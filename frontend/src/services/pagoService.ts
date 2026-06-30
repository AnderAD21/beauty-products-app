import { api } from './api'
import type { Pago } from '@/types'

export interface RegistrarPagoInput {
  ventaId: string
  monto: number
  metodo?: string
  fecha?: string
}

export const pagoService = {
  async getAll(): Promise<Pago[]> {
    return api.get<Pago[]>('/pagos')
  },

  async getById(id: string): Promise<Pago | undefined> {
    const pagos = await this.getAll()
    return pagos.find((p) => p.id === id)
  },

  async getByVenta(ventaId: string): Promise<Pago[]> {
    return api.get<Pago[]>(`/pagos/venta/${ventaId}`)
  },

  async registrarPago(input: RegistrarPagoInput): Promise<Pago> {
    return api.post<Pago>('/pagos/registrar', input)
  },
}
