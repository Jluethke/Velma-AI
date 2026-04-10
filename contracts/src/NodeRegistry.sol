// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NodeRegistry
 * @notice Registers SkillChain validator/contributor nodes.
 * @dev Requires a minimum TRUST stake (100 tokens) held in escrow.
 *      Nodes are identified by a unique bytes32 nodeId.
 */
contract NodeRegistry is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable trustToken;

    /// @notice Minimum stake to register a node (100 TRUST).
    uint256 public constant MIN_STAKE = 100 * 1e18;

    struct NodeInfo {
        bytes32 nodeId;
        address owner;
        bytes publicKey;
        string[] domainTags;
        uint256 registeredAt;
        bool active;
        uint256 stakeAmount;
    }

    mapping(bytes32 => NodeInfo) internal _nodes;
    mapping(address => bytes32) public ownerToNode;
    bytes32[] public nodeIds;

    // ── Events ─────────────────────────────────────────────────────────

    event NodeRegistered(bytes32 indexed nodeId, address indexed owner, uint256 stakeAmount);
    event NodeDeregistered(bytes32 indexed nodeId, address indexed owner);

    // ── Constructor ────────────────────────────────────────────────────

    constructor(address _trustToken) Ownable(msg.sender) {
        require(_trustToken != address(0), "NodeRegistry: zero token");
        trustToken = IERC20(_trustToken);
    }

    // ── Registration ───────────────────────────────────────────────────

    /**
     * @notice Register a new node. Caller must have approved >= MIN_STAKE.
     * @param nodeId     Unique node identifier.
     * @param publicKey  The node's public key for signature verification.
     * @param domainTags Domain expertise tags (e.g. ["math", "code"]).
     */
    function registerNode(
        bytes32 nodeId,
        bytes calldata publicKey,
        string[] calldata domainTags
    ) external {
        require(nodeId != bytes32(0), "NodeRegistry: zero nodeId");
        require(!_nodes[nodeId].active, "NodeRegistry: already registered");
        require(ownerToNode[msg.sender] == bytes32(0), "NodeRegistry: one node per owner");
        require(publicKey.length > 0, "NodeRegistry: empty publicKey");

        trustToken.safeTransferFrom(msg.sender, address(this), MIN_STAKE);

        string[] memory tags = new string[](domainTags.length);
        for (uint256 i = 0; i < domainTags.length; i++) {
            tags[i] = domainTags[i];
        }

        _nodes[nodeId] = NodeInfo({
            nodeId: nodeId,
            owner: msg.sender,
            publicKey: publicKey,
            domainTags: tags,
            registeredAt: block.timestamp,
            active: true,
            stakeAmount: MIN_STAKE
        });
        ownerToNode[msg.sender] = nodeId;
        nodeIds.push(nodeId);

        emit NodeRegistered(nodeId, msg.sender, MIN_STAKE);
    }

    /**
     * @notice Deregister a node and return its stake.
     * @param nodeId The node to deregister.
     */
    function deregisterNode(bytes32 nodeId) external {
        NodeInfo storage node = _nodes[nodeId];
        require(node.active, "NodeRegistry: not active");
        require(node.owner == msg.sender, "NodeRegistry: not owner");

        node.active = false;
        ownerToNode[msg.sender] = bytes32(0);

        trustToken.safeTransfer(msg.sender, node.stakeAmount);

        emit NodeDeregistered(nodeId, msg.sender);
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Get full node info.
     * @param nodeId The node to query.
     * @return info  The NodeInfo struct.
     */
    function getNode(bytes32 nodeId) external view returns (
        bytes32, address, bytes memory, string[] memory, uint256, bool, uint256
    ) {
        NodeInfo storage n = _nodes[nodeId];
        return (n.nodeId, n.owner, n.publicKey, n.domainTags, n.registeredAt, n.active, n.stakeAmount);
    }

    /**
     * @notice Check if a node is currently registered and active.
     * @param nodeId The node to check.
     * @return registered True if active.
     */
    function isRegistered(bytes32 nodeId) external view returns (bool) {
        return _nodes[nodeId].active;
    }

    /**
     * @notice Total number of ever-registered nodes.
     */
    function nodeCount() external view returns (uint256) {
        return nodeIds.length;
    }

    /**
     * @notice Get the owner of a node.
     */
    function nodeOwner(bytes32 nodeId) external view returns (address) {
        return _nodes[nodeId].owner;
    }
}
