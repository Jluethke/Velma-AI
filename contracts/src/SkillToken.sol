// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — SkillChain
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SkillToken
 * @notice ERC-20 token for the SkillChain network — "SkillChain Trust Token" (TRUST).
 * @dev 1 billion hard cap, 18 decimals. Supports burn, authorized minting,
 *      gasless approvals (ERC20Permit), and linear vesting with cliff.
 *
 * Vesting allocations (set at deploy):
 *   - 15% Wayfinder Trust: 4-year linear, 1-year cliff
 *   - 20% DAO Treasury:    immediate (no vesting)
 */
contract SkillToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Absolute supply ceiling.
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1B

    // ── Vesting ────────────────────────────────────────────────────────

    struct VestingSchedule {
        uint256 total;          // Total tokens allocated
        uint256 claimed;        // Tokens already claimed
        uint256 start;          // Vesting start timestamp
        uint256 cliffDuration;  // Duration before first claim
        uint256 vestingDuration;// Total vesting period
    }

    mapping(address => VestingSchedule) public vestingSchedules;

    // ── Events ─────────────────────────────────────────────────────────

    event VestingCreated(address indexed beneficiary, uint256 total, uint256 start, uint256 cliffDuration, uint256 vestingDuration);
    event VestingClaimed(address indexed beneficiary, uint256 amount);

    // ── Constructor ────────────────────────────────────────────────────

    /**
     * @notice Deploy the TRUST token with initial allocations.
     * @param admin         The default admin and initial minter.
     * @param wayfinder     Address for the Wayfinder Trust vesting allocation.
     * @param daoTreasury   Address for the DAO treasury allocation.
     */
    constructor(
        address admin,
        address wayfinder,
        address daoTreasury
    ) ERC20("SkillChain Trust Token", "TRUST") ERC20Permit("SkillChain Trust Token") {
        require(admin != address(0), "SkillToken: zero admin");
        require(wayfinder != address(0), "SkillToken: zero wayfinder");
        require(daoTreasury != address(0), "SkillToken: zero treasury");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);

        // 20% DAO Treasury — minted immediately
        uint256 treasuryAmount = (MAX_SUPPLY * 20) / 100;
        _mint(daoTreasury, treasuryAmount);

        // 15% Wayfinder Trust — vested (4yr linear, 1yr cliff)
        uint256 wayfinderAmount = (MAX_SUPPLY * 15) / 100;
        _mint(address(this), wayfinderAmount); // held by contract
        vestingSchedules[wayfinder] = VestingSchedule({
            total: wayfinderAmount,
            claimed: 0,
            start: block.timestamp,
            cliffDuration: 365 days,
            vestingDuration: 4 * 365 days
        });
        emit VestingCreated(wayfinder, wayfinderAmount, block.timestamp, 365 days, 4 * 365 days);
    }

    // ── Minting ────────────────────────────────────────────────────────

    /**
     * @notice Mint new tokens. Reverts if supply cap would be exceeded.
     * @param to     Recipient address.
     * @param amount Amount to mint (18 decimals).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "SkillToken: cap exceeded");
        _mint(to, amount);
    }

    // ── Vesting ────────────────────────────────────────────────────────

    /**
     * @notice Claim vested tokens for the caller.
     */
    function claimVested() external {
        VestingSchedule storage vs = vestingSchedules[msg.sender];
        require(vs.total > 0, "SkillToken: no vesting");

        uint256 vested = _vestedAmount(vs);
        uint256 claimable = vested - vs.claimed;
        require(claimable > 0, "SkillToken: nothing to claim");

        vs.claimed += claimable;
        _transfer(address(this), msg.sender, claimable);
        emit VestingClaimed(msg.sender, claimable);
    }

    /**
     * @notice View the amount currently claimable by a beneficiary.
     * @param beneficiary The vesting beneficiary.
     * @return claimable  Tokens available to claim right now.
     */
    function claimableVested(address beneficiary) external view returns (uint256) {
        VestingSchedule storage vs = vestingSchedules[beneficiary];
        if (vs.total == 0) return 0;
        return _vestedAmount(vs) - vs.claimed;
    }

    function _vestedAmount(VestingSchedule storage vs) internal view returns (uint256) {
        if (block.timestamp < vs.start + vs.cliffDuration) return 0;
        uint256 elapsed = block.timestamp - vs.start;
        if (elapsed >= vs.vestingDuration) return vs.total;
        return (vs.total * elapsed) / vs.vestingDuration;
    }
}
