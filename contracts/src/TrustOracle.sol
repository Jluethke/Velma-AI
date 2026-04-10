// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NodeRegistry.sol";
import "./libraries/TrustMath.sol";

/**
 * @title TrustOracle
 * @notice Decentralized trust attestation with weighted median aggregation.
 * @dev Registered nodes report trust scores for other nodes. Scores are
 *      aggregated using a weighted median (reporter stake as weight) over
 *      a ring buffer of the last 50 attestations.
 *
 * Mirrors ALG trust_module.py:
 *   - Exponential decay via TrustMath.expDecay()
 *   - EMA smoothing via TrustMath.ema()
 *   - Cooldown: 1 attestation per target per epoch
 *
 * Patent Family B: Runtime governance of learning/adaptive systems.
 */
contract TrustOracle is Ownable {
    using TrustMath for uint256;

    NodeRegistry public immutable nodeRegistry;

    /// @notice Blocks per epoch for attestation cooldown.
    uint256 public constant BLOCKS_PER_EPOCH = 7200; // ~1 day at 12s blocks

    /// @notice Ring buffer capacity per node.
    uint256 public constant MAX_ATTESTATIONS = 50;

    // ── Types ──────────────────────────────────────────────────────────

    struct Attestation {
        bytes32 reporterNodeId;
        uint256 trustScore;     // WAD (0–1e18)
        uint256 reporterStake;  // Weight for aggregation
        uint256 blockNumber;
    }

    struct NodeTrust {
        Attestation[50] ring;   // Fixed-size ring buffer
        uint256 head;           // Next write index
        uint256 count;          // Total attestations stored (max 50)
        uint256 aggregated;     // Cached weighted median (WAD)
        uint256 lastUpdated;    // Block of last aggregation
    }

    mapping(bytes32 => NodeTrust) internal _trust;
    /// @dev Cooldown: reporter => target => last epoch attested
    mapping(bytes32 => mapping(bytes32 => uint256)) public lastAttestEpoch;

    // ── Events ─────────────────────────────────────────────────────────

    event TrustReported(bytes32 indexed targetNodeId, bytes32 indexed reporterNodeId, uint256 trustScore);
    event TrustAggregated(bytes32 indexed nodeId, uint256 aggregatedScore);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(address _nodeRegistry) Ownable(msg.sender) {
        require(_nodeRegistry != address(0), "TrustOracle: zero registry");
        nodeRegistry = NodeRegistry(_nodeRegistry);
    }

    // ── Attestation ────────────────────────────────────────────────────

    /**
     * @notice Report a trust score for a target node.
     * @dev Caller must own a registered node. One attestation per target per epoch.
     * @param targetNodeId The node being assessed.
     * @param trustScore   Trust score in WAD (0 to 1e18).
     * Accepts a third bytes parameter reserved for future ECDSA verification.
     */
    function reportTrust(
        bytes32 targetNodeId,
        uint256 trustScore,
        bytes calldata /* signature */
    ) external {
        require(trustScore <= 1e18, "TrustOracle: score > 1");

        // Caller must own a registered node
        bytes32 reporterNodeId = nodeRegistry.ownerToNode(msg.sender);
        require(reporterNodeId != bytes32(0), "TrustOracle: not a node");
        require(nodeRegistry.isRegistered(reporterNodeId), "TrustOracle: reporter inactive");
        require(nodeRegistry.isRegistered(targetNodeId), "TrustOracle: target inactive");
        require(reporterNodeId != targetNodeId, "TrustOracle: self-attest");

        // Epoch cooldown
        uint256 currentEpoch = block.number / BLOCKS_PER_EPOCH;
        require(
            lastAttestEpoch[reporterNodeId][targetNodeId] < currentEpoch,
            "TrustOracle: cooldown"
        );
        lastAttestEpoch[reporterNodeId][targetNodeId] = currentEpoch;

        // Write into ring buffer
        NodeTrust storage nt = _trust[targetNodeId];
        uint256 idx = nt.head % MAX_ATTESTATIONS;

        // Get reporter's stake as weight (from NodeRegistry)
        (,,,,, , uint256 reporterStake) = nodeRegistry.getNode(reporterNodeId);

        nt.ring[idx] = Attestation({
            reporterNodeId: reporterNodeId,
            trustScore: trustScore,
            reporterStake: reporterStake,
            blockNumber: block.number
        });
        nt.head++;
        if (nt.count < MAX_ATTESTATIONS) nt.count++;

        // Reaggregate
        _aggregate(targetNodeId);

        emit TrustReported(targetNodeId, reporterNodeId, trustScore);
    }

    // ── Aggregation ────────────────────────────────────────────────────

    function _aggregate(bytes32 nodeId) internal {
        NodeTrust storage nt = _trust[nodeId];
        uint256 n = nt.count;
        if (n == 0) return;

        // Collect values and weights
        uint256[] memory values = new uint256[](n);
        uint256[] memory weights = new uint256[](n);

        uint256 start = nt.head > n ? nt.head - n : 0;
        for (uint256 i = 0; i < n; i++) {
            uint256 idx = (start + i) % MAX_ATTESTATIONS;
            values[i] = nt.ring[idx].trustScore;
            weights[i] = nt.ring[idx].reporterStake;
        }

        // Sort by value (insertion sort — n <= 50)
        for (uint256 i = 1; i < n; i++) {
            uint256 key = values[i];
            uint256 wKey = weights[i];
            uint256 j = i;
            while (j > 0 && values[j - 1] > key) {
                values[j] = values[j - 1];
                weights[j] = weights[j - 1];
                j--;
            }
            values[j] = key;
            weights[j] = wKey;
        }

        nt.aggregated = TrustMath.weightedMedian(values, weights);
        nt.lastUpdated = block.number;

        emit TrustAggregated(nodeId, nt.aggregated);
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Get the aggregated trust score for a node.
     * @param nodeId The node to query.
     * @return score  Weighted median trust score (WAD).
     */
    function getTrustScore(bytes32 nodeId) external view returns (uint256) {
        return _trust[nodeId].aggregated;
    }

    /**
     * @notice Get trust-weighted voting power for governance.
     * @dev Returns trustScore directly — GovernanceDAO applies the full formula.
     * @param nodeId The node to query.
     * @return vote   The trust-weighted vote (WAD).
     */
    function getTrustWeightedVote(bytes32 nodeId) external view returns (uint256) {
        return _trust[nodeId].aggregated;
    }

    /**
     * @notice Get the number of attestations stored for a node.
     */
    function attestationCount(bytes32 nodeId) external view returns (uint256) {
        return _trust[nodeId].count;
    }
}
