// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SkillRegistry.sol";
import "./SkillToken.sol";
import "./NodeRegistry.sol";

/**
 * @title Marketplace
 * @notice Skill purchasing, royalty distribution, and subscription management.
 * @dev Fee split (basis points): Creator 70%, Validator 15%, Treasury 10%, Burn 5%.
 *      Mirrors Velma bridges/gaas/contracts.py subscription tiers.
 *
 * Subscription tiers:
 *   - Explorer:     Free, 5 skills/day
 *   - Builder:      50 TRUST/month, 50 skills/day
 *   - Professional: 200 TRUST/month, 200 skills/day
 *   - Enterprise:   Custom pricing, unlimited
 */
contract Marketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    SkillToken public immutable trustToken;
    SkillRegistry public immutable skillRegistry;
    NodeRegistry public immutable nodeRegistry;

    address public treasury;

    // ── Fee Split (basis points, total = 10000) ────────────────────────

    uint256 public constant CREATOR_FEE_BPS = 7000;
    uint256 public constant VALIDATOR_FEE_BPS = 1500;
    uint256 public constant TREASURY_FEE_BPS = 1000;
    uint256 public constant BURN_FEE_BPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ── Subscription Tiers ─────────────────────────────────────────────

    enum SubscriptionTier { EXPLORER, BUILDER, PROFESSIONAL, ENTERPRISE }

    struct TierConfig {
        uint256 monthlyPrice;  // TRUST tokens (WAD). 0 = free.
        uint256 dailyLimit;    // Max skill uses per day. 0 = unlimited.
        uint256 rewardMultiplier; // WAD (1e18 = 1x)
    }

    mapping(SubscriptionTier => TierConfig) public tierConfigs;

    struct Subscription {
        SubscriptionTier tier;
        uint256 expiresAt;
        uint256 dailyUsed;
        uint256 lastUsedDay;
    }

    mapping(address => Subscription) public subscriptions;

    // ── Royalties & Rewards ────────────────────────────────────────────

    /// @notice Accumulated creator royalties: skillId => amount
    mapping(bytes32 => uint256) public creatorRoyalties;
    /// @notice Accumulated validator rewards: nodeId => amount
    mapping(bytes32 => uint256) public validatorRewards;
    /// @notice Total validator reward pool per skill (for even distribution)
    mapping(bytes32 => uint256) internal _validatorPool;

    // ── Purchase Tracking ──────────────────────────────────────────────

    mapping(address => mapping(bytes32 => bool)) public hasPurchased;

    /// @notice Total number of skills purchased by each buyer.
    mapping(address => uint256) public purchaseCountOf;

    // ── Events ─────────────────────────────────────────────────────────

    event SkillPurchased(bytes32 indexed skillId, address indexed buyer, uint256 price);
    event RoyaltiesClaimed(bytes32 indexed skillId, address indexed creator, uint256 amount);
    event ValidatorRewardsClaimed(bytes32 indexed nodeId, address indexed owner, uint256 amount);
    event Subscribed(address indexed user, SubscriptionTier tier, uint256 expiresAt);
    event TreasuryUpdated(address newTreasury);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(
        address _trustToken,
        address _skillRegistry,
        address _nodeRegistry,
        address _treasury
    ) Ownable(msg.sender) {
        require(_trustToken != address(0), "Marketplace: zero token");
        require(_skillRegistry != address(0), "Marketplace: zero skillReg");
        require(_nodeRegistry != address(0), "Marketplace: zero nodeReg");
        require(_treasury != address(0), "Marketplace: zero treasury");

        trustToken = SkillToken(_trustToken);
        skillRegistry = SkillRegistry(_skillRegistry);
        nodeRegistry = NodeRegistry(_nodeRegistry);
        treasury = _treasury;

        // Initialize tier configs
        tierConfigs[SubscriptionTier.EXPLORER] = TierConfig({
            monthlyPrice: 0,
            dailyLimit: 5,
            rewardMultiplier: 1e18
        });
        tierConfigs[SubscriptionTier.BUILDER] = TierConfig({
            monthlyPrice: 50 * 1e18,
            dailyLimit: 50,
            rewardMultiplier: 1e18
        });
        tierConfigs[SubscriptionTier.PROFESSIONAL] = TierConfig({
            monthlyPrice: 200 * 1e18,
            dailyLimit: 200,
            rewardMultiplier: 1e18
        });
        tierConfigs[SubscriptionTier.ENTERPRISE] = TierConfig({
            monthlyPrice: 1000 * 1e18,
            dailyLimit: 0, // unlimited
            rewardMultiplier: 1e18
        });
    }

    // ── Purchases ──────────────────────────────────────────────────────

    /**
     * @notice Purchase a skill with TRUST tokens.
     * @dev Fee is split: 70% creator, 15% validator pool, 10% treasury, 5% burned.
     *      Buyer must have approved the Marketplace for the skill price.
     * @param skillId The skill to purchase.
     */
    function purchaseSkill(bytes32 skillId) external nonReentrant {
        require(skillRegistry.isActive(skillId), "Marketplace: skill not active");
        require(!hasPurchased[msg.sender][skillId], "Marketplace: already purchased");

        // Check subscription daily limit
        _checkAccess(msg.sender);

        uint256 price = skillRegistry.priceOf(skillId);
        require(price > 0, "Marketplace: skill is free");

        // Transfer full price from buyer
        IERC20(address(trustToken)).safeTransferFrom(msg.sender, address(this), price);

        // Split fees
        uint256 creatorAmount = (price * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 validatorAmount = (price * VALIDATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 treasuryAmount = (price * TREASURY_FEE_BPS) / BPS_DENOMINATOR;
        uint256 burnAmount = price - creatorAmount - validatorAmount - treasuryAmount;

        // Accrue royalties
        creatorRoyalties[skillId] += creatorAmount;
        _validatorPool[skillId] += validatorAmount;

        // Send treasury share
        IERC20(address(trustToken)).safeTransfer(treasury, treasuryAmount);

        // Burn
        trustToken.burn(burnAmount);

        hasPurchased[msg.sender][skillId] = true;
        purchaseCountOf[msg.sender]++;

        emit SkillPurchased(skillId, msg.sender, price);
    }

    // ── Royalty Claims ─────────────────────────────────────────────────

    /**
     * @notice Claim accumulated royalties for a skill. Creator only.
     * @param skillId The skill to claim royalties for.
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
     * @param nodeId The validator node to claim rewards for.
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
     * @notice Distribute validator pool for a skill to a specific validator.
     * @dev Called by ValidationRegistry or owner after validation is recorded.
     * @param skillId     The skill.
     * @param nodeId      The validator node.
     * @param shareAmount The amount to award.
     */
    function distributeValidatorReward(
        bytes32 skillId,
        bytes32 nodeId,
        uint256 shareAmount
    ) external onlyOwner {
        require(_validatorPool[skillId] >= shareAmount, "Marketplace: insufficient pool");
        _validatorPool[skillId] -= shareAmount;
        validatorRewards[nodeId] += shareAmount;
    }

    // ── Subscriptions ──────────────────────────────────────────────────

    /**
     * @notice Subscribe to a tier. Payment in TRUST tokens for paid tiers.
     * @param tier The subscription tier.
     */
    function subscribe(SubscriptionTier tier) external nonReentrant {
        TierConfig memory config = tierConfigs[tier];

        if (config.monthlyPrice > 0) {
            IERC20(address(trustToken)).safeTransferFrom(
                msg.sender, treasury, config.monthlyPrice
            );
        }

        subscriptions[msg.sender] = Subscription({
            tier: tier,
            expiresAt: block.timestamp + 30 days,
            dailyUsed: 0,
            lastUsedDay: 0
        });

        emit Subscribed(msg.sender, tier, block.timestamp + 30 days);
    }

    /**
     * @notice Check if a user can access a skill (subscription + daily limit).
     * @param user    The user to check.
     * @param skillId The skill to access.
     * @return canAccess True if allowed.
     */
    function checkAccess(address user, bytes32 skillId) external view returns (bool) {
        if (hasPurchased[user][skillId]) return true;

        Subscription storage sub = subscriptions[user];
        TierConfig memory config = tierConfigs[sub.tier];

        // Explorer (default) is always active
        if (sub.tier != SubscriptionTier.EXPLORER && block.timestamp > sub.expiresAt) {
            return false;
        }

        if (config.dailyLimit == 0) return true; // unlimited

        uint256 today = block.timestamp / 1 days;
        uint256 used = sub.lastUsedDay == today ? sub.dailyUsed : 0;
        return used < config.dailyLimit;
    }

    function _checkAccess(address user) internal {
        Subscription storage sub = subscriptions[user];
        TierConfig memory config = tierConfigs[sub.tier];

        // Check expiry for paid tiers
        if (sub.tier != SubscriptionTier.EXPLORER && sub.expiresAt > 0) {
            require(block.timestamp <= sub.expiresAt, "Marketplace: subscription expired");
        }

        // Check daily limit
        if (config.dailyLimit > 0) {
            uint256 today = block.timestamp / 1 days;
            if (sub.lastUsedDay != today) {
                sub.lastUsedDay = today;
                sub.dailyUsed = 0;
            }
            require(sub.dailyUsed < config.dailyLimit, "Marketplace: daily limit");
            sub.dailyUsed++;
        }
    }

    // ── Admin ──────────────────────────────────────────────────────────

    /**
     * @notice Update the treasury address.
     * @param newTreasury New treasury address.
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Marketplace: zero treasury");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }
}
