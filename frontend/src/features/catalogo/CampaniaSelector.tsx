import { Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Campania } from '@/types'

interface Props {
  campanias: Campania[]
  value: string
  onChange: (id: string) => void
  selected?: Campania
  onActivar: () => void
  onNueva: () => void
}

export function CampaniaSelector({ campanias, value, onChange, selected, onActivar, onNueva }: Props) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="Selecciona una campaña…" />
          </SelectTrigger>
          <SelectContent>
            {campanias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected &&
          (selected.estado === 'ACTIVA' ? (
            <Badge variant="success">Activa</Badge>
          ) : (
            <Badge variant="secondary">Cerrada</Badge>
          ))}
      </div>
      <div className="flex items-center gap-2">
        {selected && selected.estado !== 'ACTIVA' && (
          <Button variant="outline" size="sm" onClick={onActivar}>
            <CheckCircle2 /> Activar
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onNueva}>
          <Plus /> Nueva campaña
        </Button>
      </div>
    </Card>
  )
}
