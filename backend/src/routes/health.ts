import { Router } from 'express'
import { queryOne } from '../db/query.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const healthRouter = Router()

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const db = await queryOne<{ ok: number }>('SELECT 1 AS ok')
    res.json({ ok: true, db: db?.ok === 1 })
  }),
)
