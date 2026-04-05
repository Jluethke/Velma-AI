"""
test_shadow_runner.py
=====================

Tests for the ShadowRunner — sandboxed skill validation.

Verifies the similarity computation (exact port from Velma's SkillShadower),
validation logic, edge cases, and timeout handling.
"""

from __future__ import annotations

import pytest

from skillchain.sdk.shadow_runner import ShadowResult, ShadowRunner
from skillchain.sdk.exceptions import ValidationError


# -- Fixtures ------------------------------------------------------------------

@pytest.fixture
def runner() -> ShadowRunner:
    """Create a ShadowRunner with default settings."""
    return ShadowRunner(shadow_count=5, graduation_threshold=0.75, similarity_threshold=0.70)


@pytest.fixture
def skill_content() -> str:
    """Sample skill content with numbered steps."""
    return (
        "# Code Review Skill\n\n"
        "1. Read the code carefully\n"
        "2. Check for common bugs\n"
        "3. Verify error handling\n"
        "4. Suggest improvements\n"
        "5. Provide a summary\n"
    )


@pytest.fixture
def matching_test_cases(skill_content: str) -> list:
    """Test cases designed to match the skill content."""
    # We need the expected output to match what _execute_skill produces
    runner = ShadowRunner()
    actual = runner._execute_skill(skill_content, "review my code")

    return [
        {"input": "review my code", "expected_output": actual},
        {"input": "review my code", "expected_output": actual},
        {"input": "review my code", "expected_output": actual},
        {"input": "review my code", "expected_output": actual},
        {"input": "review my code", "expected_output": actual},
    ]


@pytest.fixture
def mismatching_test_cases() -> list:
    """Test cases that won't match."""
    return [
        {"input": "x", "expected_output": "completely different output alpha beta gamma"},
        {"input": "y", "expected_output": "another unrelated output delta epsilon zeta"},
        {"input": "z", "expected_output": "third unrelated output eta theta iota kappa"},
    ]


# -- Similarity computation ---------------------------------------------------

class TestSimilarity:
    """Tests for _compute_similarity — must match Velma's SkillShadower."""

    def test_identical_strings(self, runner: ShadowRunner) -> None:
        assert runner._compute_similarity("hello world", "hello world") == 1.0

    def test_empty_strings(self, runner: ShadowRunner) -> None:
        assert runner._compute_similarity("", "") == 0.0
        assert runner._compute_similarity("hello", "") == 0.0
        assert runner._compute_similarity("", "hello") == 0.0

    def test_completely_different(self, runner: ShadowRunner) -> None:
        sim = runner._compute_similarity("alpha beta gamma", "delta epsilon zeta")
        # Character bigrams may have minor overlap, so check near-zero
        assert sim < 0.1

    def test_partial_overlap(self, runner: ShadowRunner) -> None:
        sim = runner._compute_similarity("the quick brown fox", "the slow brown cat")
        assert 0.0 < sim < 1.0

    def test_case_insensitive(self, runner: ShadowRunner) -> None:
        sim = runner._compute_similarity("Hello World", "hello world")
        assert sim == 1.0

    def test_weighted_formula(self, runner: ShadowRunner) -> None:
        """Verify the 0.6 * jaccard + 0.4 * bigram weighting."""
        a = "the cat sat on the mat"
        b = "the cat sat on a mat"

        # Compute expected manually
        words_a = set(a.lower().split())
        words_b = set(b.lower().split())
        jaccard = len(words_a & words_b) / len(words_a | words_b)

        bigrams_a = {a.lower()[i:i+2] for i in range(len(a.lower()) - 1)}
        bigrams_b = {b.lower()[i:i+2] for i in range(len(b.lower()) - 1)}
        bigram_sim = len(bigrams_a & bigrams_b) / max(len(bigrams_a | bigrams_b), 1)

        expected = 0.6 * jaccard + 0.4 * bigram_sim
        actual = runner._compute_similarity(a, b)
        assert abs(actual - expected) < 0.001

    def test_single_word(self, runner: ShadowRunner) -> None:
        """Single-word strings: bigrams are char-level."""
        sim = runner._compute_similarity("hello", "hello")
        assert sim == 1.0


# -- Validation ----------------------------------------------------------------

class TestValidation:
    """Tests for the validate() method."""

    def test_matching_cases_pass(
        self, runner: ShadowRunner, skill_content: str, matching_test_cases: list,
    ) -> None:
        result = runner.validate(skill_content, matching_test_cases)
        assert isinstance(result, ShadowResult)
        assert result.passed is True
        assert result.match_count == result.shadow_count
        assert result.match_rate == 1.0

    def test_mismatching_cases_fail(
        self, runner: ShadowRunner, skill_content: str, mismatching_test_cases: list,
    ) -> None:
        runner = ShadowRunner(shadow_count=3, graduation_threshold=0.75)
        result = runner.validate(skill_content, mismatching_test_cases)
        assert result.passed is False
        assert result.match_count < result.shadow_count

    def test_empty_skill_raises(self, runner: ShadowRunner) -> None:
        with pytest.raises(ValidationError, match="empty"):
            runner.validate("", [{"input": "x", "expected_output": "y"}])

    def test_empty_test_cases_raises(self, runner: ShadowRunner) -> None:
        with pytest.raises(ValidationError, match="No test cases"):
            runner.validate("some content", [])

    def test_limits_to_shadow_count(self, skill_content: str) -> None:
        runner = ShadowRunner(shadow_count=2)
        cases = [
            {"input": "a", "expected_output": "x"},
            {"input": "b", "expected_output": "y"},
            {"input": "c", "expected_output": "z"},
        ]
        result = runner.validate(skill_content, cases)
        assert result.shadow_count == 2

    def test_result_has_environment_hash(
        self, runner: ShadowRunner, skill_content: str, matching_test_cases: list,
    ) -> None:
        result = runner.validate(skill_content, matching_test_cases)
        assert result.environment_hash
        assert len(result.environment_hash) == 64  # SHA-256 hex

    def test_result_has_execution_times(
        self, runner: ShadowRunner, skill_content: str, matching_test_cases: list,
    ) -> None:
        result = runner.validate(skill_content, matching_test_cases)
        assert len(result.execution_times) == result.shadow_count
        assert all(t >= 0 for t in result.execution_times)

    def test_avg_similarity(self, runner: ShadowRunner) -> None:
        r = ShadowResult(passed=True, match_count=3, shadow_count=3,
                         similarity_scores=[0.8, 0.9, 0.7])
        assert abs(r.avg_similarity - 0.8) < 0.001


# -- Edge cases ----------------------------------------------------------------

class TestEdgeCases:
    """Edge case tests."""

    def test_skill_with_no_steps(self) -> None:
        """Skill with no numbered/bulleted steps falls back to full content."""
        runner = ShadowRunner(shadow_count=1, graduation_threshold=0.0)
        content = "This is a skill with no structured steps."
        cases = [{"input": "test", "expected_output": content}]
        result = runner.validate(content, cases)
        assert result.similarity_scores[0] == 1.0

    def test_custom_thresholds(self) -> None:
        runner = ShadowRunner(
            shadow_count=3,
            graduation_threshold=0.5,
            similarity_threshold=0.3,
        )
        assert runner.shadow_count == 3
        assert runner.graduation_threshold == 0.5
        assert runner.similarity_threshold == 0.3
