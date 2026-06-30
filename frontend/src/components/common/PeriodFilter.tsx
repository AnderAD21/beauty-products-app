import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PeriodPreset, PeriodState } from '@/lib/period'

interface Props {
  value: PeriodState
  onChange: (value: PeriodState) => void
}

const PRESETS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: 'currentMonth', label: 'Mes actual' },
  { value: 'previousMonth', label: 'Mes anterior' },
  { value: 'all', label: 'Todo' },
  { value: 'custom', label: 'Rango' },
]

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.preset}
        onValueChange={(preset) => onChange({ ...value, preset: preset as PeriodPreset })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.preset === 'custom' && (
        <>
          <Input
            type="date"
            value={value.from ?? ''}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
            className="w-[145px]"
            aria-label="Desde"
          />
          <Input
            type="date"
            value={value.to ?? ''}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
            className="w-[145px]"
            aria-label="Hasta"
          />
        </>
      )}
    </div>
  )
}
