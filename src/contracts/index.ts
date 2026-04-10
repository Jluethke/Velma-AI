export { TrustOracleABI } from './TrustOracle';
export { SkillRegistryABI } from './SkillRegistry';
export { MarketplaceABI } from './Marketplace';
export { NodeRegistryABI } from './NodeRegistry';
export { GovernanceDAOABI } from './GovernanceDAO';
export { LifeRewardsABI } from './LifeRewards';
export { StakingABI } from './Staking';
export { ValidationRegistryABI } from './ValidationRegistry';
export { TrustTokenABI } from './TrustToken';

/**
 * Contract addresses — deployed to Base Mainnet (chain ID 8453).
 * Deployed 2026-04-06 via forge script.
 */
export const CONTRACTS = {
  TrustToken:         '0x61d6a2Ce3D89B509eD1Cf2323B609512584De247' as `0x${string}`,
  TrustOracle:        '0x8AcD34480432f2472536062A01462b188b310140' as `0x${string}`,
  SkillRegistry:      '0x45f1aaA8834f03BAd40f0eE73236D1A5C07d22F5' as `0x${string}`,
  Marketplace:        '0x679B5CD7C2CdF504768cf31163aB6dFB4bF3fd48' as `0x${string}`,
  NodeRegistry:       '0xd869d3110BE9a711597Cc7AA505a6ddFc0a90196' as `0x${string}`,
  GovernanceDAO:      '0x031360865ED0C521487A9aa8F8BE2958C41a33BF' as `0x${string}`,
  LifeRewards:        '0xb793b8B0b23359EAe7BAf534da7aE54ba3c9d12d' as `0x${string}`,
  Staking:            '0x8eF891BDD235cb6a5B558bF5ee9abbBc20841658' as `0x${string}`,
  ValidationRegistry: '0x59645dc6eCE206703e4c56aF9D461cD6d0F9653C' as `0x${string}`,
  OnboardingRewards:  '0x881F2eFB238F1eB29C2D06bb3e6b89eC2c27146e' as `0x${string}`,
} as const;

/** Base Mainnet chain ID */
export const TARGET_CHAIN_ID = 8453;
