import { clearAll, getVersion, setVersion, writeCollection } from '@/services/storage'
import { nombreCampania } from '@/services/campaniaService'
import { addDays } from '@/lib/date'
import { round2 } from '@/lib/money'
import type {
  Campania,
  Cliente,
  CuentaPorCobrar,
  Pago,
  Producto,
  ProductoCampania,
  Venta,
  VentaItem,
} from '@/types'

/** Subir esta versión fuerza un reseed (limpia beautyproducts:* y recarga). */
const SCHEMA_VERSION = '4'

function diasAtras(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// --- Productos (sin precio; el precio vive en ProductoCampania) ---
const productos: Producto[] = [
  { id: 'prod_labial', codigo: 'LAB-001', nombre: 'Labial Mate Larga Duración', marca: 'Bellísima', activo: true, descripcion: 'Acabado mate aterciopelado, 8 tonos.' },
  { id: 'prod_base', codigo: 'BAS-002', nombre: 'Base Líquida Cobertura Total', marca: 'Bellísima', activo: true, descripcion: 'Cobertura media a alta, FPS 15.' },
  { id: 'prod_mascara', codigo: 'MAS-003', nombre: 'Máscara de Pestañas Volumen', marca: 'Lumière', activo: true },
  { id: 'prod_serum', codigo: 'SER-004', nombre: 'Sérum Facial Vitamina C', marca: 'DermaPro', activo: true, descripcion: 'Ilumina y unifica el tono.' },
  { id: 'prod_crema', codigo: 'CRM-005', nombre: 'Crema Hidratante Día', marca: 'DermaPro', activo: true },
  { id: 'prod_protector', codigo: 'PRO-006', nombre: 'Protector Solar FPS 50', marca: 'DermaPro', activo: true },
  { id: 'prod_perfume', codigo: 'PER-007', nombre: 'Eau de Parfum Floral 50ml', marca: 'Aroma', activo: true, descripcion: 'Notas de jazmín y vainilla.' },
  { id: 'prod_shampoo', codigo: 'SHA-008', nombre: 'Shampoo Reparación Intensa', marca: 'NutriHair', activo: true },
  { id: 'prod_mascarilla', codigo: 'MSC-009', nombre: 'Mascarilla Capilar Nutritiva', marca: 'NutriHair', activo: false, descripcion: 'Temporalmente sin stock.' },
]

// --- Campañas: una ACTIVA (mes actual) y una CERRADA (mes anterior) ---
const now = new Date()
const mesActual = now.getMonth() + 1
const anioActual = now.getFullYear()
const mesAnterior = mesActual === 1 ? 12 : mesActual - 1
const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual

const campanias: Campania[] = [
  { id: 'camp_activa', nombre: nombreCampania(mesActual, anioActual), mes: mesActual, anio: anioActual, estado: 'ACTIVA' },
  { id: 'camp_anterior', nombre: nombreCampania(mesAnterior, anioAnterior), mes: mesAnterior, anio: anioAnterior, estado: 'CERRADA' },
]

// Precio del producto en la campaña ACTIVA (referencia para los ítems de venta).
const precioActiva: Record<string, number> = {
  prod_labial: 32.9,
  prod_base: 58.0,
  prod_mascara: 41.5,
  prod_serum: 79.9,
  prod_crema: 64.0,
  prod_protector: 49.9,
  prod_perfume: 129.0,
  prod_shampoo: 38.5,
  prod_mascarilla: 44.0,
}

// --- ProductoCampania: mismo producto en ambas campañas con precios distintos ---
const productoCampanias: ProductoCampania[] = [
  // Campaña ACTIVA
  ...productos.map((p, i) => ({
    id: `pc_act_${i}`,
    productoId: p.id,
    campaniaId: 'camp_activa',
    precio: precioActiva[p.id],
    // la mascarilla (producto inactivo) queda no disponible en la campaña
    disponible: p.id !== 'prod_mascarilla',
  })),
  // Campaña ANTERIOR (precios distintos en algunos productos)
  { id: 'pc_ant_0', productoId: 'prod_labial', campaniaId: 'camp_anterior', precio: 29.9, disponible: true },
  { id: 'pc_ant_1', productoId: 'prod_base', campaniaId: 'camp_anterior', precio: 55.0, disponible: true },
  { id: 'pc_ant_2', productoId: 'prod_serum', campaniaId: 'camp_anterior', precio: 75.0, disponible: false },
  { id: 'pc_ant_3', productoId: 'prod_perfume', campaniaId: 'camp_anterior', precio: 119.0, disponible: true },
]

const clientes: Cliente[] = [
  { id: 'cli_ana', dni: '45123789', nombre: 'Ana Torres', telefono: '987 654 321', email: 'ana.torres@mail.com', direccion: 'Av. Primavera 123', creadoEn: diasAtras(60) },
  { id: 'cli_lucia', dni: '40988123', nombre: 'Lucía Ramírez', telefono: '951 222 333', email: 'lucia.r@mail.com', creadoEn: diasAtras(40) },
  { id: 'cli_marta', dni: '72655401', nombre: 'Marta Quispe', telefono: '900 111 222', direccion: 'Jr. Las Flores 456', creadoEn: diasAtras(25) },
  { id: 'cli_rosa', dni: '09876543', nombre: 'Rosa Mendoza', telefono: '933 444 555', email: 'rosa.m@mail.com', creadoEn: diasAtras(12) },
  { id: 'cli_carla', dni: '76543210', nombre: 'Carla Díaz', telefono: '966 777 888', creadoEn: diasAtras(5) },
]

function item(productoId: string, cantidad: number): VentaItem {
  const prod = productos.find((p) => p.id === productoId)!
  const precioUnit = precioActiva[productoId]
  return { productoId, nombre: prod.nombre, cantidad, precioUnit, subtotal: round2(precioUnit * cantidad) }
}

const ventas: Venta[] = []
const cuentas: CuentaPorCobrar[] = []
const pagos: Pago[] = []

function nuevaVenta(
  id: string,
  clienteId: string,
  fecha: string,
  items: VentaItem[],
  tipoPago: Venta['tipoPago'],
): number {
  const total = round2(items.reduce((a, i) => a + i.subtotal, 0))
  ventas.push({ id, clienteId, campaniaId: 'camp_activa', fecha, items, tipoPago, total, estado: 'REGISTRADA' })
  return total
}

// Venta 1: CONTADO (pago directo)
{
  const t = nuevaVenta('venta_1', 'cli_ana', diasAtras(18), [item('prod_labial', 2), item('prod_mascara', 1)], 'CONTADO')
  pagos.push({ id: 'pago_1', ventaId: 'venta_1', fecha: diasAtras(18), monto: t, tipoAplicacion: 'CONTADO', metodo: 'Efectivo' })
}

// Venta 2: CRÉDITO totalmente pagado → CxC CANCELADA
{
  const f = diasAtras(15)
  const t = nuevaVenta('venta_2', 'cli_lucia', f, [item('prod_serum', 1)], 'CREDITO')
  cuentas.push({ id: 'cxc_2', ventaId: 'venta_2', clienteId: 'cli_lucia', fecha: f, fechaVencimiento: addDays(f, 30), total: t, saldoPendiente: 0, estado: 'CANCELADA' })
  pagos.push({ id: 'pago_2', ventaId: 'venta_2', cuentaId: 'cxc_2', fecha: diasAtras(10), monto: t, tipoAplicacion: 'CREDITO', metodo: 'Yape' })
}

// Venta 3: CRÉDITO con pago parcial → CxC VIGENTE (vence en el futuro)
{
  const f = diasAtras(9)
  const t = nuevaVenta('venta_3', 'cli_marta', f, [item('prod_crema', 1)], 'CREDITO')
  const abonado = 20
  cuentas.push({ id: 'cxc_3', ventaId: 'venta_3', clienteId: 'cli_marta', fecha: f, fechaVencimiento: addDays(f, 30), total: t, saldoPendiente: round2(t - abonado), estado: 'VIGENTE' })
  pagos.push({ id: 'pago_3', ventaId: 'venta_3', cuentaId: 'cxc_3', fecha: diasAtras(4), monto: abonado, tipoAplicacion: 'CREDITO', metodo: 'Transferencia' })
}

// Venta 4: CRÉDITO sin pagos → CxC VIGENTE (saldo = total, dentro de S/100)
{
  const f = diasAtras(3)
  const t = nuevaVenta('venta_4', 'cli_rosa', f, [item('prod_protector', 1), item('prod_shampoo', 1)], 'CREDITO')
  cuentas.push({ id: 'cxc_4', ventaId: 'venta_4', clienteId: 'cli_rosa', fecha: f, fechaVencimiento: addDays(f, 30), total: t, saldoPendiente: t, estado: 'VIGENTE' })
}

// Venta 5: CONTADO reciente
{
  const f = diasAtras(1)
  const t = nuevaVenta('venta_5', 'cli_carla', f, [item('prod_protector', 1)], 'CONTADO')
  pagos.push({ id: 'pago_5', ventaId: 'venta_5', fecha: f, monto: t, tipoAplicacion: 'CONTADO', metodo: 'Efectivo' })
}

// Venta 6: CRÉDITO VENCIDO (emitida hace 45 días → venció hace 15) para probar el badge
{
  const f = diasAtras(45)
  const t = nuevaVenta('venta_6', 'cli_ana', f, [item('prod_labial', 1)], 'CREDITO')
  cuentas.push({ id: 'cxc_6', ventaId: 'venta_6', clienteId: 'cli_ana', fecha: f, fechaVencimiento: addDays(f, 30), total: t, saldoPendiente: t, estado: 'VIGENTE' })
}

/**
 * Carga/migra los datos semilla. Si la versión del esquema cambió (o no hay datos),
 * limpia el namespace y recarga la semilla nueva.
 */
export function seedIfNeeded(): void {
  if (getVersion() === SCHEMA_VERSION) return
  clearAll()
  writeCollection('productos', productos)
  writeCollection('campanias', campanias)
  writeCollection('producto_campanias', productoCampanias)
  writeCollection('clientes', clientes)
  writeCollection('ventas', ventas)
  writeCollection('cuentas', cuentas)
  writeCollection('pagos', pagos)
  setVersion(SCHEMA_VERSION)
}
