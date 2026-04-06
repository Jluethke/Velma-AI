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

export function useTrainer() {
  return useQuery<TrainerCard>({
    queryKey: ['trainer'],
    queryFn: () => apiFetch('/api/trainer'),
    staleTime: 10_000,
  });
}

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: () => apiFetch('/api/achievements'),
    staleTime: 30_000,
  });
}

export function useSkilldex() {
  return useQuery<Skilldex>({
    queryKey: ['skilldex'],
    queryFn: () => apiFetch('/api/skilldex'),
    staleTime: 30_000,
  });
}

export function useQuests() {
  return useQuery<Quest[]>({
    queryKey: ['quests'],
    queryFn: () => apiFetch('/api/quests'),
    staleTime: 60_000,
  });
}

export function useEvolutions() {
  return useQuery<{ skill: string; tier: string }[]>({
    queryKey: ['evolutions'],
    queryFn: () => apiFetch('/api/evolutions'),
    staleTime: 30_000,
  });
}
