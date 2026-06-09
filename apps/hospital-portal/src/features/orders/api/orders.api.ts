import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export interface AvailablePharmacy {
  pharmacyId: string;
  pharmacyName: string;
  availableQty: number;
  pricePerUnit: number;
}

export interface PlaceOrderPayload {
  items: Array<{
    medicineId: string;
    pharmacyId: string;
    qty: number;
  }>;
}

export interface Order {
  id: string;
  status: string;
  createdAt: string;
  subOrders: Array<{
    id: string;
    status: string;
    qty: number;
    medicine: { id: string; name: string; unit: string };
    pharmacy: { id: string; name: string };
    pricePerUnit: number;
    totalPrice: number;
  }>;
  totalAmount: number;
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await apiClient.get<Order[]>('/orders');
      return data;
    },
  });
}

export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAvailablePharmaciesQuery(medicineId: string, qty: number) {
  return useQuery({
    queryKey: ['available-pharmacies', medicineId, qty],
    queryFn: async () => {
      const { data } = await apiClient.get<AvailablePharmacy[]>('/orders/available-pharmacies', {
        params: { medicineId, qty },
      });
      return data;
    },
    enabled: !!medicineId && qty > 0,
  });
}

export function usePlaceOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlaceOrderPayload) => {
      const { data } = await apiClient.post<Order>('/orders', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.post(`/orders/${orderId}/cancel`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
