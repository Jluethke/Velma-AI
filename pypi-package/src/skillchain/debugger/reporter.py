# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Before/after comparison reports for debug-and-fix results."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from typing import TYPE_CHECKING

from .fix_generator import ProposedFix
from .test_runner import TestResults

if TYPE_CHECKING:
    from .tournament import TournamentResult

logger = logging.getLogger(__name__)


@dataclass
class DebugReport:
    """Complete before/after debug report."""

    before_results: TestResults
    after_results: TestResults
    fixes_applied: list[ProposedFix] = field(default_factory=list)
    improvement: dict = field(default_factory=dict)
    confidence: float = 0.0
    summary: str = ""
    comparison_table: str = ""
    diffs: list[str] = field(default_factory=list)


class DebugReporter:
    """Generate before/after comparison reports."""

    def report(
        self,
        before: TestResults,
        after: TestResults,
        fixes: list[ProposedFix],
        duration_ms: float,
    ) -> DebugReport:
        """Generate a complete debug report comparing before and after states."""
        tests_fixed = max(0, after.passed - before.passed)
        errors_removed = max(0, (before.failed + before.errors) - (after.failed + after.errors))

        improvement = {
            "tests_fixed": tests_fixed,
            "errors_removed": errors_removed,
            "before_pass_rate": before.success_rate,
            "after_pass_rate": after.success_rate,
            "pass_rate_delta": after.success_rate - before.success_rate,
            "duration_ms": round(duration_ms, 1),
        }

        # Collect diffs
        diffs = []
        for fix in fixes:
            for fc in fix.files_changed:
                if fc.diff:
                    diffs.append(fc.diff)

        # Overall confidence: weighted average of fix confidences
        if fixes:
            confidence = sum(f.confidence for f in fixes) / len(fixes)
        else:
            confidence = 0.0

        # Build the table
        table = self.format_table(before, after)

        # Build summary
        summary = self._build_summary(before, after, fixes, tests_fixed, errors_removed, duration_ms)

        return DebugReport(
            before_results=before,
            after_results=after,
            fixes_applied=fixes,
            improvement=improvement,
            confidence=round(confidence, 3),
            summary=summary,
            comparison_table=table,
            diffs=diffs,
        )

    def format_table(self, before: TestResults, after: TestResults) -> str:
        """Format a before/after comparison table."""
        before_pass = f"{before.passed}/{before.total}"
        after_pass = f"{after.passed}/{after.total}"
        before_fail = str(before.failed + before.errors)
        after_fail = str(after.failed + after.errors)
        before_rate = f"{before.success_rate:.0%}"
        after_rate = f"{after.success_rate:.0%}"
        before_time = f"{before.duration_s:.1f}s" if before.duration_s > 0 else "--"
        after_time = f"{after.duration_s:.1f}s" if after.duration_s > 0 else "--"

        # Calculate column widths
        metric_col = max(14, len("Tests passing"))
        before_col = max(8, len(before_pass), len(before_fail), len(before_rate), len(before_time))
        after_col = max(8, len(after_pass), len(after_fail), len(after_rate), len(after_time))

        def row(metric: str, bval: str, aval: str) -> str:
            return f"| {metric:<{metric_col}} | {bval:>{before_col}} | {aval:>{after_col}} |"

        sep = f"+{'-' * (metric_col + 2)}+{'-' * (before_col + 2)}+{'-' * (after_col + 2)}+"
        header_sep = f"+{'=' * (metric_col + 2)}+{'=' * (before_col + 2)}+{'=' * (after_col + 2)}+"

        lines = [
            sep,
            row("Metric", "Before", "After"),
            header_sep,
            row("Tests passing", before_pass, after_pass),
            row("Failures", before_fail, after_fail),
            row("Pass rate", before_rate, after_rate),
            row("Time", before_time, after_time),
            sep,
        ]
        return "\n".join(lines)

    def _build_summary(
        self,
        before: TestResults,
        after: TestResults,
        fixes: list[ProposedFix],
        tests_fixed: int,
        errors_removed: int,
        duration_ms: float,
    ) -> str:
        """Build a human-readable summary string."""
        parts: list[str] = []

        if after.all_passing:
            parts.append("ALL TESTS PASSING.")
        elif tests_fixed > 0:
            parts.append(f"Fixed {tests_fixed} test(s).")
        else:
            parts.append("No tests were fixed.")

        if errors_removed > 0:
            parts.append(f"Removed {errors_removed} error(s).")

        if fixes:
            parts.append(f"Applied {len(fixes)} fix(es):")
            for fix in fixes:
                parts.append(f"  - {fix.description} (confidence: {fix.confidence:.0%})")

        before_rate = before.success_rate
        after_rate = after.success_rate
        if after_rate > before_rate:
            delta = after_rate - before_rate
            parts.append(f"Pass rate: {before_rate:.0%} -> {after_rate:.0%} (+{delta:.0%})")
        elif after_rate == before_rate and before_rate > 0:
            parts.append(f"Pass rate unchanged: {before_rate:.0%}")

        parts.append(f"Completed in {duration_ms:.0f}ms.")

        return "\n".join(parts)

    # -- Tournament reporting -----------------------------------------------------

    def tournament_report(
        self,
        before: TestResults,
        tournament: "TournamentResult",
        duration_ms: float,
    ) -> DebugReport:
        """Generate a report with tournament details.

        Includes:
        - Before/after comparison table
        - Tournament results table (all candidates ranked)
        - Winner, consensus, and confidence summary
        """
        from .tournament import TournamentResult  # runtime import

        winner_fix = tournament.winner.fix if tournament.winner else None
        after = tournament.winner.test_results if tournament.winner else before
        fixes = [winner_fix] if winner_fix else []

        # Standard metrics
        tests_fixed = max(0, after.passed - before.passed)
        errors_removed = max(0, (before.failed + before.errors) - (after.failed + after.errors))

        improvement = {
            "tests_fixed": tests_fixed,
            "errors_removed": errors_removed,
            "before_pass_rate": before.success_rate,
            "after_pass_rate": after.success_rate,
            "pass_rate_delta": after.success_rate - before.success_rate,
            "duration_ms": round(duration_ms, 1),
            "candidates_tested": tournament.tested_candidates,
            "consensus": tournament.consensus,
        }

        diffs = []
        if winner_fix:
            for fc in winner_fix.files_changed:
                if fc.diff:
                    diffs.append(fc.diff)

        confidence = winner_fix.confidence if winner_fix else 0.0

        # Build comparison table
        table = self.format_table(before, after)

        # Build tournament table
        tourn_table = self._format_tournament_table(tournament)

        # Build summary
        summary_parts: list[str] = []
        summary_parts.append(table)
        summary_parts.append("")
        summary_parts.append(tourn_table)
        summary_parts.append("")

        if tournament.winner:
            w = tournament.winner
            summary_parts.append(
                f"Winner: {w.fix.description} (Score: {w.score:.2f}, Best of {tournament.total_candidates})"
            )
            summary_parts.append(
                f"Consensus: {tournament.consensus:.0%} "
                f"({int(tournament.consensus * tournament.total_candidates)}/{tournament.total_candidates} agreed on approach)"
            )
            summary_parts.append(f"Confidence: {confidence:.0%}")
            summary_parts.append(
                f"VERIFIED across {tournament.tested_candidates} independent runs"
            )
        else:
            summary_parts.append("No candidate fixed the issue.")
            summary_parts.append(f"Tested {tournament.tested_candidates} candidates.")

        summary_parts.append(f"Completed in {duration_ms:.0f}ms.")

        summary = "\n".join(summary_parts)

        return DebugReport(
            before_results=before,
            after_results=after,
            fixes_applied=fixes,
            improvement=improvement,
            confidence=round(confidence, 3),
            summary=summary,
            comparison_table=table,
            diffs=diffs,
        )

    def _format_tournament_table(self, tournament: "TournamentResult") -> str:
        """Format a ranked table of tournament candidates."""
        from .tournament import TournamentResult  # runtime import

        if not tournament.all_candidates:
            return "No candidates tested."

        # Column widths
        rank_w = 4
        desc_w = max(22, max(len(c.fix.description[:30]) for c in tournament.all_candidates) + 2)
        score_w = 7
        tests_w = 10
        lines_w = 7

        def hdr():
            return (
                f"| {'#':>{rank_w}} "
                f"| {'Fix':<{desc_w}} "
                f"| {'Score':>{score_w}} "
                f"| {'Tests':>{tests_w}} "
                f"| {'Lines':>{lines_w}} |"
            )

        sep = f"+{'-' * (rank_w + 2)}+{'-' * (desc_w + 2)}+{'-' * (score_w + 2)}+{'-' * (tests_w + 2)}+{'-' * (lines_w + 2)}+"
        header_sep = f"+{'=' * (rank_w + 2)}+{'=' * (desc_w + 2)}+{'=' * (score_w + 2)}+{'=' * (tests_w + 2)}+{'=' * (lines_w + 2)}+"

        rows = [sep, hdr(), header_sep]

        for cr in tournament.all_candidates:
            marker = ">" if cr.rank == 1 else " "
            check = " pass" if cr.test_results.all_passing else ""
            desc = cr.fix.description[:desc_w]
            tests_str = f"{cr.test_results.passed}/{cr.test_results.total}{check}"
            lines_changed = cr.lines_changed
            lines_str = f"+{lines_changed}"

            row = (
                f"| {marker}{cr.rank:>{rank_w - 1}} "
                f"| {desc:<{desc_w}} "
                f"| {cr.score:>{score_w}.2f} "
                f"| {tests_str:>{tests_w}} "
                f"| {lines_str:>{lines_w}} |"
            )
            rows.append(row)

        rows.append(sep)
        return "\n".join(rows)
