import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StatusBadge, MoneyDisplay } from '@dawai-setu/domain-ui';
import { useSubOrdersQuery, useAcceptSubOrderMutation, useRejectSubOrderMutation } from '../api/my-orders.api';

export default function MyOrdersPage() {
  const { data: orders = [], isLoading } = useSubOrdersQuery();
  const accept = useAcceptSubOrderMutation();
  const reject = useRejectSubOrderMutation();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function handleAccept(id: string) {
    try {
      await accept.mutateAsync(id);
      toast.success('Order accepted.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to accept order.');
    }
  }

  async function handleReject(id: string) {
    try {
      await reject.mutateAsync({ id, reason: rejectReason || undefined });
      toast.success('Order rejected.');
      setRejectingId(null);
      setRejectReason('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to reject order.');
    }
  }

  const pending = orders.filter((o) => o.status === 'PENDING');
  const others = orders.filter((o) => o.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Orders</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pending ({pending.length})
              </h2>
              {pending.map((order) => (
                <div key={order.id} className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{order.medicine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order.hospital.name} · {order.qty} {order.medicine.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <MoneyDisplay amount={order.totalPrice} className="font-medium" />
                    </div>
                  </div>

                  {rejectingId === order.id ? (
                    <div className="mt-3 space-y-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection (optional)"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(order.id)}
                          disabled={reject.isPending}
                          className="flex-1 bg-destructive text-destructive-foreground rounded-md px-3 py-1.5 text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                          {reject.isPending ? 'Rejecting…' : 'Confirm reject'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleAccept(order.id)}
                        disabled={accept.isPending}
                        className="flex-1 bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {accept.isPending ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => setRejectingId(order.id)}
                        className="flex-1 border border-destructive text-destructive rounded-md px-3 py-1.5 text-sm font-medium hover:bg-destructive/10 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {others.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                History
              </h2>
              <div className="bg-card border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      {['Medicine', 'Hospital', 'Qty', 'Amount', 'Status', 'Date'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {others.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{order.medicine.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{order.order.hospital.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {order.qty} {order.medicine.unit}
                        </td>
                        <td className="px-4 py-3">
                          <MoneyDisplay amount={order.totalPrice} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status as Parameters<typeof StatusBadge>[0]['status']} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(order.updatedAt), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
