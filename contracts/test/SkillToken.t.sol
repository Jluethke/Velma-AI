// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillToken.sol";

contract SkillTokenTest is Test {
    SkillToken public token;

    address admin = address(0xA);
    address wayfinder = address(0xB);
    address treasury = address(0xC);
    address user1 = address(0xD);

    function setUp() public {
        vm.prank(admin);
        token = new SkillToken(admin, wayfinder, treasury);
    }

    // ── Supply & Allocations ───────────────────────────────────────────

    function test_InitialSupply() public view {
        // 20% treasury + 15% held by contract for vesting = 35% of 1B
        uint256 treasuryAmount = (1_000_000_000 * 1e18 * 20) / 100;
        uint256 wayfinderAmount = (1_000_000_000 * 1e18 * 15) / 100;

        assertEq(token.balanceOf(treasury), treasuryAmount);
        assertEq(token.balanceOf(address(token)), wayfinderAmount);
        assertEq(token.totalSupply(), treasuryAmount + wayfinderAmount);
    }

    function test_MaxSupply() public view {
        assertEq(token.MAX_SUPPLY(), 1_000_000_000 * 1e18);
    }

    function test_NameAndSymbol() public view {
        assertEq(token.name(), "SkillChain Trust Token");
        assertEq(token.symbol(), "TRUST");
    }

    // ── Minting ────────────────────────────────────────────────────────

    function test_MintByAuthorized() public {
        vm.prank(admin);
        token.mint(user1, 1000 * 1e18);
        assertEq(token.balanceOf(user1), 1000 * 1e18);
    }

    function test_MintRevertUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user1, 1000 * 1e18);
    }

    function test_MintRevertCapExceeded() public {
        uint256 maxSupply = token.MAX_SUPPLY();
        vm.prank(admin);
        vm.expectRevert("SkillToken: cap exceeded");
        token.mint(user1, maxSupply); // already minted 35%
    }

    // ── Burning ────────────────────────────────────────────────────────

    function test_Burn() public {
        vm.prank(admin);
        token.mint(user1, 1000 * 1e18);

        vm.prank(user1);
        token.burn(400 * 1e18);
        assertEq(token.balanceOf(user1), 600 * 1e18);
    }

    // ── Vesting ────────────────────────────────────────────────────────

    function test_VestingBeforeCliff() public {
        // Before 1 year cliff, nothing claimable
        vm.warp(block.timestamp + 364 days);
        assertEq(token.claimableVested(wayfinder), 0);
    }

    function test_VestingAfterCliff() public {
        // After 1 year, ~25% of vesting should be available (1/4 of 4yr)
        vm.warp(block.timestamp + 365 days);
        uint256 claimable = token.claimableVested(wayfinder);
        uint256 total = (1_000_000_000 * 1e18 * 15) / 100;
        uint256 expected = (total * 365 days) / (4 * 365 days);
        assertApproxEqAbs(claimable, expected, 1e18);
    }

    function test_VestingFullyVested() public {
        uint256 total = (1_000_000_000 * 1e18 * 15) / 100;
        vm.warp(block.timestamp + 4 * 365 days);
        assertEq(token.claimableVested(wayfinder), total);
    }

    function test_ClaimVested() public {
        vm.warp(block.timestamp + 2 * 365 days);
        uint256 claimable = token.claimableVested(wayfinder);
        assertTrue(claimable > 0);

        vm.prank(wayfinder);
        token.claimVested();
        assertEq(token.balanceOf(wayfinder), claimable);
        assertEq(token.claimableVested(wayfinder), 0);
    }

    function test_ClaimVestedRevertNoVesting() public {
        vm.prank(user1);
        vm.expectRevert("SkillToken: no vesting");
        token.claimVested();
    }

    // ── Access Control ─────────────────────────────────────────────────

    function test_GrantMinterRole() public {
        bytes32 minterRole = token.MINTER_ROLE();
        vm.prank(admin);
        token.grantRole(minterRole, user1);

        vm.prank(user1);
        token.mint(user1, 100 * 1e18);
        assertEq(token.balanceOf(user1), 100 * 1e18);
    }

    // ── Constructor validation ─────────────────────────────────────────

    function test_ConstructorRevertZeroAdmin() public {
        vm.expectRevert("SkillToken: zero admin");
        new SkillToken(address(0), wayfinder, treasury);
    }

    function test_ConstructorRevertZeroWayfinder() public {
        vm.expectRevert("SkillToken: zero wayfinder");
        new SkillToken(admin, address(0), treasury);
    }

    function test_ConstructorRevertZeroTreasury() public {
        vm.expectRevert("SkillToken: zero treasury");
        new SkillToken(admin, wayfinder, address(0));
    }
}
