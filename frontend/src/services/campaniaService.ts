import { api } from './api'
import type { Campania } from '@/types'

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function nombreCampania(mes: number, anio: number): string {
  return `Campania ${MESES[mes - 1] ?? mes} ${anio}`
}

export const campaniaService = {
  async getAll(): Promise<Campania[]> {
    return api.get<Campania[]>('/campanias')
  },

  async getById(id: string): Promise<Campania | undefined> {
    const campanias = await this.getAll()
    return campanias.find((c) => c.id === id)
  },

  async getActiva(): Promise<Campania | undefined> {
    const activa = await api.get<Campania | null>('/campanias/activa')
    return activa ?? undefined
  },

  async activar(id: string): Promise<void> {
    await api.patch<Campania>(`/campanias/${id}/activar`)
  },

  async crearMensual(mes: number, anio: number): Promise<Campania> {
    const existe = (await this.getAll()).some((c) => c.mes === mes && c.anio === anio)
    if (existe) {
      throw new Error(`Ya existe la ${nombreCampania(mes, anio)}.`)
    }
    return api.post<Campania>('/campanias', { mes, anio, estado: 'CERRADA' })
  },
}
