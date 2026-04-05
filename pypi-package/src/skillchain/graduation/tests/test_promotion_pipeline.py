"""Tests for promotion_pipeline.py — end-to-end graduation."""

from __future__ import annotations

import pytest

from skillchain.graduation.health_monitor import SkillHealthMonitor
from skillchain.graduation.pattern_tracker import PatternTracker
from skillchain.graduation.promotion_pipeline import GraduatedSkill, PromotionPipeline
from skillchain.graduation.skill_generator import SkillGenerator
from skillchain.graduation.skill_runner import SkillRunner


class TestEndToEnd:
    """Full pipeline: record patterns -> graduate skills."""

    def test_no_graduates_below_threshold(self) -> None:
        tracker = PatternTracker()
        tracker.record("analyze data values", "data", True, output="ok")
        tracker.record("analyze data values", "data", True, output="ok")
        # Only 2 — need 3

        pipeline = PromotionPipeline()
        graduated = pipeline.run(tracker)
        assert graduated == []

    def test_graduates_at_threshold(self) -> None:
        tracker = PatternTracker()
        for _ in range(4):
            tracker.record("process data records", "data", True, output="processed")

        pipeline = PromotionPipeline()
        graduated = pipeline.run(tracker)
        assert len(graduated) == 1
        skill = graduated[0]
        assert isinstance(skill, GraduatedSkill)
        assert skill.name != ""
        assert "def execute" in skill.code
        assert skill.domain == "data"
        assert skill.success_rate > 0

    def test_graduated_skill_code_is_executable(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("analyze file contents deeply", "file", True)

        pipeline = PromotionPipeline()
        graduated = pipeline.run(tracker)
        assert len(graduated) >= 1

        # Verify the generated code actually runs
        runner = SkillRunner()
        result = runner.execute(graduated[0].code, {})
        # Should fail gracefully (no path) but not crash
        assert isinstance(result.success, bool)

    def test_pattern_reset_after_graduation(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("process data records", "data", True)

        pipeline = PromotionPipeline()
        pipeline.run(tracker)

        # After graduation, pattern should be reset
        candidates = tracker.check_promotions()
        assert len(candidates) == 0, "Pattern should be reset after graduation"

    def test_no_duplicate_graduation(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("process data records", "data", True)

        pipeline = PromotionPipeline()
        first = pipeline.run(tracker)
        assert len(first) == 1

        # Record again and try to graduate again
        for _ in range(3):
            tracker.record("process data records", "data", True)

        second = pipeline.run(tracker)
        assert len(second) == 0, "Should not re-graduate same pattern"

    def test_multiple_patterns_graduate(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("analyze file structure", "file", True)
            tracker.record("process data records carefully", "data", True)

        pipeline = PromotionPipeline()
        graduated = pipeline.run(tracker)
        assert len(graduated) == 2

    def test_stats_tracking(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("process data records", "data", True)

        pipeline = PromotionPipeline()
        pipeline.run(tracker)

        stats = pipeline.stats
        assert stats["candidates_seen"] >= 1
        assert stats["graduated"] >= 1
        assert stats["total_graduated"] >= 1


class TestGraduatedSkill:
    """Test GraduatedSkill dataclass."""

    def test_graduated_skill_fields(self) -> None:
        skill = GraduatedSkill(
            skill_id="grad_abc123",
            name="test_skill",
            code="def execute(ctx): return {'success': True}",
            domain="test",
            tags=["test"],
            success_rate=0.9,
            execution_count=10,
            created_at="2026-03-31T00:00:00Z",
            health_score=1.0,
        )
        assert skill.skill_id == "grad_abc123"
        assert skill.health_score == 1.0

    def test_default_fields(self) -> None:
        skill = GraduatedSkill(
            skill_id="x", name="x", code="", domain=""
        )
        assert skill.tags == []
        assert skill.success_rate == 0.0
        assert skill.execution_count == 0


class TestPipelineWithCustomComponents:
    """Test pipeline with injected components."""

    def test_custom_runner(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("compute statistics summary", "data", True)

        runner = SkillRunner(default_timeout_s=5.0)
        pipeline = PromotionPipeline(runner=runner)
        graduated = pipeline.run(tracker)
        assert len(graduated) >= 1

    def test_custom_health_monitor(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("compute statistics summary", "data", True)

        monitor = SkillHealthMonitor()
        pipeline = PromotionPipeline(health_monitor=monitor)
        graduated = pipeline.run(tracker)

        if graduated:
            # Health monitor should have tags registered
            skill = graduated[0]
            assert skill.skill_id in monitor._skill_tags

    def test_get_graduated(self) -> None:
        tracker = PatternTracker()
        for _ in range(3):
            tracker.record("process data records", "data", True)

        pipeline = PromotionPipeline()
        pipeline.run(tracker)

        all_graduated = pipeline.get_graduated()
        assert len(all_graduated) >= 1
