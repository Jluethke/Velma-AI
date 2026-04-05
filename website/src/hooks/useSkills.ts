import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useApi';

export interface Skill {
  name: string;
  domain: string;
  description: string;
  tags: string[];
  execution_pattern: string;
  price: string;
  license: string;
}

export function useSkills() {
  return useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => apiFetch('/api/skills'),
    staleTime: 60_000,
  });
}

export function useSkill(name: string) {
  return useQuery<{ name: string; content: string; manifest: Record<string, unknown> }>({
    queryKey: ['skill', name],
    queryFn: () => apiFetch(`/api/skills/${name}`),
    enabled: !!name,
  });
}
