import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  title: string
  count: number
  /** Mostrado cuando no hay elementos (p. ej. EmptyState). */
  empty: ReactNode
  /** Tarjetas de la zona; se disponen en grilla responsiva. */
  children: ReactNode
}

/** Sección de catálogo: encabezado con contador + grilla de productos o estado vacío. */
export function CatalogoSeccion({ title, count, empty, children }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} <span className="text-muted-foreground">({count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          empty
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
