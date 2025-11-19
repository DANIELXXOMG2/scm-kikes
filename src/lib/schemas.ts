import { z } from 'zod';

export const proveedorSchema = z.object({
  nit: z.string().min(1, 'El NIT es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().optional(),
  email: z.string().email('Correo inválido').optional(),
  direccion: z.string().optional(),
  rutUrl: z.string().url().optional(),
  camaraUrl: z.string().url().optional(),
});

export type Proveedor = z.infer<typeof proveedorSchema> & { id: string };

export const clienteSchema = z.object({
  cedula: z.string().min(1, 'La cédula es requerida'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().optional(),
  email: z.string().email('Correo inválido').optional(),
  direccion: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type Cliente = z.infer<typeof clienteSchema> & { id: string };

// (Datos del PDF)
export const PRECIOS_HUEVOS = {
  A: 10500,
  AA: 20700,
  B: 11350,
} as const;
export type TipoHuevo = 'A' | 'AA' | 'B';

// (RF-M3) Esquema para la colección 'inventario'
export const inventarioSchema = z.object({
  nombre: z.string(),
  precio: z.number().positive(),
  stock: z.number().int().min(0),
});
export type InventarioItem = z.infer<typeof inventarioSchema> & { id: TipoHuevo };

// (RF-M6.1) Esquema para el doc 'contabilidad/saldo'
export const saldoSchema = z.object({
  monto: z.number(),
});
export type Saldo = z.infer<typeof saldoSchema>;

// (RF-M6.2) Esquema para la colección 'transacciones'
export const transaccionSchema = z.object({
  fecha: z.any(), // Firestore Timestamp
  tipo: z.enum(['ingreso', 'egreso']),
  monto: z.number(),
  concepto: z.string(), // Ej: "Venta a Juan Pérez (Fact-001)"
});
export type Transaccion = z.infer<typeof transaccionSchema> & { id: string };

// Esquema para un item en una venta o compra
export const itemTransaccionalSchema = z.object({
  id: z.string(), // 'A', 'AA', o 'B'
  nombre: z.string(),
  cantidad: z.number().int().min(1),
  precioUnitario: z.number(),
  subtotal: z.number(),
});
export type ItemTransaccional = z.infer<typeof itemTransaccionalSchema>;

export const ventaSchema = z.object({
  clienteId: z.string(),
  clienteNombre: z.string(),
  clienteCedula: z.string(),
  items: z.array(itemTransaccionalSchema),
  total: z.number(),
  vendedorEmail: z.string().optional(),
  fecha: z.any(),
  transaccionId: z.string().optional(),
});
export type Venta = z.infer<typeof ventaSchema> & { id: string };

export const compraSchema = z.object({
  proveedorId: z.string(),
  proveedorNombre: z.string(),
  proveedorNit: z.string(),
  items: z.array(itemTransaccionalSchema),
  total: z.number(),
  medioDePago: z.string(),
  fecha: z.any(),
  creadoEn: z.any().optional(),
  transaccionId: z.string().optional(),
});
export type Compra = z.infer<typeof compraSchema> & { id: string };
