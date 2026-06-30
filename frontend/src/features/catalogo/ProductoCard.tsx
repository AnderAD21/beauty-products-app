import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { Producto } from '@/types'

interface Props {
  producto: Producto
  /** Línea destacada (p. ej. precio de campaña). */
  destacado?: ReactNode
  /** Badge de disponibilidad u otro estado. */
  estado?: ReactNode
  /** Acciones (botones) al pie. */
  acciones?: ReactNode
  className?: string
}

/** Tarjeta compacta y reutilizable de producto maestro. */
export function ProductoCard({ producto, destacado, estado, acciones, className }: Props) {
  return (
    <Card className={cn('card-interactive flex flex-col', className)}>
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary">{producto.marca}</Badge>
          {estado}
        </div>
        <div className="flex-1">
          <p className="font-mono text-xs text-muted-foreground">{producto.codigo}</p>
          <p className="text-sm font-medium leading-snug">{producto.nombre}</p>
          {producto.descripcion && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {producto.descripcion}
            </p>
          )}
        </div>
        {(destacado || acciones) && (
          <div className="flex items-center justify-between pt-1">
            <div>{destacado}</div>
            <div className="flex gap-1">{acciones}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
