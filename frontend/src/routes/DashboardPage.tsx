import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Wallet,
  CircleDollarSign,
  Users,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { TipoPagoBadge } from '@/components/common/EstadoBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getResumenCampania, getSaldosPorCliente } from '@/services/saldoService'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/date'
import { formatMoney } from '@/lib/money'

export function DashboardPage() {
  const navigate = useNavigate()

  const { data, loading } = useAsync(async () => {
    const [resumen, ventas, clientes, saldos, campania] = await Promise.all([
      getResumenCampania(),
      ventaService.getAll(),
      clienteService.getAll(),
      getSaldosPorCliente(),
      campaniaService.getActiva(),
    ])
    const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]))
    const ultimas = ventas
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5)
      .map((v) => ({ venta: v, cliente: clienteMap.get(v.clienteId) ?? '—' }))
    return { resumen, ultimas, deudores: saldos.slice(0, 5), campania }
  })

  if (loading || !data) return <Loading />
  const { resumen, ultimas, deudores, campania } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumen de campaña"
        description={campania?.nombre ?? 'Sin campaña activa'}
        actions={
          <Button asChild>
            <Link to="/ventas/nueva">
              <Plus /> Nueva venta
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total vendido"
          value={formatMoney(resumen.totalVendido)}
          icon={TrendingUp}
          tone="primary"
          hint={`${resumen.numVentas} ventas`}
        />
        <StatCard
          label="Cobrado"
          value={formatMoney(resumen.totalCobrado)}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Por cobrar"
          value={formatMoney(resumen.totalPorCobrar)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Clientes con deuda"
          value={String(resumen.numClientesConDeuda)}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Últimas ventas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ventas">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ultimas.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">Aún no hay ventas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ultimas.map(({ venta, cliente }) => (
                    <TableRow
                      key={venta.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/ventas/${venta.id}`)}
                    >
                      <TableCell className="whitespace-nowrap">{formatDate(venta.fecha)}</TableCell>
                      <TableCell className="font-medium">{cliente}</TableCell>
                      <TableCell>
                        <TipoPagoBadge tipo={venta.tipoPago} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money value={venta.total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Mayores deudas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/saldos">
                Ver cuentas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {deudores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay cuentas por cobrar. 🎉</p>
            ) : (
              <ul className="space-y-3">
                {deudores.map((d) => (
                  <li key={d.cliente.id} className="flex items-center justify-between gap-3">
                    <Link
                      to={`/clientes/${d.cliente.id}`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {d.cliente.nombre}
                    </Link>
                    <Money value={d.saldoPendiente} className="text-sm font-medium text-warning-foreground" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
