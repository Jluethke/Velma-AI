/**
 * VelmaContext — makes Velma accessible from any component without prop-drilling.
 * Wrap the app once; call useVelma() anywhere to trigger XP events.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { useVelmaCompanion } from '../hooks/useVelmaCompanion';

type VelmaApi = ReturnType<typeof useVelmaCompanion>;

const VelmaContext = createContext<VelmaApi | null>(null);

export function VelmaProvider({ children }: { children: ReactNode }) {
  const velma = useVelmaCompanion();
  return <VelmaContext.Provider value={velma}>{children}</VelmaContext.Provider>;
}

export function useVelma(): VelmaApi {
  const ctx = useContext(VelmaContext);
  if (!ctx) throw new Error('useVelma must be used inside VelmaProvider');
  return ctx;
}
