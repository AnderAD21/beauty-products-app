/** Modelos de dominio de BeautyProducts. */

export type ID = string

export type TipoPago = 'CONTADO' | 'CREDITO'

/** La venta (Nota de Venta) solo se registra; la cobranza vive en CuentaPorCobrar. */
export type EstadoVenta = 'REGISTRADA'

/** VIGENTE = pendiente de cobro · CANCELADA = totalmente pagada. */
export type EstadoCxC = 'VIGENTE' | 'CANCELADA'

/** Estado de una campaña. Solo una puede estar ACTIVA a la vez. */
export type EstadoCampania = 'ACTIVA' | 'CERRADA'

/** Reglas de negocio (consultora de belleza por campañas). */
export const LIMITE_CREDITO = 100 // S/ máximo de deuda vigente por cliente
export const PLAZO_DIAS = 30 // días para vencer una cuenta por cobrar

/**
 * Producto maestro del catálogo. El precio NO vive aquí: se define por campaña en
 * `ProductoCampania`. Un producto sin ProductoCampania no es vendible en ninguna campaña.
 */
export interface Producto {
  id: ID
  codigo: string
  nombre: string
  marca: string
  descripcion?: string
  imagen?: string
  activo: boolean
}

export interface Cliente {
  id: ID
  dni: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  creadoEn: string
}

export interface Campania {
  id: ID
  nombre: string
  mes: number
  anio: number
  estado: EstadoCampania
}

/** Precio y disponibilidad de un producto dentro de una campaña concreta. */
export interface ProductoCampania {
  id: ID
  productoId: ID
  campaniaId: ID
  precio: number
  disponible: boolean
}

export interface VentaItem {
  productoId: ID
  nombre: string
  cantidad: number
  /** Precio congelado al momento de la venta (histórico inmutable). */
  precioUnit: number
  subtotal: number
}

/** Nota de Venta. */
export interface Venta {
  id: ID
  clienteId: ID
  campaniaId: ID
  fecha: string
  items: VentaItem[]
  /** Modalidad de la venta (alias conceptual: "tipoVenta" del modelo RUP). */
  tipoPago: TipoPago
  total: number
  estado: EstadoVenta
}

/** Solo existe para ventas a CRÉDITO. */
export interface CuentaPorCobrar {
  id: ID
  ventaId: ID
  clienteId: ID
  /** Fecha de emisión (alias conceptual: "fechaEmision" del modelo RUP). */
  fecha: string
  fechaVencimiento: string
  total: number
  saldoPendiente: number
  estado: EstadoCxC
}

export interface Pago {
  id: ID
  ventaId: ID
  cuentaId?: ID
  fecha: string
  monto: number
  /** Origen del pago: CONTADO (venta al contado) o CREDITO (abono a una CxC). */
  tipoAplicacion: TipoPago
  metodo?: string
}

/** Vista de un producto vendible en una campaña (join Producto + ProductoCampania). */
export interface ProductoVendible {
  productoId: ID
  codigo: string
  nombre: string
  marca: string
  precio: number
}
