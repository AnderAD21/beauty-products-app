import { Router } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../db/query.js'
import { mapProducto, type ProductoRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const productosRouter = Router()

const productoSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  marca: z.string().min(1),
})

productosRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<ProductoRow>(
      'SELECT id_producto, codigo, descripcion, marca FROM producto ORDER BY descripcion',
    )
    res.json(rows.map(mapProducto))
  }),
)

productosRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = productoSchema.parse(req.body)
    const row = await queryOne<ProductoRow>(
      `INSERT INTO producto (codigo, descripcion, marca)
       VALUES ($1, $2, $3)
       RETURNING id_producto, codigo, descripcion, marca`,
      [input.codigo, input.descripcion ?? input.nombre, input.marca],
    )
    res.status(201).json(mapProducto(row!))
  }),
)

productosRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = productoSchema.partial().parse(req.body)
    const actual = await queryOne<ProductoRow>(
      'SELECT id_producto, codigo, descripcion, marca FROM producto WHERE id_producto = $1',
      [req.params.id],
    )
    if (!actual) throw new HttpError(404, 'Producto no encontrado.')

    const row = await queryOne<ProductoRow>(
      `UPDATE producto
       SET codigo = $1, descripcion = $2, marca = $3
       WHERE id_producto = $4
       RETURNING id_producto, codigo, descripcion, marca`,
      [
        input.codigo ?? actual.codigo,
        input.descripcion ?? input.nombre ?? actual.descripcion,
        input.marca ?? actual.marca,
        req.params.id,
      ],
    )
    res.json(mapProducto(row!))
  }),
)

productosRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM producto WHERE id_producto = $1', [req.params.id])
    res.status(204).send()
  }),
)
