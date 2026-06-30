import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CreditCard, Wallet, Check, CalendarRange } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ProductoPickerGrid,
  type ProductoCampaniaItem,
} from '@/features/ventas/ProductoPickerGrid'
import { CartPanel } from '@/features/ventas/CartPanel'
import { ClientePicker } from '@/features/clientes/ClientePicker'
import { clienteService } from '@/services/clienteService'
import { campaniaService } from '@/services/campaniaService'
import { productoCampaniaService } from '@/services/productoCampaniaService'
import { ventaService } from '@/services/ventaService'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { round2 } from '@/lib/money'
import { LIMITE_CREDITO, type Cliente, type TipoPago, type VentaItem } from '@/types'

export function VentaNuevaPage() {
  const navigate = useNavigate()
  const { data, loading, reload } = useAsync(async () => {
    const [clientes, campania] = await Promise.all([
      clienteService.getAll(),
      campaniaService.getActiva(),
    ])
    const filas = campania
      ? await productoCampaniaService.getByCampaniaConProducto(campania.id)
      : []
    const productos: ProductoCampaniaItem[] = filas.map(({ pc, producto }) => ({
      productoId: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      marca: producto.marca,
      precio: pc.precio,
      disponible: pc.disponible && producto.activo,
    }))
    return { clientes, campania, productos }
  })

  const [paso, setPaso] = useState<1 | 2>(1)
  const [items, setItems] = useState<VentaItem[]>([])
  const [cliente, setCliente] = useState<Cliente | undefined>()
  const [tipoPago, setTipoPago] = useState<TipoPago>('CONTADO')
  const [saving, setSaving] = useState(false)

  const total = round2(items.reduce((acc, i) => acc + i.subtotal, 0))
  const enCarrito = new Set(items.map((i) => i.productoId))
  const campania = data?.campania

  function agregar(p: ProductoCampaniaItem) {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === p.productoId)
      if (existente) {
        return prev.map((i) =>
          i.productoId === p.productoId
            ? { ...i, cantidad: i.cantidad + 1, subtotal: round2(i.precioUnit * (i.cantidad + 1)) }
            : i,
        )
      }
      return [
        ...prev,
        { productoId: p.productoId, nombre: p.nombre, cantidad: 1, precioUnit: p.precio, subtotal: p.precio },
      ]
    })
  }

  async function registrar() {
    if (!campania) return toast.error('No hay una campaña activa.')
    if (!cliente) return toast.error('Selecciona un cliente.')
    if (items.length === 0) return toast.error('Agrega al menos un producto.')

    setSaving(true)
    try {
      const venta = await ventaService.registrarVenta({
        clienteId: cliente.id,
        campaniaId: campania.id,
        items,
        tipoPago,
      })
      toast.success(
        tipoPago === 'CONTADO'
          ? 'Venta registrada y pagada.'
          : 'Venta a crédito registrada. Se generó la cuenta por cobrar.',
      )
      navigate(`/ventas/${venta.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar la venta.')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) return <Loading />

  if (!campania) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          icon={CalendarRange}
          title="No hay campaña activa"
          description="Para registrar ventas, activa una campaña desde el Catálogo."
          action={
            <Button asChild variant="outline">
              <Link to="/catalogo">Ir al Catálogo</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title="Nueva venta"
        description={campania.nombre}
        actions={<StepIndicator paso={paso} />}
      />

      {paso === 1 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Productos de la campaña</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductoPickerGrid
                  productos={data!.productos}
                  enCarrito={enCarrito}
                  onAdd={agregar}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carrito</CardTitle>
              </CardHeader>
              <CardContent>
                <CartPanel items={items} onChange={setItems} />
              </CardContent>
            </Card>
            <Button
              className="w-full"
              size="lg"
              disabled={items.length === 0}
              onClick={() => setPaso(2)}
            >
              Continuar <ArrowRight />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientePicker
                  clientes={data!.clientes}
                  selectedId={cliente?.id ?? ''}
                  onSelect={setCliente}
                  onClienteCreado={() => reload()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forma de pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <PagoOption
                    active={tipoPago === 'CONTADO'}
                    onClick={() => setTipoPago('CONTADO')}
                    icon={<Wallet className="h-4 w-4" />}
                    label="Contado"
                    desc="Pago total ahora"
                  />
                  <PagoOption
                    active={tipoPago === 'CREDITO'}
                    onClick={() => setTipoPago('CREDITO')}
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Crédito"
                    desc="Cuenta por cobrar"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tipoPago === 'CONTADO'
                    ? 'Se registra el pago por el total de inmediato.'
                    : `Se genera una cuenta por cobrar (vence en 30 días). Límite de crédito por cliente: S/${LIMITE_CREDITO}.`}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{cliente?.nombre ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Productos</span>
                  <span>{items.reduce((a, i) => a + i.cantidad, 0)} und.</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <Money value={total} className="text-xl font-semibold" />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPaso(1)}>
                <ArrowLeft /> Atrás
              </Button>
              <Button
                className="flex-1"
                disabled={saving || !cliente}
                onClick={registrar}
              >
                <Check /> Registrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
      <Link to="/ventas">
        <ArrowLeft /> Ventas
      </Link>
    </Button>
  )
}

function StepIndicator({ paso }: { paso: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={paso === 1 ? 'default' : 'secondary'}>1 · Productos</Badge>
      <span className="text-muted-foreground">→</span>
      <Badge variant={paso === 2 ? 'default' : 'secondary'}>2 · Cliente y pago</Badge>
    </div>
  )
}

function PagoOption({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  desc: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-muted',
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <span className={cn('text-xs', active ? 'text-primary/80' : 'text-muted-foreground')}>
        {desc}
      </span>
    </button>
  )
}
