import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, ShoppingBag, Wallet, CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { StatCard } from '@/components/common/StatCard'
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
import { clienteService } from '@/services/clienteService'
import { ventaService } from '@/services/ventaService'
import { pagoService } from '@/services/pagoService'
import { getSaldoCliente } from '@/services/saldoService'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatDateTime } from '@/lib/date'
import { formatMoney } from '@/lib/money'

export function ClienteDetallePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const { data, loading } = useAsync(async () => {
    const cliente = await clienteService.getById(id)
    if (!cliente) return null
    const [ventas, saldo] = await Promise.all([
      ventaService.getByCliente(id),
      getSaldoCliente(id),
    ])
    const ventasOrden = ventas.slice().sort((a, b) => b.fecha.localeCompare(a.fecha))
    const pagosArrays = await Promise.all(ventas.map((v) => pagoService.getByVenta(v.id)))
    const pagos = pagosArrays
      .flat()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
    const totalComprado = ventas.reduce((acc, v) => acc + v.total, 0)
    return { cliente, ventas: ventasOrden, saldo, pagos, totalComprado }
  }, [id])

  if (loading) return <Loading />
  if (!data) {
    return (
      <EmptyState
        title="Cliente no encontrado"
        description="El cliente que buscas no existe."
        action={
          <Button variant="outline" onClick={() => navigate('/clientes')}>
            Volver a clientes
          </Button>
        }
      />
    )
  }

  const { cliente, ventas, saldo, pagos, totalComprado } = data

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to="/clientes">
          <ArrowLeft /> Clientes
        </Link>
      </Button>

      <PageHeader title={cliente.nombre} description={`Cliente desde ${formatDate(cliente.creadoEn)}`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo pendiente"
          value={formatMoney(saldo)}
          tone={saldo > 0 ? 'warning' : 'success'}
          icon={Wallet}
          hint={saldo > 0 ? undefined : 'Al día'}
        />
        <StatCard
          label="Total comprado"
          value={formatMoney(totalComprado)}
          tone="primary"
          icon={ShoppingBag}
        />
        <StatCard label="N° de ventas" value={String(ventas.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            DNI {cliente.dni}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {cliente.telefono ?? '—'}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {cliente.email ?? '—'}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {cliente.direccion ?? '—'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de ventas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ventas.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Aún no tiene ventas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/ventas/${v.id}`)}
                  >
                    <TableCell>{formatDate(v.fecha)}</TableCell>
                    <TableCell>
                      <TipoPagoBadge tipo={v.tipoPago} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.items.reduce((a, i) => a + i.cantidad, 0)} artículos
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={v.total} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos registrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pagos.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Sin pagos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Aplicación</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDateTime(p.fecha)}</TableCell>
                    <TableCell>
                      <TipoPagoBadge tipo={p.tipoAplicacion} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.metodo ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={p.monto} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Total comprado histórico: <Money value={totalComprado} />
      </p>
    </div>
  )
}
