# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Run tests against a codebase and capture structured results."""

from __future__ import annotations

import logging
import re
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path

from .config import DebugConfig
from .error_parser import ErrorParser

logger = logging.getLogger(__name__)


@dataclass
class TestFailure:
    """A single test failure with details."""
    test_name: str
    file_path: str | None = None
    line_number: int | None = None
    error_type: str = ""
    message: str = ""
    traceback: str = ""


@dataclass
class TestResults:
    """Results from running a test suite."""
    __test__ = False  # Prevent pytest collection
    passed: int = 0
    failed: int = 0
    errors: int = 0
    skipped: int = 0
    total: int = 0
    duration_s: float = 0.0
    output: str = ""
    failures: list[TestFailure] = field(default_factory=list)
    command_used: str = ""
    return_code: int = -1

    @property
    def success_rate(self) -> float:
        """Fraction of tests that passed (0.0 - 1.0)."""
        if self.total == 0:
            return 0.0
        return self.passed / self.total

    @property
    def all_passing(self) -> bool:
        return self.total > 0 and self.failed == 0 and self.errors == 0


class TestRunner:
    """Run tests against a codebase and capture structured results."""

    def __init__(self, config: DebugConfig | None = None):
        self.config = config or DebugConfig()
        self._parser = ErrorParser()

    def run(
        self,
        repo_path: Path | str,
        test_command: str | None = None,
        timeout_s: int | None = None,
        language: str | None = None,
    ) -> TestResults:
        """
        Run the test suite and return structured results.

        Args:
            repo_path: Path to the repository root
            test_command: Command to run tests (auto-detected if not provided)
            timeout_s: Timeout in seconds (default from config)
            language: Language hint for parsing output
        """
        repo_path = Path(repo_path).resolve()
        if not repo_path.is_dir():
            raise FileNotFoundError(f"Repository path does not exist: {repo_path}")

        timeout_s = timeout_s or self.config.test_timeout_s

        # Auto-detect test command if needed
        if test_command is None:
            from .scanner import CodebaseScanner
            scanner = CodebaseScanner(self.config)
            info = scanner.scan(repo_path)
            test_command = info.test_command
            language = language or info.language

        if not test_command:
            return TestResults(
                output="No test command detected. Cannot run tests.",
                command_used="(none)",
            )

        logger.info("Running tests: %s in %s", test_command, repo_path)

        start = time.monotonic()
        try:
            proc = subprocess.run(
                test_command,
                shell=True,
                cwd=str(repo_path),
                capture_output=True,
                text=True,
                timeout=timeout_s,
            )
            duration = time.monotonic() - start
            output = proc.stdout + "\n" + proc.stderr
            return_code = proc.returncode
        except subprocess.TimeoutExpired as e:
            duration = time.monotonic() - start
            output = (e.stdout or "") + "\n" + (e.stderr or "")
            if isinstance(output, bytes):
                output = output.decode("utf-8", errors="replace")
            return TestResults(
                output=f"TIMEOUT after {timeout_s}s\n{output}",
                duration_s=duration,
                command_used=test_command,
                return_code=-1,
                errors=1,
                total=1,
            )
        except OSError as e:
            return TestResults(
                output=f"Failed to run test command: {e}",
                command_used=test_command,
                return_code=-1,
                errors=1,
                total=1,
            )

        # Parse the output
        summary = self._parser.parse_test_summary(output, language)
        failures = self._extract_failures(output, language)

        results = TestResults(
            passed=summary.get("passed", 0),
            failed=summary.get("failed", 0),
            errors=summary.get("errors", 0),
            skipped=summary.get("skipped", 0),
            total=summary.get("total", 0),
            duration_s=round(duration, 2),
            output=output.strip(),
            failures=failures,
            command_used=test_command,
            return_code=return_code,
        )

        # If total is 0 but we had a non-zero return code, mark as error
        if results.total == 0 and return_code != 0:
            results.errors = 1
            results.total = 1

        logger.info(
            "Tests done: %d passed, %d failed, %d errors (%.1fs)",
            results.passed, results.failed, results.errors, results.duration_s,
        )
        return results

    def _extract_failures(self, output: str, language: str | None) -> list[TestFailure]:
        """Extract individual test failures from output."""
        failures: list[TestFailure] = []

        if language == "python" or "FAILED" in output:
            failures.extend(self._extract_pytest_failures(output))
        elif language in ("javascript", "typescript"):
            failures.extend(self._extract_jest_failures(output))
        elif language == "rust":
            failures.extend(self._extract_cargo_failures(output))
        elif language == "go":
            failures.extend(self._extract_go_failures(output))

        return failures

    def _extract_pytest_failures(self, output: str) -> list[TestFailure]:
        """Extract failures from pytest output."""
        failures: list[TestFailure] = []

        # Match "FAILED test_file.py::test_name" lines
        failed_pattern = re.compile(r'FAILED\s+(\S+?)::(\S+)')
        for m in failed_pattern.finditer(output):
            file_path = m.group(1)
            test_name = m.group(2)

            # Try to find the traceback for this failure
            tb = ""
            error_type = ""
            message = ""

            # Look for the section between "_____ test_name _____" markers.
            # Ends at next section header, "short test summary", or "====" line.
            section_pattern = re.compile(
                rf'_+\s+{re.escape(test_name)}\s+_+(.*?)(?=_+\s+\w|short test summary|={3,}|$)',
                re.DOTALL,
            )
            section_m = section_pattern.search(output)
            if section_m:
                tb = section_m.group(1).strip()
                # Extract error type — look for "ErrorType: message" on its own line
                # or at end of a path like "broken_code.py:5: ZeroDivisionError"
                error_line_m = re.search(r'^(\w+(?:Error|Exception))\s*:\s*(.*)', tb, re.MULTILINE)
                if error_line_m:
                    error_type = error_line_m.group(1)
                    message = error_line_m.group(2).strip()
                else:
                    # pytest sometimes puts "file:line: ErrorType" at the end
                    trailing_m = re.search(r':\s+(\w+(?:Error|Exception))\s*$', tb, re.MULTILINE)
                    if trailing_m:
                        error_type = trailing_m.group(1)

            # Also check the FAILED summary line for error info
            if not error_type:
                fail_summary = re.search(
                    rf'FAILED\s+\S+::{re.escape(test_name)}\s*-\s*(\w+(?:Error|Exception)):\s*(.*)',
                    output,
                )
                if fail_summary:
                    error_type = fail_summary.group(1)
                    message = fail_summary.group(2).strip()

            # Find line number from traceback or from "file:line:" pattern
            line_num = None
            line_m = re.search(rf'File ".*{re.escape(file_path)}".*line (\d+)', tb)
            if line_m:
                line_num = int(line_m.group(1))
            else:
                # pytest short format: "test_broken.py:10:"
                short_m = re.search(rf'{re.escape(file_path)}:(\d+)', tb)
                if short_m:
                    line_num = int(short_m.group(1))

            failures.append(TestFailure(
                test_name=test_name,
                file_path=file_path,
                line_number=line_num,
                error_type=error_type,
                message=message,
                traceback=tb,
            ))

        return failures

    def _extract_jest_failures(self, output: str) -> list[TestFailure]:
        """Extract failures from Jest output."""
        failures: list[TestFailure] = []

        # Match "FAIL src/file.test.js" and "x test_name" patterns
        fail_file = None
        for line in output.splitlines():
            if line.strip().startswith("FAIL "):
                fail_file = line.strip().replace("FAIL ", "").strip()
            elif fail_file and re.match(r'\s+[x✕✗]\s+', line):
                test_name = re.sub(r'^\s+[x✕✗]\s+', '', line).strip()
                failures.append(TestFailure(
                    test_name=test_name,
                    file_path=fail_file,
                ))

        return failures

    def _extract_cargo_failures(self, output: str) -> list[TestFailure]:
        """Extract failures from cargo test output."""
        failures: list[TestFailure] = []

        # "test module::test_name ... FAILED"
        for m in re.finditer(r'test\s+(\S+)\s+\.\.\.\s+FAILED', output):
            failures.append(TestFailure(
                test_name=m.group(1),
            ))

        return failures

    def _extract_go_failures(self, output: str) -> list[TestFailure]:
        """Extract failures from go test output."""
        failures: list[TestFailure] = []

        # "--- FAIL: TestName (0.00s)"
        for m in re.finditer(r'---\s+FAIL:\s+(\S+)', output):
            failures.append(TestFailure(
                test_name=m.group(1),
            ))

        return failures
