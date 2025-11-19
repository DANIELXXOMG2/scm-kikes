'use client';
'use no memo';

import * as React from 'react';

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { deleteDoc, deleteField, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { ProveedorForm } from '@/components/forms/ProveedorForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestoreCollection } from '@/hooks/useFirestoreCollection';
import { db, storage } from '@/lib/firebase';
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

type DocumentType = 'rut' | 'camara';

function DocumentActions({ proveedor }: { proveedor: Proveedor }) {
  const [uploading, setUploading] = React.useState<DocumentType | null>(null);
  const [removing, setRemoving] = React.useState<DocumentType | null>(null);
  const inputRefs = React.useRef<{ rut: HTMLInputElement | null; camara: HTMLInputElement | null }>({
    rut: null,
    camara: null,
  });

  const triggerUpload = (type: DocumentType) => {
    inputRefs.current[type]?.click();
  };

  const handleUpload = async (type: DocumentType, file: File) => {
    const label = type === 'rut' ? 'RUT' : 'Cámara de Comercio';
    if (file.type && file.type !== 'application/pdf') {
      toast.error(`El archivo ${label} debe ser un PDF.`);
      return;
    }

    setUploading(type);
    try {
      const storageRef = ref(storage, `proveedores/${proveedor.id}/${type}.pdf`);
      await uploadBytes(storageRef, file, {
        contentType: file.type || 'application/pdf',
      });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'proveedores', proveedor.id), {
        [`${type}Url`]: url,
      });
      toast.success(`Documento ${label} actualizado.`);
    } catch (error) {
      console.error(`Error al subir ${label}:`, error);
      toast.error(`No se pudo actualizar el documento ${label}.`);
    } finally {
      setUploading(null);
      const input = inputRefs.current[type];
      if (input) {
        input.value = '';
      }
    }
  };

  const handleFileChange = (type: DocumentType) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleUpload(type, file);
    }
  };

  const handleDelete = async (type: DocumentType) => {
    const label = type === 'rut' ? 'RUT' : 'Cámara de Comercio';
    if (!window.confirm(`¿Deseas eliminar el documento ${label}?`)) {
      return;
    }

    setRemoving(type);
    try {
      const storageRef = ref(storage, `proveedores/${proveedor.id}/${type}.pdf`);
      await deleteObject(storageRef);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code && code !== 'storage/object-not-found') {
        console.error(`Error al eliminar archivo ${label}:`, error);
        toast.error(`No se pudo eliminar el archivo de ${label}.`);
        setRemoving(null);
        return;
      }
    }

    try {
      await updateDoc(doc(db, 'proveedores', proveedor.id), {
        [`${type}Url`]: deleteField(),
      });
      toast.success(`Documento ${label} eliminado.`);
    } catch (error) {
      console.error(`Error al actualizar el registro de ${label}:`, error);
      toast.error(`No se pudo actualizar la información del ${label}.`);
    } finally {
      setRemoving(null);
    }
  };

  const documentos: Array<{ type: DocumentType; label: string; url?: string }> = [
    { type: 'rut', label: 'RUT', url: proveedor.rutUrl },
    { type: 'camara', label: 'Cámara de Comercio', url: proveedor.camaraUrl },
  ];

  return (
    <div className="space-y-3">
      {documentos.map(({ type, label, url }) => (
        <div
          key={type}
          className="flex items-center justify-between gap-3 rounded-lg border border-accent/20 bg-background/60 px-3 py-2"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-dark">{label}</span>
            <span className="text-xs text-text-dark/70">{url ? 'Documento cargado' : 'Sin documento'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-accent hover:text-accent/80"
              disabled={!url}
              onClick={() => {
                if (url) {
                  window.open(url, '_blank', 'noopener');
                }
              }}
            >
              Ver
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => triggerUpload(type)}
              disabled={uploading === type || removing === type}
            >
              {uploading === type ? 'Subiendo...' : url ? 'Reemplazar' : 'Subir'}
            </Button>
            {url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={uploading === type || removing === type}
                onClick={() => {
                  void handleDelete(type);
                }}
              >
                {removing === type ? 'Eliminando...' : 'Eliminar'}
              </Button>
            )}
            <input
              ref={(element) => {
                inputRefs.current[type] = element;
              }}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange(type)}
            />
          </div>
        </div>
      ))}
    </div>
  );
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
          return <DocumentActions proveedor={row.original} />;
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
              <DialogDescription>
                Complete los datos para registrar o editar un proveedor. (RNF-04)
              </DialogDescription>
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
