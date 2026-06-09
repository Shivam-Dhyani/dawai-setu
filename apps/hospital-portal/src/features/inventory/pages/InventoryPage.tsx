import React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StatusBadge } from '@dawai-setu/domain-ui';
import { useInventoryQuery, useMarkReadyMutation } from '../api/inventory.api';

export default function InventoryPage() {
  const { data: batches = [], isLoading } = useInventoryQuery();
  const markReady = useMarkReadyMutation();

  async function handleMarkReady(batchId: string) {
    try {
      await markReady.mutateAsync(batchId);
      toast.success('Batch marked as ready to use.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update batch.');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Inventory</h1>

      {isLoading ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground animate-pulse">
          Loading…
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No inventory batches found.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {['Medicine', 'Qty', 'Expiry Date', 'Status', ''].map((h) => (
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(batch.expiryDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={batch.displayStatus as Parameters<typeof StatusBadge>[0]['status']} />
                  </td>
                  <td className="px-4 py-3">
                    {batch.readinessState === 'RECEIVED_PENDING' && (
                      <button
                        onClick={() => handleMarkReady(batch.id)}
                        disabled={markReady.isPending}
                        className="text-sm text-primary hover:underline disabled:opacity-50"
                      >
                        Mark ready
                      </button>
                    )}
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
