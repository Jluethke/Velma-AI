// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NodeRegistry.sol";
import "./SkillRegistry.sol";

/**
 * @title ValidationRegistry
 * @notice Records shadow validation results and handles disputes.
 * @dev Mirrors Velma's SkillShadower: validators run skills in shadow mode,
 *      compare outputs to reference, and submit attestations. Consensus
 *      requires 3+ validators with 67%+ success rate.
 *
 * Dispute flow:
 *   1. challengeValidation() — any registered node can challenge
 *   2. Arbitrator selected: keccak256(skillId, challengeId) % validatorCount
 *   3. resolveChallenge() — arbitrator decides, loser gets slashed
 */
contract ValidationRegistry is Ownable {

    NodeRegistry public immutable nodeRegistry;
    SkillRegistry public immutable skillRegistry;

    /// @notice Address authorized to execute slashing (set to Staking contract).
    address public stakingContract;

    // ── Types ──────────────────────────────────────────────────────────

    struct ValidationRecord {
        bytes32 skillId;
        bytes32 validatorNodeId;
        bool success;
        uint256 shadowRunCount;
        uint256 matchCount;
        uint256 avgSimilarity;   // WAD (0–1e18)
        string resultIpfsCid;
        uint256 timestamp;
    }

    struct Challenge {
        uint256 challengeId;
        bytes32 skillId;
        bytes32 challengerNodeId;
        uint256 targetValidationIdx;
        bytes32 arbitratorNodeId;
        bool resolved;
        bool upheld;             // true = challenge was valid
        uint256 createdAt;
    }

    /// @notice Minimum validators required for consensus.
    uint256 public constant MIN_VALIDATORS = 3;
    /// @notice Minimum success rate for consensus (67% = 6700 bps).
    uint256 public constant CONSENSUS_THRESHOLD_BPS = 6700;

    mapping(bytes32 => ValidationRecord[]) public validations;
    mapping(bytes32 => uint256) public successCount;
    mapping(bytes32 => uint256) public totalCount;

    Challenge[] public challenges;
    uint256 public nextChallengeId;

    // ── Events ─────────────────────────────────────────────────────────

    event ValidationSubmitted(bytes32 indexed skillId, bytes32 indexed validatorNodeId, bool success);
    event ConsensusReached(bytes32 indexed skillId, uint256 totalValidations, uint256 successRate);
    event ChallengeCreated(uint256 indexed challengeId, bytes32 indexed skillId, bytes32 indexed challengerNodeId);
    event ChallengeResolved(uint256 indexed challengeId, bool upheld);
    event StakingContractSet(address stakingContract);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(
        address _nodeRegistry,
        address _skillRegistry
    ) Ownable(msg.sender) {
        require(_nodeRegistry != address(0), "ValReg: zero nodeRegistry");
        require(_skillRegistry != address(0), "ValReg: zero skillRegistry");
        nodeRegistry = NodeRegistry(_nodeRegistry);
        skillRegistry = SkillRegistry(_skillRegistry);
    }

    /**
     * @notice Set the Staking contract address (for slash calls).
     * @param _staking The Staking contract address.
     */
    function setStakingContract(address _staking) external onlyOwner {
        require(_staking != address(0), "ValReg: zero staking");
        stakingContract = _staking;
        emit StakingContractSet(_staking);
    }

    // ── Validation Submission ──────────────────────────────────────────

    /**
     * @notice Submit a shadow validation result for a skill.
     * @dev Caller must own a registered node. Mirrors SkillShadower.record_shadow().
     * @param skillId        The skill that was validated.
     * @param success        Whether the skill output matched reference.
     * @param shadowRunCount Total shadow runs performed.
     * @param matchCount     Number of runs that matched.
     * @param avgSimilarity  Average output similarity (WAD).
     * @param resultIpfsCid  IPFS CID of the detailed validation report.
     */
    function submitValidation(
        bytes32 skillId,
        bool success,
        uint256 shadowRunCount,
        uint256 matchCount,
        uint256 avgSimilarity,
        string calldata resultIpfsCid
    ) external {
        require(skillRegistry.isActive(skillId), "ValReg: skill not active");

        bytes32 validatorNodeId = nodeRegistry.ownerToNode(msg.sender);
        require(validatorNodeId != bytes32(0), "ValReg: not a node");
        require(nodeRegistry.isRegistered(validatorNodeId), "ValReg: node inactive");

        validations[skillId].push(ValidationRecord({
            skillId: skillId,
            validatorNodeId: validatorNodeId,
            success: success,
            shadowRunCount: shadowRunCount,
            matchCount: matchCount,
            avgSimilarity: avgSimilarity,
            resultIpfsCid: resultIpfsCid,
            timestamp: block.timestamp
        }));

        totalCount[skillId]++;
        if (success) successCount[skillId]++;

        emit ValidationSubmitted(skillId, validatorNodeId, success);

        // Check for consensus
        if (totalCount[skillId] >= MIN_VALIDATORS) {
            uint256 rate = (successCount[skillId] * 10000) / totalCount[skillId];
            if (rate >= CONSENSUS_THRESHOLD_BPS) {
                emit ConsensusReached(skillId, totalCount[skillId], rate);
            }
        }
    }

    // ── Consensus Query ────────────────────────────────────────────────

    /**
     * @notice Check if a skill has reached validation consensus.
     * @param skillId The skill to check.
     * @return hasConsensus  True if 3+ validators and 67%+ success.
     * @return numValidators Number of validations submitted.
     * @return successRateBps Success rate in basis points.
     */
    function getValidationConsensus(bytes32 skillId) external view returns (
        bool hasConsensus,
        uint256 numValidators,
        uint256 successRateBps
    ) {
        numValidators = totalCount[skillId];
        if (numValidators == 0) return (false, 0, 0);

        successRateBps = (successCount[skillId] * 10000) / numValidators;
        hasConsensus = numValidators >= MIN_VALIDATORS && successRateBps >= CONSENSUS_THRESHOLD_BPS;
    }

    // ── Disputes ───────────────────────────────────────────────────────

    /**
     * @notice Challenge a specific validation result.
     * @param skillId              The skill whose validation is disputed.
     * @param targetValidationIdx  Index into the validations[skillId] array.
     */
    function challengeValidation(
        bytes32 skillId,
        uint256 targetValidationIdx
    ) external {
        require(targetValidationIdx < validations[skillId].length, "ValReg: invalid index");

        bytes32 challengerNodeId = nodeRegistry.ownerToNode(msg.sender);
        require(challengerNodeId != bytes32(0), "ValReg: not a node");
        require(nodeRegistry.isRegistered(challengerNodeId), "ValReg: challenger inactive");

        // Arbitrator selection: deterministic from skillId + challengeId
        uint256 challengeId = nextChallengeId++;
        uint256 nodeCount = nodeRegistry.nodeCount();
        require(nodeCount >= 3, "ValReg: need 3+ nodes");

        uint256 arbIdx = uint256(keccak256(abi.encodePacked(skillId, challengeId))) % nodeCount;
        bytes32 arbitratorNodeId = nodeRegistry.nodeIds(arbIdx);

        // Ensure arbitrator is not challenger or the challenged validator
        require(arbitratorNodeId != challengerNodeId, "ValReg: arb is challenger");
        require(
            arbitratorNodeId != validations[skillId][targetValidationIdx].validatorNodeId,
            "ValReg: arb is defendant"
        );

        challenges.push(Challenge({
            challengeId: challengeId,
            skillId: skillId,
            challengerNodeId: challengerNodeId,
            targetValidationIdx: targetValidationIdx,
            arbitratorNodeId: arbitratorNodeId,
            resolved: false,
            upheld: false,
            createdAt: block.timestamp
        }));

        emit ChallengeCreated(challengeId, skillId, challengerNodeId);
    }

    /**
     * @notice Resolve a challenge. Only the assigned arbitrator can call.
     * @param challengeId The challenge to resolve.
     * @param upheld      True if the challenge is valid (original validation was bad).
     */
    function resolveChallenge(uint256 challengeId, bool upheld) external {
        require(challengeId < challenges.length, "ValReg: invalid challenge");
        Challenge storage c = challenges[challengeId];
        require(!c.resolved, "ValReg: already resolved");

        // Only arbitrator's owner can resolve
        address arbOwner = nodeRegistry.nodeOwner(c.arbitratorNodeId);
        require(msg.sender == arbOwner, "ValReg: not arbitrator");

        c.resolved = true;
        c.upheld = upheld;

        emit ChallengeResolved(challengeId, upheld);
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Get validation count for a skill.
     */
    function validationCount(bytes32 skillId) external view returns (uint256) {
        return validations[skillId].length;
    }

    /**
     * @notice Get total number of challenges.
     */
    function challengeCount() external view returns (uint256) {
        return challenges.length;
    }

    /**
     * @notice Count of validations submitted by a given validator address.
     * @param validator The validator's wallet address.
     * @return count    Total validations submitted across all skills.
     */
    function validatorSubmissionCount(address validator) external view returns (uint256 count) {
        bytes32 nodeId = nodeRegistry.ownerToNode(validator);
        if (nodeId == bytes32(0)) return 0;
        for (uint256 i = 0; i < skillRegistry.skillCount(); i++) {
            bytes32 sid = skillRegistry.skillIds(i);
            ValidationRecord[] storage recs = validations[sid];
            for (uint256 j = 0; j < recs.length; j++) {
                if (recs[j].validatorNodeId == nodeId) {
                    count++;
                }
            }
        }
    }
}
