import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // pharmacy name
  email: string;
  phone?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  specializations?: Array<{ name: string }>;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
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
      const { data } = await apiClient.get<Profile>('/profile');
      return data;
    },
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await apiClient.patch<Profile>('/profile', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
