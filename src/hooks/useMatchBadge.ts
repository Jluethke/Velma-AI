/**
 * Polls the discovery summary endpoint to drive the navbar badge.
 * Returns pendingMatches count; 0 when no wallet connected.
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export interface DiscoverySummary {
  activeListings: number;
  pendingMatches: number;
}

export function useMatchBadge() {
  const { address } = useAccount();

  const { data } = useQuery({
    queryKey: ['discovery-summary', address],
    queryFn: async (): Promise<DiscoverySummary> => {
      const res = await fetch(`/api/discovery/summary?wallet=${address}`);
      if (!res.ok) return { activeListings: 0, pendingMatches: 0 };
      return res.json() as Promise<DiscoverySummary>;
    },
    enabled: !!address,
    // Poll every 45 seconds in the background
    refetchInterval: 45_000,
    staleTime: 30_000,
  });

  return data?.pendingMatches ?? 0;
}
