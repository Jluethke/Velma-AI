import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SkillChain',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'skillchain-dev',
  chains: [base],
  ssr: false,
});
