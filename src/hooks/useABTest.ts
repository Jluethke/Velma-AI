import { useState } from 'react';
import { trackEvent } from './useAnalytics';

interface ABTestConfig {
  name: string;
  variants: string[];
}

export function useABTest({ name, variants }: ABTestConfig): { variant: string; track: (action: string) => void } {
  const [variant] = useState(() => {
    const key = `ab-test-${name}`;
    const stored = sessionStorage.getItem(key);
    if (stored && variants.includes(stored)) return stored;
    const picked = variants[Math.floor(Math.random() * variants.length)];
    sessionStorage.setItem(key, picked);
    return picked;
  });

  const track = (action: string) => {
    trackEvent(`ab_${name}_${action}`, { variant });
  };

  return { variant, track };
}
