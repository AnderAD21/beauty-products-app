import { api } from './api'
import type { Cliente } from '@/types'

export interface SaldoCliente {
  cliente: Cliente
  saldoPendiente: number
  cuentasVigentes: number
  cuentaMasAntigua?: string
  proximoVencimiento?: string
  cuentasVencidas: number
  tieneVencida: boolean
}

export interface ResumenCampania {
  totalVendido: number
  totalCobrado: number
  totalPorCobrar: number
  numVentas: number
  numClientesConDeuda: number
}

export async function getSaldosPorCliente(): Promise<SaldoCliente[]> {
  return api.get<SaldoCliente[]>('/saldos/clientes')
}

export async function getSaldoCliente(clienteId: string): Promise<number> {
  const data = await api.get<{ saldo: number }>(`/saldos/clientes/${clienteId}`)
  return data.saldo
}

export async function getResumenCampania(): Promise<ResumenCampania> {
  return api.get<ResumenCampania>('/saldos/resumen')
}
