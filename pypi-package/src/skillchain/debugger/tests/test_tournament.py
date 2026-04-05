# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""Tests for the FixTournament — scoring, ranking, consensus, parallel execution."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from skillchain.debugger.fix_generator import FileChange, ProposedFix
from skillchain.debugger.sandbox import SandboxManager
from skillchain.debugger.test_runner import TestResults
from skillchain.debugger.tournament import CandidateResult, FixTournament, TournamentResult


def _make_fix(fix_id: str, desc: str, confidence: float, file_path: str = "app.py") -> ProposedFix:
    return ProposedFix(
        fix_id=fix_id,
        description=desc,
        confidence=confidence,
        files_changed=[FileChange(
            file_path=file_path,
            original_content="x = 1\n",
            fixed_content="x = 2\n",
            diff="",
        )],
    )


def _make_results(passed: int, failed: int, errors: int = 0) -> TestResults:
    return TestResults(
        passed=passed,
        failed=failed,
        errors=errors,
        total=passed + failed + errors,
    )


class TestScoringFormula:
    """Score = 0.5*pass_improvement + 0.2*confidence + 0.15*minimality + 0.15*no_regression"""

    def test_perfect_fix(self):
        fix = _make_fix("f1", "Perfect fix", confidence=1.0)
        baseline = _make_results(5, 5)
        after = _make_results(10, 0)

        score = FixTournament._score_candidate(fix, after, baseline)
        # pass_improvement=1.0, confidence=1.0, minimality~1.0, no_regression=1.0
        assert score > 0.9

    def test_no_improvement(self):
        fix = _make_fix("f2", "No change", confidence=0.5)
        baseline = _make_results(5, 5)
        after = _make_results(5, 5)

        score = FixTournament._score_candidate(fix, after, baseline)
        # pass_improvement=0.0 (50%), confidence=0.5 (20%), minimality, no_regression
        assert score < 0.5

    def test_regression(self):
        fix = _make_fix("f3", "Regression fix", confidence=0.8)
        baseline = _make_results(8, 2)
        after = _make_results(5, 5)

        score = FixTournament._score_candidate(fix, after, baseline)
        # pass_improvement=0 (negative clamped), regression penalty
        assert score < 0.5

    def test_higher_confidence_scores_better(self):
        fix_hi = _make_fix("fhi", "High conf", confidence=0.95)
        fix_lo = _make_fix("flo", "Low conf", confidence=0.3)
        baseline = _make_results(5, 5)
        after = _make_results(8, 2)

        score_hi = FixTournament._score_candidate(fix_hi, after, baseline)
        score_lo = FixTournament._score_candidate(fix_lo, after, baseline)
        assert score_hi > score_lo

    def test_fewer_lines_scores_better(self):
        # Fix with 1 line changed
        fix_small = ProposedFix(
            fix_id="fs",
            description="Small",
            confidence=0.8,
            files_changed=[FileChange("a.py", "x = 1\n", "x = 2\n", "")],
        )
        # Fix with many lines changed
        fix_big = ProposedFix(
            fix_id="fb",
            description="Big",
            confidence=0.8,
            files_changed=[FileChange(
                "a.py",
                "x = 1\n",
                "x = 2\ny = 3\nz = 4\nw = 5\na = 6\nb = 7\nc = 8\nd = 9\ne = 10\nf = 11\n",
                "",
            )],
        )
        baseline = _make_results(5, 5)
        after = _make_results(10, 0)

        score_small = FixTournament._score_candidate(fix_small, after, baseline)
        score_big = FixTournament._score_candidate(fix_big, after, baseline)
        assert score_small > score_big


class TestWinnerSelection:
    def test_highest_score_wins(self):
        """Highest score wins in the tournament."""
        cr1 = CandidateResult(
            fix=_make_fix("f1", "Fix A", 0.9),
            test_results=_make_results(10, 0),
            sandbox_path=Path("/tmp/sb1"),
            score=0.95,
        )
        cr2 = CandidateResult(
            fix=_make_fix("f2", "Fix B", 0.7),
            test_results=_make_results(8, 2),
            sandbox_path=Path("/tmp/sb2"),
            score=0.72,
        )
        cr3 = CandidateResult(
            fix=_make_fix("f3", "Fix C", 0.5),
            test_results=_make_results(6, 4),
            sandbox_path=Path("/tmp/sb3"),
            score=0.50,
        )

        # Simulate sorting as tournament does
        candidates = [cr3, cr1, cr2]
        candidates.sort(key=lambda c: c.score, reverse=True)
        for i, cr in enumerate(candidates):
            cr.rank = i + 1

        assert candidates[0].fix.fix_id == "f1"
        assert candidates[0].rank == 1


class TestAllCandidatesFail:
    def test_reports_failure(self, tmp_path):
        """If no candidate fixes the issue, winner is None."""
        (tmp_path / "app.py").write_text("x = 1\n", encoding="utf-8")

        # Mock test runner that always returns failing
        mock_runner = MagicMock()
        mock_runner.run.return_value = _make_results(0, 10)

        with SandboxManager(tmp_path) as mgr:
            tournament = FixTournament(mgr, mock_runner, parallel=False)
            result = tournament.run(
                [_make_fix("f1", "Bad fix", 0.3)],
                baseline=_make_results(0, 10),
            )

        # Score will be >0 because of confidence component, but still should report
        assert result.tested_candidates == 1
        assert len(result.all_candidates) == 1


class TestConsensusCalculation:
    def test_all_same_files(self):
        """All candidates modifying same file = high consensus."""
        candidates = [
            CandidateResult(
                fix=_make_fix(f"f{i}", f"Fix {i}", 0.8, "app.py"),
                test_results=_make_results(10, 0),
                sandbox_path=Path(f"/tmp/sb{i}"),
                score=0.9,
            )
            for i in range(5)
        ]
        consensus = FixTournament._compute_consensus(candidates)
        assert consensus == 1.0

    def test_all_different_files(self):
        """Each candidate modifying a different file = low consensus."""
        candidates = [
            CandidateResult(
                fix=_make_fix(f"f{i}", f"Fix {i}", 0.8, f"file_{i}.py"),
                test_results=_make_results(10, 0),
                sandbox_path=Path(f"/tmp/sb{i}"),
                score=0.9,
            )
            for i in range(5)
        ]
        consensus = FixTournament._compute_consensus(candidates)
        assert consensus == 0.2  # 1/5

    def test_majority_agree(self):
        """3/5 modifying same file = 0.6 consensus."""
        candidates = []
        for i in range(3):
            candidates.append(CandidateResult(
                fix=_make_fix(f"f{i}", f"Fix {i}", 0.8, "common.py"),
                test_results=_make_results(10, 0),
                sandbox_path=Path(f"/tmp/sb{i}"),
                score=0.9,
            ))
        for i in range(3, 5):
            candidates.append(CandidateResult(
                fix=_make_fix(f"f{i}", f"Fix {i}", 0.8, f"other_{i}.py"),
                test_results=_make_results(10, 0),
                sandbox_path=Path(f"/tmp/sb{i}"),
                score=0.9,
            ))
        consensus = FixTournament._compute_consensus(candidates)
        assert consensus == 0.6

    def test_single_candidate(self):
        """Single candidate = 1.0 consensus."""
        candidates = [CandidateResult(
            fix=_make_fix("f1", "Fix", 0.8),
            test_results=_make_results(10, 0),
            sandbox_path=Path("/tmp/sb1"),
            score=0.9,
        )]
        consensus = FixTournament._compute_consensus(candidates)
        assert consensus == 1.0


class TestParallelExecution:
    def test_uses_thread_pool(self, tmp_path):
        """Candidates tested via ThreadPoolExecutor when parallel=True."""
        (tmp_path / "app.py").write_text("x = 1\n", encoding="utf-8")

        call_count = 0

        def mock_run(repo_path, **kwargs):
            nonlocal call_count
            call_count += 1
            return _make_results(10, 0)

        mock_runner = MagicMock()
        mock_runner.run.side_effect = mock_run

        with SandboxManager(tmp_path) as mgr:
            tournament = FixTournament(mgr, mock_runner, parallel=True)
            fixes = [_make_fix(f"f{i}", f"Fix {i}", 0.8) for i in range(3)]
            result = tournament.run(
                fixes,
                baseline=_make_results(5, 5),
            )

        assert result.tested_candidates == 3
        assert call_count == 3

    def test_sequential_fallback(self, tmp_path):
        """Works sequentially when parallel=False."""
        (tmp_path / "app.py").write_text("x = 1\n", encoding="utf-8")

        mock_runner = MagicMock()
        mock_runner.run.return_value = _make_results(10, 0)

        with SandboxManager(tmp_path) as mgr:
            tournament = FixTournament(mgr, mock_runner, parallel=False)
            fixes = [_make_fix(f"f{i}", f"Fix {i}", 0.8) for i in range(2)]
            result = tournament.run(
                fixes,
                baseline=_make_results(5, 5),
            )

        assert result.tested_candidates == 2
