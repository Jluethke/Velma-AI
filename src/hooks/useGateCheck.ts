import { useAccount, useReadContract } from 'wagmi';
import { SkillTokenABI } from '../contracts/SkillToken';
import { CONTRACTS, TARGET_CHAIN_ID } from '../contracts';

export interface GateState {
  isConnected: boolean;
  isUnlocked: boolean;
  balance: bigint | undefined;
  isLoading: boolean;
}

export function useGateCheck(): GateState {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: SkillTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: isConnected && !!address,
      staleTime: 30_000,
    },
  });

  return {
    isConnected,
    isUnlocked: isConnected && !!balance && (balance as bigint) > 0n,
    balance: balance as bigint | undefined,
    isLoading,
  };
}
