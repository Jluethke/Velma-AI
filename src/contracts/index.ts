export { TrustOracleABI } from './TrustOracle';
export { SkillRegistryABI } from './SkillRegistry';
export { MarketplaceABI } from './Marketplace';
export { NodeRegistryABI } from './NodeRegistry';
export { GovernanceDAOABI } from './GovernanceDAO';
export { LifeRewardsABI } from './LifeRewards';
export { StakingABI } from './Staking';
export { ValidationRegistryABI } from './ValidationRegistry';
export { SkillTokenABI } from './SkillToken';

/**
 * Contract addresses — placeholder until deployment.
 * Replace with real addresses after deploying to Base Sepolia.
 */
export const CONTRACTS = {
  TrustToken:         '0x0000000000000000000000000000000000000001' as `0x${string}`,
  TrustOracle:        '0x0000000000000000000000000000000000000002' as `0x${string}`,
  SkillRegistry:      '0x0000000000000000000000000000000000000003' as `0x${string}`,
  Marketplace:        '0x0000000000000000000000000000000000000004' as `0x${string}`,
  NodeRegistry:       '0x0000000000000000000000000000000000000005' as `0x${string}`,
  GovernanceDAO:      '0x0000000000000000000000000000000000000006' as `0x${string}`,
  LifeRewards:        '0x0000000000000000000000000000000000000007' as `0x${string}`,
  Staking:            '0x0000000000000000000000000000000000000008' as `0x${string}`,
  ValidationRegistry: '0x0000000000000000000000000000000000000009' as `0x${string}`,
} as const;

/** Base Sepolia chain ID */
export const TARGET_CHAIN_ID = 84532;
