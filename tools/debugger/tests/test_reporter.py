# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""Tests for the debug reporter — table formatting, summaries, improvement metrics."""

from __future__ import annotations

import pytest

from skillchain.tools.debugger.fix_generator import FileChange, ProposedFix
from skillchain.tools.debugger.reporter import DebugReporter
from skillchain.tools.debugger.test_runner import TestResults


@pytest.fixture
def reporter():
    return DebugReporter()


def _make_results(passed: int, failed: int, errors: int = 0, duration: float = 1.0) -> TestResults:
    return TestResults(
        passed=passed,
        failed=failed,
        errors=errors,
        total=passed + failed + errors,
        duration_s=duration,
    )


def _make_fix(desc: str, confidence: float, diff: str = "--- a\n+++ b\n") -> ProposedFix:
    return ProposedFix(
        fix_id="test-fix-001",
        description=desc,
        confidence=confidence,
        files_changed=[FileChange(
            file_path="test.py",
            original_content="old",
            fixed_content="new",
            diff=diff,
        )],
        explanation="Test fix explanation.",
    )


class TestFormatTable:
    def test_table_structure(self, reporter: DebugReporter):
        before = _make_results(3, 7)
        after = _make_results(10, 0)

        table = reporter.format_table(before, after)
        lines = table.strip().splitlines()

        # Should have header, separator, 4 data rows, and borders
        assert len(lines) >= 6
        assert "Before" in lines[1]
        assert "After" in lines[1]
        assert "Tests passing" in table
        assert "Failures" in table
        assert "Pass rate" in table

    def test_table_values(self, reporter: DebugReporter):
        before = _make_results(3, 7)
        after = _make_results(10, 0)

        table = reporter.format_table(before, after)
        assert "3/10" in table
        assert "10/10" in table
        assert "30%" in table
        assert "100%" in table

    def test_table_with_zero_tests(self, reporter: DebugReporter):
        before = _make_results(0, 0)
        after = _make_results(0, 0)

        table = reporter.format_table(before, after)
        assert "0/0" in table
        assert "0%" in table


class TestReport:
    def test_full_fix_report(self, reporter: DebugReporter):
        before = _make_results(3, 7, duration=0)
        after = _make_results(10, 0, duration=2.5)
        fix = _make_fix("Add zero-check", 0.9)

        report = reporter.report(before, after, [fix], 3500.0)

        assert report.improvement["tests_fixed"] == 7
        assert report.improvement["errors_removed"] == 7
        assert report.confidence == 0.9
        assert "ALL TESTS PASSING" in report.summary
        assert "3/10" in report.comparison_table
        assert "10/10" in report.comparison_table
        assert len(report.diffs) == 1

    def test_partial_fix_report(self, reporter: DebugReporter):
        before = _make_results(2, 8)
        after = _make_results(6, 4)
        fix = _make_fix("Partial fix", 0.6)

        report = reporter.report(before, after, [fix], 2000.0)

        assert report.improvement["tests_fixed"] == 4
        assert "Fixed 4 test(s)" in report.summary
        assert report.confidence == 0.6

    def test_no_fix_report(self, reporter: DebugReporter):
        before = _make_results(5, 5)
        after = _make_results(5, 5)

        report = reporter.report(before, after, [], 1000.0)

        assert report.improvement["tests_fixed"] == 0
        assert "No tests were fixed" in report.summary
        assert report.confidence == 0.0

    def test_multiple_fixes(self, reporter: DebugReporter):
        before = _make_results(0, 10)
        after = _make_results(10, 0)
        fixes = [
            _make_fix("Fix A", 0.9),
            _make_fix("Fix B", 0.7),
        ]

        report = reporter.report(before, after, fixes, 5000.0)

        assert report.confidence == pytest.approx(0.8, abs=0.01)
        assert "Fix A" in report.summary
        assert "Fix B" in report.summary
        assert len(report.diffs) == 2


class TestImprovement:
    def test_improvement_metrics(self, reporter: DebugReporter):
        before = _make_results(2, 8)
        after = _make_results(9, 1)

        report = reporter.report(before, after, [], 1000.0)

        assert report.improvement["before_pass_rate"] == pytest.approx(0.2)
        assert report.improvement["after_pass_rate"] == pytest.approx(0.9)
        assert report.improvement["pass_rate_delta"] == pytest.approx(0.7)
        assert report.improvement["duration_ms"] == 1000.0

    def test_pass_rate_in_summary(self, reporter: DebugReporter):
        before = _make_results(5, 5)
        after = _make_results(8, 2)
        fix = _make_fix("Improve", 0.8)

        report = reporter.report(before, after, [fix], 1000.0)
        assert "50%" in report.summary
        assert "80%" in report.summary
