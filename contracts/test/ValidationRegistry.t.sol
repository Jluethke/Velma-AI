// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillToken.sol";
import "../src/NodeRegistry.sol";
import "../src/SkillRegistry.sol";
import "../src/ValidationRegistry.sol";

contract ValidationRegistryTest is Test {
    SkillToken public token;
    NodeRegistry public nodeReg;
    SkillRegistry public skillReg;
    ValidationRegistry public valReg;

    address admin = address(0xA);
    address creator = address(0xB);

    address node1Owner = address(0x1);
    address node2Owner = address(0x2);
    address node3Owner = address(0x3);
    address node4Owner = address(0x4);

    bytes32 nodeId1 = keccak256("node1");
    bytes32 nodeId2 = keccak256("node2");
    bytes32 nodeId3 = keccak256("node3");
    bytes32 nodeId4 = keccak256("node4");

    bytes32 skillId;

    function setUp() public {
        vm.startPrank(admin);
        token = new SkillToken(admin, admin, admin);
        nodeReg = new NodeRegistry(address(token));
        skillReg = new SkillRegistry();
        valReg = new ValidationRegistry(address(nodeReg), address(skillReg));

        // Fund and register nodes
        token.mint(node1Owner, 1000 * 1e18);
        token.mint(node2Owner, 1000 * 1e18);
        token.mint(node3Owner, 1000 * 1e18);
        token.mint(node4Owner, 1000 * 1e18);
        vm.stopPrank();

        _registerNode(node1Owner, nodeId1);
        _registerNode(node2Owner, nodeId2);
        _registerNode(node3Owner, nodeId3);
        _registerNode(node4Owner, nodeId4);

        // Register a skill
        string[] memory tags = new string[](1);
        tags[0] = "test";
        string[] memory inputs = new string[](1);
        inputs[0] = "input";
        string[] memory outputs = new string[](1);
        outputs[0] = "output";

        vm.prank(creator);
        skillId = skillReg.registerSkill(
            "QmTestSkill", "TestSkill", "test", tags, inputs, outputs,
            10 * 1e18, SkillRegistry.LicenseType.OPEN
        );
    }

    function _registerNode(address owner, bytes32 nodeId) internal {
        vm.startPrank(owner);
        token.approve(address(nodeReg), 100 * 1e18);
        string[] memory tags = new string[](1);
        tags[0] = "validator";
        nodeReg.registerNode(nodeId, bytes("pubkey"), tags);
        vm.stopPrank();
    }

    // ── Validation Submission ──────────────────────────────────────────

    function test_SubmitValidation() public {
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmResult1");

        assertEq(valReg.validationCount(skillId), 1);
        assertEq(valReg.totalCount(skillId), 1);
        assertEq(valReg.successCount(skillId), 1);
    }

    function test_SubmitValidationNotNode() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert("ValReg: not a node");
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmResult1");
    }

    // ── Consensus ──────────────────────────────────────────────────────

    function test_ConsensusReached() public {
        // 3 successful validations
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmR1");

        vm.prank(node2Owner);
        valReg.submitValidation(skillId, true, 5, 5, 0.9e18, "QmR2");

        vm.prank(node3Owner);
        valReg.submitValidation(skillId, true, 5, 3, 0.75e18, "QmR3");

        (bool consensus, uint256 count, uint256 rate) = valReg.getValidationConsensus(skillId);
        assertTrue(consensus);
        assertEq(count, 3);
        assertEq(rate, 10000); // 100%
    }

    function test_ConsensusNotReachedTooFew() public {
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmR1");

        (bool consensus, , ) = valReg.getValidationConsensus(skillId);
        assertFalse(consensus);
    }

    function test_ConsensusNotReachedLowSuccess() public {
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmR1");

        vm.prank(node2Owner);
        valReg.submitValidation(skillId, false, 5, 1, 0.3e18, "QmR2");

        vm.prank(node3Owner);
        valReg.submitValidation(skillId, false, 5, 0, 0.1e18, "QmR3");

        (bool consensus, , uint256 rate) = valReg.getValidationConsensus(skillId);
        assertFalse(consensus);
        assertEq(rate, 3333); // ~33%
    }

    // ── Challenges ─────────────────────────────────────────────────────

    function test_ChallengeValidation() public {
        // Submit a validation first
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmR1");

        // Challenge it
        vm.prank(node2Owner);
        valReg.challengeValidation(skillId, 0);

        assertEq(valReg.challengeCount(), 1);
    }

    function test_ResolveChallenge() public {
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmR1");

        vm.prank(node2Owner);
        valReg.challengeValidation(skillId, 0);

        // Find arbitrator and resolve
        (,,,,bytes32 arbNodeId,,, ) = valReg.challenges(0);
        address arbOwner = nodeReg.nodeOwner(arbNodeId);

        vm.prank(arbOwner);
        valReg.resolveChallenge(0, true);

        (,,,,,, bool upheld, ) = valReg.challenges(0);
        assertTrue(upheld);
    }

    function test_ResolveChallengeNotArbitrator() public {
        vm.prank(node1Owner);
        valReg.submitValidation(skillId, true, 5, 4, 0.85e18, "QmR1");

        vm.prank(node2Owner);
        valReg.challengeValidation(skillId, 0);

        vm.prank(address(0xDEAD));
        vm.expectRevert("ValReg: not arbitrator");
        valReg.resolveChallenge(0, true);
    }
}
