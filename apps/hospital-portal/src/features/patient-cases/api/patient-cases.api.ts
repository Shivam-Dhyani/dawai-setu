import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export type DoseFrequency =
  | 'ONCE_A_DAY' | 'TWICE_A_DAY' | 'THRICE_A_DAY'
  | 'ONCE_IN_3_DAYS' | 'ONCE_IN_4_DAYS' | 'ONCE_A_WEEK';

export type WhenToTake =
  | 'BEFORE_BREAKFAST' | 'AFTER_BREAKFAST'
  | 'BEFORE_LUNCH' | 'AFTER_LUNCH'
  | 'BEFORE_DINNER' | 'AFTER_DINNER';

export interface CaseMedicine {
  medicineId: string;
  dose: string;
  days: number;
  frequency: DoseFrequency;
  whenToTake?: WhenToTake;
  dispensedQty: number;
}

export interface CreatePatientCasePayload {
  patientName: string;
  symptoms?: string[];
  diseases?: string[];
  remarks?: string;
  medicines: CaseMedicine[];
}

export interface PatientCase {
  id: string;
  patientName: string;
  symptoms: string[];
  diseases: string[];
  remarks?: string;
  createdAt: string;
  medicines: Array<{
    id: string;
    medicine: { id: string; name: string; unit: string };
    dose: string;
    days: number;
    frequency: DoseFrequency;
    whenToTake?: WhenToTake;
    dispensedQty: number;
    medicineCost: number;
  }>;
  totalCost: number;
  consultationFee: number;
  taxAmount: number;
  grandTotal: number;
  subOrder?: {
    id: string;
    status: string;
    pharmacy?: { name: string };
  };
}

type Period = 'day' | 'week' | 'month' | 'year';

export function usePatientCasesQuery(period?: Period) {
  return useQuery({
    queryKey: ['patient-cases', period],
    queryFn: async () => {
      const { data } = await apiClient.get<PatientCase[]>('/patient-cases', {
        params: period ? { period } : undefined,
      });
      return data;
    },
  });
}

export function usePatientCaseQuery(id: string) {
  return useQuery({
    queryKey: ['patient-cases', id],
    queryFn: async () => {
      const { data } = await apiClient.get<PatientCase>(`/patient-cases/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePatientCaseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePatientCasePayload) => {
      const { data } = await apiClient.post<PatientCase>('/patient-cases', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient-cases'] }),
  });
}
