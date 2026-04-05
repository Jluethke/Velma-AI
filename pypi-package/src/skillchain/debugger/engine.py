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
DebugEngine — the complete debug-and-fix pipeline.

Drop your repo, get working code back.

Usage::

    engine = DebugEngine()
    result = engine.run("/path/to/broken/repo")
    print(result.report.summary)
    print(result.report.comparison_table)
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from pathlib import Path

from .config import DebugConfig
from .error_parser import ErrorParser, ParsedError
from .fix_generator import FileChange, FixGenerator, ProposedFix
from .reporter import DebugReport, DebugReporter
from .root_cause import RootCauseAnalysis, RootCauseAnalyzer
from .sandbox import SandboxManager
from .scanner import CodebaseInfo, CodebaseScanner
from .test_runner import TestResults, TestRunner
from .tournament import CandidateResult, FixTournament, TournamentResult

logger = logging.getLogger(__name__)


@dataclass
class DebugResult:
    """Complete result of a debug-and-fix run."""

    success: bool = False
    mode: str = "auto-fix"
    codebase: CodebaseInfo | None = None
    errors_found: list[ParsedError] = field(default_factory=list)
    analyses: list[RootCauseAnalysis] = field(default_factory=list)
    fixes_attempted: list[ProposedFix] = field(default_factory=list)
    fixes_applied: list[ProposedFix] = field(default_factory=list)
    report: DebugReport | None = None
    tournament: TournamentResult | None = None
    explanation: str = ""
    duration_ms: float = 0.0


class DebugEngine:
    """
    The complete debug-and-fix pipeline.

    Modes:
        verified-fix:   Scan -> Test -> Parse -> Analyze -> Generate N candidates
                        -> Test all in parallel sandboxes -> Select winner -> Report
        auto-fix:       Scan -> Test -> Parse -> Analyze -> Fix -> Verify -> Report
        diagnose-only:  Scan -> Test -> Parse -> Analyze -> Report (no changes)
        explain:        Scan -> Test -> Parse -> Analyze -> Explain (human-readable)
    """

    def __init__(self, config: DebugConfig | None = None):
        self.config = config or DebugConfig()
        self.scanner = CodebaseScanner(self.config)
        self.parser = ErrorParser()
        self.analyzer = RootCauseAnalyzer()
        self.fixer = FixGenerator()
        self.runner = TestRunner(self.config)
        self.reporter = DebugReporter()

    def run(
        self,
        repo_path: str | Path,
        error_text: str | None = None,
        mode: str = "verified-fix",
        max_attempts: int | None = None,
        candidate_count: int | None = None,
    ) -> DebugResult:
        """
        Full debug-and-fix pipeline.

        Steps (verified-fix mode):
            1. SCAN    — understand the codebase
            2. TEST    — run tests to get baseline (before)
            3. PARSE   — parse errors from test output or provided error_text
            4. ANALYZE — root cause analysis
            5. GENERATE N candidate fixes
            6. CREATE N sandboxes
            7. APPLY each fix to its sandbox
            8. TEST each sandbox (parallel)
            9. SCORE and RANK candidates
            10. SELECT winner
            11. APPLY winner to actual repo
            12. RUN final verification on real repo
            13. REPORT with before/after + tournament results

        Args:
            repo_path: Path to the repository
            error_text: Optional error message / traceback to parse directly
            mode: "verified-fix" | "auto-fix" | "diagnose-only" | "explain"
            max_attempts: Max fix attempts (default from config)
            candidate_count: Number of fix candidates to generate (verified-fix mode)
        """
        if mode == "verified-fix":
            return self._run_verified(
                repo_path, error_text,
                candidate_count=candidate_count or self.config.candidate_count,
            )
        elif mode == "auto-fix":
            return self._run_auto(repo_path, error_text, max_attempts)
        elif mode in ("diagnose-only", "explain"):
            return self._run_analysis(repo_path, error_text, mode)
        else:
            raise ValueError(f"Unknown mode: {mode!r}")

    def _run_auto(
        self,
        repo_path: str | Path,
        error_text: str | None = None,
        max_attempts: int | None = None,
    ) -> DebugResult:
        """Legacy single-fix pipeline."""
        start = time.monotonic()
        repo_path = Path(repo_path).resolve()
        max_attempts = max_attempts or self.config.max_fix_attempts

        result = DebugResult(mode="auto-fix")

        try:
            # 1. SCAN
            logger.info("SCAN: Analyzing codebase at %s", repo_path)
            codebase = self.scanner.scan(repo_path)
            result.codebase = codebase
            logger.info("  Language: %s | Framework: %s | Test cmd: %s",
                         codebase.language, codebase.framework, codebase.test_command)

            # 2. TEST (before)
            logger.info("TEST: Running baseline tests...")
            before = self.runner.run(
                repo_path,
                test_command=codebase.test_command,
                language=codebase.language,
            )
            logger.info("  Before: %d/%d passing (%.0f%%)",
                         before.passed, before.total, before.success_rate * 100)

            # 3. PARSE
            logger.info("PARSE: Extracting errors...")
            errors = self._extract_errors(error_text, before, codebase)
            result.errors_found = errors

            if not errors:
                if before.all_passing:
                    logger.info("  No errors found — all tests passing!")
                    result.success = True
                    result.report = self.reporter.report(before, before, [], 0)
                    result.explanation = "All tests are already passing. No fixes needed."
                else:
                    logger.warning("  Could not parse any errors from test output.")
                    result.report = self.reporter.report(before, before, [], 0)
                    result.explanation = "Tests are failing but could not parse error details."
                result.duration_ms = (time.monotonic() - start) * 1000
                return result

            logger.info("  Found %d error(s)", len(errors))

            # 4. ANALYZE
            logger.info("ANALYZE: Root cause analysis...")
            file_contents = self._read_affected_files(repo_path, errors, codebase)
            analyses = []
            for error in errors:
                analysis = self.analyzer.analyze(error, codebase, file_contents)
                analyses.append(analysis)
                logger.info("  %s (confidence: %.0f%%)", analysis.primary_cause, analysis.confidence * 100)
            result.analyses = analyses

            # 5-9. FIX loop
            logger.info("FIX: Generating and applying fixes...")
            after = before
            applied_fixes: list[ProposedFix] = []

            # Generate ALL fixes across all analyses
            all_fixes: list[ProposedFix] = []
            for analysis in analyses:
                fixes = self.fixer.generate(analysis, file_contents)
                all_fixes.extend(fixes)
            all_fixes.sort(key=lambda f: f.confidence, reverse=True)

            # Try fixes in order of confidence
            attempt = 0
            for fix in all_fixes:
                if attempt >= max_attempts:
                    break
                if after.all_passing:
                    break

                attempt += 1
                result.fixes_attempted.append(fix)
                logger.info("  Attempt %d/%d: %s (confidence: %.0f%%)",
                             attempt, max_attempts, fix.description, fix.confidence * 100)

                # 6. APPLY
                self._apply_fix(fix, repo_path)

                # 7. TEST (after)
                after = self.runner.run(
                    repo_path,
                    test_command=codebase.test_command,
                    language=codebase.language,
                )
                logger.info("    After: %d/%d passing (%.0f%%)",
                             after.passed, after.total, after.success_rate * 100)

                # 8. VERIFY
                if after.success_rate > before.success_rate or after.all_passing:
                    applied_fixes.append(fix)
                    logger.info("    FIX HELPED — keeping it.")
                    # Update file_contents for subsequent fixes
                    for fc in fix.files_changed:
                        file_contents[fc.file_path] = fc.fixed_content
                else:
                    # 9. ROLLBACK and try next
                    logger.info("    Fix did not help — rolling back.")
                    self._rollback_fix(fix, repo_path)
                    after = before  # Reset to baseline

            result.fixes_applied = applied_fixes
            result.success = after.all_passing or after.success_rate > before.success_rate

            # 10. REPORT
            elapsed_ms = (time.monotonic() - start) * 1000
            result.report = self.reporter.report(before, after, applied_fixes, elapsed_ms)
            result.duration_ms = elapsed_ms

            logger.info("DONE: %s in %.0fms", "SUCCESS" if result.success else "PARTIAL", elapsed_ms)

        except Exception as exc:
            logger.exception("DebugEngine failed: %s", exc)
            result.duration_ms = (time.monotonic() - start) * 1000
            result.explanation = f"Engine error: {exc}"

        return result

    def _run_verified(
        self,
        repo_path: str | Path,
        error_text: str | None = None,
        candidate_count: int = 5,
    ) -> DebugResult:
        """
        The killer pipeline: multi-candidate fix generation with tournament selection.

        1.  SCAN codebase
        2.  RUN tests (before baseline)
        3.  PARSE errors
        4.  ANALYZE root cause
        5.  GENERATE N candidate fixes
        6.  CREATE N sandboxes
        7.  APPLY each fix to its sandbox
        8.  TEST each sandbox (parallel)
        9.  SCORE and RANK candidates
        10. SELECT winner
        11. APPLY winner to actual repo
        12. RUN final verification on real repo
        13. REPORT with before/after + tournament results
        """
        start = time.monotonic()
        repo_path = Path(repo_path).resolve()
        result = DebugResult(mode="verified-fix")

        try:
            # 1. SCAN
            logger.info("SCAN: Analyzing codebase at %s", repo_path)
            codebase = self.scanner.scan(repo_path)
            result.codebase = codebase
            logger.info("  Language: %s | Framework: %s | Test cmd: %s",
                         codebase.language, codebase.framework, codebase.test_command)

            # 2. TEST (before baseline)
            logger.info("TEST: Running baseline tests...")
            before = self.runner.run(
                repo_path,
                test_command=codebase.test_command,
                language=codebase.language,
            )
            logger.info("  Before: %d/%d passing (%.0f%%)",
                         before.passed, before.total, before.success_rate * 100)

            # 3. PARSE
            logger.info("PARSE: Extracting errors...")
            errors = self._extract_errors(error_text, before, codebase)
            result.errors_found = errors

            if not errors:
                if before.all_passing:
                    logger.info("  No errors found — all tests passing!")
                    result.success = True
                    result.report = self.reporter.report(before, before, [], 0)
                    result.explanation = "All tests are already passing. No fixes needed."
                else:
                    logger.warning("  Could not parse any errors from test output.")
                    result.report = self.reporter.report(before, before, [], 0)
                    result.explanation = "Tests are failing but could not parse error details."
                result.duration_ms = (time.monotonic() - start) * 1000
                return result

            logger.info("  Found %d error(s)", len(errors))

            # 4. ANALYZE
            logger.info("ANALYZE: Root cause analysis...")
            file_contents = self._read_affected_files(repo_path, errors, codebase)
            analyses = []
            for error in errors:
                analysis = self.analyzer.analyze(error, codebase, file_contents)
                analyses.append(analysis)
                logger.info("  %s (confidence: %.0f%%)", analysis.primary_cause, analysis.confidence * 100)
            result.analyses = analyses

            # 5. GENERATE N candidate fixes
            logger.info("GENERATE: Creating %d fix candidates...", candidate_count)
            all_candidates: list[ProposedFix] = []
            for analysis in analyses:
                candidates = self.fixer.generate_candidates(analysis, file_contents, count=candidate_count)
                all_candidates.extend(candidates)
            # Cap total candidates
            all_candidates = all_candidates[:candidate_count]
            result.fixes_attempted = all_candidates

            if not all_candidates:
                logger.warning("  No fix candidates generated.")
                elapsed_ms = (time.monotonic() - start) * 1000
                result.report = self.reporter.report(before, before, [], elapsed_ms)
                result.explanation = "Could not generate any fix candidates."
                result.duration_ms = elapsed_ms
                return result

            logger.info("  Generated %d candidates", len(all_candidates))

            # 6-9. TOURNAMENT: sandbox, apply, test, score, rank
            logger.info("TOURNAMENT: Testing candidates in sandboxes...")
            with SandboxManager(repo_path) as sandbox_mgr:
                tournament = FixTournament(
                    sandbox_mgr,
                    self.runner,
                    parallel=self.config.parallel_sandboxes,
                )
                tournament_result = tournament.run(
                    all_candidates,
                    test_command=codebase.test_command,
                    language=codebase.language,
                    baseline=before,
                )

            result.tournament = tournament_result

            # 10. SELECT winner
            if tournament_result.winner is not None:
                winner = tournament_result.winner
                logger.info(
                    "WINNER: %s (score: %.2f, %d/%d passing)",
                    winner.fix.description,
                    winner.score,
                    winner.test_results.passed,
                    winner.test_results.total,
                )

                # 11. APPLY winner to actual repo
                logger.info("APPLY: Writing winning fix to repo...")
                self._apply_fix(winner.fix, repo_path)
                result.fixes_applied = [winner.fix]

                # 12. VERIFY on real repo
                logger.info("VERIFY: Running final tests on real repo...")
                after = self.runner.run(
                    repo_path,
                    test_command=codebase.test_command,
                    language=codebase.language,
                )
                logger.info("  Final: %d/%d passing (%.0f%%)",
                             after.passed, after.total, after.success_rate * 100)

                # If verification failed, rollback
                if after.success_rate < before.success_rate:
                    logger.warning("  Winner made things worse — rolling back.")
                    self._rollback_fix(winner.fix, repo_path)
                    after = before
                    result.fixes_applied = []

                result.success = after.all_passing or after.success_rate > before.success_rate
            else:
                logger.warning("  No candidate fixed the issue.")
                after = before
                result.success = False

            # 13. REPORT
            elapsed_ms = (time.monotonic() - start) * 1000
            result.report = self.reporter.tournament_report(before, tournament_result, elapsed_ms)
            result.duration_ms = elapsed_ms

            logger.info("DONE: %s in %.0fms", "SUCCESS" if result.success else "INCOMPLETE", elapsed_ms)

        except Exception as exc:
            logger.exception("DebugEngine (verified-fix) failed: %s", exc)
            result.duration_ms = (time.monotonic() - start) * 1000
            result.explanation = f"Engine error: {exc}"

        return result

    def _run_analysis(
        self,
        repo_path: str | Path,
        error_text: str | None,
        mode: str,
    ) -> DebugResult:
        """Handle diagnose-only and explain modes."""
        start = time.monotonic()
        repo_path = Path(repo_path).resolve()
        result = DebugResult(mode=mode)

        try:
            codebase = self.scanner.scan(repo_path)
            result.codebase = codebase

            before = self.runner.run(
                repo_path,
                test_command=codebase.test_command,
                language=codebase.language,
            )

            errors = self._extract_errors(error_text, before, codebase)
            result.errors_found = errors

            if not errors:
                if before.all_passing:
                    result.success = True
                    result.explanation = "All tests are already passing. No fixes needed."
                else:
                    result.explanation = "Tests are failing but could not parse error details."
                result.report = self.reporter.report(before, before, [], 0)
                result.duration_ms = (time.monotonic() - start) * 1000
                return result

            file_contents = self._read_affected_files(repo_path, errors, codebase)
            analyses = []
            for error in errors:
                analysis = self.analyzer.analyze(error, codebase, file_contents)
                analyses.append(analysis)
            result.analyses = analyses

            if mode == "diagnose-only":
                result.report = self.reporter.report(before, before, [], 0)
                result.explanation = self._format_diagnosis(analyses)
            elif mode == "explain":
                result.explanation = self._format_explanation(errors, analyses, codebase)
                result.report = self.reporter.report(before, before, [], 0)

            result.duration_ms = (time.monotonic() - start) * 1000

        except Exception as exc:
            logger.exception("DebugEngine (%s) failed: %s", mode, exc)
            result.duration_ms = (time.monotonic() - start) * 1000
            result.explanation = f"Engine error: {exc}"

        return result

    def diagnose(self, repo_path: str | Path, error_text: str | None = None) -> RootCauseAnalysis:
        """Diagnose only — don't fix. Returns the primary root cause analysis."""
        result = self.run(repo_path, error_text=error_text, mode="diagnose-only")
        if result.analyses:
            return result.analyses[0]
        return RootCauseAnalysis(
            primary_cause="Could not determine root cause",
            category="unknown",
            confidence=0.0,
        )

    def explain(self, repo_path: str | Path, error_text: str | None = None) -> str:
        """Explain what's wrong and why, in plain language."""
        result = self.run(repo_path, error_text=error_text, mode="explain")
        return result.explanation

    # -- Internal helpers ---------------------------------------------------------

    def _extract_errors(
        self,
        error_text: str | None,
        test_results: TestResults,
        codebase: CodebaseInfo,
    ) -> list[ParsedError]:
        """Extract parsed errors from provided text and/or test output."""
        errors: list[ParsedError] = []

        # Parse provided error text
        if error_text and error_text.strip():
            parsed = self.parser.parse(error_text, language=codebase.language)
            if parsed.error_type != "Unknown":
                errors.append(parsed)

        # Parse errors from test output
        if test_results.output and not test_results.all_passing:
            # Try to parse each test failure's traceback
            for failure in test_results.failures:
                parsed_ok = False
                if failure.traceback:
                    parsed = self.parser.parse(failure.traceback, language=codebase.language)
                    if parsed.error_type != "Unknown":
                        errors.append(parsed)
                        parsed_ok = True
                if not parsed_ok and failure.error_type:
                    # Traceback didn't parse fully — use the extracted summary info
                    errors.append(ParsedError(
                        error_type=failure.error_type,
                        message=failure.message,
                        file_path=failure.file_path,
                        line_number=failure.line_number,
                        language=codebase.language,
                        category=self._categorize_error(failure.error_type),
                        raw_text=failure.traceback or "",
                    ))

            # Also try the full output — it often has better tracebacks
            if test_results.output:
                parsed = self.parser.parse(test_results.output, language=codebase.language)
                if parsed.error_type != "Unknown":
                    # Only add if we don't already have this error type with better info
                    existing_types = {e.error_type for e in errors}
                    if parsed.error_type not in existing_types or (
                        parsed.stack_frames and not any(e.stack_frames for e in errors)
                    ):
                        # Replace the summary-only version with the full-traceback version
                        errors = [e for e in errors if e.error_type != parsed.error_type]
                        errors.append(parsed)

        return errors

    def _read_affected_files(
        self,
        repo_path: Path,
        errors: list[ParsedError],
        codebase: CodebaseInfo,
    ) -> dict[str, str]:
        """Read content of files mentioned in errors."""
        file_contents: dict[str, str] = {}

        paths_to_read: set[str] = set()
        for error in errors:
            if error.file_path:
                paths_to_read.add(error.file_path)
            for frame in error.stack_frames:
                paths_to_read.add(frame.file)

        for file_path in paths_to_read:
            content = self._read_file(repo_path, file_path)
            if content is not None:
                file_contents[file_path] = content

        return file_contents

    def _read_file(self, repo_path: Path, file_path: str) -> str | None:
        """Read a file, trying both absolute and relative paths."""
        candidates = [
            Path(file_path),
            repo_path / file_path,
        ]
        for p in candidates:
            if p.is_file():
                try:
                    size = p.stat().st_size
                    if size > self.config.max_file_size:
                        logger.warning("Skipping large file: %s (%d bytes)", p, size)
                        return None
                    return p.read_text(encoding="utf-8", errors="replace")
                except OSError:
                    pass
        return None

    def _apply_fix(self, fix: ProposedFix, repo_path: Path) -> None:
        """Apply a fix by writing changed files to disk."""
        for fc in fix.files_changed:
            if not fc.changed:
                continue
            try:
                path = self._resolve_file_path(repo_path, fc.file_path)
                path.write_text(fc.fixed_content, encoding="utf-8")
                logger.debug("Applied fix to %s", path)
            except OSError as e:
                logger.error("Failed to write fix to %s: %s", fc.file_path, e)

    def _rollback_fix(self, fix: ProposedFix, repo_path: Path) -> None:
        """Rollback a fix by restoring original file contents."""
        for fc in fix.files_changed:
            if not fc.changed:
                continue
            try:
                path = self._resolve_file_path(repo_path, fc.file_path)
                path.write_text(fc.original_content, encoding="utf-8")
                logger.debug("Rolled back %s", path)
            except OSError as e:
                logger.error("Failed to rollback %s: %s", fc.file_path, e)

    @staticmethod
    def _resolve_file_path(repo_path: Path, file_path: str) -> Path:
        """Resolve a file path — try absolute first, then relative to repo."""
        p = Path(file_path)
        if p.is_absolute() and p.exists():
            return p
        resolved = repo_path / file_path
        if resolved.exists():
            return resolved
        # Even if it doesn't exist yet, use the repo-relative path
        return resolved

    @staticmethod
    def _categorize_error(error_type: str) -> str:
        """Map an error type name to a category."""
        from .error_parser import _CATEGORY_MAP
        return _CATEGORY_MAP.get(error_type, "runtime")

    def _format_diagnosis(self, analyses: list[RootCauseAnalysis]) -> str:
        """Format root cause analyses for diagnosis mode."""
        parts: list[str] = ["ROOT CAUSE ANALYSIS", "=" * 40, ""]

        for i, a in enumerate(analyses, 1):
            parts.append(f"Issue #{i}: {a.primary_cause}")
            parts.append(f"  Category:   {a.category}")
            parts.append(f"  Confidence: {a.confidence:.0%}")
            if a.affected_files:
                parts.append(f"  Files:      {', '.join(a.affected_files)}")
            if a.fix_hints:
                parts.append("  Fix hints:")
                for hint in a.fix_hints:
                    parts.append(f"    - {hint}")
            if a.suggested_investigation:
                parts.append("  Investigate:")
                for item in a.suggested_investigation:
                    parts.append(f"    - {item}")
            parts.append("")

        return "\n".join(parts)

    def _format_explanation(
        self,
        errors: list[ParsedError],
        analyses: list[RootCauseAnalysis],
        codebase: CodebaseInfo,
    ) -> str:
        """Format a plain-language explanation of the errors."""
        parts: list[str] = [
            f"Project: {codebase.language} ({codebase.framework or 'no framework detected'})",
            f"Test runner: {codebase.test_runner or 'unknown'}",
            "",
            "WHAT'S WRONG",
            "-" * 40,
        ]

        for i, (error, analysis) in enumerate(zip(errors, analyses), 1):
            parts.append(f"\n{i}. {error.error_type}: {error.message}")
            if error.file_path:
                parts.append(f"   Location: {error.location}")
            parts.append(f"   Category: {analysis.category}")
            parts.append(f"\n   WHY IT HAPPENS:")
            parts.append(f"   {analysis.primary_cause}")
            if analysis.fix_hints:
                parts.append(f"\n   HOW TO FIX:")
                for hint in analysis.fix_hints:
                    parts.append(f"   - {hint}")

        return "\n".join(parts)
