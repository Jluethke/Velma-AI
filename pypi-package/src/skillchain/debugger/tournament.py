# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
tournament.py
=============

Tournament-style selection of the best fix from multiple candidates.
Each candidate is applied in an isolated sandbox, tests are run,
and results are compared to select the winner.
"""

from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path

from .fix_generator import ProposedFix
from .sandbox import SandboxManager
from .test_runner import TestResults, TestRunner

logger = logging.getLogger(__name__)


@dataclass
class CandidateResult:
    """Outcome of testing a single candidate fix in its sandbox."""

    fix: ProposedFix
    test_results: TestResults
    sandbox_path: Path
    score: float              # Computed from test results
    rank: int = 0             # 1 = best

    @property
    def lines_changed(self) -> int:
        """Total number of lines added/removed across all file changes."""
        total = 0
        for fc in self.fix.files_changed:
            if not fc.changed:
                continue
            orig_lines = fc.original_content.splitlines()
            fixed_lines = fc.fixed_content.splitlines()
            total += abs(len(fixed_lines) - len(orig_lines))
            # Also count modified lines (rough heuristic)
            for a, b in zip(orig_lines, fixed_lines):
                if a != b:
                    total += 1
        return max(total, 1)


@dataclass
class TournamentResult:
    """Complete result of a fix tournament."""

    winner: CandidateResult | None
    all_candidates: list[CandidateResult]
    consensus: float          # How many candidates agreed on approach (0-1)
    total_candidates: int
    tested_candidates: int
    tournament_duration_ms: float

    @property
    def success(self) -> bool:
        return self.winner is not None and self.winner.score > 0


class FixTournament:
    """Run multiple fix candidates through parallel testing and select the best."""

    def __init__(
        self,
        sandbox_manager: SandboxManager,
        test_runner: TestRunner,
        *,
        parallel: bool = True,
    ):
        self._sandbox = sandbox_manager
        self._runner = test_runner
        self._parallel = parallel

    def run(
        self,
        candidates: list[ProposedFix],
        test_command: str | None = None,
        language: str | None = None,
        baseline: TestResults | None = None,
    ) -> TournamentResult:
        """
        Tournament process:
        1. Create N sandboxes (one per candidate)
        2. Apply each fix to its sandbox
        3. Run tests in each sandbox (parallel with ThreadPoolExecutor if enabled)
        4. Score each candidate
        5. Select winner
        6. Compute consensus
        """
        start = time.monotonic()
        n = len(candidates)

        if n == 0:
            return TournamentResult(
                winner=None,
                all_candidates=[],
                consensus=0.0,
                total_candidates=0,
                tested_candidates=0,
                tournament_duration_ms=0.0,
            )

        # 1. Create sandboxes
        logger.info("Creating %d sandboxes...", n)
        sandboxes = self._sandbox.create(n)

        # 2. Apply fixes
        applied: list[tuple[ProposedFix, Path]] = []
        for fix, sb in zip(candidates, sandboxes):
            ok = self._sandbox.apply_fix(sb, fix)
            if ok:
                applied.append((fix, sb))
            else:
                logger.warning("Failed to apply fix %s to sandbox", fix.fix_id)

        # 3. Run tests
        results: list[CandidateResult] = []
        if self._parallel and len(applied) > 1:
            results = self._run_parallel(applied, test_command, language, baseline)
        else:
            results = self._run_sequential(applied, test_command, language, baseline)

        # 4-5. Score and rank
        results.sort(key=lambda c: c.score, reverse=True)
        for i, cr in enumerate(results):
            cr.rank = i + 1

        winner = results[0] if results and results[0].score > 0 else None

        # 6. Consensus
        consensus = self._compute_consensus(results)

        duration_ms = (time.monotonic() - start) * 1000

        return TournamentResult(
            winner=winner,
            all_candidates=results,
            consensus=consensus,
            total_candidates=n,
            tested_candidates=len(results),
            tournament_duration_ms=duration_ms,
        )

    # -- internal -----------------------------------------------------------------

    def _test_one(
        self,
        fix: ProposedFix,
        sandbox_path: Path,
        test_command: str | None,
        language: str | None,
        baseline: TestResults | None,
    ) -> CandidateResult:
        """Test a single candidate in its sandbox and return scored result."""
        test_results = self._runner.run(
            sandbox_path,
            test_command=test_command,
            language=language,
        )
        score = self._score_candidate(fix, test_results, baseline)
        return CandidateResult(
            fix=fix,
            test_results=test_results,
            sandbox_path=sandbox_path,
            score=score,
        )

    def _run_parallel(
        self,
        applied: list[tuple[ProposedFix, Path]],
        test_command: str | None,
        language: str | None,
        baseline: TestResults | None,
    ) -> list[CandidateResult]:
        """Run tests across sandboxes in parallel using ThreadPoolExecutor."""
        results: list[CandidateResult] = []
        with ThreadPoolExecutor(max_workers=len(applied)) as pool:
            futures = {
                pool.submit(
                    self._test_one, fix, sb, test_command, language, baseline,
                ): fix.fix_id
                for fix, sb in applied
            }
            for future in as_completed(futures):
                fix_id = futures[future]
                try:
                    cr = future.result()
                    results.append(cr)
                    logger.info(
                        "Candidate %s scored %.2f (%d/%d passing)",
                        fix_id, cr.score, cr.test_results.passed, cr.test_results.total,
                    )
                except Exception as exc:
                    logger.error("Candidate %s failed: %s", fix_id, exc)
        return results

    def _run_sequential(
        self,
        applied: list[tuple[ProposedFix, Path]],
        test_command: str | None,
        language: str | None,
        baseline: TestResults | None,
    ) -> list[CandidateResult]:
        """Run tests one at a time (fallback when parallel is disabled)."""
        results: list[CandidateResult] = []
        for fix, sb in applied:
            try:
                cr = self._test_one(fix, sb, test_command, language, baseline)
                results.append(cr)
                logger.info(
                    "Candidate %s scored %.2f (%d/%d passing)",
                    fix.fix_id, cr.score, cr.test_results.passed, cr.test_results.total,
                )
            except Exception as exc:
                logger.error("Candidate %s failed: %s", fix.fix_id, exc)
        return results

    @staticmethod
    def _score_candidate(
        fix: ProposedFix,
        test_results: TestResults,
        baseline: TestResults | None,
    ) -> float:
        """
        Score a candidate fix.

        Formula:
            50% test pass rate improvement (before -> after)
            20% fix confidence (from fix_generator)
            15% minimality (fewer lines changed = better)
            15% no regressions (didn't break other tests)
        """
        # -- pass rate improvement (50%) --
        if baseline and baseline.total > 0:
            before_rate = baseline.success_rate
            after_rate = test_results.success_rate
            improvement = max(0.0, after_rate - before_rate)
            # Normalise: 0->1 improvement maps to 0->1 score
            pass_score = min(improvement / max(1.0 - before_rate, 0.01), 1.0)
        else:
            pass_score = test_results.success_rate

        # -- confidence (20%) --
        confidence_score = fix.confidence

        # -- minimality (15%) --
        total_changed = 0
        for fc in fix.files_changed:
            if fc.changed:
                orig = fc.original_content.splitlines()
                fixed = fc.fixed_content.splitlines()
                total_changed += abs(len(fixed) - len(orig))
                for a, b in zip(orig, fixed):
                    if a != b:
                        total_changed += 1
        total_changed = max(total_changed, 1)
        # Fewer changes = higher score.  1 line -> 1.0, 20+ lines -> ~0.2
        minimality_score = min(1.0, 5.0 / total_changed)

        # -- no regressions (15%) --
        if baseline and baseline.total > 0:
            # Count tests that were passing before but now fail
            regressions = max(0, baseline.passed - test_results.passed)
            if test_results.passed > baseline.passed:
                regressions = 0
            regression_score = 1.0 - min(regressions / max(baseline.passed, 1), 1.0)
        else:
            regression_score = 1.0 if test_results.all_passing else 0.5

        score = (
            pass_score * 0.50
            + confidence_score * 0.20
            + minimality_score * 0.15
            + regression_score * 0.15
        )
        return round(score, 4)

    @staticmethod
    def _compute_consensus(candidates: list[CandidateResult]) -> float:
        """
        Consensus: how many candidates fixed the same files/lines?

        If 4/5 candidates all modified the same function -> high consensus (0.8)
        If all 5 modified different files -> low consensus (0.2)
        """
        if len(candidates) <= 1:
            return 1.0

        # Build a set of modified files per candidate
        modified_files: list[set[str]] = []
        for cr in candidates:
            files = {fc.file_path for fc in cr.fix.files_changed if fc.changed}
            modified_files.append(files)

        if not modified_files:
            return 0.0

        # Count how many candidates share the same modified-file set as the plurality
        from collections import Counter
        file_signatures = Counter(frozenset(fs) for fs in modified_files)
        most_common_count = file_signatures.most_common(1)[0][1]

        return round(most_common_count / len(candidates), 2)
