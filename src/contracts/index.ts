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
 * Contract addresses — deployed to Base Sepolia (chain ID 84532).
 * Deployed 2026-04-06 via forge script.
 */
export const CONTRACTS = {
  TrustToken:         '0xd7413F4B59173fA6F8e7Fb583001Dae0dbC497c8' as `0x${string}`,
  TrustOracle:        '0x0909645Fb7a98594836279d08c45C5b4f946c2A4' as `0x${string}`,
  SkillRegistry:      '0x43DA32DCD5ECfDd64801e1291E585338c8067AE5' as `0x${string}`,
  Marketplace:        '0x74F0117cEeC2d7b0EB08CC59936532eF0C01912A' as `0x${string}`,
  NodeRegistry:       '0x7407B872ac3D66Cfed48C96474a752DD9ee374F9' as `0x${string}`,
  GovernanceDAO:      '0x1fF5aE129202eAAeD9a055A28f16803124bCadCd' as `0x${string}`,
  LifeRewards:        '0xa6634ee2246F403D339354D09F1b85Bc6f9DF54d' as `0x${string}`,
  Staking:            '0x426eC6FC7a6f4d675d2e8c052d413A0838A92824' as `0x${string}`,
  ValidationRegistry: '0xD02253F2a4060F5C53ad58769f2bcd3E49814A7A' as `0x${string}`,
} as const;

/** Base Sepolia chain ID */
export const TARGET_CHAIN_ID = 84532;
