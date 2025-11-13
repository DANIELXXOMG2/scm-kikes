'use client';

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db, storage } from '@/lib/firebase';
import { proveedorSchema, type Proveedor } from '@/lib/schemas';

const enhancedSchema = proveedorSchema.extend({
  rutFile: z.instanceof(File).optional(),
  camaraFile: z.instanceof(File).optional(),
});

type ProveedorFormValues = z.infer<typeof enhancedSchema>;

type ProveedorFormProps = {
  proveedor?: Proveedor | null;
  onClose: () => void;
};

export function ProveedorForm({ proveedor, onClose }: ProveedorFormProps) {
  const isEditMode = Boolean(proveedor);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [rutFile, setRutFile] = React.useState<File | null>(null);
  const [camaraFile, setCamaraFile] = React.useState<File | null>(null);

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(enhancedSchema),
    defaultValues: {
      nit: proveedor?.nit ?? '',
      nombre: proveedor?.nombre ?? '',
      telefono: proveedor?.telefono ?? '',
      email: proveedor?.email ?? '',
      direccion: proveedor?.direccion ?? '',
      rutUrl: proveedor?.rutUrl,
      camaraUrl: proveedor?.camaraUrl,
      rutFile: undefined,
      camaraFile: undefined,
    },
  });

  const handleSubmit = async (values: ProveedorFormValues) => {
    try {
      setIsSubmitting(true);
      const { rutFile: rutFileFromForm, camaraFile: camaraFileFromForm, ...payload } = values;

      if (isEditMode && proveedor) {
        await updateDoc(doc(db, 'proveedores', proveedor.id), payload);
        toast.success('Proveedor actualizado correctamente');
      } else {
        if (!rutFile || !camaraFile) {
          toast.error('Debes cargar el RUT y la Cámara de Comercio antes de guardar');
          setIsSubmitting(false);
          return;
        }

        const docRef = await addDoc(collection(db, 'proveedores'), payload);

        const rutStorageRef = ref(storage, `proveedores/${docRef.id}/rut.pdf`);
        const camaraStorageRef = ref(storage, `proveedores/${docRef.id}/camara.pdf`);

        await uploadBytes(rutStorageRef, rutFileFromForm ?? rutFile);
        await uploadBytes(camaraStorageRef, camaraFileFromForm ?? camaraFile);

        const [rutUrl, camaraUrl] = await Promise.all([
          getDownloadURL(rutStorageRef),
          getDownloadURL(camaraStorageRef),
        ]);

        await updateDoc(docRef, { rutUrl, camaraUrl });
        toast.success('Proveedor creado correctamente');
        setRutFile(null);
        setCamaraFile(null);
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al guardar el proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIT</FormLabel>
                <FormControl>
                  <Input placeholder="123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Proveedor S.A." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="3001234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="contacto@proveedor.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Calle 123 #45-67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isEditMode && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rut-file">RUT (PDF)</Label>
              <Input
                type="file"
                accept="application/pdf"
                id="rut-file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setRutFile(file);
                  form.setValue('rutFile', file ?? undefined, { shouldDirty: true });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camara-file">Cámara de Comercio (PDF)</Label>
              <Input
                type="file"
                accept="application/pdf"
                id="camara-file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setCamaraFile(file);
                  form.setValue('camaraFile', file ?? undefined, { shouldDirty: true });
                }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || (!isEditMode && (!rutFile || !camaraFile))
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
