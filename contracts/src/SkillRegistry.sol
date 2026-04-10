// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SkillRegistry
 * @notice On-chain registry of AI skills with versioning and metadata.
 * @dev Skills are identified by keccak256(ipfsCid). Creators can update
 *      CID and price (bumps version). Deactivation is permanent.
 *
 * Mirrors Velma's graduation pipeline: skills must be registered before
 * they can be validated, traded, or composed in the FlowFabric network.
 */
contract SkillRegistry is Ownable {

    // ── Types ──────────────────────────────────────────────────────────

    enum LicenseType { OPEN, COMMERCIAL, EXCLUSIVE, PROPRIETARY }

    struct SkillRecord {
        bytes32 skillId;
        address creator;
        string ipfsCid;
        string name;
        string domain;
        string[] tags;
        string[] inputKeys;
        string[] outputKeys;
        uint256 price;            // TRUST tokens (WAD)
        LicenseType licenseType;
        uint256 version;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
        uint256 totalValidations;
        uint256 successRate;      // basis points (0–10000)
    }

    mapping(bytes32 => SkillRecord) internal _skills;
    bytes32[] public skillIds;

    // ── Events ─────────────────────────────────────────────────────────

    event SkillRegistered(bytes32 indexed skillId, address indexed creator, string name, string ipfsCid);
    event SkillUpdated(bytes32 indexed skillId, uint256 version, string newIpfsCid, uint256 newPrice);
    event SkillDeactivated(bytes32 indexed skillId);
    event SkillStatsUpdated(bytes32 indexed skillId, uint256 totalValidations, uint256 successRate);

    constructor() Ownable(msg.sender) {}

    // ── Registration ───────────────────────────────────────────────────

    /**
     * @notice Register a new skill on-chain.
     * @param ipfsCid     IPFS content identifier for the skill package.
     * @param name        Human-readable name.
     * @param domain      Domain category (e.g. "math", "code", "nlp").
     * @param tags        Searchable tags.
     * @param inputKeys   Expected input parameter names.
     * @param outputKeys  Expected output parameter names.
     * @param price       Price in TRUST tokens (WAD). 0 = free.
     * @param licenseType The license governing usage.
     * @return skillId    The unique skill identifier.
     */
    function registerSkill(
        string calldata ipfsCid,
        string calldata name,
        string calldata domain,
        string[] calldata tags,
        string[] calldata inputKeys,
        string[] calldata outputKeys,
        uint256 price,
        LicenseType licenseType
    ) external returns (bytes32 skillId) {
        require(bytes(ipfsCid).length > 0, "SkillRegistry: empty CID");
        require(bytes(name).length > 0, "SkillRegistry: empty name");

        skillId = keccak256(abi.encodePacked(ipfsCid));
        require(_skills[skillId].createdAt == 0, "SkillRegistry: already registered");

        // Copy dynamic arrays
        string[] memory _tags = new string[](tags.length);
        for (uint256 i = 0; i < tags.length; i++) _tags[i] = tags[i];
        string[] memory _inputs = new string[](inputKeys.length);
        for (uint256 i = 0; i < inputKeys.length; i++) _inputs[i] = inputKeys[i];
        string[] memory _outputs = new string[](outputKeys.length);
        for (uint256 i = 0; i < outputKeys.length; i++) _outputs[i] = outputKeys[i];

        _skills[skillId] = SkillRecord({
            skillId: skillId,
            creator: msg.sender,
            ipfsCid: ipfsCid,
            name: name,
            domain: domain,
            tags: _tags,
            inputKeys: _inputs,
            outputKeys: _outputs,
            price: price,
            licenseType: licenseType,
            version: 1,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true,
            totalValidations: 0,
            successRate: 0
        });
        skillIds.push(skillId);

        emit SkillRegistered(skillId, msg.sender, name, ipfsCid);
    }

    // ── Updates ────────────────────────────────────────────────────────

    /**
     * @notice Update a skill's CID and/or price. Creator only. Bumps version.
     * @param skillId    The skill to update.
     * @param newIpfsCid New IPFS CID (pass empty string to keep current).
     * @param newPrice   New price in TRUST (WAD).
     */
    function updateSkill(
        bytes32 skillId,
        string calldata newIpfsCid,
        uint256 newPrice
    ) external {
        SkillRecord storage s = _skills[skillId];
        require(s.active, "SkillRegistry: not active");
        require(s.creator == msg.sender, "SkillRegistry: not creator");

        if (bytes(newIpfsCid).length > 0) {
            s.ipfsCid = newIpfsCid;
        }
        s.price = newPrice;
        s.version++;
        s.updatedAt = block.timestamp;

        emit SkillUpdated(skillId, s.version, s.ipfsCid, newPrice);
    }

    /**
     * @notice Permanently deactivate a skill. Creator or contract owner.
     * @param skillId The skill to deactivate.
     */
    function deactivateSkill(bytes32 skillId) external {
        SkillRecord storage s = _skills[skillId];
        require(s.active, "SkillRegistry: not active");
        require(
            s.creator == msg.sender || msg.sender == owner(),
            "SkillRegistry: not authorized"
        );
        s.active = false;
        emit SkillDeactivated(skillId);
    }

    // ── Stats (called by ValidationRegistry) ───────────────────────────

    /**
     * @notice Update validation statistics for a skill. Only callable by owner
     *         (which should be set to ValidationRegistry or a router).
     * @param skillId          The skill.
     * @param totalValidations New total validation count.
     * @param successRate      New success rate in basis points.
     */
    function updateStats(
        bytes32 skillId,
        uint256 totalValidations,
        uint256 successRate
    ) external onlyOwner {
        SkillRecord storage s = _skills[skillId];
        require(s.createdAt > 0, "SkillRegistry: unknown skill");
        s.totalValidations = totalValidations;
        s.successRate = successRate;
        emit SkillStatsUpdated(skillId, totalValidations, successRate);
    }

    // ── Views ──────────────────────────────────────────────────────────

    /**
     * @notice Get core skill metadata.
     */
    function getSkill(bytes32 skillId) external view returns (
        address creator,
        string memory ipfsCid,
        string memory name,
        string memory domain,
        uint256 price,
        LicenseType licenseType,
        uint256 version,
        bool active,
        uint256 totalValidations,
        uint256 successRate
    ) {
        SkillRecord storage s = _skills[skillId];
        return (s.creator, s.ipfsCid, s.name, s.domain, s.price, s.licenseType,
                s.version, s.active, s.totalValidations, s.successRate);
    }

    /**
     * @notice Check if a skill exists and is active.
     */
    function isActive(bytes32 skillId) external view returns (bool) {
        return _skills[skillId].active;
    }

    /**
     * @notice Get the creator of a skill.
     */
    function creatorOf(bytes32 skillId) external view returns (address) {
        return _skills[skillId].creator;
    }

    /**
     * @notice Get the price of a skill.
     */
    function priceOf(bytes32 skillId) external view returns (uint256) {
        return _skills[skillId].price;
    }

    /**
     * @notice Total number of registered skills.
     */
    function skillCount() external view returns (uint256) {
        return skillIds.length;
    }

    /**
     * @notice Count of skills published by a given author.
     * @param author The creator address.
     * @return count  Number of skills (active or not) authored by this address.
     */
    function authorSkillCount(address author) external view returns (uint256 count) {
        for (uint256 i = 0; i < skillIds.length; i++) {
            if (_skills[skillIds[i]].creator == author) {
                count++;
            }
        }
    }
}
