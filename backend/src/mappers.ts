export type ClienteRow = {
  id_cliente: number
  dni: string
  nombres: string
  telefono: string | null
  direccion: string | null
}

export type CampaniaRow = {
  id_campana: number
  mes: string
  anio: number
  estado: string
}

export type ProductoRow = {
  id_producto: number
  codigo: string
  descripcion: string
  marca: string
}

export type ProductoCampaniaRow = {
  id_producto_campana: number
  id_producto: number
  id_campana: number
  precio: string
  disponibilidad: string
}

export type ProductoVendibleRow = ProductoRow & {
  precio: string
}

export type VentaRow = {
  id_venta: number
  id_cliente: number
  id_campana: number
  fecha: Date | string
  tipo_venta: string
  total: string | null
  id_producto: number | null
  producto_nombre: string | null
  cantidad: number | null
  precio_aplicado: string | null
}

export type CuentaPorCobrarRow = {
  id_cuenta: number
  id_venta: number
  id_cliente: number
  fecha: Date | string
  fecha_vencimiento: Date | string
  total: string
  saldo_pendiente: string
  estado: string
}

export type PagoRow = {
  id_pago: number
  id_venta: number
  id_cuenta: number | null
  fecha: Date | string
  monto: string
}

const meses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function mesTextoANumero(mes: string): number {
  const index = meses.findIndex((item) => item.toLowerCase() === mes.toLowerCase())
  return index >= 0 ? index + 1 : Number(mes)
}

export function mesNumeroATexto(mes: number): string {
  return meses[mes - 1] ?? String(mes)
}

export function mapEstadoDb(value: string) {
  return value.toUpperCase()
}

export function mapEstadoApi(value: string) {
  return value === 'ACTIVA' ? 'Activa' : 'Cerrada'
}

export function mapCliente(row: ClienteRow) {
  return {
    id: String(row.id_cliente),
    dni: row.dni,
    nombre: row.nombres,
    telefono: row.telefono ?? undefined,
    direccion: row.direccion ?? undefined,
    creadoEn: '',
  }
}

export function mapCampania(row: CampaniaRow) {
  const mes = mesTextoANumero(row.mes)
  return {
    id: String(row.id_campana),
    nombre: `Campania ${row.mes} ${row.anio}`,
    mes,
    anio: row.anio,
    estado: mapEstadoDb(row.estado),
  }
}

export function mapProducto(row: ProductoRow) {
  return {
    id: String(row.id_producto),
    codigo: row.codigo,
    nombre: row.descripcion,
    marca: row.marca,
    descripcion: row.descripcion,
    activo: true,
  }
}

export function mapProductoCampania(row: ProductoCampaniaRow) {
  return {
    id: String(row.id_producto_campana),
    productoId: String(row.id_producto),
    campaniaId: String(row.id_campana),
    precio: Number(row.precio),
    disponible: row.disponibilidad.toLowerCase() === 'disponible',
  }
}

export function mapProductoVendible(row: ProductoVendibleRow) {
  return {
    productoId: String(row.id_producto),
    codigo: row.codigo,
    nombre: row.descripcion,
    marca: row.marca,
    precio: Number(row.precio),
  }
}

function toISO(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapTipoVentaDb(value: string) {
  return value.toLowerCase().includes('cr') ? 'CREDITO' : 'CONTADO'
}

export function mapVentas(rows: VentaRow[]) {
  const ventas = new Map<string, ReturnType<typeof createVentaBase>>()

  for (const row of rows) {
    const id = String(row.id_venta)
    const venta = ventas.get(id) ?? createVentaBase(row)
    if (row.id_producto && row.producto_nombre && row.cantidad && row.precio_aplicado) {
      const precioUnit = Number(row.precio_aplicado)
      venta.items.push({
        productoId: String(row.id_producto),
        nombre: row.producto_nombre,
        cantidad: row.cantidad,
        precioUnit,
        subtotal: Number((precioUnit * row.cantidad).toFixed(2)),
      })
    }
    ventas.set(id, venta)
  }

  return Array.from(ventas.values())
}

function createVentaBase(row: VentaRow) {
  return {
    id: String(row.id_venta),
    clienteId: String(row.id_cliente),
    campaniaId: String(row.id_campana),
    fecha: toISO(row.fecha),
    items: [] as Array<{
      productoId: string
      nombre: string
      cantidad: number
      precioUnit: number
      subtotal: number
    }>,
    tipoPago: mapTipoVentaDb(row.tipo_venta),
    total: Number(row.total ?? 0),
    estado: 'REGISTRADA' as const,
  }
}

export function mapCuentaPorCobrar(row: CuentaPorCobrarRow) {
  return {
    id: String(row.id_cuenta),
    ventaId: String(row.id_venta),
    clienteId: String(row.id_cliente),
    fecha: toISO(row.fecha),
    fechaVencimiento: toISO(row.fecha_vencimiento),
    total: Number(row.total),
    saldoPendiente: Number(row.saldo_pendiente),
    estado: row.estado.toUpperCase() === 'CANCELADA' ? 'CANCELADA' : 'VIGENTE',
  }
}

export function mapPago(row: PagoRow) {
  return {
    id: String(row.id_pago),
    ventaId: String(row.id_venta),
    cuentaId: row.id_cuenta ? String(row.id_cuenta) : undefined,
    fecha: toISO(row.fecha),
    monto: Number(row.monto),
    tipoAplicacion: row.id_cuenta ? 'CREDITO' : 'CONTADO',
  }
}
