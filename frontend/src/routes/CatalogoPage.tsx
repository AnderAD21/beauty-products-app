import { useMemo, useState } from 'react'
import { Plus, Package, Pencil, Trash2, PackagePlus, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Loading } from '@/components/common/Loading'
import { Money } from '@/components/common/Money'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductoFormDialog } from '@/features/catalogo/ProductoFormDialog'
import { CampaniaFormDialog } from '@/features/catalogo/CampaniaFormDialog'
import { ProductoCampaniaFormDialog } from '@/features/catalogo/ProductoCampaniaFormDialog'
import { CampaniaSelector } from '@/features/catalogo/CampaniaSelector'
import { ProductoCard } from '@/features/catalogo/ProductoCard'
import { CatalogoSeccion } from '@/features/catalogo/CatalogoSeccion'
import { campaniaService } from '@/services/campaniaService'
import { productoService } from '@/services/productoService'
import {
  productoCampaniaService,
  type ProductoCampaniaConProducto,
} from '@/services/productoCampaniaService'
import { useAsync } from '@/hooks/useAsync'
import type { Producto } from '@/types'

export function CatalogoPage() {
  const [selected, setSelected] = useState('')
  const [query, setQuery] = useState('')
  const [marca, setMarca] = useState('Todas')

  const [campFormOpen, setCampFormOpen] = useState(false)
  const [prodFormOpen, setProdFormOpen] = useState(false)
  const [pcDialog, setPcDialog] = useState<{ producto: Producto; pc?: ProductoCampaniaConProducto['pc'] }>()
  const [aQuitar, setAQuitar] = useState<ProductoCampaniaConProducto>()

  const { data, loading, reload } = useAsync(async () => {
    const [campanias, productos] = await Promise.all([
      campaniaService.getAll(),
      productoService.getAll(),
    ])
    const campaniaId =
      selected ||
      campanias.find((c) => c.estado === 'ACTIVA')?.id ||
      campanias[0]?.id ||
      ''
    const rows = campaniaId
      ? await productoCampaniaService.getByCampaniaConProducto(campaniaId)
      : []
    return { campanias, productos, campaniaId, rows }
  }, [selected])

  const campania = data?.campanias.find((c) => c.id === data.campaniaId)
  const rows = data?.rows ?? []
  const productos = data?.productos ?? []

  const marcas = useMemo(
    () => ['Todas', ...Array.from(new Set(productos.map((p) => p.marca))).sort()],
    [productos],
  )

  const matchFiltro = (p: Producto) => {
    const q = query.toLowerCase().trim()
    const matchQ =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.descripcion?.toLowerCase().includes(q) ?? false)
    const matchMarca = marca === 'Todas' || p.marca === marca
    return matchQ && matchMarca
  }

  const asociados = useMemo(() => rows.filter((r) => matchFiltro(r.producto)), [rows, query, marca])

  const disponibles = useMemo(() => {
    const enCampania = new Set(rows.map((r) => r.producto.id))
    return productos.filter((p) => !enCampania.has(p.id) && matchFiltro(p))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, productos, query, marca])

  async function activar() {
    if (!campania) return
    await campaniaService.activar(campania.id)
    toast.success(`${campania.nombre} activada.`)
    reload()
  }

  async function confirmarQuitar() {
    if (!aQuitar) return
    await productoCampaniaService.remove(aQuitar.pc.id)
    toast.success('Producto quitado de la campaña.')
    reload()
  }

  if (loading && !data) return <Loading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo"
        description="Productos, precios y disponibilidad por campaña."
        actions={
          <Button variant="outline" onClick={() => setProdFormOpen(true)}>
            <PlusCircle /> Nuevo producto
          </Button>
        }
      />

      <CampaniaSelector
        campanias={data?.campanias ?? []}
        value={data?.campaniaId ?? ''}
        onChange={setSelected}
        selected={campania}
        onActivar={activar}
        onNueva={() => setCampFormOpen(true)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por código, nombre o descripción…"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {marcas.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={marca === m ? 'default' : 'outline'}
              onClick={() => setMarca(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {/* Zona 1: productos en la campaña */}
      <CatalogoSeccion
        title="En la campaña"
        count={asociados.length}
        empty={
          !campania ? (
            <EmptyState icon={Package} title="Sin campaña" description="Crea o selecciona una campaña." />
          ) : (
            <EmptyState
              icon={Package}
              title="Sin productos en la campaña"
              description="Agrega productos desde la zona de abajo."
            />
          )
        }
      >
        {asociados.map((row) => (
          <ProductoCard
            key={row.pc.id}
            producto={row.producto}
            destacado={<Money value={row.pc.precio} className="text-base font-semibold" />}
            estado={
              row.pc.disponible ? (
                <Badge variant="success">Disponible</Badge>
              ) : (
                <Badge variant="warning">No disponible</Badge>
              )
            }
            acciones={
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setPcDialog({ producto: row.producto, pc: row.pc })}
                  aria-label={`Editar ${row.producto.nombre}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setAQuitar(row)}
                  aria-label={`Quitar ${row.producto.nombre}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            }
          />
        ))}
      </CatalogoSeccion>

      {/* Zona 2: productos disponibles para agregar */}
      <CatalogoSeccion
        title="Disponibles para agregar"
        count={disponibles.length}
        empty={
          <EmptyState
            icon={PackagePlus}
            title="Nada por agregar"
            description="Todos los productos del catálogo ya están en la campaña, o no hay coincidencias."
            action={
              <Button variant="outline" onClick={() => setProdFormOpen(true)}>
                <PlusCircle /> Nuevo producto
              </Button>
            }
          />
        }
      >
        {disponibles.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            estado={!p.activo ? <Badge variant="warning">Inactivo</Badge> : undefined}
            acciones={
              <Button size="sm" disabled={!campania} onClick={() => setPcDialog({ producto: p })}>
                <Plus /> Agregar
              </Button>
            }
          />
        ))}
      </CatalogoSeccion>

      <CampaniaFormDialog
        open={campFormOpen}
        onOpenChange={setCampFormOpen}
        onSaved={(c) => setSelected(c.id)}
      />

      <ProductoFormDialog
        open={prodFormOpen}
        onOpenChange={setProdFormOpen}
        onSaved={() => reload()}
      />

      {data?.campaniaId && pcDialog && (
        <ProductoCampaniaFormDialog
          open={Boolean(pcDialog)}
          onOpenChange={(o) => !o && setPcDialog(undefined)}
          campaniaId={data.campaniaId}
          producto={pcDialog.producto}
          pc={pcDialog.pc}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(aQuitar)}
        onOpenChange={(o) => !o && setAQuitar(undefined)}
        title="Quitar de la campaña"
        description={`¿Quitar "${aQuitar?.producto.nombre}" de ${campania?.nombre}? No elimina el producto del catálogo maestro.`}
        confirmLabel="Quitar"
        destructive
        onConfirm={confirmarQuitar}
      />
    </div>
  )
}
