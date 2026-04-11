// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TrustToken.sol";
import "../src/NodeRegistry.sol";
import "../src/SkillRegistry.sol";
import "../src/TrustOracle.sol";
import "../src/ValidationRegistry.sol";
import "../src/Marketplace.sol";
import "../src/Staking.sol";
import "../src/GovernanceDAO.sol";
import "../src/LifeRewards.sol";
import "../src/OnboardingRewards.sol";
import "../src/CommunityPool.sol";

/**
 * @title Deploy
 * @notice Deploys all FlowFabric contracts and wires cross-references.
 * @dev Target: Base Mainnet. Run with:
 *      forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        vm.startBroadcast(deployerPk);

        // 1. SkillToken — ERC-20 with vesting
        //    deployer = admin, wayfinder = deployer for now, treasury = deployer
        TrustToken token = new TrustToken(deployer, deployer, deployer);

        // 2. NodeRegistry — requires TRUST token for staking
        NodeRegistry nodeReg = new NodeRegistry(address(token));

        // 3. SkillRegistry — skill metadata
        SkillRegistry skillReg = new SkillRegistry();

        // 4. TrustOracle — attestation aggregation
        TrustOracle oracle = new TrustOracle(address(nodeReg));

        // 5. ValidationRegistry — shadow validation + disputes
        ValidationRegistry valReg = new ValidationRegistry(
            address(nodeReg),
            address(skillReg)
        );

        // 6. Staking — validator staking with tiers and slashing
        Staking staking = new Staking(address(token), address(nodeReg));

        // 7a. CommunityPool — purchase premium → earner yield
        CommunityPool communityPool = new CommunityPool(address(token));

        // 7b. Marketplace — purchases, royalties, subscriptions
        Marketplace marketplace = new Marketplace(
            address(token),
            address(skillReg),
            address(nodeReg),
            deployer, // treasury
            address(communityPool)
        );

        // Grant Marketplace the DEPOSITOR_ROLE so it can deposit into the pool,
        // and EARNER_ROLE so it can register creator + validator earned weights.
        communityPool.grantRole(communityPool.DEPOSITOR_ROLE(), address(marketplace));
        communityPool.grantRole(communityPool.EARNER_ROLE(), address(marketplace));

        // 8. GovernanceDAO — trust-weighted governance
        GovernanceDAO dao = new GovernanceDAO(
            address(staking),
            address(oracle),
            address(nodeReg)
        );

        // ── Wire cross-references ──────────────────────────────────────

        // Grant SLASHER_ROLE to ValidationRegistry and GovernanceDAO
        staking.grantRole(staking.SLASHER_ROLE(), address(valReg));
        staking.grantRole(staking.SLASHER_ROLE(), address(dao));

        // Set staking contract on ValidationRegistry
        valReg.setStakingContract(address(staking));

        // Transfer SkillRegistry ownership to ValidationRegistry
        // so it can call updateStats()
        skillReg.transferOwnership(address(valReg));

        // Grant MINTER_ROLE to Staking for potential reward minting
        token.grantRole(token.MINTER_ROLE(), address(staking));

        // 9. LifeRewards — daily activity + streaks
        LifeRewards lifeRewards = new LifeRewards(
            address(token),
            address(oracle),
            address(nodeReg),
            100_000 * 1e18 // 100K TRUST daily emission cap
        );

        // Grant MINTER_ROLE to LifeRewards for minting Life Protocol rewards
        token.grantRole(token.MINTER_ROLE(), address(lifeRewards));

        // 10. OnboardingRewards — starter tokens + milestone bonuses
        OnboardingRewards onboarding = new OnboardingRewards(
            address(token),
            address(nodeReg),
            address(skillReg),
            address(valReg),
            address(marketplace),
            address(lifeRewards)
        );

        // Fund onboarding pool with 10M TRUST (1% of supply) from deployer/treasury
        token.mint(deployer, 10_000_000 * 1e18);
        token.approve(address(onboarding), 10_000_000 * 1e18);
        onboarding.fundPool(10_000_000 * 1e18);

        // Grant RECORDER_ROLE to deployer so the MCP server wallet can be added later
        // via marketplace.grantRole(RECORDER_ROLE, mcpServerAddress)
        marketplace.grantRole(marketplace.RECORDER_ROLE(), deployer);

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("TrustToken:         ", address(token));
        console.log("NodeRegistry:       ", address(nodeReg));
        console.log("SkillRegistry:      ", address(skillReg));
        console.log("TrustOracle:        ", address(oracle));
        console.log("ValidationRegistry: ", address(valReg));
        console.log("Staking:            ", address(staking));
        console.log("Marketplace:        ", address(marketplace));
        console.log("GovernanceDAO:      ", address(dao));
        console.log("LifeRewards:        ", address(lifeRewards));
        console.log("OnboardingRewards:  ", address(onboarding));
        console.log("CommunityPool:      ", address(communityPool));
    }
}
