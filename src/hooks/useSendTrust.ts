/**
 * useSendTrust — send TRUST tokens to another wallet address.
 */
import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { base } from 'wagmi/chains';
import { SkillTokenABI } from '../contracts/SkillToken';
import { CONTRACTS, TARGET_CHAIN_ID } from '../contracts';

export interface SendState {
  status: 'idle' | 'sending' | 'switching' | 'confirmed' | 'error';
  error?: string;
  txHash?: string;
}

export function useSendTrust() {
  const { address, chainId } = useAccount();
  const [state, setState] = useState<SendState>({ status: 'idle' });
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const send = useCallback(async (to: string, amount: string): Promise<boolean> => {
    if (!address) {
      setState({ status: 'error', error: 'Wallet not connected' });
      return false;
    }

    if (!to || !to.startsWith('0x') || to.length !== 42) {
      setState({ status: 'error', error: 'Invalid address — must be 0x... (42 characters)' });
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setState({ status: 'error', error: 'Enter a valid amount' });
      return false;
    }

    try {
      // Switch to Base if not already on it
      if (chainId !== TARGET_CHAIN_ID) {
        setState({ status: 'switching' });
        try {
          await switchChainAsync({ chainId: TARGET_CHAIN_ID });
        } catch {
          setState({ status: 'error', error: 'Please switch to Base network in MetaMask' });
          return false;
        }
      }

      setState({ status: 'sending' });

      const txHash = await writeContractAsync({
        address: CONTRACTS.TrustToken,
        abi: SkillTokenABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseUnits(amount, 18)],
        chain: base,
        account: address,
      });

      setState({ status: 'confirmed', txHash });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      // Clean up the error message for common cases
      if (msg.includes('User rejected')) {
        setState({ status: 'error', error: 'Transaction cancelled' });
      } else if (msg.includes('insufficient')) {
        setState({ status: 'error', error: 'Insufficient TRUST balance or ETH for gas' });
      } else {
        setState({ status: 'error', error: msg.length > 100 ? msg.slice(0, 100) + '...' : msg });
      }
      return false;
    }
  }, [address, chainId, writeContractAsync, switchChainAsync]);

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
