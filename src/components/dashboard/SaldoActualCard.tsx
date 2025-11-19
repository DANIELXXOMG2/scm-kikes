'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSaldoCaja } from '@/hooks/useSaldoCaja';

export function SaldoActualCard() {
  const { saldo, loading } = useSaldoCaja();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="bg-secondary border-none">
      <CardHeader>
        <CardTitle className="text-xl font-medium text-text-dark/80">
          Saldo Actual en Caja (RF-M6.1)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-16 w-3/4 bg-base" />
        ) : (
          <div className="text-5xl font-bold text-text-dark">
            {formatCurrency(saldo)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
