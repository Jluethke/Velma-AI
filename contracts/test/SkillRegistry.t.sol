// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SkillRegistry.sol";

contract SkillRegistryTest is Test {
    SkillRegistry public registry;

    address creator = address(0xA);
    address other = address(0xB);

    string constant CID = "QmTest1234567890";
    string constant NAME = "Math Solver";
    string constant DOMAIN = "math";

    function setUp() public {
        registry = new SkillRegistry();
    }

    function _registerSkill() internal returns (bytes32) {
        string[] memory tags = new string[](2);
        tags[0] = "algebra";
        tags[1] = "calculus";
        string[] memory inputs = new string[](1);
        inputs[0] = "equation";
        string[] memory outputs = new string[](1);
        outputs[0] = "solution";

        vm.prank(creator);
        return registry.registerSkill(CID, NAME, DOMAIN, tags, inputs, outputs, 100 * 1e18, SkillRegistry.LicenseType.COMMERCIAL);
    }

    // ── Registration ───────────────────────────────────────────────────

    function test_RegisterSkill() public {
        bytes32 skillId = _registerSkill();
        assertEq(skillId, keccak256(abi.encodePacked(CID)));
        assertTrue(registry.isActive(skillId));
        assertEq(registry.creatorOf(skillId), creator);
        assertEq(registry.priceOf(skillId), 100 * 1e18);
        assertEq(registry.skillCount(), 1);
    }

    function test_RegisterSkillIdIsKeccak() public {
        bytes32 skillId = _registerSkill();
        assertEq(skillId, keccak256(abi.encodePacked(CID)));
    }

    function test_RegisterDuplicateReverts() public {
        _registerSkill();

        string[] memory tags = new string[](0);
        string[] memory inputs = new string[](0);
        string[] memory outputs = new string[](0);

        vm.prank(other);
        vm.expectRevert("SkillRegistry: already registered");
        registry.registerSkill(CID, "Other", "other", tags, inputs, outputs, 0, SkillRegistry.LicenseType.OPEN);
    }

    function test_RegisterEmptyCidReverts() public {
        string[] memory tags = new string[](0);
        string[] memory inputs = new string[](0);
        string[] memory outputs = new string[](0);

        vm.prank(creator);
        vm.expectRevert("SkillRegistry: empty CID");
        registry.registerSkill("", NAME, DOMAIN, tags, inputs, outputs, 0, SkillRegistry.LicenseType.OPEN);
    }

    // ── Updates ────────────────────────────────────────────────────────

    function test_UpdateSkill() public {
        bytes32 skillId = _registerSkill();

        vm.prank(creator);
        registry.updateSkill(skillId, "QmNewCid", 200 * 1e18);

        (, , , , uint256 price, , uint256 version, , ,) = registry.getSkill(skillId);
        assertEq(price, 200 * 1e18);
        assertEq(version, 2);
    }

    function test_UpdateSkillNotCreatorReverts() public {
        bytes32 skillId = _registerSkill();

        vm.prank(other);
        vm.expectRevert("SkillRegistry: not creator");
        registry.updateSkill(skillId, "QmNewCid", 200 * 1e18);
    }

    // ── Deactivation ───────────────────────────────────────────────────

    function test_DeactivateByCreator() public {
        bytes32 skillId = _registerSkill();

        vm.prank(creator);
        registry.deactivateSkill(skillId);
        assertFalse(registry.isActive(skillId));
    }

    function test_DeactivateByOwner() public {
        bytes32 skillId = _registerSkill();

        // Contract owner (this test contract, deployer) can deactivate
        registry.deactivateSkill(skillId);
        assertFalse(registry.isActive(skillId));
    }

    function test_DeactivateUnauthorizedReverts() public {
        bytes32 skillId = _registerSkill();

        vm.prank(other);
        vm.expectRevert("SkillRegistry: not authorized");
        registry.deactivateSkill(skillId);
    }

    // ── Stats ──────────────────────────────────────────────────────────

    function test_UpdateStats() public {
        bytes32 skillId = _registerSkill();

        // Only owner can update stats
        registry.updateStats(skillId, 100, 8500);

        (, , , , , , , , uint256 totalVal, uint256 successRate) = registry.getSkill(skillId);
        assertEq(totalVal, 100);
        assertEq(successRate, 8500);
    }
}
