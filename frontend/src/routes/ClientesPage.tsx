import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Pencil, Trash2, ChevronRight, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataToolbar } from '@/components/common/DataToolbar'
import { PaginationControls } from '@/components/common/PaginationControls'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClienteFormDialog } from '@/features/clientes/ClienteFormDialog'
import { clienteService } from '@/services/clienteService'
import { getSaldosPorCliente } from '@/services/saldoService'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import type { Cliente } from '@/types'

type FiltroDeuda = 'TODOS' | 'CON_DEUDA' | 'SIN_DEUDA'

export function ClientesPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [clientes, saldos] = await Promise.all([
      clienteService.getAll(),
      getSaldosPorCliente(),
    ])
    const saldoMap = new Map(saldos.map((s) => [s.cliente.id, s.saldoPendiente]))
    return clientes
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((c) => ({ cliente: c, saldo: saldoMap.get(c.id) ?? 0 }))
  })

  const [query, setQuery] = useState('')
  const [deuda, setDeuda] = useState<FiltroDeuda>('TODOS')
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | undefined>()
  const [aBorrar, setABorrar] = useState<Cliente | undefined>()

  const filas = data ?? []
  const filtradas = useMemo(() => {
    const q = query.toLowerCase().trim()
    return filas.filter(({ cliente, saldo }) => {
      const matchQ =
        !q ||
        [cliente.nombre, cliente.dni, cliente.email, cliente.telefono]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q))
      const matchDeuda =
        deuda === 'TODOS' ||
        (deuda === 'CON_DEUDA' ? saldo > 0 : saldo <= 0)
      return matchQ && matchDeuda
    })
  }, [filas, query, deuda])

  const pagination = usePagination(filtradas, [query, deuda])

  function nuevo() {
    setEditando(undefined)
    setFormOpen(true)
  }

  async function confirmarBorrado() {
    if (!aBorrar) return
    await clienteService.remove(aBorrar.id)
    toast.success('Cliente eliminado.')
    reload()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Registro de clientes y su saldo pendiente."
        actions={
          <Button onClick={nuevo}>
            <Plus /> Nuevo cliente
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : filas.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes"
          description="Registra tu primer cliente para empezar a vender."
          action={
            <Button onClick={nuevo} variant="outline">
              <Plus /> Registrar cliente
            </Button>
          }
        />
      ) : (
        <Card>
          <DataToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Buscar por DNI, nombre, telefono o email..."
            count={filtradas.length}
            total={filas.length}
          >
            {[
              ['TODOS', 'Todos'],
              ['CON_DEUDA', 'Con deuda'],
              ['SIN_DEUDA', 'Sin deuda'],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={deuda === value ? 'default' : 'outline'}
                onClick={() => setDeuda(value as FiltroDeuda)}
              >
                {label}
              </Button>
            ))}
          </DataToolbar>
          {filtradas.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay clientes que coincidan.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Saldo pendiente</TableHead>
                    <TableHead className="w-[1%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginated.map(({ cliente, saldo }) => (
                    <TableRow key={cliente.id} className="group">
                      <TableCell>
                        <Link
                          to={`/clientes/${cliente.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {cliente.nombre}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {cliente.dni}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                          {cliente.telefono && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> {cliente.telefono}
                            </span>
                          )}
                          {cliente.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> {cliente.email}
                            </span>
                          )}
                          {!cliente.telefono && !cliente.email && <span>-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {saldo > 0 ? (
                          <Money value={saldo} className="font-medium text-warning-foreground" />
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin deuda</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditando(cliente)
                              setFormOpen(true)
                            }}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setABorrar(cliente)}
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button size="icon" variant="ghost" asChild aria-label="Ver detalle">
                            <Link to={`/clientes/${cliente.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={filtradas.length}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
              />
            </>
          )}
        </Card>
      )}

      <ClienteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={editando}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(aBorrar)}
        onOpenChange={(o) => !o && setABorrar(undefined)}
        title="Eliminar cliente"
        description={`Eliminar a "${aBorrar?.nombre}"? Esta accion no elimina sus ventas.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmarBorrado}
      />
    </div>
  )
}
