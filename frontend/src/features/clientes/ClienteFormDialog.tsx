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
import { clienteService } from '@/services/clienteService'
import { nowISO } from '@/lib/date'
import type { Cliente } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente
  /** DNI inicial (p. ej. el texto buscado al crear desde una venta). */
  dniInicial?: string
  /** Devuelve el cliente guardado (para preseleccionarlo en la venta). */
  onSaved: (cliente: Cliente) => void
}

export function ClienteFormDialog({ open, onOpenChange, cliente, dniInicial, onSaved }: Props) {
  const editing = Boolean(cliente)
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDni(cliente?.dni ?? dniInicial ?? '')
      setNombre(cliente?.nombre ?? '')
      setTelefono(cliente?.telefono ?? '')
      setEmail(cliente?.email ?? '')
      setDireccion(cliente?.direccion ?? '')
    }
  }, [open, cliente, dniInicial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dniTrim = dni.trim()
    if (!dniTrim) return toast.error('Ingresa el DNI del cliente.')
    if (!/^\d{8}$/.test(dniTrim)) return toast.error('El DNI debe tener 8 dígitos numéricos.')
    if (!nombre.trim()) return toast.error('Ingresa el nombre del cliente.')

    setSaving(true)
    try {
      if (await clienteService.existeDni(dniTrim, cliente?.id)) {
        toast.error('Ya existe un cliente con ese DNI.')
        return
      }
      const data = {
        dni: dni.trim(),
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
      }
      const saved = cliente
        ? await clienteService.update(cliente.id, data)
        : await clienteService.create({ ...data, creadoEn: nowISO() })
      toast.success(cliente ? 'Cliente actualizado.' : 'Cliente registrado.')
      onOpenChange(false)
      onSaved(saved)
    } catch {
      toast.error('No se pudo guardar el cliente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>Datos del cliente.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 45123789"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="987 654 321"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ana Torres"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@mail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. / Jr. ..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? 'Guardar cambios' : 'Registrar cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
