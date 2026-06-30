import { Router } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../db/query.js'
import {
  mapProductoCampania,
  mapProductoVendible,
  type ProductoCampaniaRow,
  type ProductoVendibleRow,
} from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const productosCampaniaRouter = Router()

const upsertSchema = z.object({
  productoId: z.string().min(1),
  campaniaId: z.string().min(1),
  precio: z.number().positive(),
  disponible: z.boolean(),
})

function disponibilidad(value: boolean) {
  return value ? 'Disponible' : 'No disponible'
}

productosCampaniaRouter.get(
  '/campania/:campaniaId',
  asyncHandler(async (req, res) => {
    const rows = await query<ProductoCampaniaRow>(
      `SELECT id_producto_campana, id_producto, id_campana, precio, disponibilidad
       FROM productocampana
       WHERE id_campana = $1
       ORDER BY id_producto_campana`,
      [req.params.campaniaId],
    )
    res.json(rows.map(mapProductoCampania))
  }),
)

productosCampaniaRouter.get(
  '/campania/:campaniaId/vendibles',
  asyncHandler(async (req, res) => {
    const rows = await query<ProductoVendibleRow>(
      `SELECT p.id_producto, p.codigo, p.descripcion, p.marca, pc.precio
       FROM productocampana pc
       JOIN producto p ON p.id_producto = pc.id_producto
       WHERE pc.id_campana = $1 AND lower(pc.disponibilidad) = 'disponible'
       ORDER BY p.descripcion`,
      [req.params.campaniaId],
    )
    res.json(rows.map(mapProductoVendible))
  }),
)

productosCampaniaRouter.post(
  '/upsert',
  asyncHandler(async (req, res) => {
    const input = upsertSchema.parse(req.body)
    const existente = await queryOne<{ id_producto_campana: number }>(
      `SELECT id_producto_campana
       FROM productocampana
       WHERE id_producto = $1 AND id_campana = $2`,
      [input.productoId, input.campaniaId],
    )

    const row = existente
      ? await queryOne<ProductoCampaniaRow>(
          `UPDATE productocampana
           SET precio = $1, disponibilidad = $2
           WHERE id_producto_campana = $3
           RETURNING id_producto_campana, id_producto, id_campana, precio, disponibilidad`,
          [input.precio, disponibilidad(input.disponible), existente.id_producto_campana],
        )
      : await queryOne<ProductoCampaniaRow>(
          `INSERT INTO productocampana (id_producto, id_campana, precio, disponibilidad)
           VALUES ($1, $2, $3, $4)
           RETURNING id_producto_campana, id_producto, id_campana, precio, disponibilidad`,
          [input.productoId, input.campaniaId, input.precio, disponibilidad(input.disponible)],
        )

    res.json(mapProductoCampania(row!))
  }),
)

productosCampaniaRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM productocampana WHERE id_producto_campana = $1', [req.params.id])
    res.status(204).send()
  }),
)
