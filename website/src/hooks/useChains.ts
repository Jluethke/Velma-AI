import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch, apiPost } from './useApi';

export interface ChainSummary {
  name: string;
  description: string;
  category: string;
  steps: number;
  skills: string[];
}

export interface ChainMatch {
  chain_name: string;
  description: string;
  category: string;
  score: number;
  match_reason: string;
  skills: string[];
  step_count: number;
}

export interface StepResult {
  skill_name: string;
  alias: string;
  status: string;
  output: Record<string, unknown>;
  duration_ms: number;
  error: string;
}

export interface ChainRunResult {
  chain: {
    chain_name: string;
    steps: StepResult[];
    total_duration_ms: number;
    success: boolean;
    final_output: Record<string, unknown>;
  };
  gamification: {
    trainer: Record<string, unknown>;
    unlocked: { name: string; description: string; xp: number }[];
  };
}

export function useChains() {
  return useQuery<ChainSummary[]>({
    queryKey: ['chains'],
    queryFn: () => apiFetch('/api/chains'),
    staleTime: 60_000,
  });
}

export function useSearchChains(query: string) {
  return useQuery<ChainMatch[]>({
    queryKey: ['chains-search', query],
    queryFn: () => apiPost('/api/chains/search', { query, max_results: 10 }),
    enabled: query.length > 2,
    staleTime: 30_000,
  });
}

export function useRunChain() {
  return useMutation<ChainRunResult, Error, { name: string; context?: Record<string, unknown> }>({
    mutationFn: ({ name, context }) =>
      apiPost(`/api/chains/${name}/run`, { initial_context: context || {} }),
  });
}
