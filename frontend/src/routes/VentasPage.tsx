import { Fragment, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { TipoPagoBadge } from '@/components/common/EstadoBadge'
import { DataToolbar } from '@/components/common/DataToolbar'
import { PaginationControls } from '@/components/common/PaginationControls'
import { PeriodFilter } from '@/components/common/PeriodFilter'
import { Badge } from '@/components/ui/badge'
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
import { ventaService } from '@/services/ventaService'
import { clienteService } from '@/services/clienteService'
import { campaniaService } from '@/services/campaniaService'
import { cuentaPorCobrarService, esVencida } from '@/services/cuentaPorCobrarService'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { formatDate } from '@/lib/date'
import { defaultPeriod, inPeriod, monthKey, monthLabel, shouldGroupByMonth } from '@/lib/period'
import type { TipoPago } from '@/types'

type FiltroTipo = 'TODAS' | TipoPago
type EstadoCobro = 'Pagada' | 'Vigente' | 'Vencida'

export function VentasPage() {
  const navigate = useNavigate()
  const { data, loading } = useAsync(async () => {
    const [ventas, clientes, cuentas, campanias] = await Promise.all([
      ventaService.getAll(),
      clienteService.getAll(),
      cuentaPorCobrarService.getAll(),
      campaniaService.getAll(),
    ])
    const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]))
    const cuentaMap = new Map(cuentas.map((c) => [c.ventaId, c]))
    const campaniaMap = new Map(campanias.map((c) => [c.id, c.nombre]))
    return ventas
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((v) => {
        const cuenta = cuentaMap.get(v.id)
        const estadoCobro: EstadoCobro =
          v.tipoPago === 'CONTADO' || cuenta?.estado === 'CANCELADA'
            ? 'Pagada'
            : cuenta && esVencida(cuenta)
              ? 'Vencida'
              : 'Vigente'
        return {
          venta: v,
          cliente: clienteMap.get(v.clienteId) ?? 'Cliente eliminado',
          campania: campaniaMap.get(v.campaniaId) ?? '-',
          saldo: cuenta?.saldoPendiente ?? 0,
          estadoCobro,
        }
      })
  })

  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState<FiltroTipo>('TODAS')
  const [estado, setEstado] = useState<'TODAS' | 'Pendiente' | 'Pagada'>('TODAS')
  const [periodo, setPeriodo] = useState(defaultPeriod('all'))

  const filas = data ?? []
  const filtradas = useMemo(() => {
    const q = query.toLowerCase().trim()
    return filas.filter((f) => {
      const matchQ = !q || f.cliente.toLowerCase().includes(q) || f.campania.toLowerCase().includes(q)
      const matchTipo = tipo === 'TODAS' || f.venta.tipoPago === tipo
      const matchEstado =
        estado === 'TODAS' ||
        (estado === 'Pagada' ? f.estadoCobro === 'Pagada' : f.estadoCobro !== 'Pagada')
      return matchQ && matchTipo && matchEstado && inPeriod(f.venta.fecha, periodo)
    })
  }, [filas, query, tipo, estado, periodo])

  const pagination = usePagination(filtradas, [query, tipo, estado, periodo.preset, periodo.from, periodo.to], 15)
  const agrupar = shouldGroupByMonth(periodo)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Historial de ventas al contado y al credito."
        actions={
          <Button asChild>
            <Link to="/ventas/nueva">
              <Plus /> Nueva venta
            </Link>
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : filas.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Sin ventas"
          description="Registra una venta para verla aqui."
          action={
            <Button asChild variant="outline">
              <Link to="/ventas/nueva">
                <Plus /> Nueva venta
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <DataToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Buscar cliente o campania..."
            count={filtradas.length}
            total={filas.length}
          >
            <PeriodFilter value={periodo} onChange={setPeriodo} />
            <span className="hidden h-6 w-px bg-border lg:block" />
            {(['TODAS', 'CONTADO', 'CREDITO'] as FiltroTipo[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tipo === t ? 'default' : 'outline'}
                onClick={() => setTipo(t)}
              >
                {t === 'TODAS' ? 'Todas' : t === 'CONTADO' ? 'Contado' : 'Credito'}
              </Button>
            ))}
            <span className="hidden h-6 w-px bg-border lg:block" />
            {(['TODAS', 'Pendiente', 'Pagada'] as const).map((e) => (
              <Button
                key={e}
                size="sm"
                variant={estado === e ? 'default' : 'outline'}
                onClick={() => setEstado(e)}
              >
                {e === 'TODAS' ? 'Todo estado' : e}
              </Button>
            ))}
          </DataToolbar>
          {filtradas.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay ventas que coincidan.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Campania</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cobro</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginated.map((row, index, list) => {
                    const showMonth =
                      agrupar && (index === 0 || monthKey(row.venta.fecha) !== monthKey(list[index - 1].venta.fecha))
                    return (
                      <Fragment key={row.venta.id}>
                        {showMonth && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={7} className="bg-muted/50 py-2 text-xs font-semibold uppercase text-muted-foreground">
                              {monthLabel(row.venta.fecha)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => navigate(`/ventas/${row.venta.id}`)}
                        >
                          <TableCell className="whitespace-nowrap">{formatDate(row.venta.fecha)}</TableCell>
                          <TableCell className="font-medium">{row.cliente}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {row.campania}
                          </TableCell>
                          <TableCell>
                            <TipoPagoBadge tipo={row.venta.tipoPago} />
                          </TableCell>
                          <TableCell>
                            {row.estadoCobro === 'Pagada' ? (
                              <Badge variant="success">Pagada</Badge>
                            ) : row.estadoCobro === 'Vencida' ? (
                              <Badge variant="destructive">Vencida</Badge>
                            ) : (
                              <Badge variant="warning">Vigente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.saldo > 0 ? <Money value={row.saldo} /> : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <Money value={row.venta.total} />
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    )
                  })}
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
    </div>
  )
}
