import { api } from './api'
import type { CuentaPorCobrar } from '@/types'

export function esVencida(cuenta: CuentaPorCobrar): boolean {
  return (
    cuenta.estado === 'VIGENTE' &&
    cuenta.saldoPendiente > 0 &&
    Date.now() > new Date(cuenta.fechaVencimiento).getTime()
  )
}

export const cuentaPorCobrarService = {
  async getAll(): Promise<CuentaPorCobrar[]> {
    return api.get<CuentaPorCobrar[]>('/cuentas')
  },

  async getById(id: string): Promise<CuentaPorCobrar | undefined> {
    const cuentas = await this.getAll()
    return cuentas.find((c) => c.id === id)
  },

  async getByVenta(ventaId: string): Promise<CuentaPorCobrar | undefined> {
    const cuenta = await api.get<CuentaPorCobrar | null>(`/cuentas/venta/${ventaId}`)
    return cuenta ?? undefined
  },

  async getByCliente(clienteId: string): Promise<CuentaPorCobrar[]> {
    return api.get<CuentaPorCobrar[]>(`/cuentas/cliente/${clienteId}`)
  },

  async getVigentes(): Promise<CuentaPorCobrar[]> {
    return api.get<CuentaPorCobrar[]>('/cuentas/vigentes')
  },

  async update(id: string, patch: Partial<Omit<CuentaPorCobrar, 'id'>>): Promise<CuentaPorCobrar> {
    return api.put<CuentaPorCobrar>(`/cuentas/${id}`, patch)
  },
}
