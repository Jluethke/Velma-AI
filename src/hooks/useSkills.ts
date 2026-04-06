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
}

const fallbackSkills: Skill[] = STATIC_SKILLS.map(s => ({
  ...s,
  execution_pattern: 'sequential',
}));

export function useSkills() {
  return useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => apiFetch('/api/skills'),
    staleTime: 60_000,
    placeholderData: fallbackSkills,
    retry: 1,
  });
}

export function useSkill(name: string) {
  return useQuery<{ name: string; content: string; manifest: Record<string, unknown> }>({
    queryKey: ['skill', name],
    queryFn: () => apiFetch(`/api/skills/${name}`),
    enabled: !!name,
  });
}
