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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Money } from '@/components/common/Money'
import { pagoService } from '@/services/pagoService'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  ventaId: string
  saldoPendiente: number
  onSaved: () => void
}

const METODOS = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta']

export function PagoFormDialog({ open, onOpenChange, ventaId, saldoPendiente, onSaved }: Props) {
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState(METODOS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setMonto('')
      setMetodo(METODOS[0])
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) return toast.error('Ingresa un monto válido.')
    if (montoNum > saldoPendiente + 0.001)
      return toast.error('El monto supera el saldo pendiente.')

    setSaving(true)
    try {
      await pagoService.registrarPago({ ventaId, monto: montoNum, metodo })
      const restante = saldoPendiente - montoNum
      toast.success(
        restante <= 0.001
          ? 'Pago registrado. Cuenta cancelada.'
          : 'Pago parcial registrado.',
      )
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar el pago.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Saldo pendiente: <Money value={saldoPendiente} className="font-medium text-foreground" />
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto a pagar (S/)</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setMonto(String(saldoPendiente))}
            >
              Pagar saldo completo
            </button>
          </div>

          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Registrar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
