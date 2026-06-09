import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useNearExpiryQuery } from '../../inventory/api/inventory.api';

export default function NearExpiryPage() {
  const { data: batches = [], isLoading } = useNearExpiryQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl font-semibold">Near Expiry</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Ready-to-use inventory batches expiring within 3 months.
      </p>

      {isLoading ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground animate-pulse">
          Loading…
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No batches nearing expiry.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {['Medicine', 'Qty', 'Expiry Date', 'Days Remaining'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => {
                const daysLeft = differenceInDays(new Date(batch.expiryDate), new Date());
                return (
                  <tr key={batch.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{batch.medicine.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {batch.qty} {batch.medicine.unit}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(batch.expiryDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${daysLeft <= 30 ? 'text-destructive' : 'text-amber-600'}`}>
                        {daysLeft}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
