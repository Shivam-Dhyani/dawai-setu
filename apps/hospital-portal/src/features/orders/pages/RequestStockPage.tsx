import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { MoneyDisplay } from '@dawai-setu/domain-ui';
import { useMedicinesQuery } from '../../../lib/medicines.api';
import { useAvailablePharmaciesQuery, usePlaceOrderMutation } from '../api/orders.api';

interface CartItem {
  medicineId: string;
  medicineName: string;
  pharmacyId: string;
  pharmacyName: string;
  qty: number;
  pricePerUnit: number;
}

export default function RequestStockPage() {
  const navigate = useNavigate();
  const { data: medicines = [] } = useMedicinesQuery();
  const placeOrder = usePlaceOrderMutation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState({ medicineId: '', qty: 1 });

  const { data: pharmacies = [], isLoading: loadingPharmacies } = useAvailablePharmaciesQuery(
    selected.medicineId,
    selected.qty,
  );

  function addToCart(pharmacy: { pharmacyId: string; pharmacyName: string; pricePerUnit: number }) {
    const medicine = medicines.find((m) => m.id === selected.medicineId);
    if (!medicine) return;

    setCart((prev) => {
      const existing = prev.findIndex(
        (c) => c.medicineId === selected.medicineId && c.pharmacyId === pharmacy.pharmacyId,
      );
      if (existing >= 0) {
        return prev.map((c, i) =>
          i === existing ? { ...c, qty: c.qty + selected.qty } : c,
        );
      }
      return [
        ...prev,
        {
          medicineId: selected.medicineId,
          medicineName: medicine.name,
          pharmacyId: pharmacy.pharmacyId,
          pharmacyName: pharmacy.pharmacyName,
          qty: selected.qty,
          pricePerUnit: pharmacy.pricePerUnit,
        },
      ];
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.pricePerUnit, 0);

  async function handlePlaceOrder() {
    if (cart.length === 0) { toast.error('Add items to cart first.'); return; }
    try {
      const order = await placeOrder.mutateAsync({
        items: cart.map((c) => ({
          medicineId: c.medicineId,
          pharmacyId: c.pharmacyId,
          qty: c.qty,
        })),
      });
      toast.success('Order placed successfully!');
      navigate(`/orders`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to place order.');
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold">Request Medicine Stock</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Selection panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-lg p-5 space-y-4">
            <h2 className="font-medium">Find available medicines</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Medicine</label>
                <select
                  value={selected.medicineId}
                  onChange={(e) => setSelected((s) => ({ ...s, medicineId: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input"
                >
                  <option value="">Select medicine…</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={selected.qty}
                  onChange={(e) => setSelected((s) => ({ ...s, qty: Math.max(1, +e.target.value) }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input"
                />
              </div>
            </div>

            {selected.medicineId && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Available pharmacies
                </p>

                {loadingPharmacies ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Searching…</div>
                ) : pharmacies.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No pharmacies have sufficient stock.
                  </div>
                ) : (
                  pharmacies.map((p) => (
                    <div
                      key={p.pharmacyId}
                      className="flex items-center justify-between border rounded-md px-3 py-2.5 text-sm"
                    >
                      <div>
                        <p className="font-medium">{p.pharmacyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.availableQty} available · <MoneyDisplay amount={p.pricePerUnit} /> per unit
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-md px-2.5 py-1.5 hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-3">
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Cart ({cart.length})</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cart is empty</p>
            ) : (
              <>
                <div className="divide-y">
                  {cart.map((item, i) => (
                    <div key={i} className="py-2.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.medicineName}</p>
                        <p className="text-xs text-muted-foreground">{item.pharmacyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.qty} × <MoneyDisplay amount={item.pricePerUnit} />
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <MoneyDisplay amount={item.qty * item.pricePerUnit} className="text-sm font-medium" />
                        <button
                          onClick={() => removeFromCart(i)}
                          className="block mt-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <MoneyDisplay amount={cartTotal} />
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placeOrder.isPending}
                  className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {placeOrder.isPending ? 'Placing order…' : 'Place order'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
