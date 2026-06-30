import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db/query.js'
import { transaction } from '../db/pool.js'
import { mapPago, type PagoRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const pagosRouter = Router()

const registrarPagoSchema = z.object({
  ventaId: z.string().min(1),
  monto: z.number().positive(),
  metodo: z.string().optional(),
  fecha: z.string().optional(),
})

const pagoSelect = `
  SELECT
    p.id_pago,
    COALESCE(nv_direct.id_venta, nv_cuenta.id_venta) AS id_venta,
    p.id_cuenta,
    p.fecha,
    p.monto
  FROM pago p
  LEFT JOIN notaventa nv_direct ON nv_direct.id_nota_venta = p.id_nota_venta
  LEFT JOIN cuentaporcobrar cpc ON cpc.id_cuenta = p.id_cuenta
  LEFT JOIN notaventa nv_cuenta ON nv_cuenta.id_nota_venta = cpc.id_nota_venta
`

pagosRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<PagoRow>(
      `${pagoSelect}
       ORDER BY p.fecha DESC, p.id_pago DESC`,
    )
    res.json(rows.map(mapPago))
  }),
)

pagosRouter.get(
  '/venta/:ventaId',
  asyncHandler(async (req, res) => {
    const rows = await query<PagoRow>(
      `${pagoSelect}
       WHERE COALESCE(nv_direct.id_venta, nv_cuenta.id_venta) = $1
       ORDER BY p.fecha DESC, p.id_pago DESC`,
      [req.params.ventaId],
    )
    res.json(rows.map(mapPago))
  }),
)

pagosRouter.post(
  '/registrar',
  asyncHandler(async (req, res) => {
    const input = registrarPagoSchema.parse(req.body)

    const pagoId = await transaction(async (client) => {
      const cuentaResult = await client.query<{
        id_cuenta: number
        saldo_pendiente: string
        estado: string
      }>(
        `SELECT cpc.id_cuenta, cpc.saldo_pendiente, cpc.estado
         FROM cuentaporcobrar cpc
         JOIN notaventa nv ON nv.id_nota_venta = cpc.id_nota_venta
         WHERE nv.id_venta = $1`,
        [input.ventaId],
      )
      const cuenta = cuentaResult.rows[0]
      if (!cuenta) throw new HttpError(400, 'Esta venta no tiene una cuenta por cobrar.')
      if (cuenta.estado.toLowerCase() === 'cancelada') {
        throw new HttpError(400, 'La cuenta ya esta cancelada.')
      }

      const saldo = Number(cuenta.saldo_pendiente)
      if (input.monto > saldo + 0.001) {
        throw new HttpError(400, 'El monto no puede superar el saldo pendiente.')
      }

      const nuevoSaldo = Number((saldo - input.monto).toFixed(2))
      const nuevoEstado = nuevoSaldo <= 0 ? 'Cancelada' : 'Vigente'

      await client.query(
        `UPDATE cuentaporcobrar
         SET saldo_pendiente = $1, estado = $2
         WHERE id_cuenta = $3`,
        [nuevoSaldo, nuevoEstado, cuenta.id_cuenta],
      )

      const pagoResult = await client.query<{ id_pago: number }>(
        `INSERT INTO pago (id_nota_venta, id_cuenta, fecha, monto)
         VALUES (NULL, $1, COALESCE($2::timestamp, NOW()), $3)
         RETURNING id_pago`,
        [cuenta.id_cuenta, input.fecha ?? null, input.monto],
      )

      return pagoResult.rows[0]!.id_pago
    })

    const rows = await query<PagoRow>(
      `${pagoSelect}
       WHERE p.id_pago = $1`,
      [pagoId],
    )
    res.status(201).json(mapPago(rows[0]!))
  }),
)
