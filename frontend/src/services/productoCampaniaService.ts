import { api } from './api'
import { productoService } from './productoService'
import type { Producto, ProductoCampania, ProductoVendible } from '@/types'

export interface ProductoCampaniaConProducto {
  pc: ProductoCampania
  producto: Producto
}

export const productoCampaniaService = {
  async getAll(): Promise<ProductoCampania[]> {
    const campanias = await api.get<{ id: string }[]>('/campanias')
    const grupos = await Promise.all(campanias.map((c) => this.getByCampania(c.id)))
    return grupos.flat()
  },

  async getById(id: string): Promise<ProductoCampania | undefined> {
    const filas = await this.getAll()
    return filas.find((x) => x.id === id)
  },

  async create(data: Omit<ProductoCampania, 'id'>): Promise<ProductoCampania> {
    return this.upsert(data.productoId, data.campaniaId, data.precio, data.disponible)
  },

  async update(id: string, patch: Partial<Omit<ProductoCampania, 'id'>>): Promise<ProductoCampania> {
    const actual = await this.getById(id)
    if (!actual) throw new Error('Producto de campania no encontrado.')
    return this.upsert(
      patch.productoId ?? actual.productoId,
      patch.campaniaId ?? actual.campaniaId,
      patch.precio ?? actual.precio,
      patch.disponible ?? actual.disponible,
    )
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/productos-campania/${id}`)
  },

  async getByCampania(campaniaId: string): Promise<ProductoCampania[]> {
    return api.get<ProductoCampania[]>(`/productos-campania/campania/${campaniaId}`)
  },

  async getByProducto(productoId: string): Promise<ProductoCampania[]> {
    const todas = await this.getAll()
    return todas.filter((x) => x.productoId === productoId)
  },

  async getByCampaniaConProducto(campaniaId: string): Promise<ProductoCampaniaConProducto[]> {
    const [filas, productos] = await Promise.all([
      this.getByCampania(campaniaId),
      productoService.getAll(),
    ])
    const map = new Map(productos.map((p) => [p.id, p]))
    return filas
      .map((pc) => {
        const producto = map.get(pc.productoId)
        return producto ? { pc, producto } : null
      })
      .filter((x): x is ProductoCampaniaConProducto => x !== null)
  },

  async upsert(
    productoId: string,
    campaniaId: string,
    precio: number,
    disponible: boolean,
  ): Promise<ProductoCampania> {
    return api.post<ProductoCampania>('/productos-campania/upsert', {
      productoId,
      campaniaId,
      precio,
      disponible,
    })
  },

  async getProductosVendibles(campaniaId: string): Promise<ProductoVendible[]> {
    return api.get<ProductoVendible[]>(`/productos-campania/campania/${campaniaId}/vendibles`)
  },
}
