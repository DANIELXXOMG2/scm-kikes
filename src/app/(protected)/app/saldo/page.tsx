'use client';

import { useCallback, useMemo, useState } from 'react';

import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { generarComprobanteCompraPdf, generarFacturaVentaPdf } from '@/lib/pdf';
import { type Compra, type Transaccion, type Venta } from '@/lib/schemas';

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

  const { data: ventas } = useFirestoreCollection<Venta>('ventas');
  const { data: compras } = useFirestoreCollection<Compra>('compras');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const ventasPorTransaccion = useMemo(() => {
    const map = new Map<string, Venta>();
    ventas.forEach((venta) => {
      if (venta.transaccionId) {
        map.set(venta.transaccionId, venta);
      }
    });
    return map;
  }, [ventas]);

  const comprasPorTransaccion = useMemo(() => {
    const map = new Map<string, Compra>();
    compras.forEach((compra) => {
      if (compra.transaccionId) {
        map.set(compra.transaccionId, compra);
      }
    });
    return map;
  }, [compras]);

  const sortedTransacciones = useMemo(() => {
    return [...transacciones].sort((a, b) => {
      const fechaA = a.fecha && typeof a.fecha.toDate === 'function' ? a.fecha.toDate() : new Date(a.fecha ?? 0);
      const fechaB = b.fecha && typeof b.fecha.toDate === 'function' ? b.fecha.toDate() : new Date(b.fecha ?? 0);
      const timeA = Number.isNaN(fechaA.getTime()) ? 0 : fechaA.getTime();
      const timeB = Number.isNaN(fechaB.getTime()) ? 0 : fechaB.getTime();
      return timeB - timeA;
    });
  }, [transacciones]);

  const handleDownloadPdf = useCallback(
    async (transaccion: Transaccion) => {
      try {
        setDownloadingId(transaccion.id);
        let blob: Blob;

        if (transaccion.tipo === 'ingreso') {
          const venta = ventasPorTransaccion.get(transaccion.id);
          if (!venta) {
            throw new Error('No se encontró la venta asociada a esta transacción.');
          }
          blob = await generarFacturaVentaPdf({ transaccion, venta });
        } else {
          const compra = comprasPorTransaccion.get(transaccion.id);
          if (!compra) {
            throw new Error('No se encontró la compra asociada a esta transacción.');
          }
          blob = await generarComprobanteCompraPdf({ transaccion, compra });
        }

        const filenamePrefix = transaccion.tipo === 'ingreso' ? 'factura' : 'comprobante';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}-${transaccion.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (downloadError) {
        console.error('Error al generar el comprobante:', downloadError);
        toast.error(
          downloadError instanceof Error
            ? downloadError.message
            : 'No fue posible generar el PDF solicitado.',
        );
      } finally {
        setDownloadingId(null);
      }
    },
    [comprasPorTransaccion, ventasPorTransaccion],
  );

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
                  sortedTransacciones.map((transaccion) => {
                    const esIngreso = transaccion.tipo === 'ingreso';
                    const tieneSoporte = esIngreso
                      ? ventasPorTransaccion.has(transaccion.id)
                      : comprasPorTransaccion.has(transaccion.id);
                    const estaDescargando = downloadingId === transaccion.id;

                    return (
                      <TableRow key={transaccion.id} className="border-accent/10">
                        <TableCell>{formatFecha(transaccion.fecha)}</TableCell>
                        <TableCell className="capitalize">
                          {esIngreso ? 'Ingreso' : 'Egreso'}
                        </TableCell>
                        <TableCell>{transaccion.concepto}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            esIngreso ? 'text-accent' : 'text-danger'
                          }`}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatCurrency(transaccion.monto)}</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(transaccion)}
                              disabled={!tieneSoporte || estaDescargando}
                              aria-label={esIngreso ? 'Descargar factura en PDF' : 'Descargar comprobante en PDF'}
                              title={
                                tieneSoporte
                                  ? 'Descargar PDF'
                                  : 'Sin comprobante disponible para esta transacción'
                              }
                              className="rounded-full border border-transparent p-1 text-text-dark/70 transition hover:text-text-dark disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {estaDescargando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
