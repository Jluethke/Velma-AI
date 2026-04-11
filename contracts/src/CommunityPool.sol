// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CommunityPool
 * @notice Values earned TRUST above purchased TRUST by distributing a portion
 *         of every marketplace purchase and subscription payment back to addresses
 *         that earned their TRUST through real activity.
 *
 * Mechanism
 * ─────────
 * The Marketplace routes a "purchase premium" (% of every flow purchase /
 * subscription fee) here as TRUST deposits. This pool is NOT open to buyers
 * who simply acquired TRUST — it distributes ONLY to addresses whose earned
 * weight was registered by a trusted EARNER_ROLE contract (LifeRewards,
 * OnboardingRewards, bounty payouts, etc.).
 *
 * Distribution uses a share-accumulator pattern (Synthetix-style):
 *   accSharePerWeight  — monotonically increasing, updated on each deposit
 *   earnedWeight[user] — lifetime TRUST earned via approved earn contracts
 *
 * Rewards accrue continuously. Users call claim() at any time.
 *
 * Why this closes the gap
 * ───────────────────────
 * Purchased TRUST costs the buyer slightly more (premium) and that premium
 * flows directly to earners. Earning TRUST therefore has a real, on-chain
 * yield advantage over buying it. The more purchase activity in the ecosystem,
 * the more attractive earning becomes — a self-reinforcing flywheel.
 *
 * Roles
 * ─────
 *   DEFAULT_ADMIN_ROLE — governance; can update earn sources, drain to treasury
 *   DEPOSITOR_ROLE     — Marketplace; calls deposit() when routing premium
 *   EARNER_ROLE        — LifeRewards, OnboardingRewards, any earn contract;
 *                        calls notifyEarned() when minting TRUST to a user
 */
contract CommunityPool is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ──────────────────────────────────────────────────────────

    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");
    bytes32 public constant EARNER_ROLE    = keccak256("EARNER_ROLE");

    // ── Token ──────────────────────────────────────────────────────────

    IERC20 public immutable token;

    // ── Distribution accumulator ───────────────────────────────────────

    /// @dev Total TRUST deposited (for reference only — not needed for math).
    uint256 public totalDeposited;

    /// @dev Cumulative TRUST per unit of earned weight (WAD / WAD = WAD).
    ///      Increases with every deposit.
    uint256 public accSharePerWeight;

    /// @dev Sum of all earned weights across all users.
    uint256 public totalEarnedWeight;

    // ── Per-user state ─────────────────────────────────────────────────

    /// @notice Lifetime earned-TRUST weight for each address.
    ///         Reported by EARNER_ROLE contracts when minting to a user.
    mapping(address => uint256) public earnedWeight;

    /// @notice Snapshot of `accSharePerWeight` at the last time a user's
    ///         rewards were settled. Used to compute unsettled rewards.
    mapping(address => uint256) public userAcc;

    /// @notice Settled (but not yet withdrawn) rewards per user.
    mapping(address => uint256) public pendingRewards;

    // ── Events ─────────────────────────────────────────────────────────

    event Deposited(address indexed from, uint256 amount);
    event EarnedWeightAdded(address indexed user, uint256 amount, uint256 newTotal);
    event Claimed(address indexed user, uint256 amount);
    event EmergencyDrain(address indexed to, uint256 amount);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(address _token) {
        require(_token != address(0), "CommunityPool: zero token");
        token = IERC20(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ── Deposit (called by Marketplace) ───────────────────────────────

    /**
     * @notice Deposit TRUST into the pool. Immediately increases the
     *         per-weight share accumulator, so all current earners benefit.
     * @dev Caller must have DEPOSITOR_ROLE and must have approved this
     *      contract for `amount` TRUST before calling.
     * @param amount Amount of TRUST to deposit (WAD).
     */
    function deposit(uint256 amount) external onlyRole(DEPOSITOR_ROLE) nonReentrant {
        require(amount > 0, "CommunityPool: zero deposit");

        token.safeTransferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;

        if (totalEarnedWeight > 0) {
            // Distribute immediately to current earner weight
            accSharePerWeight += (amount * 1e18) / totalEarnedWeight;
        }
        // If no earners yet, tokens sit in the pool until the first notifyEarned
        // and can be distributed on the next deposit.

        emit Deposited(msg.sender, amount);
    }

    // ── Earn weight (called by reward contracts) ───────────────────────

    /**
     * @notice Register earned TRUST for a user. Called by LifeRewards,
     *         OnboardingRewards, or any other approved earn contract at the
     *         moment TRUST is minted to the user.
     * @dev Settles the user's existing pending rewards BEFORE increasing weight,
     *      so they don't retroactively claim a larger share of past epochs.
     * @param user   The address that earned TRUST.
     * @param amount Amount of TRUST they earned (WAD). Adds to their weight.
     */
    function notifyEarned(address user, uint256 amount) external onlyRole(EARNER_ROLE) {
        require(user != address(0), "CommunityPool: zero user");
        require(amount > 0, "CommunityPool: zero amount");

        _settle(user);

        earnedWeight[user]  += amount;
        totalEarnedWeight   += amount;

        emit EarnedWeightAdded(user, amount, earnedWeight[user]);
    }

    // ── Claim ──────────────────────────────────────────────────────────

    /**
     * @notice Claim all pending community pool rewards for the caller.
     */
    function claim() external nonReentrant {
        _settle(msg.sender);

        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "CommunityPool: nothing to claim");

        pendingRewards[msg.sender] = 0;
        token.safeTransfer(msg.sender, amount);

        emit Claimed(msg.sender, amount);
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Preview how much TRUST a user can claim right now.
     */
    function pendingClaim(address user) external view returns (uint256) {
        uint256 delta = accSharePerWeight - userAcc[user];
        uint256 unsettled = (earnedWeight[user] * delta) / 1e18;
        return pendingRewards[user] + unsettled;
    }

    /**
     * @notice Current pool balance (TRUST sitting here, not yet claimed).
     */
    function poolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // ── Admin ──────────────────────────────────────────────────────────

    /**
     * @notice Emergency drain to treasury. Only if pool is stuck (e.g. no
     *         earners ever registered). Does NOT touch pending user claims.
     * @param to     Destination address.
     * @param amount Amount to drain.
     */
    function emergencyDrain(address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        require(to != address(0), "CommunityPool: zero to");
        token.safeTransfer(to, amount);
        emit EmergencyDrain(to, amount);
    }

    // ── Internal ───────────────────────────────────────────────────────

    /**
     * @dev Settle pending rewards for a user into `pendingRewards[user]`.
     *      Called before any weight change or claim.
     */
    function _settle(address user) internal {
        uint256 delta = accSharePerWeight - userAcc[user];
        if (delta > 0 && earnedWeight[user] > 0) {
            pendingRewards[user] += (earnedWeight[user] * delta) / 1e18;
        }
        userAcc[user] = accSharePerWeight;
    }
}
