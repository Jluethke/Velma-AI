// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title OnboardingRewards
 * @notice Distributes starter tokens and milestone bonuses to bootstrap the
 *         SkillChain ecosystem. Rewards come from a pre-funded pool — no
 *         minting occurs here.
 *
 * Bonuses (one-time per wallet):
 *   - Starter:           10 TRUST   (first-time registered node)
 *   - First Skill:       50 TRUST   (publish first skill)
 *   - First Validation:  25 TRUST   (submit first validation)
 *   - First Purchase:    10 TRUST   (buy first skill)
 *   - Referral:          15 TRUST to referrer, 10 TRUST to new user
 *   - Activity Streak:    5 TRUST per completed 7-day streak
 */
contract OnboardingRewards is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ── External Contracts ────────────────────────────────────────────

    IERC20 public immutable trustToken;
    INodeRegistry public immutable nodeRegistry;
    ISkillRegistry public immutable skillRegistry;
    IValidationRegistry public immutable validationRegistry;
    IMarketplace public immutable marketplace;
    ILifeRewards public immutable lifeRewards;

    // ── Reward Amounts (adjustable by governance) ─────────────────────

    uint256 public starterAmount     = 10 * 1e18;
    uint256 public firstSkillAmount  = 50 * 1e18;
    uint256 public firstValAmount    = 25 * 1e18;
    uint256 public firstBuyAmount    = 10 * 1e18;
    uint256 public referrerAmount    = 15 * 1e18;
    uint256 public referredAmount    = 10 * 1e18;
    uint256 public streakAmount      =  5 * 1e18;

    uint256 public constant MAX_REFERRALS = 50;
    uint256 public constant REFERRAL_WINDOW = 24 hours;

    // ── Claim Tracking ────────────────────────────────────────────────

    mapping(address => bool) public starterClaimed;
    mapping(address => bool) public firstSkillClaimed;
    mapping(address => bool) public firstValClaimed;
    mapping(address => bool) public firstBuyClaimed;
    mapping(address => bool) public referralClaimedByNewUser;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public streaksClaimedCount;

    // ── Events ────────────────────────────────────────────────────────

    event StarterClaimed(address indexed user, uint256 amount);
    event MilestoneClaimed(address indexed user, string milestone, uint256 amount);
    event ReferralClaimed(address indexed referrer, address indexed newUser, uint256 referrerReward, uint256 newUserReward);
    event PoolFunded(address indexed funder, uint256 amount);

    // ── Constructor ───────────────────────────────────────────────────

    constructor(
        address _trustToken,
        address _nodeRegistry,
        address _skillRegistry,
        address _validationRegistry,
        address _marketplace,
        address _lifeRewards
    ) Ownable(msg.sender) {
        require(_trustToken != address(0), "OnboardingRewards: zero token");
        require(_nodeRegistry != address(0), "OnboardingRewards: zero nodeReg");
        require(_skillRegistry != address(0), "OnboardingRewards: zero skillReg");
        require(_validationRegistry != address(0), "OnboardingRewards: zero valReg");
        require(_marketplace != address(0), "OnboardingRewards: zero marketplace");
        require(_lifeRewards != address(0), "OnboardingRewards: zero lifeRewards");

        trustToken = IERC20(_trustToken);
        nodeRegistry = INodeRegistry(_nodeRegistry);
        skillRegistry = ISkillRegistry(_skillRegistry);
        validationRegistry = IValidationRegistry(_validationRegistry);
        marketplace = IMarketplace(_marketplace);
        lifeRewards = ILifeRewards(_lifeRewards);
    }

    // ── Modifiers ─────────────────────────────────────────────────────

    modifier onlyRegisteredNode() {
        bytes32 nodeId = nodeRegistry.ownerToNode(msg.sender);
        require(nodeId != bytes32(0), "OnboardingRewards: not registered");
        require(nodeRegistry.isRegistered(nodeId), "OnboardingRewards: node inactive");
        _;
    }

    // ── Starter Bonus ─────────────────────────────────────────────────

    /**
     * @notice Claim one-time starter bonus (10 TRUST). Must be a registered node.
     */
    function claimStarter() external nonReentrant whenNotPaused onlyRegisteredNode {
        require(!starterClaimed[msg.sender], "OnboardingRewards: starter already claimed");
        starterClaimed[msg.sender] = true;
        _distribute(msg.sender, starterAmount);
        emit StarterClaimed(msg.sender, starterAmount);
    }

    // ── Milestone Bonuses ─────────────────────────────────────────────

    /**
     * @notice Claim first-skill bonus (50 TRUST). Verified via SkillRegistry.
     */
    function claimFirstSkillBonus() external nonReentrant whenNotPaused onlyRegisteredNode {
        require(!firstSkillClaimed[msg.sender], "OnboardingRewards: first-skill already claimed");

        // Verify caller has at least one skill in the registry
        uint256 count = skillRegistry.authorSkillCount(msg.sender);
        require(count > 0, "OnboardingRewards: no skills published");

        firstSkillClaimed[msg.sender] = true;
        _distribute(msg.sender, firstSkillAmount);
        emit MilestoneClaimed(msg.sender, "first-skill", firstSkillAmount);
    }

    /**
     * @notice Claim first-validation bonus (25 TRUST). Verified via ValidationRegistry.
     */
    function claimFirstValidationBonus() external nonReentrant whenNotPaused onlyRegisteredNode {
        require(!firstValClaimed[msg.sender], "OnboardingRewards: first-validation already claimed");

        uint256 count = validationRegistry.validatorSubmissionCount(msg.sender);
        require(count > 0, "OnboardingRewards: no validations submitted");

        firstValClaimed[msg.sender] = true;
        _distribute(msg.sender, firstValAmount);
        emit MilestoneClaimed(msg.sender, "first-validation", firstValAmount);
    }

    /**
     * @notice Claim first-purchase bonus (10 TRUST). Verified via Marketplace.
     */
    function claimFirstPurchaseBonus() external nonReentrant whenNotPaused onlyRegisteredNode {
        require(!firstBuyClaimed[msg.sender], "OnboardingRewards: first-purchase already claimed");

        uint256 count = marketplace.purchaseCountOf(msg.sender);
        require(count > 0, "OnboardingRewards: no purchases made");

        firstBuyClaimed[msg.sender] = true;
        _distribute(msg.sender, firstBuyAmount);
        emit MilestoneClaimed(msg.sender, "first-purchase", firstBuyAmount);
    }

    /**
     * @notice Claim streak bonus (5 TRUST per completed 7-day streak).
     * @param streakDays The streak length reported by LifeRewards.
     */
    function claimStreakBonus(uint8 streakDays) external nonReentrant whenNotPaused onlyRegisteredNode {
        require(streakDays >= 7, "OnboardingRewards: need 7+ day streak");

        uint256 currentStreak = lifeRewards.consecutiveDaysOf(msg.sender);
        require(currentStreak >= streakDays, "OnboardingRewards: streak not reached");

        uint256 completedStreaks = streakDays / 7;
        require(completedStreaks > streaksClaimedCount[msg.sender], "OnboardingRewards: streaks already claimed");

        uint256 newStreaks = completedStreaks - streaksClaimedCount[msg.sender];
        streaksClaimedCount[msg.sender] = completedStreaks;

        uint256 reward = newStreaks * streakAmount;
        _distribute(msg.sender, reward);
        emit MilestoneClaimed(msg.sender, "streak", reward);
    }

    // ── Referral Bonus ────────────────────────────────────────────────

    /**
     * @notice Claim referral bonus. Referrer gets 15 TRUST, new user gets 10 TRUST.
     * @param referrerNodeId The node ID of the referrer.
     */
    function claimReferralBonus(bytes32 referrerNodeId) external nonReentrant whenNotPaused onlyRegisteredNode {
        require(!referralClaimedByNewUser[msg.sender], "OnboardingRewards: referral already claimed");
        require(nodeRegistry.isRegistered(referrerNodeId), "OnboardingRewards: referrer not registered");

        // Referrer must be a different address
        (,address referrerOwner,,,,,) = nodeRegistry.getNode(referrerNodeId);
        require(referrerOwner != msg.sender, "OnboardingRewards: cannot self-refer");
        require(referralCount[referrerOwner] < MAX_REFERRALS, "OnboardingRewards: referrer maxed out");

        // New user must have registered within last 24 hours
        bytes32 newUserNodeId = nodeRegistry.ownerToNode(msg.sender);
        (,,,,uint256 registeredAt,,) = nodeRegistry.getNode(newUserNodeId);
        require(block.timestamp - registeredAt <= REFERRAL_WINDOW, "OnboardingRewards: registration too old");

        referralClaimedByNewUser[msg.sender] = true;
        referralCount[referrerOwner]++;

        _distribute(referrerOwner, referrerAmount);
        _distribute(msg.sender, referredAmount);

        emit ReferralClaimed(referrerOwner, msg.sender, referrerAmount, referredAmount);
    }

    // ── Pool Management ───────────────────────────────────────────────

    /**
     * @notice Fund the rewards pool. Caller must have approved this contract.
     * @param amount Amount of TRUST to add to the pool.
     */
    function fundPool(uint256 amount) external {
        require(amount > 0, "OnboardingRewards: zero amount");
        trustToken.safeTransferFrom(msg.sender, address(this), amount);
        emit PoolFunded(msg.sender, amount);
    }

    /**
     * @notice Current TRUST balance available for rewards.
     */
    function poolBalance() external view returns (uint256) {
        return trustToken.balanceOf(address(this));
    }

    /**
     * @notice Update reward amounts. Only owner (governance).
     */
    function setRewardAmounts(
        uint256 _starter,
        uint256 _firstSkill,
        uint256 _firstVal,
        uint256 _firstBuy,
        uint256 _referrer,
        uint256 _referred,
        uint256 _streak
    ) external onlyOwner {
        starterAmount    = _starter;
        firstSkillAmount = _firstSkill;
        firstValAmount   = _firstVal;
        firstBuyAmount   = _firstBuy;
        referrerAmount   = _referrer;
        referredAmount   = _referred;
        streakAmount     = _streak;
    }

    /**
     * @notice Pause all reward claims.
     */
    function pauseRewards() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause reward claims.
     */
    function unpauseRewards() external onlyOwner {
        _unpause();
    }

    // ── Internal ──────────────────────────────────────────────────────

    function _distribute(address to, uint256 amount) internal {
        require(trustToken.balanceOf(address(this)) >= amount, "OnboardingRewards: pool depleted");
        trustToken.safeTransfer(to, amount);
    }
}

// ── Minimal Interfaces ────────────────────────────────────────────────────

interface INodeRegistry {
    function ownerToNode(address owner) external view returns (bytes32);
    function isRegistered(bytes32 nodeId) external view returns (bool);
    function getNode(bytes32 nodeId) external view returns (
        bytes32, address, bytes memory, string[] memory, uint256, bool, uint256
    );
}

interface ISkillRegistry {
    /// @notice Returns the number of skills published by a given author.
    function authorSkillCount(address author) external view returns (uint256);
}

interface IValidationRegistry {
    /// @notice Returns the number of validations submitted by a given validator address.
    function validatorSubmissionCount(address validator) external view returns (uint256);
}

interface IMarketplace {
    /// @notice Returns the total number of skills purchased by a given buyer.
    function purchaseCountOf(address buyer) external view returns (uint256);
}

interface ILifeRewards {
    /// @notice Returns the current consecutive-day streak for a user.
    function consecutiveDaysOf(address user) external view returns (uint256);
}
