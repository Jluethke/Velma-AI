"""Tests for pattern_tracker.py."""

from __future__ import annotations

import pytest

from skillchain.tools.graduation.pattern_tracker import PatternTracker, PromotionCandidate


class TestPatternKey:
    """Test fuzzy key computation."""

    def test_same_words_different_order(self) -> None:
        tracker = PatternTracker()
        key1 = tracker._compute_key("analyze the file contents")
        key2 = tracker._compute_key("contents the file analyze")
        assert key1 == key2, "Same words in different order should produce the same key"

    def test_short_words_filtered(self) -> None:
        tracker = PatternTracker()
        key = tracker._compute_key("go to the big park")
        # "go", "to", "the" are <= 3 chars, filtered out; only "park" remains
        assert "park" in key

    def test_max_five_significant_words(self) -> None:
        tracker = PatternTracker()
        key = tracker._compute_key(
            "alpha bravo charlie delta echo foxtrot golf hotel"
        )
        parts = key.split("|")
        assert len(parts) <= 5

    def test_empty_description_fallback(self) -> None:
        tracker = PatternTracker()
        key = tracker._compute_key("go to do")
        # All words <= 3 chars, falls back to lowercase prefix
        assert key == "go to do"


class TestRecord:
    """Test recording task outcomes."""

    def test_record_returns_none_below_threshold(self) -> None:
        tracker = PatternTracker()
        result = tracker.record("analyze the file", "file", True)
        assert result is None  # Only 1 occurrence, need 3

    def test_record_returns_key_at_threshold(self) -> None:
        tracker = PatternTracker()
        tracker.record("analyze the file", "file", True)
        tracker.record("analyze the file", "file", True)
        result = tracker.record("analyze the file", "file", True)
        assert result is not None, "Should promote after 3 successes"

    def test_record_no_promotion_with_low_success(self) -> None:
        tracker = PatternTracker()
        tracker.record("analyze the file", "file", True)
        tracker.record("analyze the file", "file", False)
        tracker.record("analyze the file", "file", False)
        result = tracker.record("analyze the file", "file", True)
        # 2/4 = 50% < 75% threshold
        assert result is None

    def test_record_stores_output(self) -> None:
        tracker = PatternTracker()
        tracker.record("analyze data", "data", True, output="result_1")
        pattern = tracker.get_pattern(tracker._compute_key("analyze data"))
        assert pattern is not None
        assert "result_1" in pattern["outputs"]

    def test_tracked_count(self) -> None:
        tracker = PatternTracker()
        tracker.record("task alpha", "a", True)
        tracker.record("task bravo", "b", True)
        assert tracker.tracked_count == 2


class TestCheckPromotions:
    """Test batch promotion checking."""

    def test_returns_empty_when_no_patterns(self) -> None:
        tracker = PatternTracker()
        assert tracker.check_promotions() == []

    def test_returns_candidates_at_threshold(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("process data records", "data", True, output="ok")

        candidates = tracker.check_promotions()
        assert len(candidates) == 1
        cand = candidates[0]
        assert isinstance(cand, PromotionCandidate)
        assert cand.count == 3
        assert cand.success_rate == 1.0
        assert cand.domain == "data"

    def test_does_not_return_below_success_rate(self) -> None:
        tracker = PatternTracker()
        tracker.record("process data records", "data", True)
        tracker.record("process data records", "data", True)
        tracker.record("process data records", "data", False)
        tracker.record("process data records", "data", False)
        # 2/4 = 50% < 75%
        assert tracker.check_promotions() == []

    def test_multiple_candidates(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("analyze code quality", "code", True)
            tracker.record("generate report summary", "report", True)
        candidates = tracker.check_promotions()
        assert len(candidates) == 2


class TestMarkPromoted:
    """Test resetting patterns after promotion."""

    def test_mark_promoted_resets_counts(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("analyze code quality", "code", True)

        key = tracker._compute_key("analyze code quality")
        tracker.mark_promoted(key)

        pattern = tracker.get_pattern(key)
        assert pattern is not None
        assert pattern["count"] == 0
        assert pattern["successes"] == 0

    def test_after_promotion_needs_fresh_observations(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("analyze code quality", "code", True)

        key = tracker._compute_key("analyze code quality")
        tracker.mark_promoted(key)

        # Should not be in promotions anymore
        assert tracker.check_promotions() == []


class TestEviction:
    """Test pattern eviction at capacity."""

    def test_evicts_lowest_count_pattern(self) -> None:
        tracker = PatternTracker(promotion_threshold=100)
        # Fill to capacity with unique patterns
        for i in range(501):
            tracker.record(f"unique_pattern_{i:04d}_placeholder", "test", True)
        assert tracker.tracked_count <= 500
