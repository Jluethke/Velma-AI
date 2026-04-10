import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TrustTokenABI } from '../contracts/TrustToken';
import { CONTRACTS, TARGET_CHAIN_ID } from '../contracts';

export type TrustTier = 'explorer' | 'builder' | 'creator' | 'pro' | 'validator' | 'governor';

export interface GateState {
  isConnected: boolean;
  tier: TrustTier;
  balance: bigint | undefined;
  balanceFormatted: string;
  isLoading: boolean;
  // Convenience booleans
  canChain: boolean;      // builder+
  canPublish: boolean;    // creator+
  canSchedule: boolean;   // builder+ (basic), pro+ (advanced)
  canValidate: boolean;   // validator+
  canGovern: boolean;     // governor+
}

/** Tier thresholds in whole TRUST tokens */
const TIER_THRESHOLDS: { tier: TrustTier; min: number }[] = [
  { tier: 'governor',  min: 100_000 },
  { tier: 'validator', min: 25_000 },
  { tier: 'pro',       min: 10_000 },
  { tier: 'creator',   min: 2_500 },
  { tier: 'builder',   min: 500 },
  { tier: 'explorer',  min: 0 },
];

export function getTierFromBalance(balanceFormatted: number): TrustTier {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (balanceFormatted >= min) return tier;
  }
  return 'explorer';
}

export const TIER_LABELS: Record<TrustTier, string> = {
  explorer:  'Explorer',
  builder:   'Builder',
  creator:   'Creator',
  pro:       'Pro Creator',
  validator: 'Validator',
  governor:  'Governor',
};

export const TIER_COLORS: Record<TrustTier, string> = {
  explorer:  'var(--text-secondary)',
  builder:   'var(--cyan)',
  creator:   'var(--green)',
  pro:       'var(--gold)',
  validator: 'var(--purple)',
  governor:  '#ff6b6b',
};

const TIER_ORDER: Record<TrustTier, number> = {
  explorer: 0, builder: 1, creator: 2, pro: 3, validator: 4, governor: 5,
};

function atLeast(current: TrustTier, required: TrustTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}

export function useGateCheck(): GateState {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: TrustTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: isConnected && !!address,
      staleTime: 30_000,
    },
  });

  const raw = balance as bigint | undefined;
  const formatted = raw ? Number(formatUnits(raw, 18)) : 0;
  const balanceFormatted = raw ? Number(formatUnits(raw, 18)).toLocaleString() : '0';
  const tier = isConnected ? getTierFromBalance(formatted) : 'explorer';

  return {
    isConnected,
    tier,
    balance: raw,
    balanceFormatted,
    isLoading,
    canChain:    isConnected && atLeast(tier, 'builder'),
    canPublish:  isConnected && atLeast(tier, 'creator'),
    canSchedule: isConnected && atLeast(tier, 'builder'),
    canValidate: isConnected && atLeast(tier, 'validator'),
    canGovern:   isConnected && atLeast(tier, 'governor'),
  };
}
