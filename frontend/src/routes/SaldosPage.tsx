import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Users, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { StatCard } from '@/components/common/StatCard'
import { DataToolbar } from '@/components/common/DataToolbar'
import { PaginationControls } from '@/components/common/PaginationControls'
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
import { getSaldosPorCliente, type SaldoCliente } from '@/services/saldoService'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { daysSince, daysUntil, formatDate } from '@/lib/date'
import { formatMoney } from '@/lib/money'

type EstadoFiltro = 'TODAS' | 'VENCIDAS' | 'POR_VENCER' | 'AL_DIA'

const ESTADOS: Array<{ value: EstadoFiltro; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'VENCIDAS', label: 'Vencidas' },
  { value: 'POR_VENCER', label: 'Por vencer' },
  { value: 'AL_DIA', label: 'Al dia' },
]

export function SaldosPage() {
  const { data, loading } = useAsync(() => getSaldosPorCliente())
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState<EstadoFiltro>('TODAS')

  const rows = data ?? []
  const filtradas = useMemo(() => {
    const q = query.toLowerCase().trim()
    return rows.filter((saldo) => {
      const matchQ =
        !q ||
        [saldo.cliente.nombre, saldo.cliente.dni, saldo.cliente.telefono]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q))
      const matchEstado = estado === 'TODAS' || estadoSaldo(saldo) === estado
      return matchQ && matchEstado
    })
  }, [rows, query, estado])

  const pagination = usePagination(filtradas, [query, estado])

  if (loading || !data) return <Loading />

  const totalPorCobrar = data.reduce((acc, s) => acc + s.saldoPendiente, 0)
  const cuentasVencidas = data.reduce((acc, s) => acc + s.cuentasVencidas, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas por cobrar"
        description="Reporte de saldos y vencimientos por cliente."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total por cobrar"
          value={formatMoney(totalPorCobrar)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard label="Clientes con deuda" value={String(data.length)} icon={Users} />
        <StatCard
          label="Cuentas vencidas"
          value={String(cuentasVencidas)}
          icon={AlertTriangle}
          tone={cuentasVencidas > 0 ? 'warning' : 'default'}
        />
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Todo cobrado"
          description="No hay cuentas por cobrar vigentes."
        />
      ) : (
        <Card>
          <DataToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Buscar cliente o DNI..."
            count={filtradas.length}
            total={data.length}
          >
            {ESTADOS.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={estado === item.value ? 'default' : 'outline'}
                onClick={() => setEstado(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </DataToolbar>
          {filtradas.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay cuentas que coincidan.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Cuentas</TableHead>
                    <TableHead>Antiguedad</TableHead>
                    <TableHead>Prox. vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-[1%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginated.map((s) => {
                    const dias = s.cuentaMasAntigua ? daysSince(s.cuentaMasAntigua) : 0
                    const faltan = s.proximoVencimiento ? daysUntil(s.proximoVencimiento) : 0
                    return (
                      <TableRow key={s.cliente.id}>
                        <TableCell className="font-medium">{s.cliente.nombre}</TableCell>
                        <TableCell className="text-center tabular-nums">{s.cuentasVigentes}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {dias} {dias === 1 ? 'dia' : 'dias'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {s.proximoVencimiento ? (
                            <>
                              {formatDate(s.proximoVencimiento)}
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({faltan < 0 ? `${Math.abs(faltan)}d vencido` : `en ${faltan}d`})
                              </span>
                            </>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <EstadoBadge saldo={s} />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-warning-foreground">
                          <Money value={s.saldoPendiente} />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/clientes/${s.cliente.id}`}>Ver detalle</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
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

function estadoSaldo(saldo: SaldoCliente): EstadoFiltro {
  if (saldo.tieneVencida) return 'VENCIDAS'
  const faltan = saldo.proximoVencimiento ? daysUntil(saldo.proximoVencimiento) : 999
  if (faltan <= 7) return 'POR_VENCER'
  return 'AL_DIA'
}

function EstadoBadge({ saldo }: { saldo: SaldoCliente }) {
  const estado = estadoSaldo(saldo)
  if (estado === 'VENCIDAS') return <Badge variant="destructive">Vencida</Badge>
  if (estado === 'POR_VENCER') return <Badge variant="warning">Por vencer</Badge>
  return <Badge variant="success">Al dia</Badge>
}
