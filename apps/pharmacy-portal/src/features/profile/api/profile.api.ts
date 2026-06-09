import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export interface PharmacyProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  licenseNo?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProfilePayload {
  phone?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
}

export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<PharmacyProfile>('/profile');
      return data;
    },
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await apiClient.patch<PharmacyProfile>('/profile', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
