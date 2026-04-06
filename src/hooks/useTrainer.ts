import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useApi';

export interface TrainerCard {
  level: number;
  title: string;
  xp: number;
  xp_next: number;
  xp_progress: number;
  streak: number;
  streak_best: number;
  streak_multiplier: number;
  skills_discovered: number;
  skills_total: number;
  chains_completed: number;
  chains_total: number;
  achievements_unlocked: number;
  achievements_total: number;
  total_skill_runs: number;
  total_chain_runs: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface SkilldexCategory {
  discovered: number;
  total: number;
  percent: number;
  skills: { name: string; discovered: boolean; evolution: string }[];
}

export interface Skilldex {
  total_discovered: number;
  total_skills: number;
  percent: number;
  categories: Record<string, SkilldexCategory>;
}

export interface Quest {
  text: string;
  xp: number;
  completed: boolean;
  type: string;
}

const fallbackTrainer: TrainerCard = {
  level: 7, title: 'Chain Architect', xp: 2840, xp_next: 3500, xp_progress: 0.81,
  streak: 12, streak_best: 18, streak_multiplier: 1.6,
  skills_discovered: 42, skills_total: 95,
  chains_completed: 28, chains_total: 44,
  achievements_unlocked: 14, achievements_total: 30,
  total_skill_runs: 347, total_chain_runs: 89,
};

const fallbackQuests: Quest[] = [
  { text: 'Run any skill', xp: 25, completed: true, type: 'daily' },
  { text: 'Complete a chain', xp: 50, completed: true, type: 'daily' },
  { text: 'Discover a new skill', xp: 75, completed: false, type: 'daily' },
  { text: 'Validate a community skill', xp: 100, completed: false, type: 'daily' },
];

export function useTrainer() {
  return useQuery<TrainerCard>({
    queryKey: ['trainer'],
    queryFn: () => apiFetch('/api/trainer'),
    staleTime: 10_000,
    placeholderData: fallbackTrainer,
    retry: 1,
  });
}

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: () => apiFetch('/api/achievements'),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSkilldex() {
  return useQuery<Skilldex>({
    queryKey: ['skilldex'],
    queryFn: () => apiFetch('/api/skilldex'),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useQuests() {
  return useQuery<Quest[]>({
    queryKey: ['quests'],
    queryFn: () => apiFetch('/api/quests'),
    staleTime: 60_000,
    placeholderData: fallbackQuests,
    retry: 1,
  });
}

export function useEvolutions() {
  return useQuery<{ skill: string; tier: string }[]>({
    queryKey: ['evolutions'],
    queryFn: () => apiFetch('/api/evolutions'),
    staleTime: 30_000,
    retry: 1,
  });
}
