/**
 * usePublishSkill — on-chain skill publishing via SkillRegistry contract.
 *
 * Handles the full flow:
 * 1. Hash skill content to create a pseudo-IPFS CID
 * 2. Call SkillRegistry.registerSkill() — user signs with their wallet
 * 3. Track the returned skillId for derivative/royalty linking
 * 4. Query creatorOf() to verify authorship
 */
import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { SkillRegistryABI } from '../contracts/SkillRegistry';
import { CONTRACTS, TARGET_CHAIN_ID } from '../contracts';

export type LicenseType = 0 | 1 | 2; // 0=OPEN, 1=COMMERCIAL, 2=PROPRIETARY

export interface PublishSkillParams {
  name: string;
  domain: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
  price: bigint;
  licenseType: LicenseType;
  /** The actual skill content (skill.md + manifest) for content-addressing */
  content: string;
  /** If this is a derivative, the original skill's on-chain ID */
  derivedFrom?: string;
}

export interface PublishResult {
  skillId: string;
  txHash: string;
  author: string;
  derivedFrom?: string;
}

export interface PublishState {
  status: 'idle' | 'signing' | 'confirming' | 'confirmed' | 'error';
  error?: string;
  result?: PublishResult;
}

export function usePublishSkill() {
  const { address } = useAccount();
  const [state, setState] = useState<PublishState>({ status: 'idle' });

  const { writeContractAsync } = useWriteContract();

  const publish = useCallback(async (params: PublishSkillParams): Promise<PublishResult | null> => {
    if (!address) {
      setState({ status: 'error', error: 'Wallet not connected' });
      return null;
    }

    try {
      setState({ status: 'signing' });

      // Create a content-addressed CID from the skill content
      // In production this would upload to IPFS — for now we use a content hash
      const contentHash = keccak256(toBytes(params.content));
      const ipfsCid = `skillchain://${contentHash.slice(0, 20)}`;

      // Call SkillRegistry.registerSkill()
      const txHash = await writeContractAsync({
        address: CONTRACTS.SkillRegistry,
        abi: SkillRegistryABI,
        functionName: 'registerSkill',
        args: [
          ipfsCid,
          params.name,
          params.domain,
          params.tags,
          params.inputs,
          params.outputs,
          params.price,
          params.licenseType,
        ],
      });

      setState({ status: 'confirming' });

      // Generate the skillId (same as contract: keccak256(abi.encodePacked(msg.sender, name)))
      // This is deterministic so we can compute it client-side
      const skillId = keccak256(toBytes(`${address}${params.name}`));

      const result: PublishResult = {
        skillId,
        txHash,
        author: address,
        derivedFrom: params.derivedFrom,
      };

      setState({ status: 'confirmed', result });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setState({ status: 'error', error: message });
      return null;
    }
  }, [address, writeContractAsync]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { publish, state, reset };
}

/**
 * Read the on-chain creator of a skill.
 */
export function useSkillCreator(skillId: string | undefined) {
  return useReadContract({
    address: CONTRACTS.SkillRegistry,
    abi: SkillRegistryABI,
    functionName: 'creatorOf',
    args: skillId ? [skillId as `0x${string}`] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!skillId },
  });
}

/**
 * Read how many skills an author has published.
 */
export function useAuthorSkillCount(authorAddress: string | undefined) {
  return useReadContract({
    address: CONTRACTS.SkillRegistry,
    abi: SkillRegistryABI,
    functionName: 'authorSkillCount',
    args: authorAddress ? [authorAddress as `0x${string}`] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!authorAddress },
  });
}
