import { Router } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../db/query.js'
import { mapCliente, type ClienteRow } from '../mappers.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const clientesRouter = Router()

const clienteSchema = z.object({
  dni: z.string().min(1),
  nombre: z.string().min(1),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
})

clientesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<ClienteRow>(
      'SELECT id_cliente, dni, nombres, telefono, direccion FROM cliente ORDER BY nombres',
    )
    res.json(rows.map(mapCliente))
  }),
)

clientesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await queryOne<ClienteRow>(
      'SELECT id_cliente, dni, nombres, telefono, direccion FROM cliente WHERE id_cliente = $1',
      [req.params.id],
    )
    if (!row) throw new HttpError(404, 'Cliente no encontrado.')
    res.json(mapCliente(row))
  }),
)

clientesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = clienteSchema.parse(req.body)
    const row = await queryOne<ClienteRow>(
      `INSERT INTO cliente (dni, nombres, telefono, direccion)
       VALUES ($1, $2, $3, $4)
       RETURNING id_cliente, dni, nombres, telefono, direccion`,
      [input.dni, input.nombre, input.telefono ?? null, input.direccion ?? null],
    )
    res.status(201).json(mapCliente(row!))
  }),
)

clientesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = clienteSchema.partial().parse(req.body)
    const actual = await queryOne<ClienteRow>(
      'SELECT id_cliente, dni, nombres, telefono, direccion FROM cliente WHERE id_cliente = $1',
      [req.params.id],
    )
    if (!actual) throw new HttpError(404, 'Cliente no encontrado.')

    const row = await queryOne<ClienteRow>(
      `UPDATE cliente
       SET dni = $1, nombres = $2, telefono = $3, direccion = $4
       WHERE id_cliente = $5
       RETURNING id_cliente, dni, nombres, telefono, direccion`,
      [
        input.dni ?? actual.dni,
        input.nombre ?? actual.nombres,
        input.telefono ?? actual.telefono,
        input.direccion ?? actual.direccion,
        req.params.id,
      ],
    )
    res.json(mapCliente(row!))
  }),
)

clientesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM cliente WHERE id_cliente = $1', [req.params.id])
    res.status(204).send()
  }),
)
