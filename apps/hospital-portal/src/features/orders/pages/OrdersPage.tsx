import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge, MoneyDisplay } from '@dawai-setu/domain-ui';
import { useOrdersQuery, useCancelOrderMutation, type Order } from '../api/orders.api';

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrdersQuery();
  const cancelOrder = useCancelOrderMutation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCancel(id: string) {
    try {
      await cancelOrder.mutateAsync(id);
      toast.success('Order cancelled.');
    } catch {
      toast.error('Failed to cancel order.');
    }
  }

  return (
    <div className="space-y-4">
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
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expanded={expanded.has(order.id)}
              onToggle={() => toggleExpand(order.id)}
              onCancel={handleCancel}
              cancelPending={cancelOrder.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onCancel,
  cancelPending,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onCancel: (id: string) => void;
  cancelPending: boolean;
}) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Order #{order.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>

        <StatusBadge status={order.status as Parameters<typeof StatusBadge>[0]['status']} />

        <MoneyDisplay amount={order.totalAmount} className="text-sm font-medium" />

        {order.status === 'PENDING' && (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(order.id); }}
            disabled={cancelPending}
            className="text-xs text-destructive hover:underline disabled:opacity-50 ml-2"
          >
            Cancel
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">Medicine</th>
                <th className="pb-2 font-medium">Pharmacy</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.subOrders.map((sub) => (
                <tr key={sub.id}>
                  <td className="py-2">{sub.medicine.name}</td>
                  <td className="py-2 text-muted-foreground">{sub.pharmacy.name}</td>
                  <td className="py-2 text-muted-foreground">
                    {sub.qty} {sub.medicine.unit}
                  </td>
                  <td className="py-2">
                    <StatusBadge status={sub.status as Parameters<typeof StatusBadge>[0]['status']} />
                  </td>
                  <td className="py-2 text-right">
                    <MoneyDisplay amount={sub.totalPrice} />
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
