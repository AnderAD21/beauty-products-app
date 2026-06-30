import { api } from './api'
import type { TipoPago, Venta, VentaItem } from '@/types'

export interface RegistrarVentaInput {
  clienteId: string
  campaniaId: string
  items: VentaItem[]
  tipoPago: TipoPago
  metodoPago?: string
}

export const ventaService = {
  async getAll(): Promise<Venta[]> {
    return api.get<Venta[]>('/ventas')
  },

  async getById(id: string): Promise<Venta | undefined> {
    try {
      return await api.get<Venta>(`/ventas/${id}`)
    } catch {
      return undefined
    }
  },

  async getByCliente(clienteId: string): Promise<Venta[]> {
    return api.get<Venta[]>(`/ventas/cliente/${clienteId}`)
  },

  async registrarVenta(input: RegistrarVentaInput): Promise<Venta> {
    return api.post<Venta>('/ventas', input)
  },
}
