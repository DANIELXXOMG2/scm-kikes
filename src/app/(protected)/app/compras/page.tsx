'use client';

import { useMemo, useState } from 'react';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { useSaldoCaja } from '@/hooks/useSaldoCaja';
import { db } from '@/lib/firebase';
import {
  type InventarioItem,
  type ItemTransaccional,
  type Proveedor,
  type TipoHuevo,
} from '@/lib/schemas';

const HUEVOS: TipoHuevo[] = ['A', 'AA', 'B'];
const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Otro'];

export default function ComprasPage() {
  const { saldo, loading: loadingSaldo } = useSaldoCaja();
  const { data: proveedores, loading: loadingProveedores } = useFirestoreCollection<Proveedor>('proveedores');
  const { data: inventario } = useFirestoreCollection<InventarioItem>('inventario');

  const [proveedorPopoverOpen, setProveedorPopoverOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoHuevo>('A');
  const [cantidad, setCantidad] = useState<number>(1);
  const [items, setItems] = useState<ItemTransaccional[]>([]);
  const [medioPago, setMedioPago] = useState('');
  const [fechaPago, setFechaPago] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCompra = useMemo(
    () => items.reduce((acc, item) => acc + item.subtotal, 0),
    [items],
  );

  const handleSelectProveedor = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setProveedorPopoverOpen(false);
  };

  const handleAddItem = () => {
    if (!inventario.length) {
      toast.error('No hay inventario disponible.');
      return;
    }

    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a cero.');
      return;
    }

    const inventarioItem = inventario.find((item) => item.id === selectedTipo);

    if (!inventarioItem) {
      toast.error('El tipo de huevo seleccionado no está disponible.');
      return;
    }

    const subtotal = inventarioItem.precio * cantidad;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === inventarioItem.id);

      if (existingIndex !== -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        const nuevaCantidad = existing.cantidad + cantidad;
        next[existingIndex] = {
          ...existing,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * inventarioItem.precio,
        };
        return next;
      }

      return [
        ...prev,
        {
          id: inventarioItem.id,
          nombre: inventarioItem.nombre,
          cantidad,
          precioUnitario: inventarioItem.precio,
          subtotal,
        },
      ];
    });

    setCantidad(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFinalizarCompra = async () => {
    if (!selectedProveedor) {
      toast.error('Selecciona un proveedor.');
      return;
    }

    if (!medioPago) {
      toast.error('Selecciona un medio de pago.');
      return;
    }

    if (!fechaPago) {
      toast.error('Selecciona una fecha para la compra.');
      return;
    }

    if (items.length === 0) {
      toast.error('Agrega al menos un item a la compra.');
      return;
    }

    if (!loadingSaldo && totalCompra > saldo) {
      toast.error('Saldo en caja insuficiente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const total = totalCompra;

      await runTransaction(db, async (transaction) => {
        const saldoRef = doc(db, 'contabilidad', 'saldo');
        const saldoSnap = await transaction.get(saldoRef);

        if (!saldoSnap.exists()) {
          throw new Error('Debe inicializar el saldo antes de registrar compras.');
        }

        const saldoActual = (saldoSnap.data()?.monto as number) ?? 0;

        if (total > saldoActual) {
          throw new Error('Saldo insuficiente en caja.');
        }

        for (const item of items) {
          const inventarioRef = doc(db, 'inventario', item.id);
          const inventarioSnap = await transaction.get(inventarioRef);

          if (!inventarioSnap.exists()) {
            throw new Error(`Inventario no encontrado para ${item.nombre}.`);
          }

          const data = inventarioSnap.data() as InventarioItem;

          transaction.update(inventarioRef, {
            stock: data.stock + item.cantidad,
          });
        }

        transaction.update(saldoRef, {
          monto: saldoActual - total,
        });

        const transaccionRef = doc(collection(db, 'transacciones'));
        transaction.set(transaccionRef, {
          fecha: Timestamp.fromDate(fechaPago),
          tipo: 'egreso',
          monto: total,
          concepto: `Compra a ${selectedProveedor.nombre}`,
        });
      });

      await addDoc(collection(db, 'compras'), {
        proveedorId: selectedProveedor.id,
        proveedorNombre: selectedProveedor.nombre,
        proveedorNit: selectedProveedor.nit,
        items,
        total: totalCompra,
        medioDePago: medioPago,
        fecha: Timestamp.fromDate(fechaPago),
        creadoEn: serverTimestamp(),
      });

      toast.success('Compra registrada.');
      setItems([]);
      setSelectedProveedor(null);
      setMedioPago('');
    } catch (error) {
      console.error('Error al registrar compra:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar la compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-secondary border-none text-text-dark">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Registrar Compra (RF-M5)</CardTitle>
          <p className="text-sm text-text-dark/70">
            Saldo en caja:{' '}
            {loadingSaldo ? 'Cargando...' : `$${new Intl.NumberFormat('es-CO').format(saldo)}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <Label className="text-sm font-medium text-text-dark">Buscar Proveedor (RF-M5.1)</Label>
            <Popover open={proveedorPopoverOpen} onOpenChange={setProveedorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={proveedorPopoverOpen}
                  className="w-full justify-between bg-background text-left text-text-dark"
                >
                  {selectedProveedor ? selectedProveedor.nombre : 'Selecciona un proveedor'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar proveedor por nombre..." />
                  <CommandEmpty>
                    {loadingProveedores ? 'Cargando proveedores...' : 'No se encontraron proveedores.'}
                  </CommandEmpty>
                  <CommandList>
                    <CommandGroup heading="Proveedores registrados">
                      {proveedores.map((proveedor) => (
                        <CommandItem
                          key={proveedor.id}
                          value={proveedor.nombre}
                          onSelect={() => handleSelectProveedor(proveedor)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{proveedor.nombre}</span>
                            <span className="text-xs text-text-dark/70">
                              NIT: {proveedor.nit} · {proveedor.email ?? 'Sin correo'}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedProveedor && (
              <div className="rounded-md border border-accent/40 bg-background/40 p-3 text-sm">
                <p className="font-semibold">{selectedProveedor.nombre}</p>
                <p className="text-text-dark/70">NIT: {selectedProveedor.nit}</p>
                {selectedProveedor.direccion && <p className="text-text-dark/70">{selectedProveedor.direccion}</p>}
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medioPago">Medio de pago (RF-M5.2)</Label>
              <Select value={medioPago} onValueChange={setMedioPago}>
                <SelectTrigger id="medioPago" className="bg-background text-text-dark">
                  <SelectValue placeholder="Selecciona medio de pago" />
                </SelectTrigger>
                <SelectContent className="bg-background text-text-dark">
                  {MEDIOS_PAGO.map((opcion) => (
                    <SelectItem key={opcion} value={opcion}>
                      {opcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora (RF-M5.2)</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start bg-background text-text-dark"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaPago
                      ? format(fechaPago, "PPP p", { locale: es })
                      : 'Selecciona fecha y hora'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaPago}
                    onSelect={(date) => date && setFechaPago(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de huevo</Label>
              <Select value={selectedTipo} onValueChange={(value) => setSelectedTipo(value as TipoHuevo)}>
                <SelectTrigger id="tipo" className="bg-background text-text-dark">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent className="bg-background text-text-dark">
                  {HUEVOS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {inventario.find((item) => item.id === tipo)?.nombre ?? `Tipo ${tipo}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad (cubetas)</Label>
              <Input
                id="cantidad"
                type="number"
                min={1}
                value={cantidad}
                onChange={(event) => setCantidad(Number(event.target.value))}
                className="bg-background text-text-dark"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full bg-primary text-primary-foreground" onClick={handleAddItem}>
                Añadir Item
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detalle de la compra</h2>
              <span className="text-lg font-bold">
                Total: ${new Intl.NumberFormat('es-CO').format(totalCompra)}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/40 border-accent/30">
                  <TableHead className="text-text-dark">Tipo</TableHead>
                  <TableHead className="text-text-dark">Cantidad</TableHead>
                  <TableHead className="text-text-dark">Precio Unitario</TableHead>
                  <TableHead className="text-text-dark">Subtotal</TableHead>
                  <TableHead className="text-text-dark">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-text-dark/70">
                      Agrega items para registrar la compra.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="border-accent/20">
                      <TableCell>{inventario.find((inv) => inv.id === item.id)?.nombre ?? item.nombre}</TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>
                        ${new Intl.NumberFormat('es-CO').format(item.precioUnitario)}
                      </TableCell>
                      <TableCell>
                        ${new Intl.NumberFormat('es-CO').format(item.subtotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>

          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-accent text-text-dark hover:bg-accent/90"
              disabled={isSubmitting}
              onClick={handleFinalizarCompra}
            >
              {isSubmitting ? 'Registrando...' : 'Finalizar Compra'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
