import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export interface InventoryBatch {
  id: string;
  medicine: { id: string; name: string; unit: string };
  qty: number;
  expiryDate: string;
  readinessState: 'RECEIVED_PENDING' | 'READY_TO_USE';
  displayStatus: 'RECEIVED_PENDING' | 'READY_TO_USE' | 'NEAR_EXPIRY' | 'EXPIRED';
  subOrderId?: string;
  createdAt: string;
}

export function useInventoryQuery() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await apiClient.get<InventoryBatch[]>('/inventory');
      return data;
    },
  });
}

export function useNearExpiryQuery() {
  return useQuery({
    queryKey: ['inventory', 'near-expiry'],
    queryFn: async () => {
      const { data } = await apiClient.get<InventoryBatch[]>('/inventory/near-expiry');
      return data;
    },
  });
}

export function useExpiredQuery() {
  return useQuery({
    queryKey: ['inventory', 'expired'],
    queryFn: async () => {
      const { data } = await apiClient.get<InventoryBatch[]>('/inventory/expired');
      return data;
    },
  });
}

export function useMarkReadyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      await apiClient.put(`/inventory/batch/${batchId}/ready`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
