// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./TrustToken.sol";
import "./TrustOracle.sol";
import "./NodeRegistry.sol";

/**
 * @title LifeRewards
 * @notice The Life Protocol — Proof of Living. Rewards human contribution
 *         across six categories: Move, Learn, Build, Teach, Serve, Produce.
 * @dev Verified by the same trust-weighted attestation system used for
 *      SkillChain skill validation. TRUST tokens are minted from a dedicated
 *      Life Protocol emission pool.
 *
 * Key mechanics:
 *   - Daily caps per category per user (prevents grinding)
 *   - Diminishing returns within a day (exponential decay)
 *   - Diversity bonus for 3+ categories in a day (1.2x)
 *   - Streak bonuses for consecutive daily activity (7d=1.1x, 30d=1.3x, 90d=1.5x)
 *   - Trust-gated attestation (attestors must have trust >= 0.40)
 *   - Configurable reward rates per category (governance-controlled)
 *
 * Patent Family B: Runtime governance of learning/adaptive systems.
 */
contract LifeRewards is Ownable, ReentrancyGuard, Pausable {

    // ── External Contracts ────────────────────────────────────────────

    TrustToken public immutable skillToken;
    TrustOracle public immutable trustOracle;
    NodeRegistry public immutable nodeRegistry;

    // ── Constants ─────────────────────────────────────────────────────

    /// @notice WAD precision (1e18) used for fixed-point arithmetic.
    uint256 public constant WAD = 1e18;

    /// @notice Minimum trust score required to attest proofs (0.40 in WAD).
    uint256 public constant MIN_ATTESTOR_TRUST = 4e17;

    /// @notice Diversity bonus multiplier when 3+ categories active in a day (1.2x in WAD).
    uint256 public constant DIVERSITY_BONUS = 12e17;

    /// @notice Minimum categories required to trigger diversity bonus.
    uint256 public constant DIVERSITY_THRESHOLD = 3;

    /// @notice Diminishing returns decay factor per subsequent activity (0.7x per additional).
    uint256 public constant DECAY_FACTOR = 7e17;

    /// @notice Maximum activities per category per day before full cutoff.
    uint256 public constant MAX_DAILY_ACTIVITIES = 10;

    // ── Enums ─────────────────────────────────────────────────────────

    /// @notice The six Life Protocol activity categories.
    enum Category {
        MOVE,       // Physical activity
        LEARN,      // Skill acquisition
        BUILD,      // Creation and contribution
        TEACH,      // Knowledge transfer
        SERVE,      // Community contribution
        PRODUCE     // Physical production (Terra Unita bridge)
    }

    /// @notice Proof lifecycle states.
    enum ProofState {
        PENDING,    // Submitted, awaiting attestations
        APPROVED,   // Met attestation threshold, reward minted
        REJECTED,   // Failed attestation or expired
        EXPIRED     // Attestation window closed without threshold
    }

    // ── Structs ───────────────────────────────────────────────────────

    /// @notice Configuration for each reward category.
    struct CategoryConfig {
        uint256 baseReward;         // Base reward amount in WAD
        uint256 dailyCap;           // Max reward per user per day in WAD
        uint256 minAttestations;    // Required attestation count
        bool active;                // Whether category is accepting proofs
    }

    /// @notice A submitted proof of activity.
    struct Proof {
        uint256 proofId;
        address submitter;
        bytes32 nodeId;
        Category category;
        bytes32 proofHash;          // SHA-256 hash of proof data
        uint256 rewardAmount;       // Calculated reward (before bonuses)
        uint256 submittedAt;
        uint256 attestationCount;
        ProofState state;
    }

    /// @notice Per-user daily tracking for caps and diversity.
    struct DailyActivity {
        uint256 lastResetDay;       // Day number (block.timestamp / 1 days)
        uint256[6] categoryCount;   // Activity count per category today
        uint256[6] categoryEarned;  // TRUST earned per category today
        uint256 activeCategoryMask; // Bitmask of categories with activity
    }

    /// @notice Per-user streak tracking.
    struct Streak {
        uint256 lastActiveDay;      // Last day the user submitted an approved proof
        uint256 consecutiveDays;    // Current streak length
    }

    // ── State ─────────────────────────────────────────────────────────

    /// @notice Category configurations (governance-adjustable).
    mapping(Category => CategoryConfig) public categoryConfigs;

    /// @notice All submitted proofs.
    Proof[] public proofs;

    /// @notice Mapping: proofId => attestor address => has attested.
    mapping(uint256 => mapping(address => bool)) public hasAttested;

    /// @notice Per-user daily activity tracking.
    mapping(address => DailyActivity) internal _dailyActivity;

    /// @notice Per-user streak tracking.
    mapping(address => Streak) public streaks;

    /// @notice Global daily emission cap for Life Protocol rewards.
    uint256 public dailyEmissionCap;

    /// @notice Total TRUST minted today via Life Protocol.
    uint256 public todayEmitted;

    /// @notice The day number for todayEmitted tracking.
    uint256 public emissionDay;

    /// @notice Attestation window duration (proofs expire after this).
    uint256 public attestationWindow = 24 hours;

    // ── Events ────────────────────────────────────────────────────────

    /// @notice Emitted when a user submits a proof of activity.
    event ProofSubmitted(
        uint256 indexed proofId,
        address indexed submitter,
        Category category,
        bytes32 proofHash
    );

    /// @notice Emitted when a peer attests a proof.
    event ProofAttested(
        uint256 indexed proofId,
        address indexed attestor,
        uint256 attestationCount
    );

    /// @notice Emitted when a proof is approved and reward minted.
    event RewardMinted(
        uint256 indexed proofId,
        address indexed recipient,
        Category category,
        uint256 baseAmount,
        uint256 finalAmount
    );

    /// @notice Emitted when a proof is rejected.
    event ProofRejected(uint256 indexed proofId);

    /// @notice Emitted when a proof expires without sufficient attestations.
    event ProofExpired(uint256 indexed proofId);

    /// @notice Emitted when category configuration is updated.
    event CategoryConfigUpdated(
        Category indexed category,
        uint256 baseReward,
        uint256 dailyCap,
        uint256 minAttestations,
        bool active
    );

    /// @notice Emitted when daily emission cap is updated.
    event DailyEmissionCapUpdated(uint256 newCap);

    /// @notice Emitted when attestation window is updated.
    event AttestationWindowUpdated(uint256 newWindow);

    /// @notice Emitted when a user's streak updates.
    event StreakUpdated(address indexed user, uint256 consecutiveDays);

    // ── Constructor ───────────────────────────────────────────────────

    /**
     * @notice Deploy the Life Protocol contract.
     * @param _skillToken   Address of the TrustToken (TRUST) contract.
     * @param _trustOracle  Address of the TrustOracle contract.
     * @param _nodeRegistry Address of the NodeRegistry contract.
     * @param _dailyEmissionCap Maximum TRUST that can be minted per day via Life Protocol.
     */
    constructor(
        address _skillToken,
        address _trustOracle,
        address _nodeRegistry,
        uint256 _dailyEmissionCap
    ) Ownable(msg.sender) {
        require(_skillToken != address(0), "Life: zero skillToken");
        require(_trustOracle != address(0), "Life: zero trustOracle");
        require(_nodeRegistry != address(0), "Life: zero nodeRegistry");
        require(_dailyEmissionCap > 0, "Life: zero emission cap");

        skillToken = TrustToken(_skillToken);
        trustOracle = TrustOracle(_trustOracle);
        nodeRegistry = NodeRegistry(_nodeRegistry);
        dailyEmissionCap = _dailyEmissionCap;
        emissionDay = block.timestamp / 1 days;

        // Default category configurations
        // MOVE: 0.005 TRUST base, 0.05 cap, 2 attestations
        categoryConfigs[Category.MOVE] = CategoryConfig({
            baseReward: 5e15,
            dailyCap: 5e16,
            minAttestations: 2,
            active: true
        });

        // LEARN: 0.5 TRUST base, 5.0 cap, 2 attestations
        categoryConfigs[Category.LEARN] = CategoryConfig({
            baseReward: 5e17,
            dailyCap: 5e18,
            minAttestations: 2,
            active: true
        });

        // BUILD: 2.5 TRUST base, 25.0 cap, 3 attestations
        categoryConfigs[Category.BUILD] = CategoryConfig({
            baseReward: 25e17,
            dailyCap: 25e18,
            minAttestations: 3,
            active: true
        });

        // TEACH: 5.0 TRUST base, 50.0 cap, 3 attestations
        categoryConfigs[Category.TEACH] = CategoryConfig({
            baseReward: 5e18,
            dailyCap: 50e18,
            minAttestations: 3,
            active: true
        });

        // SERVE: 5.0 TRUST base, 50.0 cap, 3 attestations
        categoryConfigs[Category.SERVE] = CategoryConfig({
            baseReward: 5e18,
            dailyCap: 50e18,
            minAttestations: 3,
            active: true
        });

        // PRODUCE: 5.0 TRUST base, 50.0 cap, 3 attestations
        categoryConfigs[Category.PRODUCE] = CategoryConfig({
            baseReward: 5e18,
            dailyCap: 50e18,
            minAttestations: 3,
            active: true
        });
    }

    // ── Proof Submission ──────────────────────────────────────────────

    /**
     * @notice Submit a proof of activity for reward consideration.
     * @param category  The activity category.
     * @param proofHash SHA-256 hash of the proof data (sensor data, git commit, quiz score, etc.).
     * @return proofId  The ID of the submitted proof.
     */
    function submitProof(
        Category category,
        bytes32 proofHash
    ) external whenNotPaused returns (uint256 proofId) {
        bytes32 nodeId = nodeRegistry.ownerToNode(msg.sender);
        require(nodeId != bytes32(0), "Life: not a node");
        require(nodeRegistry.isRegistered(nodeId), "Life: node inactive");

        CategoryConfig storage config = categoryConfigs[category];
        require(config.active, "Life: category inactive");

        // Reset daily tracking if new day
        DailyActivity storage daily = _dailyActivity[msg.sender];
        uint256 today = block.timestamp / 1 days;
        if (daily.lastResetDay != today) {
            _resetDaily(daily, today);
        }

        uint256 catIdx = uint256(category);
        require(daily.categoryCount[catIdx] < MAX_DAILY_ACTIVITIES, "Life: daily activity limit");

        // Calculate reward with diminishing returns
        uint256 activityNum = daily.categoryCount[catIdx]; // 0-indexed
        uint256 reward = _applyDiminishingReturns(config.baseReward, activityNum);

        // Check daily cap
        uint256 projectedTotal = daily.categoryEarned[catIdx] + reward;
        if (projectedTotal > config.dailyCap) {
            reward = config.dailyCap > daily.categoryEarned[catIdx]
                ? config.dailyCap - daily.categoryEarned[catIdx]
                : 0;
        }
        require(reward > 0, "Life: daily cap reached");

        proofId = proofs.length;
        proofs.push(Proof({
            proofId: proofId,
            submitter: msg.sender,
            nodeId: nodeId,
            category: category,
            proofHash: proofHash,
            rewardAmount: reward,
            submittedAt: block.timestamp,
            attestationCount: 0,
            state: ProofState.PENDING
        }));

        // Update daily tracking
        daily.categoryCount[catIdx]++;
        daily.activeCategoryMask |= (1 << catIdx);

        emit ProofSubmitted(proofId, msg.sender, category, proofHash);
    }

    // ── Attestation ───────────────────────────────────────────────────

    /**
     * @notice Attest a submitted proof. Only nodes with trust >= 0.40 may attest.
     *         When the attestation threshold is met, the reward is minted.
     * @param proofId The proof to attest.
     */
    function attestProof(uint256 proofId) external whenNotPaused nonReentrant {
        require(proofId < proofs.length, "Life: invalid proof");
        Proof storage p = proofs[proofId];
        require(p.state == ProofState.PENDING, "Life: not pending");
        require(block.timestamp <= p.submittedAt + attestationWindow, "Life: attestation expired");
        require(msg.sender != p.submitter, "Life: cannot self-attest");
        require(!hasAttested[proofId][msg.sender], "Life: already attested");

        // Verify attestor is a registered node with sufficient trust
        bytes32 attestorNodeId = nodeRegistry.ownerToNode(msg.sender);
        require(attestorNodeId != bytes32(0), "Life: attestor not a node");
        require(nodeRegistry.isRegistered(attestorNodeId), "Life: attestor inactive");

        uint256 attestorTrust = trustOracle.getTrustScore(attestorNodeId);
        require(attestorTrust >= MIN_ATTESTOR_TRUST, "Life: trust too low");

        hasAttested[proofId][msg.sender] = true;
        p.attestationCount++;

        emit ProofAttested(proofId, msg.sender, p.attestationCount);

        // Check if attestation threshold met
        CategoryConfig storage config = categoryConfigs[p.category];
        if (p.attestationCount >= config.minAttestations) {
            _approveAndMint(p);
        }
    }

    /**
     * @notice Reject a proof. Only owner (governance) can reject.
     * @param proofId The proof to reject.
     */
    function rejectProof(uint256 proofId) external onlyOwner {
        require(proofId < proofs.length, "Life: invalid proof");
        Proof storage p = proofs[proofId];
        require(p.state == ProofState.PENDING, "Life: not pending");

        p.state = ProofState.REJECTED;
        emit ProofRejected(proofId);
    }

    /**
     * @notice Mark expired proofs. Anyone can call to clean up.
     * @param proofId The proof to check for expiry.
     */
    function expireProof(uint256 proofId) external {
        require(proofId < proofs.length, "Life: invalid proof");
        Proof storage p = proofs[proofId];
        require(p.state == ProofState.PENDING, "Life: not pending");
        require(block.timestamp > p.submittedAt + attestationWindow, "Life: not expired");

        p.state = ProofState.EXPIRED;
        emit ProofExpired(proofId);
    }

    // ── Governance ────────────────────────────────────────────────────

    /**
     * @notice Update reward configuration for a category.
     * @param category       The category to update.
     * @param baseReward     New base reward amount (WAD).
     * @param dailyCap       New daily cap per user (WAD).
     * @param minAttestations New minimum attestation count.
     * @param active         Whether the category accepts proofs.
     */
    function setCategoryConfig(
        Category category,
        uint256 baseReward,
        uint256 dailyCap,
        uint256 minAttestations,
        bool active
    ) external onlyOwner {
        require(minAttestations > 0, "Life: zero attestations");
        require(dailyCap >= baseReward, "Life: cap < base");

        categoryConfigs[category] = CategoryConfig({
            baseReward: baseReward,
            dailyCap: dailyCap,
            minAttestations: minAttestations,
            active: active
        });

        emit CategoryConfigUpdated(category, baseReward, dailyCap, minAttestations, active);
    }

    /**
     * @notice Update the global daily emission cap.
     * @param newCap New daily emission cap (WAD).
     */
    function setDailyEmissionCap(uint256 newCap) external onlyOwner {
        require(newCap > 0, "Life: zero cap");
        dailyEmissionCap = newCap;
        emit DailyEmissionCapUpdated(newCap);
    }

    /**
     * @notice Update the attestation window duration.
     * @param newWindow New window duration in seconds.
     */
    function setAttestationWindow(uint256 newWindow) external onlyOwner {
        require(newWindow >= 1 hours, "Life: window too short");
        require(newWindow <= 7 days, "Life: window too long");
        attestationWindow = newWindow;
        emit AttestationWindowUpdated(newWindow);
    }

    /**
     * @notice Pause the contract in case of emergency.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ── Views ─────────────────────────────────────────────────────────

    /**
     * @notice Total number of submitted proofs.
     */
    function proofCount() external view returns (uint256) {
        return proofs.length;
    }

    /**
     * @notice Get a user's daily activity summary for today.
     * @param user The user address.
     * @return categoryCount  Activity count per category.
     * @return categoryEarned TRUST earned per category.
     * @return activeCategories Number of distinct categories with activity.
     */
    function getDailyActivity(address user) external view returns (
        uint256[6] memory categoryCount,
        uint256[6] memory categoryEarned,
        uint256 activeCategories
    ) {
        DailyActivity storage daily = _dailyActivity[user];
        uint256 today = block.timestamp / 1 days;

        if (daily.lastResetDay != today) {
            // Would be reset; return zeroes
            return (categoryCount, categoryEarned, 0);
        }

        categoryCount = daily.categoryCount;
        categoryEarned = daily.categoryEarned;
        activeCategories = _popcount(daily.activeCategoryMask);
    }

    /**
     * @notice Calculate the streak multiplier for a user (WAD).
     * @param user The user address.
     * @return multiplier The streak multiplier in WAD (1e18 = 1.0x).
     */
    function getStreakMultiplier(address user) external view returns (uint256) {
        return _streakMultiplier(streaks[user].consecutiveDays);
    }

    /**
     * @notice Get the current consecutive-day streak for a user.
     * @param user The user address.
     * @return days The number of consecutive active days.
     */
    function consecutiveDaysOf(address user) external view returns (uint256) {
        return streaks[user].consecutiveDays;
    }

    /**
     * @notice Get the current day's emission usage.
     * @return emitted Total TRUST emitted today.
     * @return cap     Daily emission cap.
     * @return remaining Remaining emission capacity.
     */
    function getEmissionStatus() external view returns (
        uint256 emitted,
        uint256 cap,
        uint256 remaining
    ) {
        uint256 today = block.timestamp / 1 days;
        emitted = (emissionDay == today) ? todayEmitted : 0;
        cap = dailyEmissionCap;
        remaining = cap > emitted ? cap - emitted : 0;
    }

    // ── Internal ──────────────────────────────────────────────────────

    /**
     * @dev Approve a proof and mint the reward with bonuses applied.
     */
    function _approveAndMint(Proof storage p) internal {
        p.state = ProofState.APPROVED;

        uint256 reward = p.rewardAmount;

        // Apply streak bonus
        Streak storage s = streaks[p.submitter];
        uint256 today = block.timestamp / 1 days;

        if (s.lastActiveDay == today - 1 || s.lastActiveDay == today) {
            if (s.lastActiveDay != today) {
                s.consecutiveDays++;
                s.lastActiveDay = today;
                emit StreakUpdated(p.submitter, s.consecutiveDays);
            }
        } else {
            s.consecutiveDays = 1;
            s.lastActiveDay = today;
            emit StreakUpdated(p.submitter, s.consecutiveDays);
        }

        uint256 streakMult = _streakMultiplier(s.consecutiveDays);
        reward = (reward * streakMult) / WAD;

        // Apply diversity bonus
        DailyActivity storage daily = _dailyActivity[p.submitter];
        if (daily.lastResetDay == today) {
            uint256 activeCount = _popcount(daily.activeCategoryMask);
            if (activeCount >= DIVERSITY_THRESHOLD) {
                reward = (reward * DIVERSITY_BONUS) / WAD;
            }
        }

        // Check global daily emission cap
        if (emissionDay != today) {
            emissionDay = today;
            todayEmitted = 0;
        }

        if (todayEmitted + reward > dailyEmissionCap) {
            reward = dailyEmissionCap > todayEmitted
                ? dailyEmissionCap - todayEmitted
                : 0;
        }

        if (reward == 0) return;

        todayEmitted += reward;

        // Update daily earned tracking
        if (daily.lastResetDay == today) {
            daily.categoryEarned[uint256(p.category)] += reward;
        }

        // Mint TRUST to the submitter
        skillToken.mint(p.submitter, reward);

        emit RewardMinted(p.proofId, p.submitter, p.category, p.rewardAmount, reward);
    }

    /**
     * @dev Apply diminishing returns: reward * DECAY_FACTOR^activityNum.
     * @param baseReward The base reward for the category.
     * @param activityNum The 0-indexed activity number today (0 = first, full reward).
     * @return The diminished reward.
     */
    function _applyDiminishingReturns(
        uint256 baseReward,
        uint256 activityNum
    ) internal pure returns (uint256) {
        uint256 reward = baseReward;
        for (uint256 i = 0; i < activityNum; i++) {
            reward = (reward * DECAY_FACTOR) / WAD;
        }
        return reward;
    }

    /**
     * @dev Compute streak multiplier from consecutive days.
     *      7d = 1.1x, 30d = 1.3x, 90d = 1.5x. Linear interpolation between tiers.
     * @param days_ Consecutive days of activity.
     * @return multiplier WAD-scaled multiplier.
     */
    function _streakMultiplier(uint256 days_) internal pure returns (uint256) {
        if (days_ < 7) return WAD;                              // 1.0x
        if (days_ < 30) return WAD + (1e17 * (days_ - 7)) / 23; // 1.0x -> 1.1x
        if (days_ < 90) return 11e17 + (2e17 * (days_ - 30)) / 60; // 1.1x -> 1.3x
        return 15e17;                                            // 1.5x cap
    }

    /**
     * @dev Reset daily activity tracking for a new day.
     */
    function _resetDaily(DailyActivity storage daily, uint256 today) internal {
        daily.lastResetDay = today;
        for (uint256 i = 0; i < 6; i++) {
            daily.categoryCount[i] = 0;
            daily.categoryEarned[i] = 0;
        }
        daily.activeCategoryMask = 0;
    }

    /**
     * @dev Count set bits in a uint256 (population count). Only checks lower 6 bits.
     */
    function _popcount(uint256 x) internal pure returns (uint256 count) {
        for (uint256 i = 0; i < 6; i++) {
            if (x & (1 << i) != 0) count++;
        }
    }
}
