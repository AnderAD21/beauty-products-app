import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { round2 } from '@/lib/money'
import type { VentaItem } from '@/types'

interface Props {
  items: VentaItem[]
  onChange: (items: VentaItem[]) => void
}

/** Carrito de la venta preliminar: editar cantidades, quitar, ver subtotales y total. */
export function CartPanel({ items, onChange }: Props) {
  function setCantidad(productoId: string, cantidad: number) {
    if (cantidad <= 0) {
      onChange(items.filter((i) => i.productoId !== productoId))
      return
    }
    onChange(
      items.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad, subtotal: round2(i.precioUnit * cantidad) }
          : i,
      ),
    )
  }

  const total = round2(items.reduce((acc, i) => acc + i.subtotal, 0))
  const unidades = items.reduce((acc, i) => acc + i.cantidad, 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Carrito vacío</p>
        <p className="text-xs text-muted-foreground">
          Agrega productos de la campaña para armar la venta.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="divide-y rounded-lg border">
        {items.map((i) => (
          <div key={i.productoId} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.nombre}</p>
              <p className="text-xs text-muted-foreground">
                <Money value={i.precioUnit} /> c/u
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setCantidad(i.productoId, i.cantidad - 1)}
                aria-label={`Disminuir ${i.nombre}`}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-7 text-center text-sm tabular-nums">{i.cantidad}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setCantidad(i.productoId, i.cantidad + 1)}
                aria-label={`Aumentar ${i.nombre}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Money value={i.subtotal} className="w-20 text-right text-sm font-medium" />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setCantidad(i.productoId, 0)}
              aria-label={`Quitar ${i.nombre}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
        <span className="text-sm text-muted-foreground">
          {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">Total</span>
          <Money value={total} className="text-lg font-semibold" />
        </span>
      </div>
    </div>
  )
}
