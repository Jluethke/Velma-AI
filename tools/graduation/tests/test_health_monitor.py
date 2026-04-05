"""Tests for health_monitor.py."""

from __future__ import annotations

import time

import pytest

from skillchain.tools.graduation.health_monitor import SkillHealthMonitor


class TestHealthComputation:
    """Test health score computation."""

    def test_healthy_skill(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()
        # Recent, all successful
        for i in range(10):
            monitor.record_call("s1", True, timestamp=now - i * 3600)

        health = monitor.compute_health("s1", now=now)
        assert health > 0.7, f"Expected healthy score, got {health}"

    def test_failing_skill_low_health(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()
        # All failures
        for i in range(10):
            monitor.record_call("s1", False, timestamp=now - i * 3600)

        health = monitor.compute_health("s1", now=now)
        assert health < 0.7, f"Expected lower health for failing skill, got {health}"

    def test_old_skill_decays(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()
        # Used 60 days ago, all successful
        for i in range(5):
            monitor.record_call("s1", True, timestamp=now - 60 * 86400 - i * 3600)

        health = monitor.compute_health("s1", now=now)
        # Recency should be very low due to 60-day gap
        assert health < 0.7

    def test_unknown_skill_gets_default(self) -> None:
        monitor = SkillHealthMonitor()
        health = monitor.compute_health("unknown_skill")
        # No calls — uses defaults (recency=0.3, success=0.5, overlap=0.0)
        assert 0.0 < health < 1.0

    def test_health_bounded_zero_to_one(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()
        monitor.record_call("s1", True, timestamp=now)
        health = monitor.compute_health("s1", now=now)
        assert 0.0 <= health <= 1.0

    def test_overlap_reduces_health(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()

        monitor.record_call("s1", True, timestamp=now)
        monitor.record_call("s2", True, timestamp=now)

        # Register identical tags (high overlap)
        monitor.register_tags("s1", {"data", "analysis", "report"})
        monitor.register_tags("s2", {"data", "analysis", "report"})

        health_s1 = monitor.compute_health("s1", now=now)

        # Now make s1 unique
        monitor.register_tags("s1", {"unique", "special", "different"})
        health_unique = monitor.compute_health("s1", now=now)

        assert health_unique >= health_s1, (
            f"Unique skill ({health_unique}) should be at least as healthy "
            f"as overlapping one ({health_s1})"
        )


class TestQuarantine:
    """Test quarantine management."""

    def test_quarantine_skill(self) -> None:
        monitor = SkillHealthMonitor()
        monitor.quarantine("s1")
        assert monitor.is_quarantined("s1")
        assert "s1" in monitor.get_quarantined()

    def test_rehabilitate_skill(self) -> None:
        monitor = SkillHealthMonitor()
        monitor.quarantine("s1")
        assert monitor.rehabilitate("s1")
        assert not monitor.is_quarantined("s1")

    def test_rehabilitate_non_quarantined(self) -> None:
        monitor = SkillHealthMonitor()
        assert not monitor.rehabilitate("s1")

    def test_auto_quarantine_low_health(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()
        # Recent failures within 30d window + high overlap = low health
        for i in range(10):
            monitor.record_call("s1", False, timestamp=now - 90 * 86400 + i)
        # Also register high overlap
        monitor.register_tags("s1", {"data", "analysis"})
        monitor.register_tags("s2", {"data", "analysis"})

        quarantined = monitor.auto_quarantine("s1", now=now)
        assert quarantined
        assert monitor.is_quarantined("s1")

    def test_auto_quarantine_healthy_skill(self) -> None:
        monitor = SkillHealthMonitor()
        now = time.time()
        for i in range(10):
            monitor.record_call("s1", True, timestamp=now - i * 3600)

        quarantined = monitor.auto_quarantine("s1", now=now)
        assert not quarantined
        assert not monitor.is_quarantined("s1")


class TestCallRecording:
    """Test call log behavior."""

    def test_records_calls(self) -> None:
        monitor = SkillHealthMonitor()
        monitor.record_call("s1", True)
        monitor.record_call("s1", False)
        assert len(monitor._call_log["s1"]) == 2

    def test_trims_to_100(self) -> None:
        monitor = SkillHealthMonitor()
        for i in range(120):
            monitor.record_call("s1", True, timestamp=float(i))
        assert len(monitor._call_log["s1"]) == 100

    def test_default_timestamp(self) -> None:
        monitor = SkillHealthMonitor()
        before = time.time()
        monitor.record_call("s1", True)
        after = time.time()
        ts = monitor._call_log["s1"][0].timestamp
        assert before <= ts <= after
