import cors from 'cors'
import express from 'express'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import { campaniasRouter } from './routes/campanias.js'
import { clientesRouter } from './routes/clientes.js'
import { cuentasRouter } from './routes/cuentas.js'
import { healthRouter } from './routes/health.js'
import { pagosRouter } from './routes/pagos.js'
import { productosRouter } from './routes/productos.js'
import { productosCampaniaRouter } from './routes/productosCampania.js'
import { saldosRouter } from './routes/saldos.js'
import { ventasRouter } from './routes/ventas.js'
import { HttpError } from './utils/httpError.js'

export const app = express()

app.use(cors({ origin: env.corsOrigins }))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/clientes', clientesRouter)
app.use('/api/campanias', campaniasRouter)
app.use('/api/productos', productosRouter)
app.use('/api/productos-campania', productosCampaniaRouter)
app.use('/api/ventas', ventasRouter)
app.use('/api/cuentas', cuentasRouter)
app.use('/api/pagos', pagosRouter)
app.use('/api/saldos', saldosRouter)

app.use((req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.path}` })
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Datos invalidos.', errors: error.flatten() })
    return
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Error interno del servidor.' })
})
