import type { ReactNode } from 'react'
import { SearchInput } from './SearchInput'
import { cn } from '@/lib/cn'

interface Props {
  query?: string
  onQueryChange?: (value: string) => void
  searchPlaceholder?: string
  count: number
  total: number
  children?: ReactNode
  className?: string
}

export function DataToolbar({
  query,
  onQueryChange,
  searchPlaceholder = 'Buscar...',
  count,
  total,
  children,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col gap-3 border-b p-4', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onQueryChange && query !== undefined && (
            <SearchInput
              value={query}
              onChange={onQueryChange}
              placeholder={searchPlaceholder}
              className="sm:w-72"
            />
          )}
          {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
        <p className="text-sm text-muted-foreground">
          {count} de {total} registros
        </p>
      </div>
    </div>
  )
}
