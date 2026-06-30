import { readCollection, writeCollection, delay } from './storage'
import { uid } from '@/lib/id'

export interface Entity {
  id: string
}

/**
 * Repositorio CRUD genérico async respaldado por localStorage.
 * La firma (Promise) imita una API REST para facilitar el reemplazo futuro.
 */
export function createRepository<T extends Entity>(collection: string, idPrefix = '') {
  function all(): T[] {
    return readCollection<T>(collection)
  }

  return {
    collection,

    async getAll(): Promise<T[]> {
      return delay(all())
    },

    async getById(id: string): Promise<T | undefined> {
      return delay(all().find((item) => item.id === id))
    },

    async create(data: Omit<T, 'id'>): Promise<T> {
      const item = { ...data, id: uid(idPrefix) } as T
      const next = [...all(), item]
      writeCollection(collection, next)
      return delay(item)
    },

    async update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T> {
      const next = all().map((item) => (item.id === id ? { ...item, ...patch } : item))
      writeCollection(collection, next)
      const updated = next.find((item) => item.id === id)
      if (!updated) throw new Error(`No existe el registro ${id} en ${collection}`)
      return delay(updated)
    },

    async remove(id: string): Promise<void> {
      writeCollection(
        collection,
        all().filter((item) => item.id !== id),
      )
      return delay(undefined)
    },

    /** Acceso sincrónico interno (para servicios que orquestan varias colecciones). */
    _allSync: all,
    _writeSync: (items: T[]) => writeCollection(collection, items),
  }
}
