'use client';

import { SaldoActualCard } from '@/components/dashboard/SaldoActualCard';
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
import { type Transaccion } from '@/lib/schemas';

function formatFecha(timestamp: Transaccion['fecha']) {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(timestamp.toDate());
  }

  const parsedDate = timestamp instanceof Date ? timestamp : new Date(timestamp ?? 0);
  if (Number.isNaN(parsedDate.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SaldoPage() {
  const {
    data: transacciones,
    loading,
    error,
  } = useFirestoreCollection<Transaccion>('transacciones');

  const sortedTransacciones = [...transacciones].sort((a, b) => {
    const fechaA = a.fecha && typeof a.fecha.toDate === 'function' ? a.fecha.toDate() : new Date(a.fecha ?? 0);
    const fechaB = b.fecha && typeof b.fecha.toDate === 'function' ? b.fecha.toDate() : new Date(b.fecha ?? 0);
    const timeA = Number.isNaN(fechaA.getTime()) ? 0 : fechaA.getTime();
    const timeB = Number.isNaN(fechaB.getTime()) ? 0 : fechaB.getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-text-dark">Saldo en Caja (RF-M6)</h1>
        <p className="text-sm text-text-dark/70">Visualiza el saldo actual y el historial de movimientos generados en el sistema.</p>
      </div>

      <SaldoActualCard />

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-dark">Movimientos Recientes (RF-M6.2)</h2>
          {error && <p className="text-sm text-danger">No fue posible cargar los movimientos. Intenta nuevamente.</p>}
        </div>

        <Card className="border-none bg-secondary">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30 hover:bg-accent/40 border-b border-accent/20">
                  <TableHead className="text-text-dark">Fecha/Hora</TableHead>
                  <TableHead className="text-text-dark">Tipo</TableHead>
                  <TableHead className="text-text-dark">Concepto</TableHead>
                  <TableHead className="text-right text-text-dark">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : sortedTransacciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No hay movimientos registrados todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransacciones.map((transaccion) => (
                    <TableRow key={transaccion.id} className="border-accent/10">
                      <TableCell>{formatFecha(transaccion.fecha)}</TableCell>
                      <TableCell className="capitalize">
                        {transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      </TableCell>
                      <TableCell>{transaccion.concepto}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          transaccion.tipo === 'ingreso' ? 'text-accent' : 'text-danger'
                        }`}
                      >
                        {formatCurrency(transaccion.monto)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
