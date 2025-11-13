'use client';

import { useState } from 'react';

import { doc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { db } from '@/lib/firebase';
import { PRECIOS_HUEVOS, type InventarioItem } from '@/lib/schemas';

export default function InventarioPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const { data: inventario, loading } = useFirestoreCollection<InventarioItem>('inventario');

  // (RF-M3 / RF-M6) Lógica para inicializar la base de datos
  const handleInitData = async () => {
    setIsInitializing(true);
    toast.info('Inicializando datos...');
    try {
      const batch = writeBatch(db);

      // (RF-M3) Crear docs de inventario
      batch.set(doc(db, 'inventario', 'A'), {
        nombre: 'Tipo A',
        precio: PRECIOS_HUEVOS.A,
        stock: 150, // Stock inicial
      });
      batch.set(doc(db, 'inventario', 'AA'), {
        nombre: 'Tipo AA',
        precio: PRECIOS_HUEVOS.AA,
        stock: 80, // Stock inicial
      });
      batch.set(doc(db, 'inventario', 'B'), {
        nombre: 'Tipo B',
        precio: PRECIOS_HUEVOS.B,
        stock: 120, // Stock inicial
      });

      // (RF-M6.1) Crear doc de saldo
      batch.set(doc(db, 'contabilidad', 'saldo'), {
        monto: 1000000, // Saldo inicial arbitrario
      });

      await batch.commit();
      toast.success('Datos inicializados correctamente.');
    } catch (error) {
      toast.error('Error al inicializar datos.');
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            Cargando inventario...
          </TableCell>
        </TableRow>
      );
    }

    if (inventario.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            <p>No hay datos de inventario.</p>
            <Button
              onClick={handleInitData}
              disabled={isInitializing}
              className="mt-4 bg-accent text-text-dark hover:bg-accent/90"
            >
              {isInitializing ? 'Inicializando...' : 'Inicializar Datos (RF-M3)'}
            </Button>
          </TableCell>
        </TableRow>
      );
    }

    // (RF-M3) Renderizar tabla dinámica
    return inventario
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((item) => (
        <TableRow key={item.id} className="border-accent/20">
          <TableCell>{item.nombre}</TableCell>
          <TableCell>30 unidades (cubeta)</TableCell>
          <TableCell>
            ${new Intl.NumberFormat('es-CO').format(item.precio)}
          </TableCell>
          <TableCell className="font-medium">{item.stock}</TableCell>
        </TableRow>
      ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Inventario (RF-M3)</h2>
        <Button className="bg-accent text-text-dark hover:bg-accent/90">
          Generar Reporte Excel (RF-M3.3)
        </Button>
      </div>

      <Card className="bg-secondary border-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/30 hover:bg-accent/40 border-b-accent/20">
                <TableHead className="text-text-dark">Tipo de Huevo</TableHead>
                <TableHead className="text-text-dark">Presentación</TableHead>
                <TableHead className="text-text-dark">Precio por Cubeta</TableHead>
                <TableHead className="text-text-dark">Stock Actual (Cubetas)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderContent()}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
