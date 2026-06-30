import { api } from './api'
import type { Cliente } from '@/types'

export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    return api.get<Cliente[]>('/clientes')
  },

  async getById(id: string): Promise<Cliente | undefined> {
    try {
      return await api.get<Cliente>(`/clientes/${id}`)
    } catch {
      return undefined
    }
  },

  async create(data: Omit<Cliente, 'id'>): Promise<Cliente> {
    return api.post<Cliente>('/clientes', data)
  },

  async update(id: string, patch: Partial<Omit<Cliente, 'id'>>): Promise<Cliente> {
    return api.put<Cliente>(`/clientes/${id}`, patch)
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/clientes/${id}`)
  },

  async getByDni(dni: string): Promise<Cliente | undefined> {
    const todos = await this.getAll()
    return todos.find((c) => c.dni === dni.trim())
  },

  async existeDni(dni: string, exceptId?: string): Promise<boolean> {
    const todos = await this.getAll()
    return todos.some((c) => c.dni === dni.trim() && c.id !== exceptId)
  },
}
