// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TrustToken.sol";
import "../src/NodeRegistry.sol";
import "../src/SkillRegistry.sol";
import "../src/PriceOracle.sol";
import "../src/Marketplace.sol";
import "../src/CommunityPool.sol";

contract MarketplaceTest is Test {
    TrustToken public token;
    NodeRegistry public nodeReg;
    SkillRegistry public skillReg;
    CommunityPool public communityPool;
    Marketplace public marketplace;

    address admin    = address(0xA);
    address creator  = address(0xB);
    address buyer    = address(0xC);
    address treasury = address(0xD);
    address recorder = address(0xE); // MCP server wallet

    bytes32 premiumSkillId; // price = 1000 TRUST
    bytes32 freeSkillId;    // price = 0

    function setUp() public {
        vm.startPrank(admin);
        token        = new TrustToken(admin, admin, treasury);
        nodeReg      = new NodeRegistry(address(token));
        skillReg     = new SkillRegistry();
        communityPool = new CommunityPool(address(token));
        PriceOracle priceOracle = new PriceOracle(admin, 1e16); // $0.01/TRUST
        marketplace  = new Marketplace(
            address(token), address(skillReg), address(nodeReg), treasury, address(communityPool), address(priceOracle)
        );

        // Grant Marketplace the DEPOSITOR_ROLE so it can fund the pool
        communityPool.grantRole(communityPool.DEPOSITOR_ROLE(), address(marketplace));

        // Grant RECORDER_ROLE to the mock MCP server wallet
        marketplace.grantRole(marketplace.RECORDER_ROLE(), recorder);

        token.mint(creator, 10_000 * 1e18);
        token.mint(buyer,   10_000 * 1e18);
        vm.stopPrank();

        string[] memory tags    = new string[](1); tags[0]    = "test";
        string[] memory inputs  = new string[](1); inputs[0]  = "input";
        string[] memory outputs = new string[](1); outputs[0] = "output";

        vm.startPrank(creator);
        // Premium flow — 1000 TRUST to purchase
        premiumSkillId = skillReg.registerSkill(
            "QmPremiumSkill", "PremiumFlow", "test", tags, inputs, outputs,
            1000 * 1e18, SkillRegistry.LicenseType.COMMERCIAL
        );
        // Free flow — 0 TRUST, open license
        freeSkillId = skillReg.registerSkill(
            "QmFreeSkill", "FreeFlow", "test", tags, inputs, outputs,
            0, SkillRegistry.LicenseType.OPEN
        );
        vm.stopPrank();
    }

    // ── Premium Purchases ──────────────────────────────────────────────

    function test_PurchasePremiumSkill() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();

        assertTrue(marketplace.hasPurchased(buyer, premiumSkillId));
    }

    function test_PurchaseFeeSplit() public {
        uint256 price = 1000 * 1e18;
        uint256 treasuryBefore = token.balanceOf(treasury);
        uint256 supplyBefore   = token.totalSupply();

        vm.startPrank(buyer);
        token.approve(address(marketplace), price);
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();

        // Treasury: 10%
        uint256 treasuryShare = (price * 1000) / 10000;
        assertEq(token.balanceOf(treasury) - treasuryBefore, treasuryShare);

        // Burned: 5%
        uint256 burnAmount = price - (price * 7000 / 10000) - (price * 1500 / 10000) - treasuryShare;
        assertEq(supplyBefore - token.totalSupply(), burnAmount);

        // Creator royalties: 70%
        assertEq(marketplace.creatorRoyalties(premiumSkillId), (price * 7000) / 10000);
    }

    function test_PurchaseDuplicateReverts() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 2000 * 1e18);
        marketplace.purchaseSkill(premiumSkillId);

        vm.expectRevert("Marketplace: already purchased");
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();
    }

    function test_PurchaseFreeSkillReverts() public {
        // Free skills cannot be purchased — they're accessed via recordUsage
        vm.prank(buyer);
        vm.expectRevert("Marketplace: flow is free, use recordUsage");
        marketplace.purchaseSkill(freeSkillId);
    }

    function test_PurchaseDoesNotConsumeQuota() public {
        // Purchasing a premium flow should NOT consume daily free-flow quota
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();

        // After purchase, buyer still has full 5/day quota for free flows
        (,,,uint256 remaining) = marketplace.checkAccess(buyer, freeSkillId);
        assertEq(remaining, 5);
    }

    // ── checkAccess ────────────────────────────────────────────────────

    function test_CheckAccessPremiumPurchased() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();

        (bool canAccess, bool isPremium, bool isPurchased,) = marketplace.checkAccess(buyer, premiumSkillId);
        assertTrue(canAccess);
        assertTrue(isPremium);
        assertTrue(isPurchased);
    }

    function test_CheckAccessPremiumNotPurchased() public {
        (bool canAccess, bool isPremium, bool isPurchased,) = marketplace.checkAccess(buyer, premiumSkillId);
        assertFalse(canAccess);
        assertTrue(isPremium);
        assertFalse(isPurchased);
    }

    function test_CheckAccessFreeSkill() public {
        (bool canAccess, bool isPremium,, uint256 remaining) = marketplace.checkAccess(buyer, freeSkillId);
        assertTrue(canAccess);
        assertFalse(isPremium);
        assertEq(remaining, 5); // Explorer: 5/day
    }

    // ── Free Flow Usage / Daily Limit ──────────────────────────────────

    function test_RecordUsageDecrementsQuota() public {
        vm.prank(recorder);
        marketplace.recordUsage(buyer, freeSkillId);

        (,,, uint256 remaining) = marketplace.checkAccess(buyer, freeSkillId);
        assertEq(remaining, 4);
    }

    function test_DailyLimitEnforced() public {
        // Use up all 5 Explorer slots
        vm.startPrank(recorder);
        for (uint256 i = 0; i < 5; i++) {
            marketplace.recordUsage(buyer, freeSkillId);
        }

        // 6th should revert
        vm.expectRevert("Marketplace: daily limit reached");
        marketplace.recordUsage(buyer, freeSkillId);
        vm.stopPrank();
    }

    function test_DailyLimitResetsNextDay() public {
        vm.startPrank(recorder);
        for (uint256 i = 0; i < 5; i++) {
            marketplace.recordUsage(buyer, freeSkillId);
        }
        vm.stopPrank();

        // Warp to next day
        vm.warp(block.timestamp + 1 days);

        // Should be able to use again
        vm.prank(recorder);
        marketplace.recordUsage(buyer, freeSkillId);

        (,,, uint256 remaining) = marketplace.checkAccess(buyer, freeSkillId);
        assertEq(remaining, 4);
    }

    function test_RecordUsageRequiresRecorderRole() public {
        vm.prank(buyer);
        vm.expectRevert();
        marketplace.recordUsage(buyer, freeSkillId);
    }

    function test_PurchasedPremiumSkipsDailyCount() public {
        // After purchasing a premium skill, recordUsage is a no-op (no daily decrement)
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();

        vm.prank(recorder);
        marketplace.recordUsage(buyer, premiumSkillId); // should not revert, should not count

        // Free flow quota still untouched
        (,,, uint256 remaining) = marketplace.checkAccess(buyer, freeSkillId);
        assertEq(remaining, 5);
    }

    // ── Subscriptions ──────────────────────────────────────────────────

    function test_SubscribeBuilder() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 50 * 1e18);
        marketplace.subscribe(Marketplace.SubscriptionTier.BUILDER);
        vm.stopPrank();

        (Marketplace.SubscriptionTier tier, uint256 expiresAt,,) = marketplace.subscriptions(buyer);
        assertEq(uint8(tier), uint8(Marketplace.SubscriptionTier.BUILDER));
        assertEq(expiresAt, block.timestamp + 30 days);
    }

    function test_BuilderHas50PerDayQuota() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 50 * 1e18);
        marketplace.subscribe(Marketplace.SubscriptionTier.BUILDER);
        vm.stopPrank();

        (,,, uint256 remaining) = marketplace.checkAccess(buyer, freeSkillId);
        assertEq(remaining, 50);
    }

    function test_SubscribeExplorerFree() public {
        vm.prank(buyer);
        marketplace.subscribe(Marketplace.SubscriptionTier.EXPLORER);

        (Marketplace.SubscriptionTier tier,,,) = marketplace.subscriptions(buyer);
        assertEq(uint8(tier), uint8(Marketplace.SubscriptionTier.EXPLORER));
    }

    // ── Royalty Claims ─────────────────────────────────────────────────

    function test_ClaimRoyalties() public {
        vm.startPrank(buyer);
        token.approve(address(marketplace), 1000 * 1e18);
        marketplace.purchaseSkill(premiumSkillId);
        vm.stopPrank();

        uint256 creatorBefore = token.balanceOf(creator);
        vm.prank(creator);
        marketplace.claimRoyalties(premiumSkillId);

        assertEq(token.balanceOf(creator) - creatorBefore, (1000 * 1e18 * 7000) / 10000);
    }

    function test_ClaimRoyaltiesNotCreator() public {
        vm.prank(buyer);
        vm.expectRevert("Marketplace: not creator");
        marketplace.claimRoyalties(premiumSkillId);
    }

    // ── Admin ──────────────────────────────────────────────────────────

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
