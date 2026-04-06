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
 * Contract addresses — deployed to Base Mainnet (chain ID 8453).
 * Deployed 2026-04-06 via forge script.
 */
export const CONTRACTS = {
  TrustToken:         '0xAd96F3d1d6F6622f35baAcF72134765Da3C562be' as `0x${string}`,
  TrustOracle:        '0x5e3b7016FE47eb6Dbdc276104494e55d540173e3' as `0x${string}`,
  SkillRegistry:      '0x3B400Abeb3385aB5401D0076488c74AA5550f09D' as `0x${string}`,
  Marketplace:        '0xaCFDBF10009Bad15840b7FfBf59B61D3A234aB6B' as `0x${string}`,
  NodeRegistry:       '0x1EC05D141873eF47B46DEa8A30ae773E5630A3BE' as `0x${string}`,
  GovernanceDAO:      '0xF8c6ef013B7e02806C0BeE0619797c929E8741A0' as `0x${string}`,
  LifeRewards:        '0x1e436599C869Ab91161c08d7095C2e9E51dA93D0' as `0x${string}`,
  Staking:            '0x02e6157d73Fe895cde4c5D2649fFfD2E93011894' as `0x${string}`,
  ValidationRegistry: '0x4794204ADedC2390e387d02df3906FC3C768f73A' as `0x${string}`,
} as const;

/** Base Mainnet chain ID */
export const TARGET_CHAIN_ID = 8453;
