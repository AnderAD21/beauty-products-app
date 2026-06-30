import { useMemo, useState } from 'react'
import { Plus, Check, PackageSearch } from 'lucide-react'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

export interface ProductoCampaniaItem {
  productoId: string
  codigo: string
  nombre: string
  marca: string
  precio: number
  disponible: boolean
}

interface Props {
  productos: ProductoCampaniaItem[]
  enCarrito: Set<string>
  onAdd: (item: ProductoCampaniaItem) => void
}

/** Grilla de productos de la campaña activa para armar la venta. */
export function ProductoPickerGrid({ productos, enCarrito, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [marca, setMarca] = useState('Todas')

  const marcas = useMemo(
    () => ['Todas', ...Array.from(new Set(productos.map((p) => p.marca))).sort()],
    [productos],
  )

  const filtrados = useMemo(() => {
    const q = query.toLowerCase().trim()
    return productos.filter((p) => {
      const matchQ =
        !q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      const matchMarca = marca === 'Todas' || p.marca === marca
      return matchQ && matchMarca
    })
  }, [productos, query, marca])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por código o nombre…"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {marcas.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={marca === m ? 'default' : 'outline'}
              onClick={() => setMarca(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Sin productos"
          description="No hay productos que coincidan en esta campaña."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => {
            const yaEsta = enCarrito.has(p.productoId)
            return (
              <Card
                key={p.productoId}
                className={cn('card-interactive', !p.disponible && 'opacity-60')}
              >
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary">{p.marca}</Badge>
                    {!p.disponible && <Badge variant="warning">No disponible</Badge>}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                    <p className="text-sm font-medium leading-snug">{p.nombre}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Money value={p.precio} className="text-base font-semibold" />
                    <Button
                      size="sm"
                      variant={yaEsta ? 'secondary' : 'default'}
                      disabled={!p.disponible}
                      onClick={() => onAdd(p)}
                      aria-label={`Agregar ${p.nombre}`}
                    >
                      {yaEsta ? (
                        <>
                          <Check /> Agregado
                        </>
                      ) : (
                        <>
                          <Plus /> Agregar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
