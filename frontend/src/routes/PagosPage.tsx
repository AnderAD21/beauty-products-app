import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { TipoPagoBadge } from '@/components/common/EstadoBadge'
import { DataToolbar } from '@/components/common/DataToolbar'
import { PaginationControls } from '@/components/common/PaginationControls'
import { PeriodFilter } from '@/components/common/PeriodFilter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PagoFormDialog } from '@/features/pagos/PagoFormDialog'
import { pagoService } from '@/services/pagoService'
import { cuentaPorCobrarService } from '@/services/cuentaPorCobrarService'
import { clienteService } from '@/services/clienteService'
import { ventaService } from '@/services/ventaService'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { daysUntil, formatDate, formatDateTime } from '@/lib/date'
import { defaultPeriod, inPeriod } from '@/lib/period'

type EstadoCuenta = 'TODAS' | 'VENCIDAS' | 'POR_VENCER' | 'AL_DIA'

export function PagosPage() {
  const [pago, setPago] = useState<{ ventaId: string; saldo: number; cliente: string } | undefined>()
  const [queryCuentas, setQueryCuentas] = useState('')
  const [queryHistorial, setQueryHistorial] = useState('')
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuenta>('TODAS')
  const [periodo, setPeriodo] = useState(defaultPeriod('all'))

  const { data, loading, reload } = useAsync(async () => {
    const [pagos, vigentes, clientes, ventas] = await Promise.all([
      pagoService.getAll(),
      cuentaPorCobrarService.getVigentes(),
      clienteService.getAll(),
      ventaService.getAll(),
    ])
    const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]))
    const ventaClienteMap = new Map(ventas.map((v) => [v.id, v.clienteId]))
    return {
      pagos: pagos
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((p) => ({
          pago: p,
          cliente: clienteMap.get(ventaClienteMap.get(p.ventaId) ?? '') ?? '-',
        })),
      vigentes: vigentes
        .slice()
        .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
        .map((c) => ({ cuenta: c, cliente: clienteMap.get(c.clienteId) ?? '-' })),
    }
  })

  const vigentesFiltradas = useMemo(() => {
    const q = queryCuentas.toLowerCase().trim()
    const list = data?.vigentes ?? []
    return list.filter(({ cuenta, cliente }) => {
      const matchQ = !q || cliente.toLowerCase().includes(q)
      const matchEstado = estadoCuenta === 'TODAS' || estadoDeCuenta(cuenta.fechaVencimiento) === estadoCuenta
      return matchQ && matchEstado
    })
  }, [data, queryCuentas, estadoCuenta])

  const pagosFiltrados = useMemo(() => {
    const q = queryHistorial.toLowerCase().trim()
    const list = data?.pagos ?? []
    return list.filter(({ pago, cliente }) => {
      const matchQ =
        !q ||
        cliente.toLowerCase().includes(q) ||
        pago.tipoAplicacion.toLowerCase().includes(q) ||
        (pago.metodo?.toLowerCase().includes(q) ?? false)
      return matchQ && inPeriod(pago.fecha, periodo)
    })
  }, [data, queryHistorial, periodo])

  const cuentasPage = usePagination(vigentesFiltradas, [queryCuentas, estadoCuenta])
  const pagosPage = usePagination(pagosFiltrados, [queryHistorial, periodo.preset, periodo.from, periodo.to])

  if (loading || !data) return <Loading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos"
        description="Registra los pagos de las cuentas a credito."
      />

      <Tabs defaultValue="cuentas">
        <TabsList>
          <TabsTrigger value="cuentas">Cuentas por pagar</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="cuentas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cuentas disponibles para pagar</CardTitle>
            </CardHeader>
            <DataToolbar
              query={queryCuentas}
              onQueryChange={setQueryCuentas}
              searchPlaceholder="Buscar cliente..."
              count={vigentesFiltradas.length}
              total={data.vigentes.length}
              className="border-t"
            >
              {[
                ['TODAS', 'Todas'],
                ['VENCIDAS', 'Vencidas'],
                ['POR_VENCER', 'Por vencer'],
                ['AL_DIA', 'Al dia'],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={estadoCuenta === value ? 'default' : 'outline'}
                  onClick={() => setEstadoCuenta(value as EstadoCuenta)}
                >
                  {label}
                </Button>
              ))}
            </DataToolbar>
            <CardContent className="p-0">
              {vigentesFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No hay cuentas pendientes que coincidan.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Saldo a pagar</TableHead>
                        <TableHead className="w-[1%]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuentasPage.paginated.map(({ cuenta, cliente }) => (
                        <TableRow key={cuenta.id}>
                          <TableCell className="font-medium">
                            <Link to={`/ventas/${cuenta.ventaId}`} className="hover:text-primary hover:underline">
                              {cliente}
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(cuenta.fechaVencimiento)}
                          </TableCell>
                          <TableCell>
                            <CuentaBadge fecha={cuenta.fechaVencimiento} />
                          </TableCell>
                          <TableCell className="text-right font-medium text-warning-foreground">
                            <Money value={cuenta.saldoPendiente} />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() =>
                                setPago({ ventaId: cuenta.ventaId, saldo: cuenta.saldoPendiente, cliente })
                              }
                            >
                              <Receipt /> Pagar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    page={cuentasPage.page}
                    pageSize={cuentasPage.pageSize}
                    total={vigentesFiltradas.length}
                    onPageChange={cuentasPage.setPage}
                    onPageSizeChange={cuentasPage.setPageSize}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de pagos</CardTitle>
            </CardHeader>
            <DataToolbar
              query={queryHistorial}
              onQueryChange={setQueryHistorial}
              searchPlaceholder="Buscar cliente, metodo o tipo..."
              count={pagosFiltrados.length}
              total={data.pagos.length}
              className="border-t"
            >
              <PeriodFilter value={periodo} onChange={setPeriodo} />
            </DataToolbar>
            <CardContent className="p-0">
              {pagosFiltrados.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Wallet} title="Sin pagos" description="No hay pagos en el periodo seleccionado." />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Aplicacion</TableHead>
                        <TableHead>Metodo</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="w-[1%]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagosPage.paginated.map(({ pago: p, cliente }) => (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap">{formatDateTime(p.fecha)}</TableCell>
                          <TableCell className="font-medium">{cliente}</TableCell>
                          <TableCell>
                            <TipoPagoBadge tipo={p.tipoAplicacion} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.metodo ?? '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            <Money value={p.monto} />
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/ventas/${p.ventaId}`}
                              className="text-sm text-primary hover:underline"
                            >
                              Ver venta
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    page={pagosPage.page}
                    pageSize={pagosPage.pageSize}
                    total={pagosFiltrados.length}
                    onPageChange={pagosPage.setPage}
                    onPageSizeChange={pagosPage.setPageSize}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {pago && (
        <PagoFormDialog
          open={Boolean(pago)}
          onOpenChange={(o) => !o && setPago(undefined)}
          ventaId={pago.ventaId}
          saldoPendiente={pago.saldo}
          onSaved={reload}
        />
      )}
    </div>
  )
}

function estadoDeCuenta(fechaVencimiento: string): EstadoCuenta {
  const faltan = daysUntil(fechaVencimiento)
  if (faltan < 0) return 'VENCIDAS'
  if (faltan <= 7) return 'POR_VENCER'
  return 'AL_DIA'
}

function CuentaBadge({ fecha }: { fecha: string }) {
  const estado = estadoDeCuenta(fecha)
  if (estado === 'VENCIDAS') return <Badge variant="destructive">Vencida</Badge>
  if (estado === 'POR_VENCER') return <Badge variant="warning">Por vencer</Badge>
  return <Badge variant="success">Al dia</Badge>
}
