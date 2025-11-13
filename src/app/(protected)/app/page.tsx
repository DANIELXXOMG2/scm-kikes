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

// (Datos del PDF, RF-M3)
const inventoryData = [
  { tipo: 'Tipo A', presentacion: '30 unidades (cubeta)', precio: '$ 10.500', stock: 150 },
  { tipo: 'Tipo AA', presentacion: '30 unidades (cubeta)', precio: '$ 20.700', stock: 80 },
  { tipo: 'Tipo B', presentacion: '30 unidades (cubeta)', precio: '$ 11.350', stock: 120 },
];

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Inventario</h2>
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
            <TableBody>
              {inventoryData.map((item) => (
                <TableRow key={item.tipo} className="border-accent/20">
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>{item.presentacion}</TableCell>
                  <TableCell>{item.precio}</TableCell>
                  <TableCell className="font-medium">{item.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
