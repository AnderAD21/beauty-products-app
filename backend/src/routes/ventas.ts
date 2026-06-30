import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db/query.js'
import { transaction } from '../db/pool.js'
import { mapVentas, type VentaRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const ventasRouter = Router()

const ventaItemSchema = z.object({
  productoId: z.string().min(1),
  nombre: z.string().min(1),
  cantidad: z.number().int().positive(),
  precioUnit: z.number().positive(),
  subtotal: z.number().positive(),
})

const registrarVentaSchema = z.object({
  clienteId: z.string().min(1),
  campaniaId: z.string().min(1),
  items: z.array(ventaItemSchema).min(1),
  tipoPago: z.enum(['CONTADO', 'CREDITO']),
  metodoPago: z.string().optional(),
})

const ventaSelect = `
  SELECT
    v.id_venta,
    v.id_cliente,
    v.id_campana,
    v.fecha,
    v.tipo_venta,
    nv.total,
    p.id_producto,
    p.descripcion AS producto_nombre,
    dv.cantidad,
    dv.precio_aplicado
  FROM venta v
  JOIN notaventa nv ON nv.id_venta = v.id_venta
  LEFT JOIN detalleventa dv ON dv.id_venta = v.id_venta
  LEFT JOIN productocampana pc ON pc.id_producto_campana = dv.id_producto_campana
  LEFT JOIN producto p ON p.id_producto = pc.id_producto
`

async function getVenta(id: number | string) {
  const rows = await query<VentaRow>(
    `${ventaSelect}
     WHERE v.id_venta = $1
     ORDER BY dv.id_detalle`,
    [id],
  )
  return mapVentas(rows)[0]
}

ventasRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<VentaRow>(
      `${ventaSelect}
       ORDER BY v.fecha DESC, v.id_venta DESC, dv.id_detalle`,
    )
    res.json(mapVentas(rows))
  }),
)

ventasRouter.get(
  '/cliente/:clienteId',
  asyncHandler(async (req, res) => {
    const rows = await query<VentaRow>(
      `${ventaSelect}
       WHERE v.id_cliente = $1
       ORDER BY v.fecha DESC, v.id_venta DESC, dv.id_detalle`,
      [req.params.clienteId],
    )
    res.json(mapVentas(rows))
  }),
)

ventasRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const venta = await getVenta(String(req.params.id))
    if (!venta) throw new HttpError(404, 'Venta no encontrada.')
    res.json(venta)
  }),
)

ventasRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = registrarVentaSchema.parse(req.body)
    const total = Number(input.items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2))

    const ventaId = await transaction(async (client) => {
      if (input.tipoPago === 'CREDITO') {
        const saldoResult = await client.query<{ saldo: string }>(
          `SELECT COALESCE(SUM(saldo_pendiente), 0) AS saldo
           FROM cuentaporcobrar
           WHERE id_cliente = $1
             AND lower(estado) = 'vigente'
             AND saldo_pendiente > 0`,
          [input.clienteId],
        )
        const saldoActual = Number(saldoResult.rows[0]?.saldo ?? 0)
        if (Number((saldoActual + total).toFixed(2)) > 100) {
          const disponible = Math.max(0, 100 - saldoActual).toFixed(2)
          throw new HttpError(
            400,
            `Excede el limite de credito de S/100. Deuda vigente: S/${saldoActual.toFixed(
              2,
            )}; disponible: S/${disponible}.`,
          )
        }
      }

      const tipoVenta = input.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado'
      const ventaResult = await client.query<{ id_venta: number }>(
        `INSERT INTO venta (id_cliente, id_campana, fecha, tipo_venta)
         VALUES ($1, $2, NOW(), $3)
         RETURNING id_venta`,
        [input.clienteId, input.campaniaId, tipoVenta],
      )
      const idVenta = ventaResult.rows[0]!.id_venta

      for (const item of input.items) {
        const pcResult = await client.query<{ id_producto_campana: number; precio: string }>(
          `SELECT id_producto_campana, precio
           FROM productocampana
           WHERE id_producto = $1 AND id_campana = $2
           LIMIT 1`,
          [item.productoId, input.campaniaId],
        )
        const pc = pcResult.rows[0]
        if (!pc) throw new HttpError(400, `Producto ${item.nombre} no pertenece a la campania.`)

        await client.query(
          `INSERT INTO detalleventa (id_venta, id_producto_campana, cantidad, precio_aplicado)
           VALUES ($1, $2, $3, $4)`,
          [idVenta, pc.id_producto_campana, item.cantidad, item.precioUnit],
        )
      }

      const notaResult = await client.query<{ id_nota_venta: number }>(
        `INSERT INTO notaventa (id_venta, numero, total)
         VALUES ($1, $2, $3)
         RETURNING id_nota_venta`,
        [idVenta, `NV-${String(idVenta).padStart(4, '0')}`, total],
      )
      const idNotaVenta = notaResult.rows[0]!.id_nota_venta

      if (input.tipoPago === 'CREDITO') {
        await client.query(
          `INSERT INTO cuentaporcobrar
             (id_cliente, id_nota_venta, fecha_vencimiento, saldo_pendiente, estado)
           VALUES ($1, $2, CURRENT_DATE + INTERVAL '30 days', $3, 'Vigente')`,
          [input.clienteId, idNotaVenta, total],
        )
      } else {
        await client.query(
          `INSERT INTO pago (id_nota_venta, id_cuenta, fecha, monto)
           VALUES ($1, NULL, NOW(), $2)`,
          [idNotaVenta, total],
        )
      }

      return idVenta
    })

    const venta = await getVenta(ventaId)
    res.status(201).json(venta)
  }),
)
