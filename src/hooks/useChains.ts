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
  // ── FREE CHAIN — the hook ──────────────────────────────────────────
  { name: 'get-your-life-together', description: 'Budget your money, plan your week, and meal prep — all in one shot. The chain everyone needs.', category: 'life', steps: 3, skills: ['budget-builder', 'daily-planner', 'meal-planner'], free: true },

  // ── PREMIUM CHAINS — require TRUST ────────────────────────────────
  { name: 'career-launchpad', description: 'Build your resume, prep for interviews, and plan salary negotiation — full job search pipeline', category: 'career', steps: 3, skills: ['resume-builder', 'interview-coach', 'daily-planner'], free: false },
  { name: 'money-makeover', description: 'Audit expenses, build a budget, and create a retirement projection — take control of your finances', category: 'money', steps: 3, skills: ['expense-optimizer', 'budget-builder', 'retirement-planner'], free: false },
  { name: 'code-review', description: 'Full code review pipeline: lint, security scan, style check, and actionable summary', category: 'developer', steps: 3, skills: ['code-review', 'complaint-letter-writer'], free: false },
  { name: 'content-machine', description: 'Turn one piece of content into 25 platform-optimized variations with scheduling', category: 'content', steps: 3, skills: ['content-engine', 'daily-planner'], free: false },
  { name: 'healthy-week', description: 'Plan your meals, schedule workouts, and organize your week for maximum energy', category: 'health', steps: 3, skills: ['meal-planner', 'workout-planner', 'daily-planner'], free: false },
  { name: 'trip-ready', description: 'Plan your trip, budget it, and get a daily itinerary — from idea to packed bag', category: 'life', steps: 3, skills: ['travel-planner', 'budget-builder', 'daily-planner'], free: false },
  { name: 'home-savings', description: 'Energy audit your home and optimize recurring expenses — find hidden savings', category: 'home', steps: 2, skills: ['energy-audit', 'expense-optimizer'], free: false },
];

export function useChains() {
  return useQuery<ChainSummary[]>({
    queryKey: ['chains'],
    queryFn: async () => {
      try {
        return await apiFetch('/api/chains');
      } catch {
        return fallbackChains;
      }
    },
    staleTime: 60_000,
    initialData: fallbackChains,
    retry: false,
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
