// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SkillRegistry.sol";
import "./TrustToken.sol";
import "./NodeRegistry.sol";
import "./CommunityPool.sol";
import "./PriceOracle.sol";

/**
 * @title Marketplace
 * @notice Flow purchasing, royalty distribution, and subscription management.
 *
 * Two access models — both use TRUST, neither interferes with the other:
 *
 *   FREE flows (price == 0)
 *     Anyone can run them. Usage is rate-limited by subscription tier.
 *     Explorer (free):     5 flows/day
 *     Builder  ($5/mo):   50 flows/day
 *     Professional ($20/mo): 200 flows/day
 *     Enterprise ($100/mo): unlimited
 *
 *   Subscription prices are denominated in USD and converted to TRUST at the
 *   current oracle price at the moment of subscription. As TRUST appreciates,
 *   fewer tokens are required — holding TRUST becomes more valuable over time.
 *
 *   PREMIUM flows (price > 0, set by creator in USD cents)
 *     Must call purchaseSkill() once. Pays TRUST, unlocks permanently.
 *     Purchased flows do NOT consume daily quota — they are always accessible.
 *     Fee split: Creator 70%, Validator pool 15%, Treasury 8%, Community 5%, Burned 2%.
 *
 * Community Pool
 * ─────────────
 *   A portion of every purchase and subscription payment is routed to the
 *   CommunityPool contract, where it accrues to addresses that EARNED their
 *   TRUST through real activity. This "purchase premium" values earned TRUST
 *   above purchased TRUST — buyers subsidise earners.
 *
 *   Premium purchases:  5% → CommunityPool (COMMUNITY_FEE_BPS)
 *   Subscriptions:      25% of subscription fee → CommunityPool
 *
 *   Earner weight is registered at earning time (not claim time):
 *     - Flow creators:  notifyEarned(creator, 70% of purchase) on purchaseSkill()
 *     - Validators:     notifyEarned(nodeOwner, share) on distributeValidatorReward()
 *     - Life/Onboard:   called directly by those contracts (EARNER_ROLE)
 *
 * Usage recording (free flows):
 *   The MCP server calls recordUsage() after executing a free flow to
 *   increment the user's daily counter. Requires RECORDER_ROLE.
 */
contract Marketplace is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    TrustToken public immutable trustToken;
    SkillRegistry public immutable skillRegistry;
    NodeRegistry public immutable nodeRegistry;

    address public treasury;

    /// @notice Community pool — receives purchase premium from buys + subscriptions.
    CommunityPool public communityPool;

    /// @notice Price oracle — converts USD tier prices to TRUST at current market rate.
    PriceOracle public priceOracle;

    // ── Fee Split (basis points, total = 10000) ────────────────────────
    // Premium flow purchases: 70% creator · 15% validators · 8% treasury
    //                         · 5% community pool (earner yield) · 2% burned

    uint256 public constant CREATOR_FEE_BPS    = 7000;
    uint256 public constant VALIDATOR_FEE_BPS  = 1500;
    uint256 public constant TREASURY_FEE_BPS   =  800;
    uint256 public constant COMMUNITY_FEE_BPS  =  500;  // purchase premium → earners
    uint256 public constant BURN_FEE_BPS       =  200;
    uint256 public constant BPS_DENOMINATOR    = 10000;

    // Subscription fee split: 75% treasury, 25% community pool
    uint256 public constant SUB_COMMUNITY_BPS  = 2500;
    uint256 public constant SUB_TREASURY_BPS   = 7500;

    // ── Subscription Tiers ─────────────────────────────────────────────

    enum SubscriptionTier { EXPLORER, BUILDER, PROFESSIONAL, ENTERPRISE }

    struct TierConfig {
        uint256 monthlyUsd;       // USD price per month, 18 decimals (WAD). 0 = free.
        uint256 dailyLimit;       // Max free-flow uses per day. 0 = unlimited.
    }

    mapping(SubscriptionTier => TierConfig) public tierConfigs;

    struct Subscription {
        SubscriptionTier tier;
        uint256 expiresAt;        // 0 = EXPLORER (never expires)
        uint256 dailyUsed;
        uint256 lastUsedDay;
    }

    mapping(address => Subscription) public subscriptions;

    // ── Royalties & Validator Rewards ──────────────────────────────────

    /// @notice Accumulated creator royalties per skillId.
    mapping(bytes32 => uint256) public creatorRoyalties;
    /// @notice Accumulated validator rewards per nodeId.
    mapping(bytes32 => uint256) public validatorRewards;
    /// @notice Internal validator reward pool per skillId (before distribution).
    mapping(bytes32 => uint256) internal _validatorPool;

    // ── Purchase Tracking ──────────────────────────────────────────────

    /// @notice Whether a user has purchased a given premium flow.
    mapping(address => mapping(bytes32 => bool)) public hasPurchased;

    /// @notice Total premium flows purchased by each user.
    mapping(address => uint256) public purchaseCountOf;

    // ── Events ─────────────────────────────────────────────────────────

    event FlowPurchased(bytes32 indexed skillId, address indexed buyer, uint256 price);
    event FreeFlowUsed(bytes32 indexed skillId, address indexed user, uint256 dailyUsed);
    event RoyaltiesClaimed(bytes32 indexed skillId, address indexed creator, uint256 amount);
    event ValidatorRewardsClaimed(bytes32 indexed nodeId, address indexed owner, uint256 amount);
    event Subscribed(address indexed user, SubscriptionTier tier, uint256 expiresAt);
    event TreasuryUpdated(address newTreasury);
    event CommunityPoolUpdated(address newPool);
    event PriceOracleUpdated(address newOracle);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(
        address _trustToken,
        address _skillRegistry,
        address _nodeRegistry,
        address _treasury,
        address _communityPool,
        address _priceOracle
    ) {
        require(_trustToken    != address(0), "Marketplace: zero token");
        require(_skillRegistry != address(0), "Marketplace: zero skillReg");
        require(_nodeRegistry  != address(0), "Marketplace: zero nodeReg");
        require(_treasury      != address(0), "Marketplace: zero treasury");
        require(_communityPool != address(0), "Marketplace: zero communityPool");
        require(_priceOracle   != address(0), "Marketplace: zero oracle");

        trustToken    = TrustToken(_trustToken);
        skillRegistry = SkillRegistry(_skillRegistry);
        nodeRegistry  = NodeRegistry(_nodeRegistry);
        treasury      = _treasury;
        communityPool = CommunityPool(_communityPool);
        priceOracle   = PriceOracle(_priceOracle);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Subscription tier configs — prices in USD (18 decimals)
        tierConfigs[SubscriptionTier.EXPLORER]     = TierConfig({ monthlyUsd: 0,          dailyLimit: 5   });
        tierConfigs[SubscriptionTier.BUILDER]      = TierConfig({ monthlyUsd: 5   * 1e18, dailyLimit: 50  });
        tierConfigs[SubscriptionTier.PROFESSIONAL] = TierConfig({ monthlyUsd: 20  * 1e18, dailyLimit: 200 });
        tierConfigs[SubscriptionTier.ENTERPRISE]   = TierConfig({ monthlyUsd: 100 * 1e18, dailyLimit: 0   });
    }

    // ── Premium Flow Purchases ─────────────────────────────────────────

    /**
     * @notice Purchase a premium flow with TRUST tokens. Unlocks it permanently.
     * @dev Buyer must approve this contract for `skillRegistry.priceOf(skillId)`.
     *      Fee split: 70% creator, 15% validator pool, 10% treasury, 5% burned.
     *      Purchasing does NOT consume the buyer's daily free-flow quota.
     * @param skillId The flow to purchase.
     */
    function purchaseSkill(bytes32 skillId) external nonReentrant {
        require(skillRegistry.isActive(skillId), "Marketplace: flow not active");
        require(!hasPurchased[msg.sender][skillId], "Marketplace: already purchased");

        uint256 price = skillRegistry.priceOf(skillId);
        require(price > 0, "Marketplace: flow is free, use recordUsage");

        // Pull payment from buyer
        IERC20(address(trustToken)).safeTransferFrom(msg.sender, address(this), price);

        // Split fees
        uint256 creatorAmount   = (price * CREATOR_FEE_BPS)   / BPS_DENOMINATOR;
        uint256 validatorAmount = (price * VALIDATOR_FEE_BPS)  / BPS_DENOMINATOR;
        uint256 treasuryAmount  = (price * TREASURY_FEE_BPS)   / BPS_DENOMINATOR;
        uint256 communityAmount = (price * COMMUNITY_FEE_BPS)  / BPS_DENOMINATOR;
        uint256 burnAmount      = price
            - creatorAmount - validatorAmount - treasuryAmount - communityAmount;

        creatorRoyalties[skillId]  += creatorAmount;
        _validatorPool[skillId]    += validatorAmount;

        IERC20(address(trustToken)).safeTransfer(treasury, treasuryAmount);
        trustToken.burn(burnAmount);

        // Route purchase premium to community pool — earners receive this yield
        IERC20(address(trustToken)).approve(address(communityPool), communityAmount);
        communityPool.deposit(communityAmount);

        // Register creator's earned weight in the community pool at the moment of earning.
        // This means creators who publish popular flows accrue pool share automatically —
        // they don't need to claim royalties first for the weight to count.
        address creator = skillRegistry.creatorOf(skillId);
        communityPool.notifyEarned(creator, creatorAmount);

        hasPurchased[msg.sender][skillId] = true;
        purchaseCountOf[msg.sender]++;

        emit FlowPurchased(skillId, msg.sender, price);
    }

    // ── Free Flow Usage Recording ──────────────────────────────────────

    /**
     * @notice Record that a user ran a free (price == 0) flow.
     * @dev Called by the MCP server (RECORDER_ROLE) after flow execution.
     *      Reverts if the user is over their daily limit or subscription expired.
     *      No-op for premium flows that the user has purchased.
     * @param user    The user who ran the flow.
     * @param skillId The flow that was run.
     */
    function recordUsage(address user, bytes32 skillId) external onlyRole(RECORDER_ROLE) nonReentrant {
        require(skillRegistry.isActive(skillId), "Marketplace: flow not active");

        uint256 price = skillRegistry.priceOf(skillId);

        // Premium flow already purchased — no daily counter needed
        if (price > 0 && hasPurchased[user][skillId]) return;

        // Premium flow NOT purchased — cannot run it for free
        require(price == 0, "Marketplace: purchase required");

        // Increment daily counter, enforcing subscription limit
        _incrementDailyUsage(user);

        emit FreeFlowUsed(skillId, user, subscriptions[user].dailyUsed);
    }

    // ── Access Check (view) ────────────────────────────────────────────

    /**
     * @notice Check whether a user can access a given flow right now.
     * @param user    The user to check.
     * @param skillId The flow to access.
     * @return canAccess     True if the user may run the flow.
     * @return isPremium     True if the flow has a non-zero purchase price.
     * @return isPurchased   True if the user has already purchased this flow.
     * @return dailyRemaining How many free-flow runs remain today (0 if unlimited or premium).
     */
    function checkAccess(address user, bytes32 skillId) external view returns (
        bool canAccess,
        bool isPremium,
        bool isPurchased,
        uint256 dailyRemaining
    ) {
        uint256 price = skillRegistry.priceOf(skillId);
        isPremium   = (price > 0);
        isPurchased = hasPurchased[user][skillId];

        if (isPremium) {
            // Premium: only accessible if purchased
            canAccess     = isPurchased;
            dailyRemaining = 0;
        } else {
            // Free: accessible within daily subscription limit
            (bool withinLimit, uint256 remaining) = _dailyStatus(user);
            canAccess      = withinLimit;
            dailyRemaining = remaining;
        }
    }

    // ── Subscriptions ──────────────────────────────────────────────────

    /**
     * @notice Returns the current TRUST cost to subscribe to a tier.
     * @dev Call this before subscribe() to get the exact approval amount.
     * @param tier The subscription tier.
     * @return trustAmount TRUST tokens required (18 decimals). 0 for Explorer.
     */
    function subscribeCost(SubscriptionTier tier) public view returns (uint256 trustAmount) {
        uint256 usdAmount = tierConfigs[tier].monthlyUsd;
        if (usdAmount == 0) return 0;
        return priceOracle.usdToTrust(usdAmount);
    }

    /**
     * @notice Subscribe to a tier. Paid tiers require TRUST approval for subscribeCost(tier).
     * @param tier The subscription tier to purchase.
     */
    function subscribe(SubscriptionTier tier) external nonReentrant {
        uint256 trustAmount = subscribeCost(tier);

        if (trustAmount > 0) {
            uint256 communityShare = (trustAmount * SUB_COMMUNITY_BPS) / BPS_DENOMINATOR;
            uint256 treasuryShare  = trustAmount - communityShare;

            // Treasury portion
            IERC20(address(trustToken)).safeTransferFrom(msg.sender, treasury, treasuryShare);

            // Community pool portion — earners receive yield from subscription revenue
            IERC20(address(trustToken)).safeTransferFrom(
                msg.sender, address(this), communityShare
            );
            IERC20(address(trustToken)).approve(address(communityPool), communityShare);
            communityPool.deposit(communityShare);
        }

        uint256 expiresAt = (tier == SubscriptionTier.EXPLORER)
            ? 0
            : block.timestamp + 30 days;

        subscriptions[msg.sender] = Subscription({
            tier:        tier,
            expiresAt:   expiresAt,
            dailyUsed:   0,
            lastUsedDay: 0
        });

        emit Subscribed(msg.sender, tier, expiresAt);
    }

    // ── Royalty Claims ─────────────────────────────────────────────────

    /**
     * @notice Claim accumulated royalties for a flow. Creator only.
     * @param skillId The flow to claim royalties for.
     */
    function claimRoyalties(bytes32 skillId) external nonReentrant {
        address creator = skillRegistry.creatorOf(skillId);
        require(msg.sender == creator, "Marketplace: not creator");

        uint256 amount = creatorRoyalties[skillId];
        require(amount > 0, "Marketplace: no royalties");

        creatorRoyalties[skillId] = 0;
        IERC20(address(trustToken)).safeTransfer(msg.sender, amount);

        emit RoyaltiesClaimed(skillId, msg.sender, amount);
    }

    /**
     * @notice Claim accumulated validator rewards for a node.
     * @param nodeId The validator node to claim for.
     */
    function claimValidatorRewards(bytes32 nodeId) external nonReentrant {
        address nodeOwner = nodeRegistry.nodeOwner(nodeId);
        require(msg.sender == nodeOwner, "Marketplace: not node owner");

        uint256 amount = validatorRewards[nodeId];
        require(amount > 0, "Marketplace: no rewards");

        validatorRewards[nodeId] = 0;
        IERC20(address(trustToken)).safeTransfer(msg.sender, amount);

        emit ValidatorRewardsClaimed(nodeId, msg.sender, amount);
    }

    /**
     * @notice Distribute validator pool for a flow to a specific validator node.
     * @dev Called by ValidationRegistry or admin after validation is recorded.
     * @param skillId     The flow.
     * @param nodeId      The validator node.
     * @param shareAmount The amount to award from the pool.
     */
    function distributeValidatorReward(
        bytes32 skillId,
        bytes32 nodeId,
        uint256 shareAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_validatorPool[skillId] >= shareAmount, "Marketplace: insufficient pool");
        _validatorPool[skillId] -= shareAmount;
        validatorRewards[nodeId] += shareAmount;

        // Register validator node owner's earned weight at distribution time.
        address nodeOwner = nodeRegistry.nodeOwner(nodeId);
        if (nodeOwner != address(0)) {
            communityPool.notifyEarned(nodeOwner, shareAmount);
        }
    }

    // ── Admin ──────────────────────────────────────────────────────────

    /**
     * @notice Update the treasury address.
     */
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Marketplace: zero treasury");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @notice Update the community pool address.
     */
    function setCommunityPool(address newPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPool != address(0), "Marketplace: zero communityPool");
        communityPool = CommunityPool(newPool);
        emit CommunityPoolUpdated(newPool);
    }

    /**
     * @notice Update the price oracle address.
     */
    function setPriceOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOracle != address(0), "Marketplace: zero oracle");
        priceOracle = PriceOracle(newOracle);
        emit PriceOracleUpdated(newOracle);
    }

    // ── Internal ───────────────────────────────────────────────────────

    /// @dev Increment daily usage counter. Reverts if over limit or subscription expired.
    function _incrementDailyUsage(address user) internal {
        Subscription storage sub = subscriptions[user];
        TierConfig memory config = tierConfigs[sub.tier];

        // Paid tier expiry check
        if (sub.tier != SubscriptionTier.EXPLORER && sub.expiresAt > 0) {
            require(block.timestamp <= sub.expiresAt, "Marketplace: subscription expired");
        }

        if (config.dailyLimit == 0) return; // unlimited tier

        uint256 today = block.timestamp / 1 days;
        if (sub.lastUsedDay != today) {
            sub.lastUsedDay = today;
            sub.dailyUsed   = 0;
        }

        require(sub.dailyUsed < config.dailyLimit, "Marketplace: daily limit reached");
        sub.dailyUsed++;
    }

    /// @dev View helper: returns (withinLimit, remaining) for free-flow daily quota.
    function _dailyStatus(address user) internal view returns (bool withinLimit, uint256 remaining) {
        Subscription storage sub = subscriptions[user];
        TierConfig memory config = tierConfigs[sub.tier];

        // Paid tier expired → fall back to Explorer limits
        uint256 dailyLimit = config.dailyLimit;
        if (sub.tier != SubscriptionTier.EXPLORER && sub.expiresAt > 0 && block.timestamp > sub.expiresAt) {
            dailyLimit = tierConfigs[SubscriptionTier.EXPLORER].dailyLimit;
        }

        if (dailyLimit == 0) return (true, type(uint256).max); // unlimited

        uint256 today = block.timestamp / 1 days;
        uint256 used  = (sub.lastUsedDay == today) ? sub.dailyUsed : 0;

        withinLimit = used < dailyLimit;
        remaining   = withinLimit ? dailyLimit - used : 0;
    }
}
