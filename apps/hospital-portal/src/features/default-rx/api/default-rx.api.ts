import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { DoseFrequency, WhenToTake } from '../../patient-cases/api/patient-cases.api';

export interface DefaultRxEntry {
  id: string;
  medicineId: string;
  medicine: { id: string; name: string; unit: string };
  dose: string;
  days: number;
  frequency: DoseFrequency;
  whenToTake?: WhenToTake;
  defaultQty: number;
}

export interface UpsertDefaultRxPayload {
  dose: string;
  days: number;
  frequency: DoseFrequency;
  whenToTake?: WhenToTake;
  defaultQty: number;
}

export function useDefaultRxQuery() {
  return useQuery({
    queryKey: ['default-rx'],
    queryFn: async () => {
      const { data } = await apiClient.get<DefaultRxEntry[]>('/default-rx');
      return data;
    },
  });
}

export function useUpsertDefaultRxMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ medicineId, payload }: { medicineId: string; payload: UpsertDefaultRxPayload }) => {
      const { data } = await apiClient.put(`/default-rx/${medicineId}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['default-rx'] }),
  });
}
