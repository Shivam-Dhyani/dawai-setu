import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';

export interface Medicine {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  description?: string;
}

export function useMedicinesQuery() {
  return useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const { data } = await apiClient.get<Medicine[]>('/medicines');
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useAvailableMedicinesQuery() {
  return useQuery({
    queryKey: ['medicines', 'available'],
    queryFn: async () => {
      const { data } = await apiClient.get<Medicine[]>('/medicines/available');
      return data;
    },
  });
}
