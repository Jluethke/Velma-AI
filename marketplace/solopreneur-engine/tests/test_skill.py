# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Marketplace skill tests for solopreneur-engine."""

import json
from pathlib import Path

import pytest


SKILL_DIR = Path(__file__).parent.parent


class TestManifest:
    def test_manifest_exists(self):
        assert (SKILL_DIR / "manifest.json").exists()

    def test_manifest_valid_json(self):
        data = json.loads((SKILL_DIR / "manifest.json").read_text())
        assert data["name"] == "solopreneur-engine"
        assert data["version"] == "1.0.0"

    def test_manifest_required_fields(self):
        data = json.loads((SKILL_DIR / "manifest.json").read_text())
        required = ["name", "version", "domain", "tags", "inputs", "outputs",
                     "price", "license", "description"]
        for field in required:
            assert field in data, f"Missing required field: {field}"

    def test_price_is_75_trust(self):
        data = json.loads((SKILL_DIR / "manifest.json").read_text())
        assert data["price"] == "75"

    def test_license_is_commercial(self):
        data = json.loads((SKILL_DIR / "manifest.json").read_text())
        assert data["license"] == "COMMERCIAL"


class TestProvenance:
    def test_provenance_exists(self):
        assert (SKILL_DIR / "provenance.json").exists()

    def test_provenance_valid(self):
        data = json.loads((SKILL_DIR / "provenance.json").read_text())
        assert data["author"] == "The Wayfinder Trust"
        assert data["tested"] is True


class TestSkillDoc:
    def test_skill_md_exists(self):
        assert (SKILL_DIR / "skill.md").exists()

    def test_skill_md_has_content(self):
        content = (SKILL_DIR / "skill.md").read_text()
        assert "Solopreneur Engine" in content
        assert "VALIDATE" in content
        assert "STRATEGIZE" in content
