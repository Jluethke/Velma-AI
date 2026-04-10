// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TrustToken.sol";
import "./NodeRegistry.sol";

/**
 * @title Staking
 * @notice Validator staking with tiers, cooldowns, and slashing.
 * @dev Mirrors ALG trust governance tiers. Staking tiers determine daily
 *      validation limits and reward multipliers.
 *
 * Tiers:
 *   Bronze   — 1,000 TRUST, 10/day, 1.0x rewards
 *   Silver   — 5,000 TRUST, 50/day, 1.2x rewards
 *   Gold     — 25,000 TRUST, 200/day, 1.5x rewards
 *   Platinum — 100,000 TRUST, unlimited, 2.0x rewards
 *
 * Slashing rates (basis points):
 *   Failed validation — 500 (5%)
 *   Low accuracy      — 1000 (10%)
 *   Collusion         — 2500 (25%)
 *   Malicious         — 10000 (100%) + permanent ban
 *   Downtime          — 200 (2%)
 *
 * Slashed tokens: 50% to affected party, 50% burned.
 */
contract Staking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");

    TrustToken public immutable trustToken;
    NodeRegistry public immutable nodeRegistry;

    /// @notice Unstaking cooldown period.
    uint256 public constant UNSTAKE_COOLDOWN = 7 days;

    // ── Tiers ──────────────────────────────────────────────────────────

    enum StakeTier { NONE, BRONZE, SILVER, GOLD, PLATINUM }

    struct TierThreshold {
        uint256 minStake;        // WAD
        uint256 dailyLimit;      // 0 = unlimited
        uint256 rewardMultiplier; // WAD (1e18 = 1x)
    }

    mapping(StakeTier => TierThreshold) public tierThresholds;

    // ── Slashing Rates (basis points) ──────────────────────────────────

    enum SlashReason { FAILED_VALIDATION, LOW_ACCURACY, COLLUSION, MALICIOUS, DOWNTIME }

    mapping(SlashReason => uint256) public slashRates;

    // ── Staker State ───────────────────────────────────────────────────

    struct StakerInfo {
        uint256 staked;
        uint256 pendingUnstake;
        uint256 unstakeRequestTime;
        StakeTier tier;
        bool banned;
    }

    mapping(bytes32 => StakerInfo) public stakers;

    // ── Events ─────────────────────────────────────────────────────────

    event Staked(bytes32 indexed nodeId, uint256 amount, StakeTier tier);
    event UnstakeRequested(bytes32 indexed nodeId, uint256 amount, uint256 availableAt);
    event Unstaked(bytes32 indexed nodeId, uint256 amount);
    event Slashed(bytes32 indexed nodeId, uint256 amount, SlashReason reason, address affected);
    event Banned(bytes32 indexed nodeId);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(
        address _trustToken,
        address _nodeRegistry
    ) {
        require(_trustToken != address(0), "Staking: zero token");
        require(_nodeRegistry != address(0), "Staking: zero registry");

        trustToken = TrustToken(_trustToken);
        nodeRegistry = NodeRegistry(_nodeRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Tier thresholds
        tierThresholds[StakeTier.BRONZE] = TierThreshold(1_000 * 1e18, 10, 1e18);
        tierThresholds[StakeTier.SILVER] = TierThreshold(5_000 * 1e18, 50, 1.2e18);
        tierThresholds[StakeTier.GOLD] = TierThreshold(25_000 * 1e18, 200, 1.5e18);
        tierThresholds[StakeTier.PLATINUM] = TierThreshold(100_000 * 1e18, 0, 2e18);

        // Slash rates
        slashRates[SlashReason.FAILED_VALIDATION] = 500;   // 5%
        slashRates[SlashReason.LOW_ACCURACY] = 1000;        // 10%
        slashRates[SlashReason.COLLUSION] = 2500;           // 25%
        slashRates[SlashReason.MALICIOUS] = 10000;          // 100%
        slashRates[SlashReason.DOWNTIME] = 200;             // 2%
    }

    // ── Staking ────────────────────────────────────────────────────────

    /**
     * @notice Stake TRUST tokens for a node.
     * @param nodeId The node to stake for.
     * @param amount Amount of TRUST to stake (WAD).
     */
    function stake(bytes32 nodeId, uint256 amount) external nonReentrant {
        require(nodeRegistry.isRegistered(nodeId), "Staking: node not registered");
        require(nodeRegistry.nodeOwner(nodeId) == msg.sender, "Staking: not node owner");
        require(amount > 0, "Staking: zero amount");

        StakerInfo storage info = stakers[nodeId];
        require(!info.banned, "Staking: node banned");

        IERC20(address(trustToken)).safeTransferFrom(msg.sender, address(this), amount);

        info.staked += amount;
        info.tier = _computeTier(info.staked);

        emit Staked(nodeId, amount, info.tier);
    }

    /**
     * @notice Request to unstake tokens. Subject to 7-day cooldown.
     * @param nodeId The node to unstake from.
     * @param amount Amount to unstake (WAD).
     */
    function unstake(bytes32 nodeId, uint256 amount) external nonReentrant {
        require(nodeRegistry.nodeOwner(nodeId) == msg.sender, "Staking: not node owner");

        StakerInfo storage info = stakers[nodeId];
        require(info.staked >= amount, "Staking: insufficient stake");
        require(info.pendingUnstake == 0, "Staking: pending unstake exists");

        info.staked -= amount;
        info.pendingUnstake = amount;
        info.unstakeRequestTime = block.timestamp;
        info.tier = _computeTier(info.staked);

        emit UnstakeRequested(nodeId, amount, block.timestamp + UNSTAKE_COOLDOWN);
    }

    /**
     * @notice Complete unstaking after cooldown period.
     * @param nodeId The node to withdraw unstaked tokens for.
     */
    function completeUnstake(bytes32 nodeId) external nonReentrant {
        require(nodeRegistry.nodeOwner(nodeId) == msg.sender, "Staking: not node owner");

        StakerInfo storage info = stakers[nodeId];
        require(info.pendingUnstake > 0, "Staking: no pending unstake");
        require(
            block.timestamp >= info.unstakeRequestTime + UNSTAKE_COOLDOWN,
            "Staking: cooldown active"
        );

        uint256 amount = info.pendingUnstake;
        info.pendingUnstake = 0;
        info.unstakeRequestTime = 0;

        IERC20(address(trustToken)).safeTransfer(msg.sender, amount);

        emit Unstaked(nodeId, amount);
    }

    // ── Slashing ───────────────────────────────────────────────────────

    /**
     * @notice Slash a node's stake. Only SLASHER_ROLE (ValidationRegistry / GovernanceDAO).
     * @dev 50% of slashed amount goes to affected party, 50% is burned.
     *      MALICIOUS reason also permanently bans the node.
     * @param nodeId   The node to slash.
     * @param reason   The slashing reason.
     * @param affected The address to receive 50% of slashed tokens (or address(0) to burn all).
     */
    function slash(
        bytes32 nodeId,
        SlashReason reason,
        address affected
    ) external onlyRole(SLASHER_ROLE) nonReentrant {
        StakerInfo storage info = stakers[nodeId];
        require(info.staked > 0, "Staking: nothing to slash");

        uint256 rate = slashRates[reason];
        uint256 slashAmount = (info.staked * rate) / 10000;
        if (slashAmount > info.staked) slashAmount = info.staked;

        info.staked -= slashAmount;
        info.tier = _computeTier(info.staked);

        // 50% to affected, 50% burned
        uint256 halfSlash = slashAmount / 2;
        uint256 burnAmount = slashAmount - halfSlash;

        if (affected != address(0) && halfSlash > 0) {
            IERC20(address(trustToken)).safeTransfer(affected, halfSlash);
        } else {
            burnAmount = slashAmount; // burn everything if no affected party
        }

        if (burnAmount > 0) {
            trustToken.burn(burnAmount);
        }

        // Malicious = permanent ban
        if (reason == SlashReason.MALICIOUS) {
            info.banned = true;
            emit Banned(nodeId);
        }

        emit Slashed(nodeId, slashAmount, reason, affected);
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Get the current staking tier for a node.
     * @param nodeId The node to query.
     * @return tier  The current tier.
     */
    function getTier(bytes32 nodeId) external view returns (StakeTier) {
        return stakers[nodeId].tier;
    }

    /**
     * @notice Get staked amount for a node.
     * @param nodeId The node to query.
     * @return amount Staked TRUST tokens.
     */
    function stakedAmount(bytes32 nodeId) external view returns (uint256) {
        return stakers[nodeId].staked;
    }

    /**
     * @notice Check if a node is banned.
     */
    function isBanned(bytes32 nodeId) external view returns (bool) {
        return stakers[nodeId].banned;
    }

    /**
     * @notice Get reward multiplier for a node's current tier.
     */
    function rewardMultiplier(bytes32 nodeId) external view returns (uint256) {
        StakeTier tier = stakers[nodeId].tier;
        if (tier == StakeTier.NONE) return 1e18;
        return tierThresholds[tier].rewardMultiplier;
    }

    // ── Internal ───────────────────────────────────────────────────────

    function _computeTier(uint256 amount) internal view returns (StakeTier) {
        if (amount >= tierThresholds[StakeTier.PLATINUM].minStake) return StakeTier.PLATINUM;
        if (amount >= tierThresholds[StakeTier.GOLD].minStake) return StakeTier.GOLD;
        if (amount >= tierThresholds[StakeTier.SILVER].minStake) return StakeTier.SILVER;
        if (amount >= tierThresholds[StakeTier.BRONZE].minStake) return StakeTier.BRONZE;
        return StakeTier.NONE;
    }
}
