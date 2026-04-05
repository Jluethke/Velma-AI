# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""
Integration tests for the DebugEngine.

Creates actual broken Python code in tmp_path, runs the engine,
and verifies it detects and fixes the bugs.
"""

from __future__ import annotations

import sys

import pytest

from skillchain.debugger.engine import DebugEngine


def _has_pytest_available() -> bool:
    """Check if pytest is available for subprocess execution."""
    import shutil
    return shutil.which("pytest") is not None or shutil.which("python") is not None


@pytest.fixture
def engine():
    return DebugEngine()


class TestEngineWithBrokenRepo:
    """Full pipeline test with an actual broken Python project."""

    def _create_broken_repo(self, tmp_path):
        """Create a minimal broken Python project."""
        # Source code with a bug
        (tmp_path / "broken_code.py").write_text(
            'def add(a, b):\n'
            '    return a + b\n'
            '\n'
            'def divide(a, b):\n'
            '    return a / b  # no zero check\n',
            encoding="utf-8",
        )

        # Test file that exposes the bug
        (tmp_path / "test_broken.py").write_text(
            'from broken_code import add, divide\n'
            '\n'
            'def test_add():\n'
            '    assert add(1, 2) == 3\n'
            '\n'
            'def test_divide():\n'
            '    assert divide(10, 2) == 5\n'
            '\n'
            'def test_divide_by_zero():\n'
            '    assert divide(10, 0) == 0  # will raise ZeroDivisionError\n',
            encoding="utf-8",
        )

        # Make it a Python project
        (tmp_path / "conftest.py").write_text("", encoding="utf-8")

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_full_pipeline_autofix(self, engine: DebugEngine, tmp_path):
        """The wedge demo: broken code -> engine -> fixed code."""
        self._create_broken_repo(tmp_path)

        result = engine.run(str(tmp_path), mode="auto-fix", max_attempts=3)

        # Should have scanned successfully
        assert result.codebase is not None
        assert result.codebase.language == "python"
        assert result.codebase.test_runner == "pytest"

        # Should have found errors
        assert len(result.errors_found) > 0

        # Should have analyzed root cause
        assert len(result.analyses) > 0
        analysis = result.analyses[0]
        assert analysis.category == "runtime"
        assert analysis.confidence > 0.5

        # Should have attempted fixes
        assert len(result.fixes_attempted) > 0

        # Report should exist
        assert result.report is not None
        assert result.report.comparison_table
        assert result.report.summary

        # If fix was applied, the before/after should show improvement
        if result.fixes_applied:
            assert result.report.after_results.passed >= result.report.before_results.passed

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_diagnose_mode(self, engine: DebugEngine, tmp_path):
        """Diagnose-only mode should not modify files."""
        self._create_broken_repo(tmp_path)

        original_content = (tmp_path / "broken_code.py").read_text(encoding="utf-8")

        result = engine.run(str(tmp_path), mode="diagnose-only")

        # File should be unchanged
        assert (tmp_path / "broken_code.py").read_text(encoding="utf-8") == original_content

        # Should still find errors
        assert len(result.errors_found) > 0
        assert len(result.analyses) > 0
        assert "ZeroDivisionError" in result.explanation or "runtime" in result.explanation

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_explain_mode(self, engine: DebugEngine, tmp_path):
        """Explain mode should produce human-readable output."""
        self._create_broken_repo(tmp_path)

        result = engine.run(str(tmp_path), mode="explain")

        assert result.explanation
        # Should mention the error type
        assert "ZeroDivisionError" in result.explanation or "division" in result.explanation.lower()
        # Should have project info
        assert "python" in result.explanation.lower()

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_all_passing_project(self, engine: DebugEngine, tmp_path):
        """Engine should handle already-passing projects gracefully."""
        (tmp_path / "good_code.py").write_text(
            'def add(a, b):\n    return a + b\n',
            encoding="utf-8",
        )
        (tmp_path / "test_good.py").write_text(
            'from good_code import add\n\ndef test_add():\n    assert add(1, 2) == 3\n',
            encoding="utf-8",
        )
        (tmp_path / "conftest.py").write_text("", encoding="utf-8")

        result = engine.run(str(tmp_path), mode="auto-fix")

        assert result.success is True
        assert result.report is not None
        assert "already passing" in result.explanation.lower() or result.report.before_results.all_passing

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_with_error_text(self, engine: DebugEngine, tmp_path):
        """Engine should accept pre-provided error text."""
        self._create_broken_repo(tmp_path)

        error_text = (
            'Traceback (most recent call last):\n'
            '  File "test_broken.py", line 10, in test_divide_by_zero\n'
            '    assert divide(10, 0) == 0\n'
            '  File "broken_code.py", line 5, in divide\n'
            '    return a / b\n'
            'ZeroDivisionError: division by zero\n'
        )

        result = engine.run(str(tmp_path), error_text=error_text, mode="auto-fix")

        assert len(result.errors_found) > 0
        assert result.errors_found[0].error_type == "ZeroDivisionError"


class TestVerifiedFixMode:
    """Tests for the verified-fix (tournament) pipeline."""

    def _create_broken_repo(self, tmp_path):
        """Create a minimal broken Python project."""
        (tmp_path / "broken_code.py").write_text(
            'def add(a, b):\n'
            '    return a + b\n'
            '\n'
            'def divide(a, b):\n'
            '    return a / b  # no zero check\n',
            encoding="utf-8",
        )
        (tmp_path / "test_broken.py").write_text(
            'from broken_code import add, divide\n'
            '\n'
            'def test_add():\n'
            '    assert add(1, 2) == 3\n'
            '\n'
            'def test_divide():\n'
            '    assert divide(10, 2) == 5\n'
            '\n'
            'def test_divide_by_zero():\n'
            '    assert divide(10, 0) == 0  # will raise ZeroDivisionError\n',
            encoding="utf-8",
        )
        (tmp_path / "conftest.py").write_text("", encoding="utf-8")

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_verified_fix_mode(self, engine: DebugEngine, tmp_path):
        """Full tournament: broken code -> N candidates -> best selected -> tests pass."""
        self._create_broken_repo(tmp_path)

        result = engine.run(str(tmp_path), mode="verified-fix", candidate_count=3)

        # Should have scanned successfully
        assert result.codebase is not None
        assert result.codebase.language == "python"
        assert result.mode == "verified-fix"

        # Should have found errors
        assert len(result.errors_found) > 0

        # Should have tournament result
        assert result.tournament is not None
        assert result.tournament.total_candidates > 0
        assert result.tournament.tested_candidates > 0

        # Tournament should have ranked candidates
        if result.tournament.all_candidates:
            assert result.tournament.all_candidates[0].rank == 1

        # Report should exist and contain tournament info
        assert result.report is not None
        assert result.report.summary

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_tournament_ranking(self, engine: DebugEngine, tmp_path):
        """Candidates are ranked correctly by score."""
        self._create_broken_repo(tmp_path)

        result = engine.run(str(tmp_path), mode="verified-fix", candidate_count=3)

        if result.tournament and result.tournament.all_candidates:
            candidates = result.tournament.all_candidates
            # Should be sorted by score descending
            for i in range(len(candidates) - 1):
                assert candidates[i].score >= candidates[i + 1].score
            # Ranks should be sequential
            for i, cr in enumerate(candidates):
                assert cr.rank == i + 1

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_consensus_in_result(self, engine: DebugEngine, tmp_path):
        """Consensus is calculated and present in tournament result."""
        self._create_broken_repo(tmp_path)

        result = engine.run(str(tmp_path), mode="verified-fix", candidate_count=3)

        if result.tournament:
            assert 0.0 <= result.tournament.consensus <= 1.0

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_sandbox_isolation(self, engine: DebugEngine, tmp_path):
        """Each candidate gets its own sandbox, original files unchanged during tournament."""
        self._create_broken_repo(tmp_path)

        original_content = (tmp_path / "broken_code.py").read_text(encoding="utf-8")

        # Run in verified-fix mode
        result = engine.run(str(tmp_path), mode="verified-fix", candidate_count=2)

        # If no fix was applied (or it was rolled back), original should be intact
        if not result.fixes_applied:
            current = (tmp_path / "broken_code.py").read_text(encoding="utf-8")
            assert current == original_content


class TestCandidateDiversity:
    """Tests that generate_candidates produces different approaches."""

    def test_zero_division_diversity(self):
        """generate_candidates returns different approaches for ZeroDivisionError."""
        from skillchain.debugger.fix_generator import FixGenerator
        from skillchain.debugger.root_cause import RootCauseAnalysis

        fixer = FixGenerator()
        analysis = RootCauseAnalysis(
            primary_cause="ZeroDivisionError: division by zero",
            category="runtime",
            confidence=0.95,
            affected_files=["calc.py"],
            affected_lines={"calc.py": [2]},
        )
        contents = {
            "calc.py": "def ratio(x, y):\n    return x / y\n",
        }

        candidates = fixer.generate_candidates(analysis, contents, count=5)
        assert len(candidates) >= 2

        # No two candidates should have identical fixed content
        fixed_contents = []
        for c in candidates:
            for fc in c.files_changed:
                if fc.changed:
                    fixed_contents.append(fc.fixed_content)
        assert len(fixed_contents) == len(set(fixed_contents)), "Candidates should be deduplicated"

    def test_key_error_diversity(self):
        """generate_candidates returns different approaches for KeyError."""
        from skillchain.debugger.fix_generator import FixGenerator
        from skillchain.debugger.root_cause import RootCauseAnalysis

        fixer = FixGenerator()
        analysis = RootCauseAnalysis(
            primary_cause="KeyError: 'name'",
            category="runtime",
            confidence=0.9,
            affected_files=["handler.py"],
            affected_lines={"handler.py": [2]},
        )
        contents = {
            "handler.py": "def greet(data):\n    return f\"Hello, {data['name']}!\"\n",
        }

        candidates = fixer.generate_candidates(analysis, contents, count=5)
        assert len(candidates) >= 2

        # Should include .get() and at least one alternative
        descriptions = [c.description.lower() for c in candidates]
        assert any(".get(" in d or "get" in d for d in descriptions)


class TestEngineEdgeCases:
    def test_nonexistent_repo(self, engine: DebugEngine):
        """Should handle non-existent repo path."""
        result = engine.run("/nonexistent/path/xyz123")
        assert not result.success
        assert result.explanation  # Should have error info

    @pytest.mark.skipif(not _has_pytest_available(), reason="pytest not available")
    def test_no_test_files(self, engine: DebugEngine, tmp_path):
        """Should handle repos with no tests."""
        (tmp_path / "app.py").write_text("print('hello')\n", encoding="utf-8")
        (tmp_path / "requirements.txt").write_text("", encoding="utf-8")

        result = engine.run(str(tmp_path), mode="auto-fix")
        # Should not crash
        assert result.report is not None or result.explanation

    def test_diagnose_shortcut(self, engine: DebugEngine, tmp_path):
        """Test the diagnose() convenience method."""
        (tmp_path / "conftest.py").write_text("", encoding="utf-8")
        (tmp_path / "test_x.py").write_text("def test_fail():\n    assert False\n", encoding="utf-8")

        error_text = "AssertionError"
        analysis = engine.diagnose(str(tmp_path), error_text=error_text)
        # Should return an analysis object (even if minimal)
        assert analysis is not None
        assert analysis.primary_cause

    def test_explain_shortcut(self, engine: DebugEngine, tmp_path):
        """Test the explain() convenience method."""
        (tmp_path / "conftest.py").write_text("", encoding="utf-8")
        (tmp_path / "test_x.py").write_text("def test_fail():\n    assert False\n", encoding="utf-8")

        explanation = engine.explain(str(tmp_path))
        assert isinstance(explanation, str)
