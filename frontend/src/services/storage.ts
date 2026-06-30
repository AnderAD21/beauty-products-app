/**
 * Capa de persistencia mock sobre localStorage.
 *
 * Aísla el acceso a almacenamiento para que el resto de la app no dependa de
 * `localStorage` directamente. Cuando exista API, basta con reescribir los
 * repositorios (services) sin tocar pantallas.
 */

const PREFIX = 'beautyproducts:'
const VERSION_KEY = 'version'

export function readCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function writeCollection<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* almacenamiento lleno o no disponible: en demo lo ignoramos */
  }
}

export function hasKey(key: string): boolean {
  return localStorage.getItem(PREFIX + key) !== null
}

/** Versión del esquema persistido (para migraciones por reseed). */
export function getVersion(): string | null {
  return localStorage.getItem(PREFIX + VERSION_KEY)
}

export function setVersion(version: string): void {
  localStorage.setItem(PREFIX + VERSION_KEY, version)
}

/** Borra todas las claves del namespace `beautyproducts:*`. */
export function clearAll(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

/** Simula latencia de red para que la UI maneje estados de carga reales. */
export function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
