import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export interface SubOrder {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  qty: number;
  pricePerUnit: number;
  totalPrice: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  medicine: { id: string; name: string; unit: string };
  order: {
    id: string;
    hospital: { name: string };
  };
}

export function useSubOrdersQuery() {
  return useQuery({
    queryKey: ['sub-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get<SubOrder[]>('/pharmacy-orders');
      return data;
    },
  });
}

export function useSubOrderQuery(id: string) {
  return useQuery({
    queryKey: ['sub-orders', id],
    queryFn: async () => {
      const { data } = await apiClient.get<SubOrder>(`/pharmacy-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAcceptSubOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/pharmacy-orders/${id}/accept`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRejectSubOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await apiClient.post(`/pharmacy-orders/${id}/reject`, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
