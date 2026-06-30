import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { productoCampaniaService } from '@/services/productoCampaniaService'
import type { Producto, ProductoCampania } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaniaId: string
  /** Producto objetivo (preseleccionado al agregar, o el de la fila al editar). */
  producto?: Producto
  /** Fila existente al editar precio/disponibilidad. */
  pc?: ProductoCampania
  onSaved: () => void
}

/**
 * Define precio y disponibilidad de un producto en una campaña.
 * El producto siempre viene preseleccionado (sin combo).
 */
export function ProductoCampaniaFormDialog({
  open,
  onOpenChange,
  campaniaId,
  producto,
  pc,
  onSaved,
}: Props) {
  const editing = Boolean(pc)
  const [precio, setPrecio] = useState('')
  const [disponible, setDisponible] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPrecio(pc ? String(pc.precio) : '')
      setDisponible(pc?.disponible ?? true)
    }
  }, [open, pc])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!producto) return
    const precioNum = Number(precio)
    if (!precioNum || precioNum <= 0) return toast.error('Ingresa un precio válido.')

    setSaving(true)
    try {
      await productoCampaniaService.upsert(producto.id, campaniaId, precioNum, disponible)
      toast.success(editing ? 'Actualizado en la campaña.' : 'Producto agregado a la campaña.')
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error('No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar precio / disponibilidad' : 'Agregar a la campaña'}
          </DialogTitle>
          <DialogDescription>
            {producto ? (
              <>
                <span className="font-mono text-xs">{producto.codigo}</span> · {producto.nombre} ({producto.marca})
              </>
            ) : (
              'Define el precio en esta campaña.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="precio">Precio en la campaña (S/)</Label>
            <Input
              id="precio"
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Disponible para la venta en esta campaña
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? 'Guardar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
