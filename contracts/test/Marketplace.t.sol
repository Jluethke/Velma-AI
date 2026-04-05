// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillToken.sol";
import "../src/NodeRegistry.sol";
import "../src/SkillRegistry.sol";
import "../src/Marketplace.sol";

contract MarketplaceTest is Test {
    SkillToken public token;
    NodeRegistry public nodeReg;
    SkillRegistry public skillReg;
    Marketplace public marketplace;

    address admin = address(0xA);
    address creator = address(0xB);
    address buyer = address(0xC);
    address treasury = address(0xD);

    bytes32 skillId;

    function setUp() public {
        vm.startPrank(admin);
        token = new SkillToken(admin, admin, treasury);
        nodeReg = new NodeRegistry(address(token));
        skillReg = new SkillRegistry();
        marketplace = new Marketplace(
            address(token), address(skillReg), address(nodeReg), treasury
        );

        // Fund users
        token.mint(creator, 10000 * 1e18);
        token.mint(buyer, 10000 * 1e18);
        vm.stopPrank();

        // Register a skill
        string[] memory tags = new string[](1);
        tags[0] = "test";
        string[] memory inputs = new string[](1);
        inputs[0] = "input";
        string[] memory outputs = new string[](1);
        outputs[0] = "output";

        vm.prank(creator);
        skillId = skillReg.registerSkill(
            "QmMarketSkill", "MarketSkill", "test", tags, inputs, outputs,
            1000 * 1e18, SkillRegistry.LicenseType.COMMERCIAL
        );
    }

    // ── Purchases ──────────────────────────────────────────────────────

    function test_PurchaseSkill() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(skillId);
        vm.stopPrank();

        assertTrue(marketplace.hasPurchased(buyer, skillId));
    }

    function test_PurchaseFeeSplit() public {
        uint256 price = 1000 * 1e18;
        uint256 treasuryBefore = token.balanceOf(treasury);
        uint256 supplyBefore = token.totalSupply();

        vm.startPrank(buyer);
        token.approve(address(marketplace), price);
        marketplace.purchaseSkill(skillId);
        vm.stopPrank();

        // Treasury should get 10%
        uint256 treasuryShare = (price * 1000) / 10000;
        assertEq(token.balanceOf(treasury) - treasuryBefore, treasuryShare);

        // 5% should be burned
        uint256 burnAmount = price - (price * 7000 / 10000) - (price * 1500 / 10000) - treasuryShare;
        assertEq(supplyBefore - token.totalSupply(), burnAmount);

        // Creator royalties accrued
        uint256 creatorShare = (price * 7000) / 10000;
        assertEq(marketplace.creatorRoyalties(skillId), creatorShare);
    }

    function test_PurchaseDuplicateReverts() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 2000 * 1e18);
        marketplace.purchaseSkill(skillId);

        vm.expectRevert("Marketplace: already purchased");
        marketplace.purchaseSkill(skillId);
        vm.stopPrank();
    }

    // ── Royalty Claims ─────────────────────────────────────────────────

    function test_ClaimRoyalties() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(skillId);
        vm.stopPrank();

        uint256 creatorBefore = token.balanceOf(creator);
        vm.prank(creator);
        marketplace.claimRoyalties(skillId);

        uint256 creatorShare = (1000 * 1e18 * 7000) / 10000;
        assertEq(token.balanceOf(creator) - creatorBefore, creatorShare);
    }

    function test_ClaimRoyaltiesNotCreator() public {
        vm.prank(buyer);
        vm.expectRevert("Marketplace: not creator");
        marketplace.claimRoyalties(skillId);
    }

    // ── Subscriptions ──────────────────────────────────────────────────

    function test_SubscribeBuilder() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 50 * 1e18);
        marketplace.subscribe(Marketplace.SubscriptionTier.BUILDER);
        vm.stopPrank();

        (Marketplace.SubscriptionTier tier, uint256 expiresAt, ,) = marketplace.subscriptions(buyer);
        assertEq(uint8(tier), uint8(Marketplace.SubscriptionTier.BUILDER));
        assertEq(expiresAt, block.timestamp + 30 days);
    }

    function test_SubscribeExplorerFree() public {
        vm.prank(buyer);
        marketplace.subscribe(Marketplace.SubscriptionTier.EXPLORER);

        (Marketplace.SubscriptionTier tier, , ,) = marketplace.subscriptions(buyer);
        assertEq(uint8(tier), uint8(Marketplace.SubscriptionTier.EXPLORER));
    }

    // ── Access Control ─────────────────────────────────────────────────

    function test_CheckAccessPurchased() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(skillId);
        vm.stopPrank();

        assertTrue(marketplace.checkAccess(buyer, skillId));
    }

    function test_DailyLimitEnforced() public {
        // Explorer tier: 5/day limit
        // Purchase 5 different skills to hit limit
        for (uint256 i = 0; i < 5; i++) {
            string memory cid = string(abi.encodePacked("QmLimit", vm.toString(i)));
            string[] memory tags = new string[](0);
            string[] memory inputs = new string[](0);
            string[] memory outputs = new string[](0);

            vm.prank(creator);
            bytes32 sid = skillReg.registerSkill(
                cid, "Skill", "test", tags, inputs, outputs,
                10 * 1e18, SkillRegistry.LicenseType.OPEN
            );

            vm.startPrank(buyer);
            token.approve(address(marketplace), 10 * 1e18);
            marketplace.purchaseSkill(sid);
            vm.stopPrank();
        }

        // 6th purchase should fail due to daily limit
        string[] memory tags2 = new string[](0);
        string[] memory inputs2 = new string[](0);
        string[] memory outputs2 = new string[](0);

        vm.prank(creator);
        bytes32 sid6 = skillReg.registerSkill(
            "QmLimit6", "Skill6", "test", tags2, inputs2, outputs2,
            10 * 1e18, SkillRegistry.LicenseType.OPEN
        );

        vm.startPrank(buyer);
        token.approve(address(marketplace), 10 * 1e18);
        vm.expectRevert("Marketplace: daily limit");
        marketplace.purchaseSkill(sid6);
        vm.stopPrank();
    }

    // ── Treasury ───────────────────────────────────────────────────────

    function test_SetTreasury() public {
        address newTreasury = address(0xF);
        vm.prank(admin);
        marketplace.setTreasury(newTreasury);
        assertEq(marketplace.treasury(), newTreasury);
    }

    function test_SetTreasuryZeroReverts() public {
        vm.prank(admin);
        vm.expectRevert("Marketplace: zero treasury");
        marketplace.setTreasury(address(0));
    }
}
