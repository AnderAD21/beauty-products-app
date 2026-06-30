import { api } from './api'
import type { Producto } from '@/types'

export const productoService = {
  async getAll(): Promise<Producto[]> {
    return api.get<Producto[]>('/productos')
  },

  async getById(id: string): Promise<Producto | undefined> {
    const productos = await this.getAll()
    return productos.find((p) => p.id === id)
  },

  async create(data: Omit<Producto, 'id'>): Promise<Producto> {
    return api.post<Producto>('/productos', data)
  },

  async update(id: string, patch: Partial<Omit<Producto, 'id'>>): Promise<Producto> {
    return api.put<Producto>(`/productos/${id}`, patch)
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/productos/${id}`)
  },
}
