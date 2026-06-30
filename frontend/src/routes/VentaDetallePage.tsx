import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Receipt, User } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { TipoPagoBadge, CuentaEstadoBadge } from '@/components/common/EstadoBadge'
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
import { PagoFormDialog } from '@/features/pagos/PagoFormDialog'
import { ventaService } from '@/services/ventaService'
import { clienteService } from '@/services/clienteService'
import { campaniaService } from '@/services/campaniaService'
import { cuentaPorCobrarService } from '@/services/cuentaPorCobrarService'
import { pagoService } from '@/services/pagoService'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatDateTime } from '@/lib/date'

export function VentaDetallePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [pagoOpen, setPagoOpen] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const venta = await ventaService.getById(id)
    if (!venta) return null
    const [cliente, cuenta, pagos, campania] = await Promise.all([
      clienteService.getById(venta.clienteId),
      cuentaPorCobrarService.getByVenta(venta.id),
      pagoService.getByVenta(venta.id),
      campaniaService.getById(venta.campaniaId),
    ])
    return {
      venta,
      cliente,
      cuenta,
      campania,
      pagos: pagos.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    }
  }, [id])

  if (loading) return <Loading />
  if (!data) {
    return (
      <EmptyState
        title="Venta no encontrada"
        action={
          <Button variant="outline" onClick={() => navigate('/ventas')}>
            Volver a ventas
          </Button>
        }
      />
    )
  }

  const { venta, cliente, cuenta, campania, pagos } = data
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0)
  const esCredito = venta.tipoPago === 'CREDITO'
  const puedePagar = Boolean(cuenta && cuenta.estado === 'VIGENTE')

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to="/ventas">
          <ArrowLeft /> Ventas
        </Link>
      </Button>

      <PageHeader
        title="Detalle de venta"
        description={`${formatDate(venta.fecha)} · ${campania?.nombre ?? 'Sin campaña'} · Venta registrada`}
        actions={
          puedePagar ? (
            <Button onClick={() => setPagoOpen(true)}>
              <Receipt /> Registrar pago
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">P. unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venta.items.map((it) => (
                    <TableRow key={it.productoId}>
                      <TableCell className="font-medium">{it.nombre}</TableCell>
                      <TableCell className="text-center tabular-nums">{it.cantidad}</TableCell>
                      <TableCell className="text-right">
                        <Money value={it.precioUnit} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money value={it.subtotal} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-3">
                <span className="font-medium">Total</span>
                <Money value={venta.total} className="text-lg font-semibold" />
              </div>
            </CardContent>
          </Card>

          {pagos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pagos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDateTime(p.fecha)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.metodo ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Money value={p.monto} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {cliente ? (
                <Link
                  to={`/clientes/${cliente.id}`}
                  className="flex items-center gap-3 hover:text-primary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground">{cliente.telefono ?? 'Ver detalle'}</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">Cliente eliminado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Cobranza</CardTitle>
              <TipoPagoBadge tipo={venta.tipoPago} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Total venta" value={<Money value={venta.total} />} />
              <Row label="Pagado" value={<Money value={totalPagado} />} />
              {esCredito && cuenta ? (
                <>
                  <Row
                    label="Saldo pendiente"
                    value={<Money value={cuenta.saldoPendiente} className="font-semibold" />}
                  />
                  <Row label="Vence" value={formatDate(cuenta.fechaVencimiento)} />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground">Estado cuenta</span>
                    <CuentaEstadoBadge cuenta={cuenta} />
                  </div>
                  {puedePagar && (
                    <Button className="mt-2 w-full" onClick={() => setPagoOpen(true)}>
                      <Receipt /> Registrar pago
                    </Button>
                  )}
                </>
              ) : (
                <p className="pt-1 text-muted-foreground">
                  Venta al contado, pagada en su totalidad.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {cuenta && (
        <PagoFormDialog
          open={pagoOpen}
          onOpenChange={setPagoOpen}
          ventaId={venta.id}
          saldoPendiente={cuenta.saldoPendiente}
          onSaved={reload}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {value}
    </div>
  )
}
