// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillToken.sol";
import "../src/NodeRegistry.sol";
import "../src/Staking.sol";

contract StakingTest is Test {
    SkillToken public token;
    NodeRegistry public nodeReg;
    Staking public staking;

    address admin = address(0xA);
    address node1Owner = address(0x1);
    address slasher = address(0x5);
    address affected = address(0x6);

    bytes32 nodeId1 = keccak256("node1");

    function setUp() public {
        vm.startPrank(admin);
        token = new SkillToken(admin, admin, admin);
        nodeReg = new NodeRegistry(address(token));
        staking = new Staking(address(token), address(nodeReg));

        // Fund and register node
        token.mint(node1Owner, 200_000 * 1e18);
        token.mint(slasher, 1000 * 1e18);

        // Grant slasher role
        staking.grantRole(staking.SLASHER_ROLE(), slasher);
        vm.stopPrank();

        _registerNode(node1Owner, nodeId1);
    }

    function _registerNode(address owner, bytes32 nodeId) internal {
        vm.startPrank(owner);
        token.approve(address(nodeReg), 100 * 1e18);
        string[] memory tags = new string[](1);
        tags[0] = "test";
        nodeReg.registerNode(nodeId, bytes("pubkey"), tags);
        vm.stopPrank();
    }

    // ── Staking ────────────────────────────────────────────────────────

    function test_Stake() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 5000 * 1e18);
        staking.stake(nodeId1, 5000 * 1e18);
        vm.stopPrank();

        assertEq(staking.stakedAmount(nodeId1), 5000 * 1e18);
        assertEq(uint8(staking.getTier(nodeId1)), uint8(Staking.StakeTier.SILVER));
    }

    function test_StakeTiers() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 100_000 * 1e18);

        staking.stake(nodeId1, 1000 * 1e18);
        assertEq(uint8(staking.getTier(nodeId1)), uint8(Staking.StakeTier.BRONZE));

        staking.stake(nodeId1, 4000 * 1e18);
        assertEq(uint8(staking.getTier(nodeId1)), uint8(Staking.StakeTier.SILVER));

        staking.stake(nodeId1, 20000 * 1e18);
        assertEq(uint8(staking.getTier(nodeId1)), uint8(Staking.StakeTier.GOLD));

        staking.stake(nodeId1, 75000 * 1e18);
        assertEq(uint8(staking.getTier(nodeId1)), uint8(Staking.StakeTier.PLATINUM));

        vm.stopPrank();
    }

    function test_StakeNotOwner() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert("Staking: not node owner");
        staking.stake(nodeId1, 1000 * 1e18);
    }

    // ── Unstaking ──────────────────────────────────────────────────────

    function test_UnstakeWithCooldown() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 5000 * 1e18);
        staking.stake(nodeId1, 5000 * 1e18);

        staking.unstake(nodeId1, 2000 * 1e18);

        // Cannot complete before cooldown
        vm.expectRevert("Staking: cooldown active");
        staking.completeUnstake(nodeId1);

        // Fast forward past cooldown
        vm.warp(block.timestamp + 7 days + 1);
        uint256 balBefore = token.balanceOf(node1Owner);
        staking.completeUnstake(nodeId1);

        assertEq(token.balanceOf(node1Owner) - balBefore, 2000 * 1e18);
        assertEq(staking.stakedAmount(nodeId1), 3000 * 1e18);
        vm.stopPrank();
    }

    function test_UnstakeInsufficientStake() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 1000 * 1e18);
        staking.stake(nodeId1, 1000 * 1e18);

        vm.expectRevert("Staking: insufficient stake");
        staking.unstake(nodeId1, 2000 * 1e18);
        vm.stopPrank();
    }

    // ── Slashing ───────────────────────────────────────────────────────

    function test_SlashFailedValidation() public {
        // Stake 10000 tokens
        vm.startPrank(node1Owner);
        token.approve(address(staking), 10000 * 1e18);
        staking.stake(nodeId1, 10000 * 1e18);
        vm.stopPrank();

        uint256 supplyBefore = token.totalSupply();
        uint256 affectedBefore = token.balanceOf(affected);

        // Slash 5% for failed validation
        vm.prank(slasher);
        staking.slash(nodeId1, Staking.SlashReason.FAILED_VALIDATION, affected);

        uint256 slashAmount = (10000 * 1e18 * 500) / 10000; // 500 tokens
        assertEq(staking.stakedAmount(nodeId1), 10000 * 1e18 - slashAmount);

        // 50% to affected
        uint256 halfSlash = slashAmount / 2;
        assertEq(token.balanceOf(affected) - affectedBefore, halfSlash);

        // 50% burned
        assertEq(supplyBefore - token.totalSupply(), slashAmount - halfSlash);
    }

    function test_SlashMaliciousBans() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 10000 * 1e18);
        staking.stake(nodeId1, 10000 * 1e18);
        vm.stopPrank();

        vm.prank(slasher);
        staking.slash(nodeId1, Staking.SlashReason.MALICIOUS, affected);

        assertTrue(staking.isBanned(nodeId1));
        assertEq(staking.stakedAmount(nodeId1), 0);
    }

    function test_SlashCollusion() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 10000 * 1e18);
        staking.stake(nodeId1, 10000 * 1e18);
        vm.stopPrank();

        vm.prank(slasher);
        staking.slash(nodeId1, Staking.SlashReason.COLLUSION, affected);

        // 25% slashed
        assertEq(staking.stakedAmount(nodeId1), 7500 * 1e18);
    }

    function test_SlashUnauthorized() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 1000 * 1e18);
        staking.stake(nodeId1, 1000 * 1e18);
        vm.stopPrank();

        vm.prank(address(0xDEAD));
        vm.expectRevert();
        staking.slash(nodeId1, Staking.SlashReason.DOWNTIME, affected);
    }

    // ── Reward Multiplier ──────────────────────────────────────────────

    function test_RewardMultiplier() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 25000 * 1e18);
        staking.stake(nodeId1, 25000 * 1e18);
        vm.stopPrank();

        assertEq(staking.rewardMultiplier(nodeId1), 1.5e18);
    }

    // ── Banned node cannot stake ───────────────────────────────────────

    function test_BannedCannotStake() public {
        vm.startPrank(node1Owner);
        token.approve(address(staking), 20000 * 1e18);
        staking.stake(nodeId1, 10000 * 1e18);
        vm.stopPrank();

        vm.prank(slasher);
        staking.slash(nodeId1, Staking.SlashReason.MALICIOUS, affected);

        vm.startPrank(node1Owner);
        vm.expectRevert("Staking: node banned");
        staking.stake(nodeId1, 1000 * 1e18);
        vm.stopPrank();
    }
}
