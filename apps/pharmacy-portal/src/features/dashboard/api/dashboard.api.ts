import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface PharmacyDashboard {
  pendingSubOrders: number;
  acceptedSubOrders: number;
  completedSubOrders: number;
  rejectedSubOrders: number;
  trend?: Array<{ label: string; completed: number }>;
}

export function useDashboardQuery(period: Period) {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const { data } = await apiClient.get<PharmacyDashboard>('/dashboard', { params: { period } });
      return data;
    },
  });
}
