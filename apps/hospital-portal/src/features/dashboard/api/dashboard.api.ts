import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DashboardData {
  // Doctor dashboard
  totalPatientCases?: number;
  casesToday?: number;
  medicinesDispensed?: number;
  trend?: Array<{ label: string; cases: number }>;

  // Pharmacist (hospital) dashboard
  totalOrders?: number;
  pendingOrders?: number;
  readyBatches?: number;
  nearExpiryCount?: number;

  // Pharmacy operator dashboard (not used in hospital portal)
  pendingSubOrders?: number;
  acceptedSubOrders?: number;
  completedSubOrders?: number;
}

export function useDashboardQuery(period: Period) {
  return useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardData>('/dashboard', { params: { period } });
      return data;
    },
  });
}
