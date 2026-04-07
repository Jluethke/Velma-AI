import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useApi';

export interface VelmaRecommendation {
  chain: string;
  nudge: string;
  reason: string;
  priority: number;
  category: string;
}

export function useVelma() {
  return useQuery<VelmaRecommendation[]>({
    queryKey: ['velma'],
    queryFn: async () => {
      try {
        return await apiFetch('/api/velma/what-now');
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}
