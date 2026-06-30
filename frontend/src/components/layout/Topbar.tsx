import { Menu, CalendarRange } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { campaniaService } from '@/services/campaniaService'
import { useAsync } from '@/hooks/useAsync'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { data: campania } = useAsync(() => campaniaService.getActiva())

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenu}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <BrandLogo compact className="md:hidden" />

      <div className="flex flex-1 items-center justify-between">
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <CalendarRange className="h-4 w-4" />
          Campania activa
        </div>
        {campania ? (
          <Badge variant="default" className="ml-auto gap-1.5 px-3 py-1">
            <CalendarRange className="h-3.5 w-3.5" />
            {campania.nombre}
          </Badge>
        ) : (
          <Badge variant="warning" className="ml-auto px-3 py-1">
            Sin campania activa
          </Badge>
        )}
      </div>
    </header>
  )
}
