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
import { Textarea } from '@/components/ui/textarea'
import { productoService } from '@/services/productoService'
import type { Producto } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto?: Producto
  /** Devuelve el producto guardado (útil para preseleccionarlo al crear desde otro flujo). */
  onSaved: (producto: Producto) => void
}

/** Alta/edición del producto MAESTRO (sin precio: el precio vive en ProductoCampania). */
export function ProductoFormDialog({ open, onOpenChange, producto, onSaved }: Props) {
  const editing = Boolean(producto)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [activo, setActivo] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCodigo(producto?.codigo ?? '')
      setNombre(producto?.nombre ?? '')
      setMarca(producto?.marca ?? '')
      setDescripcion(producto?.descripcion ?? '')
      setActivo(producto?.activo ?? true)
    }
  }, [open, producto])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return toast.error('Ingresa el código del producto.')
    if (!nombre.trim()) return toast.error('Ingresa el nombre del producto.')
    if (!marca.trim()) return toast.error('Ingresa la marca del producto.')

    setSaving(true)
    try {
      const data = {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        marca: marca.trim(),
        descripcion: descripcion.trim() || undefined,
        activo,
      }
      const saved = producto
        ? await productoService.update(producto.id, data)
        : await productoService.create(data)
      toast.success(producto ? 'Producto actualizado.' : 'Producto creado.')
      onOpenChange(false)
      onSaved(saved)
    } catch {
      toast.error('No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>
            Datos del producto. El precio se define por campaña.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. LAB-001"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej. Bellísima"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Labial Mate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle breve del producto"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Producto activo
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
