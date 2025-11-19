'use client';

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { clienteSchema, type Cliente } from '@/lib/schemas';

import type { z } from 'zod';

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), { ssr: false });

type ClienteFormValues = z.infer<typeof clienteSchema>;

type ClienteFormProps = {
  cliente?: Cliente | null;
  onClose: () => void;
};

export function ClienteForm({ cliente, onClose }: ClienteFormProps) {
  const isEditMode = Boolean(cliente);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      cedula: cliente?.cedula ?? '',
      nombre: cliente?.nombre ?? '',
      telefono: cliente?.telefono ?? '',
      email: cliente?.email ?? '',
      direccion: cliente?.direccion ?? '',
      lat: cliente?.lat,
      lng: cliente?.lng,
    },
  });

  const handleSubmit = async (values: ClienteFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditMode && cliente) {
        await updateDoc(doc(db, 'clientes', cliente.id), values);
        toast.success('Cliente actualizado correctamente');
      } else {
        await addDoc(collection(db, 'clientes'), values);
        toast.success('Cliente creado correctamente');
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="cedula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
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
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
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
                    <Input placeholder="cliente@correo.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buscar dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección del cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <MapPicker
              lat={form.getValues('lat')}
              lng={form.getValues('lng')}
              onLocationSelect={(lat, lng) => {
                form.setValue('lat', lat, { shouldDirty: true });
                form.setValue('lng', lng, { shouldDirty: true });
              }}
            />
            <p className="text-xs text-text-dark/70">Toque en el mapa para fijar la ubicación exacta.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
