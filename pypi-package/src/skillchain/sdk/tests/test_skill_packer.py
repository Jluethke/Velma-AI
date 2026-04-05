"""
test_skill_packer.py
====================

Tests for .skillpack creation, extraction, manifest validation,
and provenance signing/verification.
"""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

import pytest

from skillchain.sdk.skill_packer import (
    SkillManifest,
    SkillPackContents,
    pack,
    sign_provenance,
    unpack,
    validate_manifest,
    verify_provenance,
)
from skillchain.sdk.exceptions import PackingError, ValidationError


# -- Fixtures ------------------------------------------------------------------

@pytest.fixture
def tmp_skill(tmp_path: Path) -> Path:
    """Create a minimal skill.md in a temp directory."""
    skill = tmp_path / "test_skill.md"
    skill.write_text(
        "# Test Skill\n\n"
        "1. Parse the input\n"
        "2. Process the data\n"
        "3. Return the result\n",
        encoding="utf-8",
    )
    return skill


@pytest.fixture
def manifest() -> SkillManifest:
    """Create a test manifest."""
    return SkillManifest(
        name="test-skill",
        version="1.0.0",
        domain="testing",
        description="A test skill for unit tests",
        tags=["test", "unit"],
        inputs=["task"],
        outputs=["result"],
        price=0,
        license="MIT",
    )


@pytest.fixture
def test_cases() -> list:
    """Create sample test cases."""
    return [
        {
            "input": "parse this data",
            "expected_output": "parsed result",
            "description": "Basic parsing test",
        },
        {
            "input": "process this input",
            "expected_output": "processed output",
            "description": "Basic processing test",
        },
    ]


# -- Manifest validation ------------------------------------------------------

class TestManifestValidation:
    """Tests for validate_manifest()."""

    def test_valid_manifest(self, manifest: SkillManifest) -> None:
        errors = validate_manifest(manifest.to_dict())
        assert errors == []

    def test_missing_name(self) -> None:
        data = {"version": "1.0.0", "domain": "test", "description": "desc"}
        errors = validate_manifest(data)
        assert any("name" in e for e in errors)

    def test_missing_version(self) -> None:
        data = {"name": "test", "domain": "test", "description": "desc"}
        errors = validate_manifest(data)
        assert any("version" in e for e in errors)

    def test_bad_version_format(self) -> None:
        data = {"name": "test", "version": "1", "domain": "test", "description": "desc"}
        errors = validate_manifest(data)
        assert any("version" in e.lower() for e in errors)

    def test_negative_price(self) -> None:
        data = {
            "name": "test", "version": "1.0", "domain": "test",
            "description": "desc", "price": -1,
        }
        errors = validate_manifest(data)
        assert any("price" in e.lower() for e in errors)

    def test_invalid_graduation_threshold(self) -> None:
        data = {
            "name": "test", "version": "1.0", "domain": "test",
            "description": "desc", "graduation_threshold": 1.5,
        }
        errors = validate_manifest(data)
        assert any("graduation_threshold" in e for e in errors)


# -- Pack / Unpack -------------------------------------------------------------

class TestPacking:
    """Tests for pack() and unpack()."""

    def test_pack_creates_skillpack(
        self, tmp_skill: Path, manifest: SkillManifest, tmp_path: Path,
    ) -> None:
        result = pack(tmp_skill, manifest, output_dir=tmp_path)
        assert result.exists()
        assert result.suffix == ".skillpack"
        assert zipfile.is_zipfile(result)

    def test_pack_contains_required_files(
        self, tmp_skill: Path, manifest: SkillManifest, tmp_path: Path,
    ) -> None:
        result = pack(tmp_skill, manifest, output_dir=tmp_path)
        with zipfile.ZipFile(result) as zf:
            names = zf.namelist()
            assert "manifest.json" in names
            assert "skill.md" in names
            assert "tests/test_cases.json" in names
            assert "provenance.json" in names

    def test_pack_with_test_cases(
        self, tmp_skill: Path, manifest: SkillManifest,
        test_cases: list, tmp_path: Path,
    ) -> None:
        result = pack(tmp_skill, manifest, test_cases=test_cases, output_dir=tmp_path)
        with zipfile.ZipFile(result) as zf:
            cases = json.loads(zf.read("tests/test_cases.json"))
            assert len(cases) == 2
            assert cases[0]["input"] == "parse this data"

    def test_pack_with_examples(
        self, tmp_skill: Path, manifest: SkillManifest, tmp_path: Path,
    ) -> None:
        examples_dir = tmp_path / "examples"
        examples_dir.mkdir()
        (examples_dir / "example1.md").write_text("# Example 1", encoding="utf-8")

        result = pack(
            tmp_skill, manifest,
            examples_dir=examples_dir,
            output_dir=tmp_path,
        )
        with zipfile.ZipFile(result) as zf:
            assert "examples/example1.md" in zf.namelist()

    def test_pack_missing_file_raises(self, manifest: SkillManifest) -> None:
        with pytest.raises(PackingError, match="not found"):
            pack(Path("/nonexistent/skill.md"), manifest)

    def test_unpack_roundtrip(
        self, tmp_skill: Path, manifest: SkillManifest,
        test_cases: list, tmp_path: Path,
    ) -> None:
        pack_path = pack(
            tmp_skill, manifest, test_cases=test_cases, output_dir=tmp_path,
        )
        unpack_dir = tmp_path / "unpacked"
        contents = unpack(pack_path, target=unpack_dir)

        assert isinstance(contents, SkillPackContents)
        assert contents.manifest.name == "test-skill"
        assert contents.manifest.version == "1.0.0"
        assert "Test Skill" in contents.skill_content
        assert len(contents.test_cases) == 2

    def test_unpack_missing_file_raises(self) -> None:
        with pytest.raises(PackingError, match="not found"):
            unpack(Path("/nonexistent.skillpack"))

    def test_unpack_invalid_zip_raises(self, tmp_path: Path) -> None:
        bad_file = tmp_path / "bad.skillpack"
        bad_file.write_text("not a zip file", encoding="utf-8")
        with pytest.raises(PackingError, match="Not a valid ZIP"):
            unpack(bad_file)


# -- Provenance ----------------------------------------------------------------

class TestProvenance:
    """Tests for provenance signing and verification."""

    def test_sign_and_verify(self, manifest: SkillManifest) -> None:
        identity = {"node_id": "test-node", "wallet_address": "0xabc"}
        prov = sign_provenance(identity, manifest, "fakehash123")

        assert prov["author_node_id"] == "test-node"
        assert prov["skill_name"] == "test-skill"
        assert prov["content_hash"] == "fakehash123"
        assert "chain_hash" in prov
        assert verify_provenance(prov)

    def test_tampered_provenance_fails(self, manifest: SkillManifest) -> None:
        identity = {"node_id": "test-node"}
        prov = sign_provenance(identity, manifest, "fakehash")
        prov["content_hash"] = "tampered"
        assert not verify_provenance(prov)

    def test_missing_fields_fails(self) -> None:
        assert not verify_provenance({})
        assert not verify_provenance({"author_node_id": "x"})

    def test_anonymous_identity(self, manifest: SkillManifest) -> None:
        prov = sign_provenance({}, manifest, "hash123")
        assert prov["author_node_id"] == "anonymous"
        assert verify_provenance(prov)


# -- SkillManifest dataclass ---------------------------------------------------

class TestSkillManifest:
    """Tests for the SkillManifest dataclass."""

    def test_to_dict(self, manifest: SkillManifest) -> None:
        d = manifest.to_dict()
        assert d["name"] == "test-skill"
        assert d["version"] == "1.0.0"
        assert d["domain"] == "testing"
        assert "tags" in d

    def test_from_dict(self) -> None:
        data = {
            "name": "my-skill",
            "version": "2.0.0",
            "domain": "coding",
            "description": "A coding skill",
            "tags": ["python"],
            "extra_field": "ignored",
        }
        m = SkillManifest.from_dict(data)
        assert m.name == "my-skill"
        assert m.version == "2.0.0"
        assert m.tags == ["python"]

    def test_default_values(self) -> None:
        m = SkillManifest(name="x", version="1.0", domain="d", description="d")
        assert m.price == 0
        assert m.license == "MIT"
        assert m.min_shadow_count == 5
        assert m.graduation_threshold == 0.75
