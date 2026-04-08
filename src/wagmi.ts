import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'FlowFabric',
  // Get a real project ID at https://cloud.walletconnect.com
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dbdcfb28-fde4-4857-9d9c-78dc3a093837',
  chains: [base],
  ssr: false,
});
