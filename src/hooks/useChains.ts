import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch, apiPost } from './useApi';

export interface ChainSummary {
  name: string;
  description: string;
  category: string;
  steps: number;
  skills: string[];
  free?: boolean;
}

export interface ChainMatch {
  chain_name: string;
  description: string;
  category: string;
  score: number;
  match_reason: string;
  skills: string[];
  step_count: number;
  free?: boolean;
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

const fallbackChains: ChainSummary[] = [
  { name: 'code-review', description: 'Full code review pipeline: lint, security scan, style check, and summary', category: 'developer', steps: 4, skills: ['repo-health', 'code-review', 'security-hardening'], free: true },
  { name: 'content-repurpose', description: 'Transform one piece of content into 25 platform-optimized variations', category: 'content', steps: 5, skills: ['content-engine', 'velma-voice', 'social-automation'], free: false },
  { name: 'deal-analysis', description: 'Analyze CRE deals with risk scoring, market comps, and cap rate validation', category: 'finance', steps: 6, skills: ['data-extractor', 'budget-builder'] },
  { name: 'onboarding', description: 'New developer onboarding: repo map, architecture overview, key patterns', category: 'developer', steps: 3, skills: ['repo-health', 'task-decomposition'] },
  { name: 'trading-signals', description: 'Multi-timeframe signal generation with regime classification', category: 'trading', steps: 5, skills: ['trading-system', 'data-extractor'] },
  { name: 'resume-pipeline', description: 'End-to-end resume optimization: parse, score, rewrite, format', category: 'career', steps: 4, skills: ['resume-builder', 'interview-coach'] },
  { name: 'security-audit', description: 'Comprehensive security audit: dependency scan, OWASP check, report', category: 'developer', steps: 5, skills: ['security-hardening', 'repo-health'] },
  { name: 'api-scaffold', description: 'Design and scaffold a REST API from natural language spec', category: 'developer', steps: 4, skills: ['api-design', 'task-decomposition'] },
];

export function useChains() {
  return useQuery<ChainSummary[]>({
    queryKey: ['chains'],
    queryFn: () => apiFetch('/api/chains'),
    staleTime: 60_000,
    placeholderData: fallbackChains,
    retry: 1,
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
