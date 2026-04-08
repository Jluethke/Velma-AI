/**
 * useSendTrust — send TRUST tokens to another wallet address.
 *
 * Uses the same writeContract pattern as PortalStake.tsx (no chain/account
 * overrides — wagmi infers them from the connected wallet).
 */
import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
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

  // Same pattern as PortalStake.tsx — synchronous writeContract + receipt watcher
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const { switchChainAsync } = useSwitchChain();

  // Track confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      setState({ status: 'confirmed', txHash });
    }
  }, [isConfirmed, txHash]);

  // Track write errors
  useEffect(() => {
    if (writeError) {
      const msg = writeError.message || 'Transfer failed';
      if (msg.includes('User rejected')) {
        setState({ status: 'error', error: 'Transaction cancelled' });
      } else if (msg.includes('insufficient')) {
        setState({ status: 'error', error: 'Insufficient TRUST balance or ETH for gas' });
      } else {
        setState({ status: 'error', error: msg.length > 100 ? msg.slice(0, 100) + '...' : msg });
      }
    }
  }, [writeError]);

  // Track pending state
  useEffect(() => {
    if (isPending) {
      setState({ status: 'sending' });
    }
  }, [isPending]);

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

      // Use synchronous writeContract — same pattern as PortalStake.tsx
      // Do NOT pass chain or account; wagmi infers them from the connector.
      writeContract({
        address: CONTRACTS.TrustToken,
        abi: SkillTokenABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseUnits(amount, 18)],
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      if (msg.includes('User rejected')) {
        setState({ status: 'error', error: 'Transaction cancelled' });
      } else if (msg.includes('insufficient')) {
        setState({ status: 'error', error: 'Insufficient TRUST balance or ETH for gas' });
      } else {
        setState({ status: 'error', error: msg.length > 100 ? msg.slice(0, 100) + '...' : msg });
      }
      return false;
    }
  }, [address, chainId, writeContract, switchChainAsync]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
    resetWrite();
  }, [resetWrite]);

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
