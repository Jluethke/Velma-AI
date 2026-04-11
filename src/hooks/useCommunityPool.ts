/**
 * useCommunityPool — read and claim from the community reward pool.
 *
 * The pool accumulates a portion of every marketplace purchase and subscription
 * payment, then distributes it to addresses that earned their TRUST through
 * LifeRewards / OnboardingRewards / etc.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { CommunityPoolABI, CONTRACTS, TARGET_CHAIN_ID } from '../contracts';

const POOL = CONTRACTS.CommunityPool;
const DEPLOYED = POOL !== '0x0000000000000000000000000000000000000000';

export interface CommunityPoolState {
  pendingClaim: string;          // formatted TRUST
  pendingClaimRaw: bigint;
  earnedWeight: string;          // formatted TRUST (lifetime earned)
  totalEarnedWeight: string;     // formatted TRUST (all earners)
  poolBalance: string;           // formatted TRUST (unclaimed)
  totalDeposited: string;        // formatted TRUST (all-time)
  sharePercent: string;          // user's % of total earned weight
  deployed: boolean;             // false until contract is live
}

export interface ClaimState {
  status: 'idle' | 'claiming' | 'confirmed' | 'error';
  error?: string;
  txHash?: string;
}

export function useCommunityPool() {
  const { address, isConnected, chainId } = useAccount();
  const [claimState, setClaimState] = useState<ClaimState>({ status: 'idle' });

  const opts = { chainId: TARGET_CHAIN_ID, query: { enabled: DEPLOYED && isConnected && !!address, staleTime: 20_000 } };
  const globalOpts = { chainId: TARGET_CHAIN_ID, query: { enabled: DEPLOYED, staleTime: 60_000 } };

  const { data: pending, refetch: refetchPending } = useReadContract({
    address: POOL,
    abi: CommunityPoolABI,
    functionName: 'pendingClaim',
    args: address ? [address] : undefined,
    ...opts,
  });

  const { data: earned } = useReadContract({
    address: POOL,
    abi: CommunityPoolABI,
    functionName: 'earnedWeight',
    args: address ? [address] : undefined,
    ...opts,
  });

  const { data: totalEarned } = useReadContract({
    address: POOL,
    abi: CommunityPoolABI,
    functionName: 'totalEarnedWeight',
    ...globalOpts,
  });

  const { data: balance } = useReadContract({
    address: POOL,
    abi: CommunityPoolABI,
    functionName: 'poolBalance',
    ...globalOpts,
  });

  const { data: deposited } = useReadContract({
    address: POOL,
    abi: CommunityPoolABI,
    functionName: 'totalDeposited',
    ...globalOpts,
  });

  const fmt = (val: unknown, decimals = 18) =>
    val ? Number(formatUnits(val as bigint, decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';

  const earnedBig = (earned as bigint) ?? 0n;
  const totalBig  = (totalEarned as bigint) ?? 0n;
  const sharePercent = totalBig > 0n
    ? ((Number(earnedBig) / Number(totalBig)) * 100).toFixed(2)
    : '0';

  const stats: CommunityPoolState = {
    pendingClaim:      fmt(pending),
    pendingClaimRaw:   (pending as bigint) ?? 0n,
    earnedWeight:      fmt(earned),
    totalEarnedWeight: fmt(totalEarned),
    poolBalance:       fmt(balance),
    totalDeposited:    fmt(deposited),
    sharePercent,
    deployed:          DEPLOYED,
  };

  // ── Claim ──────────────────────────────────────────────────────────
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    if (isConfirmed && txHash) {
      setClaimState({ status: 'confirmed', txHash });
      refetchPending();
    }
  }, [isConfirmed, txHash, refetchPending]);

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message || 'Claim failed';
      setClaimState({
        status: 'error',
        error: msg.includes('User rejected') ? 'Transaction cancelled' : msg.slice(0, 100),
      });
    }
  }, [writeError]);

  useEffect(() => {
    if (isPending) setClaimState({ status: 'claiming' });
  }, [isPending]);

  const claim = useCallback(async (): Promise<boolean> => {
    if (!address || !DEPLOYED) return false;
    try {
      if (chainId !== TARGET_CHAIN_ID) {
        await switchChainAsync({ chainId: TARGET_CHAIN_ID });
      }
      writeContract({ address: POOL, abi: CommunityPoolABI, functionName: 'claim' });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      setClaimState({ status: 'error', error: msg.slice(0, 100) });
      return false;
    }
  }, [address, chainId, writeContract, switchChainAsync]);

  const resetClaim = useCallback(() => {
    setClaimState({ status: 'idle' });
    resetWrite();
  }, [resetWrite]);

  return { stats, claimState, claim, resetClaim };
}
