import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useStatesQuery() {
  return useQuery({
    queryKey: ['geography', 'states'],
    queryFn: () => axios.get('/api/geography/states').then((r) => r.data as { id: string; name: string; code: string }[]),
    staleTime: Infinity, // Reference data — never changes in a session
  });
}

export function useCitiesQuery(stateId: string | undefined) {
  return useQuery({
    queryKey: ['geography', 'cities', stateId],
    queryFn: () =>
      axios.get(`/api/geography/cities?stateId=${stateId}`).then((r) => r.data as { id: string; name: string }[]),
    enabled: !!stateId,
    staleTime: Infinity,
  });
}
