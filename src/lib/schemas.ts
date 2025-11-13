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
});

export type Cliente = z.infer<typeof clienteSchema> & { id: string };
