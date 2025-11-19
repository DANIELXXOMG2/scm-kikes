'use client';

import { useMemo, useState } from 'react';

import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/context/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { db } from '@/lib/firebase';
import {
  type Cliente,
  type InventarioItem,
  type ItemTransaccional,
  type TipoHuevo,
} from '@/lib/schemas';

const HUEVOS: TipoHuevo[] = ['A', 'AA', 'B'];

export default function VentasPage() {
  const { user } = useAuth();
  const { data: clientes, loading: loadingClientes } = useFirestoreCollection<Cliente>('clientes');
  const { data: inventario } = useFirestoreCollection<InventarioItem>('inventario');

  const [clientePopoverOpen, setClientePopoverOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [selectedTipo, setSelectedTipo] = useState<TipoHuevo>('A');
  const [cantidad, setCantidad] = useState<number>(1);
  const [items, setItems] = useState<ItemTransaccional[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVenta = useMemo(
    () => items.reduce((acc, item) => acc + item.subtotal, 0),
    [items],
  );

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setClientePopoverOpen(false);
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

  const handleFinalizarVenta = async () => {
    if (!selectedCliente) {
      toast.error('Selecciona un cliente antes de registrar la venta.');
      return;
    }

    if (items.length === 0) {
      toast.error('Agrega al menos un item a la venta.');
      return;
    }

    setIsSubmitting(true);

    try {
      const total = totalVenta;
      const transaccionRef = doc(collection(db, 'transacciones'));

      await runTransaction(db, async (transaction) => {
        const saldoRef = doc(db, 'contabilidad', 'saldo');
        const saldoSnap = await transaction.get(saldoRef);

        if (!saldoSnap.exists()) {
          throw new Error('Debe inicializar el saldo antes de registrar ventas.');
        }

        const saldoActual = (saldoSnap.data()?.monto as number) ?? 0;

        const inventarioSnapshots = new Map<TipoHuevo, { stock: number; nombre: string }>();

        for (const item of items) {
          const inventarioRef = doc(db, 'inventario', item.id);
          const inventarioSnap = await transaction.get(inventarioRef);

          if (!inventarioSnap.exists()) {
            throw new Error(`Inventario no encontrado para ${item.nombre}.`);
          }

          const data = inventarioSnap.data() as InventarioItem;
          const stockActual = data.stock;

          if (stockActual < item.cantidad) {
            throw new Error(`Stock insuficiente para ${data.nombre}. Disponible: ${stockActual}.`);
          }

          inventarioSnapshots.set(item.id as TipoHuevo, {
            stock: stockActual,
            nombre: data.nombre,
          });
        }

        for (const item of items) {
          const inventarioRef = doc(db, 'inventario', item.id);
          const snapshot = inventarioSnapshots.get(item.id as TipoHuevo);

          if (!snapshot) {
            throw new Error('Error de concurrencia al actualizar inventario.');
          }

          transaction.update(inventarioRef, {
            stock: snapshot.stock - item.cantidad,
          });
        }

        transaction.update(saldoRef, {
          monto: saldoActual + total,
        });

        transaction.set(transaccionRef, {
          fecha: serverTimestamp(),
          tipo: 'ingreso',
          monto: total,
          concepto: `Venta a ${selectedCliente.nombre}`,
        });
      });

      await addDoc(collection(db, 'ventas'), {
        clienteId: selectedCliente.id,
        clienteNombre: selectedCliente.nombre,
        clienteCedula: selectedCliente.cedula,
        items,
        total: totalVenta,
        vendedorEmail: user?.email ?? 'desconocido',
        fecha: serverTimestamp(),
        transaccionId: transaccionRef.id,
      });

      toast.success('Venta registrada.');
      setItems([]);
      setSelectedCliente(null);
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-secondary border-none text-text-dark">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Registrar Venta (RF-M4)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <Label className="text-sm font-medium text-text-dark">Buscar Cliente (RF-M4.1)</Label>
            <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientePopoverOpen}
                  className="w-full justify-between bg-background text-left text-text-dark"
                >
                  {selectedCliente ? selectedCliente.nombre : 'Selecciona un cliente'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente por nombre..." />
                  <CommandEmpty>
                    {loadingClientes ? 'Cargando clientes...' : 'No se encontraron clientes.'}
                  </CommandEmpty>
                  <CommandList>
                    <CommandGroup heading="Clientes disponibles">
                      {clientes.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={cliente.nombre}
                          onSelect={() => handleSelectCliente(cliente)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{cliente.nombre}</span>
                            <span className="text-xs text-text-dark/70">
                              {cliente.cedula} · {cliente.email ?? 'Sin correo'}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedCliente && (
              <div className="rounded-md border border-accent/40 bg-background/40 p-3 text-sm">
                <p className="font-semibold">{selectedCliente.nombre}</p>
                <p className="text-text-dark/70">Cédula: {selectedCliente.cedula}</p>
                {selectedCliente.direccion && <p className="text-text-dark/70">{selectedCliente.direccion}</p>}
              </div>
            )}
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
              <h2 className="text-xl font-semibold">Detalle de la venta</h2>
              <span className="text-lg font-bold">
                Total: ${new Intl.NumberFormat('es-CO').format(totalVenta)}
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
                      Agrega items para registrar la venta.
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
              onClick={handleFinalizarVenta}
            >
              {isSubmitting ? 'Registrando...' : 'Finalizar Venta (PDF Deferido: RF-M4.5)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
