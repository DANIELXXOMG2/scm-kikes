'use client';
'use no memo';

import * as React from 'react';

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { deleteDoc, doc } from 'firebase/firestore';
import { FileText, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { ProveedorForm } from '@/components/forms/ProveedorForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { db } from '@/lib/firebase';
import { type Proveedor } from '@/lib/schemas';

function useProveedorTable(
  data: Proveedor[],
  columns: ColumnDef<Proveedor>[],
  globalFilter: string,
  onGlobalFilterChange: (value: string) => void,
) {
  return useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });
}

export default function ProveedoresPage() {
  const [open, setOpen] = React.useState(false);
  const [selectedProveedor, setSelectedProveedor] = React.useState<Proveedor | null>(null);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const { data: proveedores, loading, error } = useFirestoreCollection<Proveedor>('proveedores');

  const handleDelete = React.useCallback(async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proveedor?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'proveedores', id));
      toast.success('Proveedor eliminado correctamente');
    } catch (deleteError) {
      console.error(deleteError);
      toast.error('No se pudo eliminar el proveedor');
    }
  }, []);

  const columns = React.useMemo<ColumnDef<Proveedor>[]>(
    () => [
      {
        accessorKey: 'nit',
        header: 'NIT',
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
      },
      {
        accessorKey: 'telefono',
        header: 'Teléfono',
        cell: ({ row }) => row.original.telefono ?? '—',
      },
      {
        accessorKey: 'email',
        header: 'Correo',
        cell: ({ row }) => row.original.email ?? '—',
      },
      {
        id: 'documentos',
        header: 'Documentos',
        cell: ({ row }) => {
          const { rutUrl, camaraUrl } = row.original;

          return (
            <div className="flex items-center gap-3">
              {rutUrl ? (
                <a href={rutUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                  <FileText className="h-4 w-4" />
                </a>
              ) : (
                <FileText className="h-4 w-4 text-text-dark/40" />
              )}
              {camaraUrl ? (
                <a href={camaraUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                  <FileText className="h-4 w-4" />
                </a>
              ) : (
                <FileText className="h-4 w-4 text-text-dark/40" />
              )}
            </div>
          );
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProveedor(row.original);
                  setOpen(true);
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-destructive">
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleDelete],
  );

  const table = useProveedorTable(proveedores, columns, globalFilter, setGlobalFilter);

  const handleDialogChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setSelectedProveedor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Proveedores (RF-M1)</h1>
          {error && <p className="text-sm text-destructive">No fue posible cargar los proveedores.</p>}
        </div>
        <Dialog open={open} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedProveedor(null);
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Registrar proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedProveedor ? 'Editar proveedor' : 'Registrar proveedor'}</DialogTitle>
            </DialogHeader>
            <ProveedorForm
              proveedor={selectedProveedor}
              onClose={() => {
                handleDialogChange(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none bg-secondary">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Input
              placeholder="Filtrar proveedores..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full max-w-sm"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-accent/20">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-accent/20">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-text-dark">
                        {header.isPlaceholder ? null : header.column.columnDef.header instanceof Function
                          ? header.column.columnDef.header(header.getContext())
                          : header.column.columnDef.header}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">Cargando...</TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-accent/10">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      No hay proveedores registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
