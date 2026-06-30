import { Router } from 'express'
import { query, queryOne } from '../db/query.js'
import { mapCuentaPorCobrar, type CuentaPorCobrarRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const cuentasRouter = Router()

const cuentaSelect = `
  SELECT
    cpc.id_cuenta,
    nv.id_venta,
    cpc.id_cliente,
    v.fecha,
    cpc.fecha_vencimiento,
    nv.total,
    cpc.saldo_pendiente,
    cpc.estado
  FROM cuentaporcobrar cpc
  JOIN notaventa nv ON nv.id_nota_venta = cpc.id_nota_venta
  JOIN venta v ON v.id_venta = nv.id_venta
`

cuentasRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<CuentaPorCobrarRow>(
      `${cuentaSelect}
       ORDER BY cpc.fecha_vencimiento, cpc.id_cuenta`,
    )
    res.json(rows.map(mapCuentaPorCobrar))
  }),
)

cuentasRouter.get(
  '/vigentes',
  asyncHandler(async (_req, res) => {
    const rows = await query<CuentaPorCobrarRow>(
      `${cuentaSelect}
       WHERE lower(cpc.estado) = 'vigente' AND cpc.saldo_pendiente > 0
       ORDER BY cpc.fecha_vencimiento, cpc.id_cuenta`,
    )
    res.json(rows.map(mapCuentaPorCobrar))
  }),
)

cuentasRouter.get(
  '/venta/:ventaId',
  asyncHandler(async (req, res) => {
    const row = await queryOne<CuentaPorCobrarRow>(
      `${cuentaSelect}
       WHERE nv.id_venta = $1`,
      [req.params.ventaId],
    )
    res.json(row ? mapCuentaPorCobrar(row) : null)
  }),
)

cuentasRouter.get(
  '/cliente/:clienteId',
  asyncHandler(async (req, res) => {
    const rows = await query<CuentaPorCobrarRow>(
      `${cuentaSelect}
       WHERE cpc.id_cliente = $1
       ORDER BY cpc.fecha_vencimiento, cpc.id_cuenta`,
      [req.params.clienteId],
    )
    res.json(rows.map(mapCuentaPorCobrar))
  }),
)

cuentasRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const saldoPendiente = Number(req.body.saldoPendiente)
    const estado = req.body.estado === 'CANCELADA' ? 'Cancelada' : 'Vigente'
    if (Number.isNaN(saldoPendiente)) throw new HttpError(400, 'Saldo invalido.')

    const row = await queryOne<CuentaPorCobrarRow>(
      `WITH updated AS (
         UPDATE cuentaporcobrar
         SET saldo_pendiente = $1, estado = $2
         WHERE id_cuenta = $3
         RETURNING *
       )
       SELECT
         updated.id_cuenta,
         nv.id_venta,
         updated.id_cliente,
         v.fecha,
         updated.fecha_vencimiento,
         nv.total,
         updated.saldo_pendiente,
         updated.estado
       FROM updated
       JOIN notaventa nv ON nv.id_nota_venta = updated.id_nota_venta
       JOIN venta v ON v.id_venta = nv.id_venta`,
      [saldoPendiente, estado, req.params.id],
    )
    if (!row) throw new HttpError(404, 'Cuenta no encontrada.')
    res.json(mapCuentaPorCobrar(row))
  }),
)
