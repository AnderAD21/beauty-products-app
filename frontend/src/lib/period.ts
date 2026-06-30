export type PeriodPreset = 'today' | '7d' | '14d' | 'currentMonth' | 'previousMonth' | 'all' | 'custom'

export interface PeriodState {
  preset: PeriodPreset
  from?: string
  to?: string
}

export function defaultPeriod(preset: PeriodPreset = 'all'): PeriodState {
  return { preset }
}

export function inPeriod(iso: string, period: PeriodState): boolean {
  const range = getPeriodRange(period)
  if (!range) return true
  const time = new Date(iso).getTime()
  return time >= range.from.getTime() && time <= range.to.getTime()
}

export function shouldGroupByMonth(period: PeriodState): boolean {
  return ['all', 'currentMonth', 'previousMonth', 'custom'].includes(period.preset)
}

export function monthKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  })
}

function getPeriodRange(period: PeriodState): { from: Date; to: Date } | null {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (period.preset === 'all') return null
  if (period.preset === 'today') return { from: todayStart, to: todayEnd }
  if (period.preset === '7d') return { from: addDays(todayStart, -6), to: todayEnd }
  if (period.preset === '14d') return { from: addDays(todayStart, -13), to: todayEnd }
  if (period.preset === 'currentMonth') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }
  if (period.preset === 'previousMonth') {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  }
  const from = period.from ? startOfDay(new Date(`${period.from}T00:00:00`)) : new Date(0)
  const to = period.to ? endOfDay(new Date(`${period.to}T00:00:00`)) : todayEnd
  return { from, to }
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
