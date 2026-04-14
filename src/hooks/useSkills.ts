import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useApi';
import { skills as STATIC_SKILLS } from '../data/skills';

export interface Skill {
  name: string;
  domain: string;
  description: string;
  tags: string[];
  execution_pattern: string;
  price: string;
  license: string;
  free: boolean;
}

const fallbackSkills: Skill[] = STATIC_SKILLS.map(s => ({
  ...s,
  execution_pattern: 'sequential',
}));

export function useSkills() {
  return useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      try {
        return await apiFetch('/api/skills');
      } catch {
        return fallbackSkills;
      }
    },
    staleTime: 60_000,
    initialData: fallbackSkills,
    retry: false,
  });
}

export function useSkill(name: string) {
  return useQuery<{ name: string; content: string; manifest: Record<string, unknown> }>({
    queryKey: ['skill', name],
    queryFn: () => apiFetch(`/api/skills/${name}`),
    enabled: !!name,
    retry: false,
    staleTime: Infinity,
  });
}
