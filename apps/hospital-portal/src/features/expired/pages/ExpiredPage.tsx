import React from 'react';
import { format } from 'date-fns';
import { XCircle } from 'lucide-react';
import { useExpiredQuery } from '../../inventory/api/inventory.api';

export default function ExpiredPage() {
  const { data: batches = [], isLoading } = useExpiredQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-destructive" />
        <h1 className="text-xl font-semibold">Expired Inventory</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Batches past their expiry date — not available for dispensing.
      </p>

      {isLoading ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground animate-pulse">
          Loading…
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No expired batches.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {['Medicine', 'Qty', 'Expired On', 'State at Expiry'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{batch.medicine.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {batch.qty} {batch.medicine.unit}
                  </td>
                  <td className="px-4 py-3 text-destructive">
                    {format(new Date(batch.expiryDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {batch.readinessState.replace(/_/g, ' ').toLowerCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
