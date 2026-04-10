// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TrustToken.sol";
import "../src/NodeRegistry.sol";
import "../src/TrustOracle.sol";

contract TrustOracleTest is Test {
    TrustToken public token;
    NodeRegistry public nodeReg;
    TrustOracle public oracle;

    address admin = address(0xA);
    address node1Owner = address(0x1);
    address node2Owner = address(0x2);
    address node3Owner = address(0x3);

    bytes32 nodeId1 = keccak256("node1");
    bytes32 nodeId2 = keccak256("node2");
    bytes32 nodeId3 = keccak256("node3");

    function setUp() public {
        // Start at block >= BLOCKS_PER_EPOCH so epoch > 0 (avoids cooldown
        // false-positive when lastAttestEpoch defaults to 0 == current epoch 0)
        vm.roll(7200);

        vm.startPrank(admin);
        token = new TrustToken(admin, admin, admin);
        nodeReg = new NodeRegistry(address(token));
        oracle = new TrustOracle(address(nodeReg));

        // Fund node owners and register nodes
        token.mint(node1Owner, 1000 * 1e18);
        token.mint(node2Owner, 1000 * 1e18);
        token.mint(node3Owner, 1000 * 1e18);
        vm.stopPrank();

        _registerNode(node1Owner, nodeId1);
        _registerNode(node2Owner, nodeId2);
        _registerNode(node3Owner, nodeId3);
    }

    function _registerNode(address owner, bytes32 nodeId) internal {
        vm.startPrank(owner);
        token.approve(address(nodeReg), 100 * 1e18);
        string[] memory tags = new string[](1);
        tags[0] = "test";
        nodeReg.registerNode(nodeId, bytes("pubkey"), tags);
        vm.stopPrank();
    }

    // ── Attestation ────────────────────────────────────────────────────

    function test_ReportTrust() public {
        vm.prank(node1Owner);
        oracle.reportTrust(nodeId2, 0.8e18, "");

        uint256 score = oracle.getTrustScore(nodeId2);
        assertEq(score, 0.8e18);
        assertEq(oracle.attestationCount(nodeId2), 1);
    }

    function test_MultipleAttestations() public {
        vm.prank(node1Owner);
        oracle.reportTrust(nodeId3, 0.9e18, "");

        vm.prank(node2Owner);
        oracle.reportTrust(nodeId3, 0.7e18, "");

        // Weighted median of [0.7, 0.9] with equal stakes
        uint256 score = oracle.getTrustScore(nodeId3);
        assertTrue(score > 0);
    }

    // ── Cooldown ───────────────────────────────────────────────────────

    function test_CooldownSameEpoch() public {
        vm.prank(node1Owner);
        oracle.reportTrust(nodeId2, 0.8e18, "");

        vm.prank(node1Owner);
        vm.expectRevert("TrustOracle: cooldown");
        oracle.reportTrust(nodeId2, 0.9e18, "");
    }

    function test_CooldownNewEpoch() public {
        vm.prank(node1Owner);
        oracle.reportTrust(nodeId2, 0.8e18, "");

        // Advance past one epoch
        vm.roll(block.number + oracle.BLOCKS_PER_EPOCH() + 1);

        vm.prank(node1Owner);
        oracle.reportTrust(nodeId2, 0.85e18, ""); // should succeed
        assertEq(oracle.attestationCount(nodeId2), 2);
    }

    // ── Access Control ─────────────────────────────────────────────────

    function test_RevertNonNode() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert("TrustOracle: not a node");
        oracle.reportTrust(nodeId2, 0.8e18, "");
    }

    function test_RevertSelfAttest() public {
        vm.prank(node1Owner);
        vm.expectRevert("TrustOracle: self-attest");
        oracle.reportTrust(nodeId1, 0.8e18, "");
    }

    function test_RevertScoreAboveOne() public {
        vm.prank(node1Owner);
        vm.expectRevert("TrustOracle: score > 1");
        oracle.reportTrust(nodeId2, 1.1e18, "");
    }

    // ── Trust Weighted Vote ────────────────────────────────────────────

    function test_GetTrustWeightedVote() public {
        vm.prank(node1Owner);
        oracle.reportTrust(nodeId2, 0.8e18, "");

        uint256 vote = oracle.getTrustWeightedVote(nodeId2);
        assertEq(vote, 0.8e18);
    }
}
