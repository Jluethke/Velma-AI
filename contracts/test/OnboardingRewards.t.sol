// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TrustToken.sol";
import "../src/NodeRegistry.sol";
import "../src/SkillRegistry.sol";
import "../src/TrustOracle.sol";
import "../src/ValidationRegistry.sol";
import "../src/PriceOracle.sol";
import "../src/Marketplace.sol";
import "../src/CommunityPool.sol";
import "../src/LifeRewards.sol";
import "../src/OnboardingRewards.sol";

contract OnboardingRewardsTest is Test {
    TrustToken public token;
    NodeRegistry public nodeReg;
    SkillRegistry public skillReg;
    TrustOracle public oracle;
    ValidationRegistry public valReg;
    CommunityPool public communityPool;
    Marketplace public marketplace;
    LifeRewards public lifeRewards;
    OnboardingRewards public onboarding;

    address admin = address(0xA);
    address user1 = address(0xB);
    address user2 = address(0xC);
    address treasury = address(0xD);

    bytes32 user1NodeId = keccak256("node-user1");
    bytes32 user2NodeId = keccak256("node-user2");

    function setUp() public {
        vm.startPrank(admin);

        token = new TrustToken(admin, admin, treasury);
        nodeReg = new NodeRegistry(address(token));
        skillReg = new SkillRegistry();
        oracle = new TrustOracle(address(nodeReg));
        valReg = new ValidationRegistry(address(nodeReg), address(skillReg));
        communityPool = new CommunityPool(address(token));
        PriceOracle priceOracle = new PriceOracle(address(this), 1e16); // $0.01/TRUST
        marketplace = new Marketplace(
            address(token), address(skillReg), address(nodeReg), treasury, address(communityPool), address(priceOracle)
        );
        communityPool.grantRole(communityPool.DEPOSITOR_ROLE(), address(marketplace));
        lifeRewards = new LifeRewards(
            address(token), address(oracle), address(nodeReg), 100_000 * 1e18
        );
        onboarding = new OnboardingRewards(
            address(token),
            address(nodeReg),
            address(skillReg),
            address(valReg),
            address(marketplace),
            address(lifeRewards)
        );

        // Fund onboarding pool with 1M TRUST
        token.mint(admin, 1_000_000 * 1e18);
        token.approve(address(onboarding), 1_000_000 * 1e18);
        onboarding.fundPool(1_000_000 * 1e18);

        // Fund users with tokens for node registration (MIN_STAKE = 100 TRUST)
        token.mint(user1, 10_000 * 1e18);
        token.mint(user2, 10_000 * 1e18);

        vm.stopPrank();

        // Register user1 as a node
        vm.startPrank(user1);
        token.approve(address(nodeReg), 100 * 1e18);
        nodeReg.registerNode(user1NodeId, hex"01", _tags());
        vm.stopPrank();
    }

    function _tags() internal pure returns (string[] memory) {
        string[] memory tags = new string[](1);
        tags[0] = "test";
        return tags;
    }

    function _inputs() internal pure returns (string[] memory) {
        string[] memory inp = new string[](1);
        inp[0] = "input";
        return inp;
    }

    function _outputs() internal pure returns (string[] memory) {
        string[] memory out = new string[](1);
        out[0] = "output";
        return out;
    }

    // ── Starter Claim ─────────────────────────────────────────────────

    function test_ClaimStarter() public {
        uint256 balBefore = token.balanceOf(user1);

        vm.prank(user1);
        onboarding.claimStarter();

        assertEq(token.balanceOf(user1) - balBefore, 10 * 1e18);
        assertTrue(onboarding.starterClaimed(user1));
    }

    function test_ClaimStarterTwiceReverts() public {
        vm.prank(user1);
        onboarding.claimStarter();

        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: starter already claimed");
        onboarding.claimStarter();
    }

    function test_ClaimStarterUnregisteredReverts() public {
        address rando = address(0xEE);
        vm.prank(rando);
        vm.expectRevert("OnboardingRewards: not registered");
        onboarding.claimStarter();
    }

    // ── First Skill Bonus ─────────────────────────────────────────────

    function test_ClaimFirstSkillBonus() public {
        // Publish a skill first
        vm.prank(user1);
        skillReg.registerSkill(
            "QmTest1", "TestSkill", "test", _tags(), _inputs(), _outputs(),
            100 * 1e18, SkillRegistry.LicenseType.OPEN
        );

        uint256 balBefore = token.balanceOf(user1);

        vm.prank(user1);
        onboarding.claimFirstSkillBonus();

        assertEq(token.balanceOf(user1) - balBefore, 50 * 1e18);
        assertTrue(onboarding.firstSkillClaimed(user1));
    }

    function test_ClaimFirstSkillBonusNoSkillsReverts() public {
        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: no skills published");
        onboarding.claimFirstSkillBonus();
    }

    function test_ClaimFirstSkillBonusTwiceReverts() public {
        vm.prank(user1);
        skillReg.registerSkill(
            "QmTest2", "TestSkill2", "test", _tags(), _inputs(), _outputs(),
            100 * 1e18, SkillRegistry.LicenseType.OPEN
        );

        vm.prank(user1);
        onboarding.claimFirstSkillBonus();

        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: first-skill already claimed");
        onboarding.claimFirstSkillBonus();
    }

    // ── First Validation Bonus ────────────────────────────────────────

    function test_ClaimFirstValidationBonus() public {
        // Need a skill to validate -- register from a different address
        // Transfer SkillRegistry ownership back to admin briefly to allow valReg to work
        // Actually, skillReg registerSkill is public, anyone can call it
        vm.prank(user2);
        // user2 not registered yet, but registerSkill doesn't require registration
        bytes32 sid = skillReg.registerSkill(
            "QmValSkill", "ValSkill", "test", _tags(), _inputs(), _outputs(),
            100 * 1e18, SkillRegistry.LicenseType.OPEN
        );

        // user1 submits a validation (they are registered)
        vm.prank(user1);
        valReg.submitValidation(sid, true, 5, 4, 8500, "QmResult");

        uint256 balBefore = token.balanceOf(user1);

        vm.prank(user1);
        onboarding.claimFirstValidationBonus();

        assertEq(token.balanceOf(user1) - balBefore, 25 * 1e18);
        assertTrue(onboarding.firstValClaimed(user1));
    }

    function test_ClaimFirstValidationBonusNoValidationsReverts() public {
        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: no validations submitted");
        onboarding.claimFirstValidationBonus();
    }

    // ── First Purchase Bonus ──────────────────────────────────────────

    function test_ClaimFirstPurchaseBonus() public {
        // Create a skill to buy
        vm.prank(user2);
        bytes32 sid = skillReg.registerSkill(
            "QmBuySkill", "BuySkill", "test", _tags(), _inputs(), _outputs(),
            100 * 1e18, SkillRegistry.LicenseType.OPEN
        );

        // user1 purchases it
        vm.startPrank(user1);
        token.approve(address(marketplace), 100 * 1e18);
        marketplace.purchaseSkill(sid);
        vm.stopPrank();

        uint256 balBefore = token.balanceOf(user1);

        vm.prank(user1);
        onboarding.claimFirstPurchaseBonus();

        assertEq(token.balanceOf(user1) - balBefore, 10 * 1e18);
        assertTrue(onboarding.firstBuyClaimed(user1));
    }

    function test_ClaimFirstPurchaseBonusNoPurchasesReverts() public {
        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: no purchases made");
        onboarding.claimFirstPurchaseBonus();
    }

    // ── Referral Bonus ────────────────────────────────────────────────

    function test_ClaimReferralBonus() public {
        // Register user2 as a node (timestamp = now)
        vm.startPrank(user2);
        token.approve(address(nodeReg), 100 * 1e18);
        nodeReg.registerNode(user2NodeId, hex"02", _tags());
        vm.stopPrank();

        uint256 user1BalBefore = token.balanceOf(user1);
        uint256 user2BalBefore = token.balanceOf(user2);

        // user2 claims referral bonus with user1 as referrer
        vm.prank(user2);
        onboarding.claimReferralBonus(user1NodeId);

        // Referrer (user1) gets 15 TRUST, new user (user2) gets 10 TRUST
        assertEq(token.balanceOf(user1) - user1BalBefore, 15 * 1e18);
        assertEq(token.balanceOf(user2) - user2BalBefore, 10 * 1e18);
        assertTrue(onboarding.referralClaimedByNewUser(user2));
        assertEq(onboarding.referralCount(user1), 1);
    }

    function test_ClaimReferralBonusSelfReferReverts() public {
        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: cannot self-refer");
        onboarding.claimReferralBonus(user1NodeId);
    }

    function test_ClaimReferralBonusTooLateReverts() public {
        // Register user2
        vm.startPrank(user2);
        token.approve(address(nodeReg), 100 * 1e18);
        nodeReg.registerNode(user2NodeId, hex"02", _tags());
        vm.stopPrank();

        // Advance time past 24h window
        vm.warp(block.timestamp + 25 hours);

        vm.prank(user2);
        vm.expectRevert("OnboardingRewards: registration too old");
        onboarding.claimReferralBonus(user1NodeId);
    }

    function test_ClaimReferralBonusTwiceReverts() public {
        vm.startPrank(user2);
        token.approve(address(nodeReg), 100 * 1e18);
        nodeReg.registerNode(user2NodeId, hex"02", _tags());
        vm.stopPrank();

        vm.prank(user2);
        onboarding.claimReferralBonus(user1NodeId);

        vm.prank(user2);
        vm.expectRevert("OnboardingRewards: referral already claimed");
        onboarding.claimReferralBonus(user1NodeId);
    }

    function test_ReferralCapEnforcement() public {
        // Fill up referral cap for user1
        for (uint256 i = 0; i < 50; i++) {
            address newUser = address(uint160(0x1000 + i));
            bytes32 newNodeId = keccak256(abi.encodePacked("node-", i));

            vm.prank(admin);
            token.mint(newUser, 200 * 1e18);

            vm.startPrank(newUser);
            token.approve(address(nodeReg), 100 * 1e18);
            nodeReg.registerNode(newNodeId, hex"03", _tags());
            onboarding.claimReferralBonus(user1NodeId);
            vm.stopPrank();
        }

        assertEq(onboarding.referralCount(user1), 50);

        // 51st referral should fail
        address overflowUser = address(uint160(0x2000));
        bytes32 overflowNodeId = keccak256("node-overflow");

        vm.prank(admin);
        token.mint(overflowUser, 200 * 1e18);

        vm.startPrank(overflowUser);
        token.approve(address(nodeReg), 100 * 1e18);
        nodeReg.registerNode(overflowNodeId, hex"04", _tags());
        vm.expectRevert("OnboardingRewards: referrer maxed out");
        onboarding.claimReferralBonus(user1NodeId);
        vm.stopPrank();
    }

    // ── Pool Management ───────────────────────────────────────────────

    function test_FundPool() public {
        uint256 poolBefore = onboarding.poolBalance();

        vm.startPrank(admin);
        token.mint(admin, 500 * 1e18);
        token.approve(address(onboarding), 500 * 1e18);
        onboarding.fundPool(500 * 1e18);
        vm.stopPrank();

        assertEq(onboarding.poolBalance() - poolBefore, 500 * 1e18);
    }

    function test_PoolDepletionReverts() public {
        // Deploy a fresh onboarding with small pool
        vm.startPrank(admin);
        OnboardingRewards smallPool = new OnboardingRewards(
            address(token),
            address(nodeReg),
            address(skillReg),
            address(valReg),
            address(marketplace),
            address(lifeRewards)
        );

        // Fund with only 5 TRUST (less than starter bonus of 10)
        token.mint(admin, 5 * 1e18);
        token.approve(address(smallPool), 5 * 1e18);
        smallPool.fundPool(5 * 1e18);
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert("OnboardingRewards: pool depleted");
        smallPool.claimStarter();
    }

    // ── Pause / Unpause ───────────────────────────────────────────────

    function test_PauseBlocksClaims() public {
        vm.prank(admin);
        onboarding.pauseRewards();

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        onboarding.claimStarter();
    }

    function test_UnpauseAllowsClaims() public {
        vm.prank(admin);
        onboarding.pauseRewards();

        vm.prank(admin);
        onboarding.unpauseRewards();

        vm.prank(user1);
        onboarding.claimStarter(); // should succeed
        assertTrue(onboarding.starterClaimed(user1));
    }

    // ── Governance — Set Reward Amounts ────────────────────────────────

    function test_SetRewardAmounts() public {
        vm.prank(admin);
        onboarding.setRewardAmounts(
            20 * 1e18,  // starter
            100 * 1e18, // firstSkill
            50 * 1e18,  // firstVal
            20 * 1e18,  // firstBuy
            30 * 1e18,  // referrer
            20 * 1e18,  // referred
            10 * 1e18   // streak
        );

        assertEq(onboarding.starterAmount(), 20 * 1e18);
        assertEq(onboarding.firstSkillAmount(), 100 * 1e18);

        // Claim with new amount
        vm.prank(user1);
        onboarding.claimStarter();
        // user1 got 20 TRUST (new amount)
        assertTrue(onboarding.starterClaimed(user1));
    }

    function test_SetRewardAmountsNonOwnerReverts() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        onboarding.setRewardAmounts(0, 0, 0, 0, 0, 0, 0);
    }
}
