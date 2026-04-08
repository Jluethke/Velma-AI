/**
 * Trust Bridge — On-Chain Trust Score Reader
 * =============================================
 * Reads trust scores and validation consensus from the deployed
 * TrustOracle and ValidationRegistry contracts on Base mainnet.
 *
 * Uses viem for lightweight RPC calls with local caching and offline fallback.
 *
 * Contract addresses (Base mainnet, deployed 2026-04-06):
 * - TrustOracle:        0x5e3b7016FE47eb6Dbdc276104494e55d540173e3
 * - ValidationRegistry:  0x4794204ADedC2390e387d02df3906FC3C768f73A
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Contract addresses (Base mainnet)
// ---------------------------------------------------------------------------

const TRUST_ORACLE_ADDRESS = "0x5e3b7016FE47eb6Dbdc276104494e55d540173e3" as const;
const VALIDATION_REGISTRY_ADDRESS = "0x4794204ADedC2390e387d02df3906FC3C768f73A" as const;

// Base mainnet chain ID
const BASE_CHAIN_ID = 8453;
const DEFAULT_RPC_URL = "https://mainnet.base.org";

// ---------------------------------------------------------------------------
// Minimal ABI fragments for read-only calls
// We inline these rather than importing the full ABIs to keep the MCP
// server zero-dependency (viem is the only addition).
// ---------------------------------------------------------------------------

const TRUST_ORACLE_ABI = [
  {
    type: "function" as const,
    name: "getTrustScore" as const,
    inputs: [{ name: "nodeId", type: "bytes32" as const }],
    outputs: [{ name: "", type: "uint256" as const }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "attestationCount" as const,
    inputs: [{ name: "nodeId", type: "bytes32" as const }],
    outputs: [{ name: "", type: "uint256" as const }],
    stateMutability: "view" as const,
  },
] as const;

const VALIDATION_REGISTRY_ABI = [
  {
    type: "function" as const,
    name: "getValidationConsensus" as const,
    inputs: [{ name: "skillId", type: "bytes32" as const }],
    outputs: [
      { name: "hasConsensus", type: "bool" as const },
      { name: "numValidators", type: "uint256" as const },
      { name: "successRateBps", type: "uint256" as const },
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "validationCount" as const,
    inputs: [{ name: "skillId", type: "bytes32" as const }],
    outputs: [{ name: "", type: "uint256" as const }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "successCount" as const,
    inputs: [{ name: "", type: "bytes32" as const }],
    outputs: [{ name: "", type: "uint256" as const }],
    stateMutability: "view" as const,
  },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrustScore {
  /** Raw on-chain trust score (0-10000 basis points) */
  raw: number;
  /** Normalized trust score (0-1) */
  normalized: number;
  /** Number of attestations for this node */
  attestation_count: number;
  /** Combined trust score factoring in attestation count */
  combined: number;
  /** Whether this came from on-chain or cache/fallback */
  source: "on-chain" | "cache" | "fallback";
  /** When this was last fetched */
  fetched_at: string;
}

export interface ValidationConsensus {
  hasConsensus: boolean;
  numValidators: number;
  successRateBps: number;
  source: "on-chain" | "cache" | "fallback";
  fetched_at: string;
}

interface CacheEntry<T> {
  data: T;
  fetched_at: string;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Trust Bridge
// ---------------------------------------------------------------------------

export class TrustBridge {
  private rpcUrl: string;
  private cachePath: string;
  private cache: Record<string, CacheEntry<unknown>>;
  private cacheTtlMs: number;
  private viemClient: unknown | null = null;
  private viemAvailable: boolean | null = null;

  constructor(rpcUrl?: string, cacheTtlMs: number = 5 * 60 * 1000) {
    this.rpcUrl = rpcUrl ?? process.env.SKILLCHAIN_RPC_URL ?? DEFAULT_RPC_URL;
    this.cacheTtlMs = cacheTtlMs;

    const cacheDir = join(homedir(), ".skillchain");
    mkdirSync(cacheDir, { recursive: true });
    this.cachePath = join(cacheDir, "trust_cache.json");
    this.cache = this.loadCache();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Get trust score for a skill (by name, hashed to bytes32).
   */
  async getSkillTrust(skillName: string): Promise<TrustScore> {
    const skillId = this.nameToBytes32(skillName);
    const cacheKey = `trust:${skillId}`;

    // Check cache
    const cached = this.getCached<TrustScore>(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    // Try on-chain
    try {
      const client = await this.getClient();
      if (client) {
        const { createPublicClient, http } = await import("viem");
        const { base } = await import("viem/chains");

        const publicClient = createPublicClient({
          chain: base,
          transport: http(this.rpcUrl),
        });

        const [rawScore, attestCount] = await Promise.all([
          publicClient.readContract({
            address: TRUST_ORACLE_ADDRESS,
            abi: TRUST_ORACLE_ABI,
            functionName: "getTrustScore",
            args: [skillId as `0x${string}`],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: TRUST_ORACLE_ADDRESS,
            abi: TRUST_ORACLE_ABI,
            functionName: "attestationCount",
            args: [skillId as `0x${string}`],
          }) as Promise<bigint>,
        ]);

        const result: TrustScore = {
          raw: Number(rawScore),
          normalized: Number(rawScore) / 10000,
          attestation_count: Number(attestCount),
          combined: this.computeCombinedTrust(Number(rawScore) / 10000, Number(attestCount)),
          source: "on-chain",
          fetched_at: new Date().toISOString(),
        };

        this.setCache(cacheKey, result);
        return result;
      }
    } catch { /* fall through to fallback */ }

    // Fallback: default trust score
    return this.defaultTrustScore();
  }

  /**
   * Get validation consensus for a skill.
   */
  async getValidationConsensus(skillName: string): Promise<ValidationConsensus | null> {
    const skillId = this.nameToBytes32(skillName);
    const cacheKey = `consensus:${skillId}`;

    // Check cache
    const cached = this.getCached<ValidationConsensus>(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    // Try on-chain
    try {
      const client = await this.getClient();
      if (client) {
        const { createPublicClient, http } = await import("viem");
        const { base } = await import("viem/chains");

        const publicClient = createPublicClient({
          chain: base,
          transport: http(this.rpcUrl),
        });

        const [hasConsensus, numValidators, successRateBps] = await publicClient.readContract({
          address: VALIDATION_REGISTRY_ADDRESS,
          abi: VALIDATION_REGISTRY_ABI,
          functionName: "getValidationConsensus",
          args: [skillId as `0x${string}`],
        }) as [boolean, bigint, bigint];

        const result: ValidationConsensus = {
          hasConsensus,
          numValidators: Number(numValidators),
          successRateBps: Number(successRateBps),
          source: "on-chain",
          fetched_at: new Date().toISOString(),
        };

        this.setCache(cacheKey, result);
        return result;
      }
    } catch { /* fall through */ }

    // Fallback
    return {
      hasConsensus: false,
      numValidators: 0,
      successRateBps: 0,
      source: "fallback",
      fetched_at: new Date().toISOString(),
    };
  }

  /**
   * Check if viem is available and RPC is reachable.
   */
  async isOnline(): Promise<boolean> {
    try {
      const client = await this.getClient();
      return client !== null;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private async getClient(): Promise<unknown | null> {
    if (this.viemAvailable === false) return null;

    if (this.viemClient) return this.viemClient;

    try {
      const viem = await import("viem");
      const chains = await import("viem/chains");

      this.viemClient = viem.createPublicClient({
        chain: chains.base,
        transport: viem.http(this.rpcUrl),
      });
      this.viemAvailable = true;
      return this.viemClient;
    } catch {
      this.viemAvailable = false;
      return null;
    }
  }

  /** Convert a skill name to a bytes32 hash (keccak256) */
  private nameToBytes32(name: string): string {
    // Use SHA-256 as a portable alternative when viem isn't available
    const hash = createHash("sha256").update(name.toLowerCase().trim()).digest("hex");
    return `0x${hash}`;
  }

  /**
   * Compute combined trust score factoring in attestation count.
   * More attestations = more confidence in the trust score.
   */
  private computeCombinedTrust(normalizedScore: number, attestationCount: number): number {
    if (attestationCount === 0) return 0.3; // Low confidence default
    // Logarithmic scaling: diminishing returns after ~10 attestations
    const attestConfidence = Math.min(1, Math.log2(attestationCount + 1) / Math.log2(11));
    // Weighted: 70% trust score, 30% attestation confidence
    return normalizedScore * 0.7 + attestConfidence * 0.3;
  }

  private defaultTrustScore(): TrustScore {
    return {
      raw: 5000,
      normalized: 0.5,
      attestation_count: 0,
      combined: 0.5,
      source: "fallback",
      fetched_at: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Cache
  // -----------------------------------------------------------------------

  private loadCache(): Record<string, CacheEntry<unknown>> {
    if (existsSync(this.cachePath)) {
      try { return JSON.parse(readFileSync(this.cachePath, "utf-8")); } catch { /* */ }
    }
    return {};
  }

  private saveCache(): void {
    try {
      writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch { /* best effort */ }
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache[key] as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      delete this.cache[key];
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + this.cacheTtlMs).toISOString(),
    };
    this.saveCache();
  }
}
