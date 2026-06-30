import { Badge } from '@/components/ui/badge'
import { esVencida } from '@/services/cuentaPorCobrarService'
import type { CuentaPorCobrar, TipoPago } from '@/types'

/** Badge que considera el vencimiento: Pagada · Vencida · Vigente. */
export function CuentaEstadoBadge({ cuenta }: { cuenta: CuentaPorCobrar }) {
  if (cuenta.estado === 'CANCELADA') return <Badge variant="success">Pagada</Badge>
  if (esVencida(cuenta)) return <Badge variant="destructive">Vencida</Badge>
  return <Badge variant="warning">Vigente</Badge>
}

/** Badge para el tipo de pago de una venta. */
export function TipoPagoBadge({ tipo }: { tipo: TipoPago }) {
  return tipo === 'CONTADO' ? (
    <Badge variant="default">Contado</Badge>
  ) : (
    <Badge variant="secondary">Crédito</Badge>
  )
}
