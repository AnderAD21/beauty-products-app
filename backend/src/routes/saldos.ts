import { Router } from 'express'
import { query, queryOne } from '../db/query.js'
import { mapCliente, type ClienteRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const saldosRouter = Router()

type SaldoClienteRow = ClienteRow & {
  saldo_pendiente: string
  cuentas_vigentes: string
  cuenta_mas_antigua: Date | string | null
  proximo_vencimiento: Date | string | null
  cuentas_vencidas: string
}

function toISO(value: Date | string | null) {
  return value ? (value instanceof Date ? value.toISOString() : new Date(value).toISOString()) : undefined
}

saldosRouter.get(
  '/clientes',
  asyncHandler(async (_req, res) => {
    const rows = await query<SaldoClienteRow>(
      `SELECT
         cl.id_cliente,
         cl.dni,
         cl.nombres,
         cl.telefono,
         cl.direccion,
         SUM(cpc.saldo_pendiente) AS saldo_pendiente,
         COUNT(*) AS cuentas_vigentes,
         MIN(v.fecha) AS cuenta_mas_antigua,
         MIN(cpc.fecha_vencimiento) AS proximo_vencimiento,
         COUNT(*) FILTER (
           WHERE cpc.saldo_pendiente > 0
             AND cpc.fecha_vencimiento < CURRENT_DATE
         ) AS cuentas_vencidas
       FROM cuentaporcobrar cpc
       JOIN cliente cl ON cl.id_cliente = cpc.id_cliente
       JOIN notaventa nv ON nv.id_nota_venta = cpc.id_nota_venta
       JOIN venta v ON v.id_venta = nv.id_venta
       WHERE lower(cpc.estado) = 'vigente' AND cpc.saldo_pendiente > 0
       GROUP BY cl.id_cliente, cl.dni, cl.nombres, cl.telefono, cl.direccion
       ORDER BY saldo_pendiente DESC`,
    )

    res.json(
      rows.map((row) => ({
        cliente: mapCliente(row),
        saldoPendiente: Number(row.saldo_pendiente),
        cuentasVigentes: Number(row.cuentas_vigentes),
        cuentaMasAntigua: toISO(row.cuenta_mas_antigua),
        proximoVencimiento: toISO(row.proximo_vencimiento),
        cuentasVencidas: Number(row.cuentas_vencidas),
        tieneVencida: Number(row.cuentas_vencidas) > 0,
      })),
    )
  }),
)

saldosRouter.get(
  '/clientes/:clienteId',
  asyncHandler(async (req, res) => {
    const row = await queryOne<{ saldo: string }>(
      `SELECT COALESCE(SUM(saldo_pendiente), 0) AS saldo
       FROM cuentaporcobrar
       WHERE id_cliente = $1
         AND lower(estado) = 'vigente'
         AND saldo_pendiente > 0`,
      [req.params.clienteId],
    )
    res.json({ saldo: Number(row?.saldo ?? 0) })
  }),
)

saldosRouter.get(
  '/resumen',
  asyncHandler(async (_req, res) => {
    const row = await queryOne<{
      total_vendido: string
      total_cobrado: string
      total_por_cobrar: string
      num_ventas: string
      num_clientes_con_deuda: string
    }>(
      `SELECT
         COALESCE((SELECT SUM(total) FROM notaventa), 0) AS total_vendido,
         COALESCE((SELECT SUM(monto) FROM pago), 0) AS total_cobrado,
         COALESCE((
           SELECT SUM(saldo_pendiente)
           FROM cuentaporcobrar
           WHERE lower(estado) = 'vigente' AND saldo_pendiente > 0
         ), 0) AS total_por_cobrar,
         (SELECT COUNT(*) FROM venta) AS num_ventas,
         (
           SELECT COUNT(DISTINCT id_cliente)
           FROM cuentaporcobrar
           WHERE lower(estado) = 'vigente' AND saldo_pendiente > 0
         ) AS num_clientes_con_deuda`,
    )
    res.json({
      totalVendido: Number(row?.total_vendido ?? 0),
      totalCobrado: Number(row?.total_cobrado ?? 0),
      totalPorCobrar: Number(row?.total_por_cobrar ?? 0),
      numVentas: Number(row?.num_ventas ?? 0),
      numClientesConDeuda: Number(row?.num_clientes_con_deuda ?? 0),
    })
  }),
)
