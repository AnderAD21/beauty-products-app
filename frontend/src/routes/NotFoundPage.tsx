import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Página no encontrada"
      description="La ruta que intentas abrir no existe."
      action={
        <Button asChild variant="outline">
          <Link to="/">Ir al resumen</Link>
        </Button>
      }
    />
  )
}
