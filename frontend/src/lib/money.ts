/** Formato de moneda para la demo (Soles peruanos). Ajustable a futuro. */
const formatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

export function formatMoney(value: number): string {
  return formatter.format(value || 0)
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
