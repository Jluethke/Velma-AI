// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SkillBounty
 * @notice On-chain bounty board for the FlowFabric network.
 * @dev Creators lock TRUST tokens in escrow when posting a bounty.
 *      Claimants submit a skill. The creator approves to release escrow,
 *      or disputes go to 3-validator arbitration.
 *
 * Lifecycle: OPEN -> CLAIMED -> SUBMITTED -> COMPLETED | DISPUTED -> EXPIRED
 */
contract SkillBounty is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Types ─────────────────────────────────────────────────────────────

    enum Status { OPEN, CLAIMED, SUBMITTED, COMPLETED, DISPUTED, EXPIRED }

    struct BountyInfo {
        address creator;
        address claimant;
        uint256 reward;
        uint64  deadline;
        bytes32 skillId;
        Status  status;
        string  title;
        string  domain;
    }

    struct Dispute {
        address[3] arbitrators;
        uint8 votesFor;      // votes to release to claimant
        uint8 votesAgainst;  // votes to return to creator
        mapping(address => bool) hasVoted;
        bool resolved;
    }

    // ── State ─────────────────────────────────────────────────────────────

    IERC20 public immutable trustToken;
    address public immutable nodeRegistry;

    uint256 public nextBountyId;
    mapping(uint256 => BountyInfo) internal _bounties;
    mapping(uint256 => Dispute) internal _disputes;
    uint256[] internal _openBountyIds;

    // ── Events ────────────────────────────────────────────────────────────

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward, uint64 deadline);
    event BountyClaimed(uint256 indexed bountyId, address indexed claimant);
    event SkillSubmitted(uint256 indexed bountyId, bytes32 skillId);
    event BountyCompleted(uint256 indexed bountyId, address indexed claimant, uint256 reward);
    event BountyDisputed(uint256 indexed bountyId, address[3] arbitrators);
    event BountyExpired(uint256 indexed bountyId);
    event DisputeVoted(uint256 indexed bountyId, address indexed arbitrator, bool inFavor);
    event DisputeResolved(uint256 indexed bountyId, bool releasedToClaimant);

    // ── Constructor ───────────────────────────────────────────────────────

    /**
     * @param _trustToken   Address of the TRUST ERC-20 token.
     * @param _nodeRegistry Address of the NodeRegistry contract.
     */
    constructor(address _trustToken, address _nodeRegistry) {
        require(_trustToken != address(0), "SkillBounty: zero token");
        require(_nodeRegistry != address(0), "SkillBounty: zero registry");
        trustToken = IERC20(_trustToken);
        nodeRegistry = _nodeRegistry;
    }

    // ── Bounty lifecycle ──────────────────────────────────────────────────

    /**
     * @notice Create a bounty and lock `reward` TRUST in escrow.
     * @param title    Short human-readable title.
     * @param domain   Domain tag (e.g. "trading", "code").
     * @param reward   Amount of TRUST to lock as reward.
     * @param deadline Unix timestamp after which the bounty can expire.
     * @return bountyId The ID of the newly created bounty.
     */
    function createBounty(
        string calldata title,
        string calldata domain,
        uint256 reward,
        uint64 deadline
    ) external nonReentrant returns (uint256 bountyId) {
        require(reward > 0, "SkillBounty: zero reward");
        require(deadline > block.timestamp, "SkillBounty: deadline in past");
        require(bytes(title).length > 0, "SkillBounty: empty title");

        bountyId = nextBountyId++;

        trustToken.safeTransferFrom(msg.sender, address(this), reward);

        _bounties[bountyId] = BountyInfo({
            creator: msg.sender,
            claimant: address(0),
            reward: reward,
            deadline: deadline,
            skillId: bytes32(0),
            status: Status.OPEN,
            title: title,
            domain: domain
        });

        _openBountyIds.push(bountyId);

        emit BountyCreated(bountyId, msg.sender, reward, deadline);
    }

    /**
     * @notice Claim an open bounty. Only one claimant at a time.
     * @param bountyId The bounty to claim.
     */
    function claimBounty(uint256 bountyId) external {
        BountyInfo storage b = _bounties[bountyId];
        require(b.status == Status.OPEN, "SkillBounty: not open");
        require(block.timestamp <= b.deadline, "SkillBounty: past deadline");
        require(msg.sender != b.creator, "SkillBounty: creator cannot claim");

        b.status = Status.CLAIMED;
        b.claimant = msg.sender;

        emit BountyClaimed(bountyId, msg.sender);
    }

    /**
     * @notice Submit a skill to fulfill a claimed bounty.
     * @param bountyId The bounty being fulfilled.
     * @param skillId  The on-chain skill ID being submitted.
     */
    function submitSkill(uint256 bountyId, bytes32 skillId) external {
        BountyInfo storage b = _bounties[bountyId];
        require(b.status == Status.CLAIMED, "SkillBounty: not claimed");
        require(msg.sender == b.claimant, "SkillBounty: not claimant");
        require(skillId != bytes32(0), "SkillBounty: zero skillId");

        b.status = Status.SUBMITTED;
        b.skillId = skillId;

        emit SkillSubmitted(bountyId, skillId);
    }

    /**
     * @notice Creator approves the submission, releasing escrow to claimant.
     * @param bountyId The bounty to complete.
     */
    function completeBounty(uint256 bountyId) external nonReentrant {
        BountyInfo storage b = _bounties[bountyId];
        require(b.status == Status.SUBMITTED, "SkillBounty: not submitted");
        require(msg.sender == b.creator, "SkillBounty: not creator");

        b.status = Status.COMPLETED;
        trustToken.safeTransfer(b.claimant, b.reward);
        _removeFromOpen(bountyId);

        emit BountyCompleted(bountyId, b.claimant, b.reward);
    }

    /**
     * @notice Creator disputes a submission. Requires 3 arbitrator addresses.
     * @param bountyId    The bounty to dispute.
     * @param arbitrators Array of 3 validator addresses for arbitration.
     */
    function disputeBounty(
        uint256 bountyId,
        address[3] calldata arbitrators
    ) external {
        BountyInfo storage b = _bounties[bountyId];
        require(b.status == Status.SUBMITTED, "SkillBounty: not submitted");
        require(msg.sender == b.creator, "SkillBounty: not creator");

        // Validate arbitrators are unique and not involved parties
        for (uint256 i = 0; i < 3; i++) {
            require(arbitrators[i] != address(0), "SkillBounty: zero arbitrator");
            require(arbitrators[i] != b.creator, "SkillBounty: creator as arbitrator");
            require(arbitrators[i] != b.claimant, "SkillBounty: claimant as arbitrator");
            for (uint256 j = i + 1; j < 3; j++) {
                require(arbitrators[i] != arbitrators[j], "SkillBounty: duplicate arbitrator");
            }
        }

        b.status = Status.DISPUTED;

        Dispute storage d = _disputes[bountyId];
        d.arbitrators = arbitrators;
        d.votesFor = 0;
        d.votesAgainst = 0;
        d.resolved = false;

        emit BountyDisputed(bountyId, arbitrators);
    }

    /**
     * @notice Arbitrator votes on a dispute.
     * @param bountyId The disputed bounty.
     * @param inFavor  True to release to claimant, false to return to creator.
     */
    function voteOnDispute(uint256 bountyId, bool inFavor) external nonReentrant {
        BountyInfo storage b = _bounties[bountyId];
        require(b.status == Status.DISPUTED, "SkillBounty: not disputed");

        Dispute storage d = _disputes[bountyId];
        require(!d.resolved, "SkillBounty: already resolved");
        require(!d.hasVoted[msg.sender], "SkillBounty: already voted");

        // Verify caller is an arbitrator
        bool isArbitrator = false;
        for (uint256 i = 0; i < 3; i++) {
            if (d.arbitrators[i] == msg.sender) {
                isArbitrator = true;
                break;
            }
        }
        require(isArbitrator, "SkillBounty: not arbitrator");

        d.hasVoted[msg.sender] = true;

        if (inFavor) {
            d.votesFor++;
        } else {
            d.votesAgainst++;
        }

        emit DisputeVoted(bountyId, msg.sender, inFavor);

        // Resolve when majority reached (2 of 3)
        if (d.votesFor >= 2) {
            d.resolved = true;
            b.status = Status.COMPLETED;
            trustToken.safeTransfer(b.claimant, b.reward);
            _removeFromOpen(bountyId);
            emit DisputeResolved(bountyId, true);
        } else if (d.votesAgainst >= 2) {
            d.resolved = true;
            b.status = Status.EXPIRED;
            trustToken.safeTransfer(b.creator, b.reward);
            _removeFromOpen(bountyId);
            emit DisputeResolved(bountyId, false);
        }
    }

    /**
     * @notice Expire a bounty past its deadline. Returns escrow to creator.
     * @param bountyId The bounty to expire.
     */
    function expireBounty(uint256 bountyId) external nonReentrant {
        BountyInfo storage b = _bounties[bountyId];
        require(
            b.status == Status.OPEN || b.status == Status.CLAIMED,
            "SkillBounty: cannot expire"
        );
        require(block.timestamp > b.deadline, "SkillBounty: not past deadline");

        b.status = Status.EXPIRED;
        trustToken.safeTransfer(b.creator, b.reward);
        _removeFromOpen(bountyId);

        emit BountyExpired(bountyId);
    }

    // ── Views ─────────────────────────────────────────────────────────────

    /**
     * @notice Get full bounty info.
     * @param bountyId The bounty to query.
     */
    function getBounty(uint256 bountyId) external view returns (
        address creator,
        address claimant,
        uint256 reward,
        uint64  deadline,
        bytes32 skillId,
        Status  status,
        string memory title,
        string memory domain
    ) {
        BountyInfo storage b = _bounties[bountyId];
        return (b.creator, b.claimant, b.reward, b.deadline, b.skillId, b.status, b.title, b.domain);
    }

    /**
     * @notice Get all open bounty IDs.
     */
    function getOpenBounties() external view returns (uint256[] memory) {
        return _openBountyIds;
    }

    /**
     * @notice Total bounties ever created.
     */
    function bountyCount() external view returns (uint256) {
        return nextBountyId;
    }

    // ── Internal ──────────────────────────────────────────────────────────

    function _removeFromOpen(uint256 bountyId) internal {
        for (uint256 i = 0; i < _openBountyIds.length; i++) {
            if (_openBountyIds[i] == bountyId) {
                _openBountyIds[i] = _openBountyIds[_openBountyIds.length - 1];
                _openBountyIds.pop();
                break;
            }
        }
    }
}
