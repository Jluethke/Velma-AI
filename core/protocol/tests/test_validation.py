# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# Proprietary and Confidential.

"""Tests for skillchain.protocol.validation — Network SkillShadower."""

from __future__ import annotations

import pytest

from skillchain.core.protocol.validation import (
    DomainCompetenceGate,
    NetworkSkillShadower,
    SkillSubmission,
    ValidationProof,
    compute_similarity,
)


class TestSimilarity:
    """Test the similarity computation."""

    def test_identical_strings(self) -> None:
        assert compute_similarity("hello world", "hello world") == 1.0

    def test_empty_strings(self) -> None:
        assert compute_similarity("", "") == 0.0
        assert compute_similarity("hello", "") == 0.0

    def test_completely_different(self) -> None:
        sim = compute_similarity("alpha beta gamma", "delta epsilon zeta")
        assert sim == 0.0

    def test_partial_overlap(self) -> None:
        sim = compute_similarity(
            "the quick brown fox jumps",
            "the quick red fox leaps",
        )
        assert 0.0 < sim < 1.0

    def test_case_insensitive(self) -> None:
        sim = compute_similarity("Hello World", "hello world")
        assert sim == 1.0

    def test_bigram_boost(self) -> None:
        # Same words in same order should score higher than jumbled
        ordered = compute_similarity(
            "the cat sat on the mat",
            "the cat sat on the mat today",
        )
        jumbled = compute_similarity(
            "the cat sat on the mat",
            "mat the on sat cat the today",
        )
        assert ordered > jumbled


class TestValidationProof:
    """Test ValidationProof properties."""

    def test_pass_rate(self) -> None:
        proof = ValidationProof(
            validator_id="v1", skill_hash="h1",
            publisher_id="p1", run_count=5, pass_count=4,
        )
        assert proof.pass_rate == 0.8

    def test_avg_similarity(self) -> None:
        proof = ValidationProof(
            validator_id="v1", skill_hash="h1",
            publisher_id="p1", run_count=3, pass_count=3,
            similarity_scores=[0.8, 0.9, 0.85],
        )
        assert proof.avg_similarity == pytest.approx(0.85, abs=0.01)

    def test_is_graduated(self) -> None:
        proof = ValidationProof(
            validator_id="v1", skill_hash="h1",
            publisher_id="p1", run_count=5, pass_count=4,
        )
        assert proof.is_graduated

    def test_not_graduated_insufficient_runs(self) -> None:
        proof = ValidationProof(
            validator_id="v1", skill_hash="h1",
            publisher_id="p1", run_count=3, pass_count=3,
        )
        assert not proof.is_graduated


class TestDomainCompetenceGate:
    """Test domain competence checks."""

    def test_no_competence_initially(self) -> None:
        gate = DomainCompetenceGate()
        assert not gate.is_competent("node_1", "ml")

    def test_competent_via_published(self) -> None:
        gate = DomainCompetenceGate()
        gate.record_published("node_1", "ml")
        gate.record_published("node_1", "ml")
        assert gate.is_competent("node_1", "ml")

    def test_competent_via_validated(self) -> None:
        gate = DomainCompetenceGate()
        gate.record_validated("node_1", "nlp")
        gate.record_validated("node_1", "nlp")
        gate.record_validated("node_1", "nlp")
        assert gate.is_competent("node_1", "nlp")

    def test_one_published_not_enough(self) -> None:
        gate = DomainCompetenceGate()
        gate.record_published("node_1", "ml")
        assert not gate.is_competent("node_1", "ml")

    def test_cross_domain_isolation(self) -> None:
        gate = DomainCompetenceGate()
        gate.record_published("node_1", "ml")
        gate.record_published("node_1", "ml")
        assert gate.is_competent("node_1", "ml")
        assert not gate.is_competent("node_1", "nlp")

    def test_get_competent_domains(self) -> None:
        gate = DomainCompetenceGate()
        gate.record_published("node_1", "ml")
        gate.record_published("node_1", "ml")
        gate.record_validated("node_1", "nlp")
        gate.record_validated("node_1", "nlp")
        gate.record_validated("node_1", "nlp")
        domains = gate.get_competent_domains("node_1")
        assert set(domains) == {"ml", "nlp"}


class TestNetworkSkillShadower:
    """Test the full validation workflow."""

    def _make_submission(self) -> SkillSubmission:
        return SkillSubmission(
            skill_hash="skill_abc123",
            publisher_id="publisher_1",
            domain_tags=["ml"],
            test_cases=[
                {"input": "x1"},
                {"input": "x2"},
                {"input": "x3"},
                {"input": "x4"},
                {"input": "x5"},
            ],
            reference_outputs=[
                "the model predicts class A",
                "the model predicts class B",
                "the model predicts class A",
                "the model predicts class C",
                "the model predicts class B",
            ],
        )

    def test_submit_skill(self) -> None:
        shadower = NetworkSkillShadower()
        sub = self._make_submission()
        shadower.submit_skill(sub)
        assert shadower.stats()["submitted_skills"] == 1

    def test_validate_skill_matching(self) -> None:
        shadower = NetworkSkillShadower()
        sub = self._make_submission()
        shadower.submit_skill(sub)

        # Validator produces matching outputs
        proof = shadower.validate_skill(
            validator_id="validator_1",
            skill_hash="skill_abc123",
            actual_outputs=sub.reference_outputs,
        )
        assert proof is not None
        assert proof.pass_count == 5
        assert proof.avg_similarity == 1.0

    def test_validate_skill_mismatched(self) -> None:
        shadower = NetworkSkillShadower()
        sub = self._make_submission()
        shadower.submit_skill(sub)

        proof = shadower.validate_skill(
            validator_id="validator_1",
            skill_hash="skill_abc123",
            actual_outputs=["wrong"] * 5,
        )
        assert proof is not None
        assert proof.pass_count == 0

    def test_validate_unknown_skill(self) -> None:
        shadower = NetworkSkillShadower()
        proof = shadower.validate_skill(
            validator_id="v", skill_hash="nonexistent", actual_outputs=[],
        )
        assert proof is None

    def test_output_count_mismatch(self) -> None:
        shadower = NetworkSkillShadower()
        sub = self._make_submission()
        shadower.submit_skill(sub)

        proof = shadower.validate_skill(
            validator_id="v", skill_hash="skill_abc123",
            actual_outputs=["only one"],
        )
        assert proof is None

    def test_graduation_requires_multiple_proofs(self) -> None:
        shadower = NetworkSkillShadower()
        sub = self._make_submission()
        shadower.submit_skill(sub)

        # One proof is not enough
        shadower.validate_skill(
            validator_id="v1", skill_hash="skill_abc123",
            actual_outputs=sub.reference_outputs,
        )
        assert not shadower.is_graduated("skill_abc123")

        # Add enough proofs
        for i in range(2, 6):
            shadower.validate_skill(
                validator_id=f"v{i}", skill_hash="skill_abc123",
                actual_outputs=sub.reference_outputs,
            )

        assert shadower.is_graduated("skill_abc123")


class TestDisputeResolution:
    """Test dispute opening and resolution."""

    def test_open_dispute(self) -> None:
        shadower = NetworkSkillShadower()
        validators = [f"v{i}" for i in range(10)]
        dispute = shadower.open_dispute(
            skill_hash="skill_1",
            challenger_id="challenger",
            original_validator_id="v0",
            all_validator_ids=validators,
        )
        assert dispute is not None
        assert len(dispute.arbitrator_ids) == 3
        assert "challenger" not in dispute.arbitrator_ids
        assert "v0" not in dispute.arbitrator_ids

    def test_not_enough_arbitrators(self) -> None:
        shadower = NetworkSkillShadower()
        dispute = shadower.open_dispute(
            skill_hash="s1",
            challenger_id="c",
            original_validator_id="v",
            all_validator_ids=["c", "v", "x"],  # Only 1 eligible
        )
        assert dispute is None

    def test_resolve_upheld(self) -> None:
        shadower = NetworkSkillShadower()
        validators = [f"v{i}" for i in range(10)]
        dispute = shadower.open_dispute(
            skill_hash="s1", challenger_id="c",
            original_validator_id="v0",
            all_validator_ids=validators,
        )
        assert dispute is not None

        # 2 of 3 uphold
        shadower.submit_arbitrator_vote(dispute.dispute_id, dispute.arbitrator_ids[0], "uphold")
        result = shadower.submit_arbitrator_vote(dispute.dispute_id, dispute.arbitrator_ids[1], "uphold")
        assert result == "upheld"

    def test_resolve_overturned(self) -> None:
        shadower = NetworkSkillShadower()
        validators = [f"v{i}" for i in range(10)]
        dispute = shadower.open_dispute(
            skill_hash="s1", challenger_id="c",
            original_validator_id="v0",
            all_validator_ids=validators,
        )
        assert dispute is not None

        shadower.submit_arbitrator_vote(dispute.dispute_id, dispute.arbitrator_ids[0], "overturn")
        result = shadower.submit_arbitrator_vote(dispute.dispute_id, dispute.arbitrator_ids[1], "overturn")
        assert result == "overturned"
