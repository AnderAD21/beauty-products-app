import { Router } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../db/query.js'
import { mapCampania, mapEstadoApi, mesNumeroATexto, type CampaniaRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const campaniasRouter = Router()

const campaniaSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2000),
  estado: z.enum(['ACTIVA', 'CERRADA']).optional(),
})

campaniasRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<CampaniaRow>(
      'SELECT id_campana, mes, anio, estado FROM campana ORDER BY anio, id_campana',
    )
    res.json(rows.map(mapCampania))
  }),
)

campaniasRouter.get(
  '/activa',
  asyncHandler(async (_req, res) => {
    const row = await queryOne<CampaniaRow>(
      `SELECT id_campana, mes, anio, estado
       FROM campana
       WHERE lower(estado) = 'activa'
       LIMIT 1`,
    )
    res.json(row ? mapCampania(row) : null)
  }),
)

campaniasRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = campaniaSchema.parse(req.body)
    const row = await queryOne<CampaniaRow>(
      `INSERT INTO campana (mes, anio, estado)
       VALUES ($1, $2, $3)
       RETURNING id_campana, mes, anio, estado`,
      [mesNumeroATexto(input.mes), input.anio, mapEstadoApi(input.estado ?? 'CERRADA')],
    )
    res.status(201).json(mapCampania(row!))
  }),
)

campaniasRouter.patch(
  '/:id/activar',
  asyncHandler(async (req, res) => {
    await query('UPDATE campana SET estado = $1', ['Cerrada'])
    const row = await queryOne<CampaniaRow>(
      `UPDATE campana
       SET estado = $1
       WHERE id_campana = $2
       RETURNING id_campana, mes, anio, estado`,
      ['Activa', req.params.id],
    )
    if (!row) throw new HttpError(404, 'Campania no encontrada.')
    res.json(mapCampania(row))
  }),
)
