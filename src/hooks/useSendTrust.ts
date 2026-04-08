/**
 * useSendTrust — send TRUST tokens to another wallet address.
 */
import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { SkillTokenABI } from '../contracts/SkillToken';
import { CONTRACTS, TARGET_CHAIN_ID } from '../contracts';

export interface SendState {
  status: 'idle' | 'sending' | 'confirmed' | 'error';
  error?: string;
  txHash?: string;
}

export function useSendTrust() {
  const { address } = useAccount();
  const [state, setState] = useState<SendState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();

  const send = useCallback(async (to: string, amount: string): Promise<boolean> => {
    if (!address) {
      setState({ status: 'error', error: 'Wallet not connected' });
      return false;
    }

    if (!to || !to.startsWith('0x') || to.length !== 42) {
      setState({ status: 'error', error: 'Invalid address' });
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setState({ status: 'error', error: 'Invalid amount' });
      return false;
    }

    try {
      setState({ status: 'sending' });

      const txHash = await writeContractAsync({
        address: CONTRACTS.TrustToken,
        abi: SkillTokenABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseUnits(amount, 18)],
      });

      setState({ status: 'confirmed', txHash });
      return true;
    } catch (err) {
      setState({ status: 'error', error: err instanceof Error ? err.message : 'Transfer failed' });
      return false;
    }
  }, [address, writeContractAsync]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { send, state, reset };
}

export function useTrustBalance() {
  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: CONTRACTS.TrustToken,
    abi: SkillTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: isConnected && !!address, staleTime: 15_000 },
  });

  return {
    raw: balance as bigint | undefined,
    formatted: balance ? formatUnits(balance as bigint, 18) : '0',
    display: balance ? Number(formatUnits(balance as bigint, 18)).toLocaleString() : '0',
  };
}
