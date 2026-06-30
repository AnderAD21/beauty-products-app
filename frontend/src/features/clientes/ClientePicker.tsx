import { useMemo, useState } from 'react'
import { UserPlus, Check, User } from 'lucide-react'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { ClienteFormDialog } from './ClienteFormDialog'
import { cn } from '@/lib/cn'
import type { Cliente } from '@/types'

interface Props {
  clientes: Cliente[]
  selectedId: string
  onSelect: (cliente: Cliente) => void
  /** Notifica que se creó un cliente (para refrescar la lista en el padre). */
  onClienteCreado: (cliente: Cliente) => void
}

/** Selector de cliente por DNI o nombre, con alta rápida. */
export function ClientePicker({ clientes, selectedId, onSelect, onClienteCreado }: Props) {
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const filtrados = useMemo(() => {
    const q = query.toLowerCase().trim()
    const base = clientes.slice().sort((a, b) => a.nombre.localeCompare(b.nombre))
    if (!q) return base
    return base.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.dni.toLowerCase().includes(q),
    )
  }, [clientes, query])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por DNI o nombre…"
          className="sm:flex-1"
        />
        <Button type="button" variant="outline" onClick={() => setFormOpen(true)}>
          <UserPlus /> Nuevo cliente
        </Button>
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {filtrados.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No se encontró ningún cliente.
            <button
              type="button"
              className="ml-1 font-medium text-primary hover:underline"
              onClick={() => setFormOpen(true)}
            >
              Crear nuevo
            </button>
          </div>
        ) : (
          filtrados.map((c) => {
            const active = c.id === selectedId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {active ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    DNI {c.dni}
                    {c.telefono ? ` · ${c.telefono}` : ''}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      <ClienteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        dniInicial={/^\d+$/.test(query.trim()) ? query.trim() : undefined}
        onSaved={(c) => {
          onClienteCreado(c)
          onSelect(c)
        }}
      />
    </div>
  )
}
