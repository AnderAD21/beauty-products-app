import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/cn'

interface MoneyProps {
  value: number
  className?: string
}

/** Muestra un monto con formato de moneda y tabular-nums para alinear columnas. */
export function Money({ value, className }: MoneyProps) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(value)}</span>
}
