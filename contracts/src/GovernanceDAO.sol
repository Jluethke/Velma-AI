// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Staking.sol";
import "./TrustOracle.sol";
import "./NodeRegistry.sol";
import "./libraries/TrustMath.sol";

/**
 * @title GovernanceDAO
 * @notice Trust-weighted decentralized governance for the SkillChain network.
 * @dev Voting power = sqrt(stake) * trustScore * (1 + log2(reputation)).
 *      Mirrors ALG GovernanceAction tiers: proposals move through voting,
 *      timelock, and execution phases.
 *
 * Proposal types:
 *   PARAMETER_CHANGE — Adjust protocol parameters
 *   SKILL_REMOVAL    — Remove a malicious/broken skill
 *   NODE_BAN         — Ban a malicious node
 *   TREASURY_SPEND   — Authorize treasury expenditure
 *   EMERGENCY        — Fast-track with reduced quorum/timelock
 *
 * Patent Family B: Runtime governance of learning/adaptive systems.
 */
contract GovernanceDAO is Ownable, ReentrancyGuard {
    using TrustMath for uint256;

    Staking public immutable staking;
    TrustOracle public immutable trustOracle;
    NodeRegistry public immutable nodeRegistry;

    // ── Configuration ──────────────────────────────────────────────────

    /// @notice Quorum: 10% of total registered node count must vote.
    uint256 public constant QUORUM_BPS = 1000; // 10%

    /// @notice Standard voting period.
    uint256 public constant VOTING_PERIOD = 3 days;
    /// @notice Emergency voting period.
    uint256 public constant EMERGENCY_VOTING_PERIOD = 6 hours;

    /// @notice Standard timelock before execution.
    uint256 public constant TIMELOCK = 24 hours;
    /// @notice Emergency timelock.
    uint256 public constant EMERGENCY_TIMELOCK = 1 hours;

    // ── Types ──────────────────────────────────────────────────────────

    enum ProposalType {
        PARAMETER_CHANGE,
        SKILL_REMOVAL,
        NODE_BAN,
        TREASURY_SPEND,
        EMERGENCY
    }

    enum ProposalState {
        ACTIVE,
        PASSED,
        FAILED,
        QUEUED,
        EXECUTED,
        CANCELLED
    }

    struct Proposal {
        uint256 proposalId;
        address proposer;
        ProposalType proposalType;
        bytes data;                  // ABI-encoded action data
        string description;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 executableAt;        // After timelock
        uint256 forVotes;            // Weighted votes in favor
        uint256 againstVotes;        // Weighted votes against
        uint256 voterCount;
        ProposalState state;
    }

    /// @notice Reputation scores (set by owner, represents on-chain track record).
    mapping(bytes32 => uint256) public reputation; // WAD

    Proposal[] public proposals;
    /// @dev proposalId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ── Events ─────────────────────────────────────────────────────────

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType proposalType);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalQueued(uint256 indexed proposalId, uint256 executableAt);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ReputationUpdated(bytes32 indexed nodeId, uint256 reputation);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(
        address _staking,
        address _trustOracle,
        address _nodeRegistry
    ) Ownable(msg.sender) {
        require(_staking != address(0), "DAO: zero staking");
        require(_trustOracle != address(0), "DAO: zero oracle");
        require(_nodeRegistry != address(0), "DAO: zero nodeReg");

        staking = Staking(_staking);
        trustOracle = TrustOracle(_trustOracle);
        nodeRegistry = NodeRegistry(_nodeRegistry);
    }

    // ── Proposals ──────────────────────────────────────────────────────

    /**
     * @notice Create a new governance proposal.
     * @param proposalType The type of proposal.
     * @param data         ABI-encoded action data.
     * @param description  Human-readable description.
     * @return proposalId  The new proposal's ID.
     */
    function propose(
        ProposalType proposalType,
        bytes calldata data,
        string calldata description
    ) external returns (uint256 proposalId) {
        bytes32 nodeId = nodeRegistry.ownerToNode(msg.sender);
        require(nodeId != bytes32(0), "DAO: not a node");
        require(nodeRegistry.isRegistered(nodeId), "DAO: node inactive");
        require(staking.stakedAmount(nodeId) > 0, "DAO: no stake");

        bool isEmergency = proposalType == ProposalType.EMERGENCY;
        uint256 votingEnd = block.timestamp + (isEmergency ? EMERGENCY_VOTING_PERIOD : VOTING_PERIOD);

        proposalId = proposals.length;
        proposals.push(Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            proposalType: proposalType,
            data: data,
            description: description,
            createdAt: block.timestamp,
            votingEndsAt: votingEnd,
            executableAt: 0,
            forVotes: 0,
            againstVotes: 0,
            voterCount: 0,
            state: ProposalState.ACTIVE
        }));

        emit ProposalCreated(proposalId, msg.sender, proposalType);
    }

    // ── Voting ─────────────────────────────────────────────────────────

    /**
     * @notice Vote on a proposal. Power = sqrt(stake) * trustScore * (1 + log2(reputation)).
     * @param proposalId The proposal to vote on.
     * @param support    True = for, false = against.
     */
    function vote(uint256 proposalId, bool support) external {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.ACTIVE, "DAO: not active");
        require(block.timestamp < p.votingEndsAt, "DAO: voting ended");
        require(!hasVoted[proposalId][msg.sender], "DAO: already voted");

        bytes32 nodeId = nodeRegistry.ownerToNode(msg.sender);
        require(nodeId != bytes32(0), "DAO: not a node");

        uint256 weight = _votingPower(nodeId);
        require(weight > 0, "DAO: zero voting power");

        hasVoted[proposalId][msg.sender] = true;
        p.voterCount++;

        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Finalize voting and queue for execution if passed.
     * @param proposalId The proposal to finalize.
     */
    function finalize(uint256 proposalId) external {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.ACTIVE, "DAO: not active");
        require(block.timestamp >= p.votingEndsAt, "DAO: voting ongoing");

        // Check quorum: voterCount >= 10% of total nodes
        uint256 totalNodes = nodeRegistry.nodeCount();
        uint256 quorumRequired = (totalNodes * QUORUM_BPS) / 10000;
        if (quorumRequired == 0) quorumRequired = 1;

        if (p.voterCount < quorumRequired || p.forVotes <= p.againstVotes) {
            p.state = ProposalState.FAILED;
            return;
        }

        bool isEmergency = p.proposalType == ProposalType.EMERGENCY;
        p.executableAt = block.timestamp + (isEmergency ? EMERGENCY_TIMELOCK : TIMELOCK);
        p.state = ProposalState.QUEUED;

        emit ProposalQueued(proposalId, p.executableAt);
    }

    /**
     * @notice Execute a queued proposal after its timelock.
     * @param proposalId The proposal to execute.
     */
    function execute(uint256 proposalId) external nonReentrant {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.QUEUED, "DAO: not queued");
        require(block.timestamp >= p.executableAt, "DAO: timelock active");

        p.state = ProposalState.EXECUTED;

        // Execution logic is handled externally via p.data
        // The DAO acts as a signaling mechanism; execution targets
        // are decoded and called by authorized executors.

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal. Only proposer or owner.
     * @param proposalId The proposal to cancel.
     */
    function cancel(uint256 proposalId) external {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(
            p.state == ProposalState.ACTIVE || p.state == ProposalState.QUEUED,
            "DAO: cannot cancel"
        );
        require(
            msg.sender == p.proposer || msg.sender == owner(),
            "DAO: not authorized"
        );

        p.state = ProposalState.CANCELLED;
        emit ProposalCancelled(proposalId);
    }

    // ── Reputation ─────────────────────────────────────────────────────

    /**
     * @notice Set reputation score for a node. Owner only.
     * @param nodeId The node.
     * @param rep    Reputation value (WAD).
     */
    function setReputation(bytes32 nodeId, uint256 rep) external onlyOwner {
        reputation[nodeId] = rep;
        emit ReputationUpdated(nodeId, rep);
    }

    // ── Voting Power ───────────────────────────────────────────────────

    /**
     * @notice Compute voting power: sqrt(stake) * trustScore * (1 + log2(reputation)).
     * @param nodeId The node to compute power for.
     * @return power The voting power (WAD).
     */
    function votingPower(bytes32 nodeId) external view returns (uint256) {
        return _votingPower(nodeId);
    }

    function _votingPower(bytes32 nodeId) internal view returns (uint256) {
        uint256 stakeAmt = staking.stakedAmount(nodeId);
        if (stakeAmt == 0) return 0;

        uint256 sqrtStake = TrustMath.sqrt(stakeAmt);
        uint256 trust = trustOracle.getTrustScore(nodeId);
        if (trust == 0) trust = 5e17; // default 0.5 for unattested nodes

        uint256 rep = reputation[nodeId];
        uint256 repFactor = 1e18; // base = 1.0
        if (rep > 1e18) {
            repFactor += TrustMath.log2(rep);
        }

        return (sqrtStake * trust / 1e18) * repFactor / 1e18;
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Total number of proposals.
     */
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @notice Get proposal state.
     */
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        require(proposalId < proposals.length, "DAO: invalid proposal");
        return proposals[proposalId].state;
    }
}
