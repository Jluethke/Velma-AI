# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Root cause analysis — correlate parsed errors with codebase structure."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path

from .error_parser import ParsedError
from .scanner import CodebaseInfo

logger = logging.getLogger(__name__)


@dataclass
class RootCauseAnalysis:
    """Result of root cause analysis."""

    primary_cause: str  # Human-readable description
    category: str  # Bug category
    confidence: float  # 0.0 to 1.0
    affected_files: list[str] = field(default_factory=list)
    affected_lines: dict[str, list[int]] = field(default_factory=dict)  # file -> [lines]
    related_errors: list[str] = field(default_factory=list)
    suggested_investigation: list[str] = field(default_factory=list)
    fix_hints: list[str] = field(default_factory=list)


class RootCauseAnalyzer:
    """Analyze parsed errors to identify root cause and affected code."""

    def analyze(
        self,
        parsed_error: ParsedError,
        codebase: CodebaseInfo,
        file_contents: dict[str, str] | None = None,
    ) -> RootCauseAnalysis:
        """
        Analyze a parsed error in the context of the codebase.

        Args:
            parsed_error: The structured error from ErrorParser
            codebase: The scanned codebase info
            file_contents: Optional dict of file_path -> content for deeper analysis
        """
        category = parsed_error.category

        if category == "import":
            return self._analyze_import(parsed_error, codebase, file_contents)
        elif category == "type":
            return self._analyze_type(parsed_error, codebase, file_contents)
        elif category == "syntax":
            return self._analyze_syntax(parsed_error, codebase, file_contents)
        elif category == "assertion":
            return self._analyze_assertion(parsed_error, codebase, file_contents)
        elif category == "runtime":
            return self._analyze_runtime(parsed_error, codebase, file_contents)
        elif category == "permission":
            return self._analyze_permission(parsed_error, codebase, file_contents)
        elif category == "network":
            return self._analyze_network(parsed_error, codebase, file_contents)
        else:
            return self._analyze_generic(parsed_error, codebase, file_contents)

    # -- Category-specific analyzers ----------------------------------------------

    def _analyze_import(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze import/module-not-found errors."""
        affected_files = []
        affected_lines: dict[str, list[int]] = {}

        if error.file_path:
            affected_files.append(error.file_path)
            if error.line_number:
                affected_lines[error.file_path] = [error.line_number]

        # Extract the missing module name
        module_name = ""
        m = re.search(r"No module named '([^']+)'", error.message)
        if m:
            module_name = m.group(1)
        else:
            m = re.search(r"cannot import name '([^']+)'", error.message)
            if m:
                module_name = m.group(1)

        hints = []
        investigation = []

        if module_name:
            # Check if it's a local module (exists in the codebase)
            local_path = module_name.replace(".", "/")
            found_local = False
            for dir_path in codebase.structure:
                if local_path in dir_path or module_name in dir_path:
                    found_local = True
                    break

            if found_local:
                hints.append(f"Module '{module_name}' exists locally — check import path or __init__.py")
                investigation.append(f"Check if {local_path}/__init__.py exists")
                investigation.append("Check for circular imports")
            else:
                hints.append(f"Module '{module_name}' is not installed — add to dependencies")
                if codebase.language == "python":
                    investigation.append(f"Run: pip install {module_name}")
                    investigation.append("Check requirements.txt")
                elif codebase.language in ("javascript", "typescript"):
                    investigation.append(f"Run: npm install {module_name}")
                    investigation.append("Check package.json")

        return RootCauseAnalysis(
            primary_cause=f"Missing import: {module_name or error.message}",
            category="import",
            confidence=0.9 if module_name else 0.7,
            affected_files=affected_files,
            affected_lines=affected_lines,
            related_errors=[],
            suggested_investigation=investigation,
            fix_hints=hints,
        )

    def _analyze_type(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze type errors (TypeError, AttributeError)."""
        affected_files = []
        affected_lines: dict[str, list[int]] = {}
        hints = []
        investigation = []

        if error.file_path:
            affected_files.append(error.file_path)
            if error.line_number:
                affected_lines[error.file_path] = [error.line_number]

        message = error.message.lower()

        if "nonetype" in message or "'none'" in message or "null" in message or "undefined" in message:
            hints.append("A value is None/null/undefined where an object was expected")
            hints.append("Add a null/None check before the operation")
            investigation.append("Check what returns None — trace the data flow backwards")
            investigation.append("Check if a function is missing a return statement")
            confidence = 0.85
        elif "has no attribute" in message or "has no property" in message:
            attr_m = re.search(r"has no attribute '([^']+)'", error.message)
            attr_name = attr_m.group(1) if attr_m else "unknown"
            hints.append(f"Object does not have attribute '{attr_name}'")
            hints.append("Check the type of the object — it may be the wrong type")
            investigation.append("Check where the object is created and what type it should be")
            confidence = 0.8
        elif "argument" in message or "positional" in message:
            hints.append("Wrong number or type of arguments in function call")
            investigation.append("Compare the call site with the function signature")
            confidence = 0.8
        elif "not callable" in message:
            hints.append("Trying to call something that is not a function")
            investigation.append("Check if a variable is shadowing a function name")
            confidence = 0.85
        elif "cannot read propert" in message or "of undefined" in message:
            hints.append("Accessing property on undefined — add null check")
            investigation.append("Trace the variable back to where it becomes undefined")
            confidence = 0.85
        else:
            hints.append(f"Type error: {error.message}")
            investigation.append("Check types at the error location")
            confidence = 0.6

        return RootCauseAnalysis(
            primary_cause=f"Type error: {error.message}",
            category="type",
            confidence=confidence,
            affected_files=affected_files,
            affected_lines=affected_lines,
            suggested_investigation=investigation,
            fix_hints=hints,
        )

    def _analyze_syntax(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze syntax errors."""
        affected_files = []
        affected_lines: dict[str, list[int]] = {}
        hints = []

        if error.file_path:
            affected_files.append(error.file_path)
            if error.line_number:
                affected_lines[error.file_path] = [error.line_number]
                # Syntax errors often point to the line AFTER the real problem
                if error.line_number > 1:
                    affected_lines[error.file_path].append(error.line_number - 1)

        message = error.message.lower()
        if "indent" in message:
            hints.append("Fix indentation — use consistent spaces or tabs")
        elif "unexpected" in message:
            hints.append("Unexpected token — check for missing brackets, parentheses, or semicolons")
        elif "eof" in message or "end of" in message:
            hints.append("Unexpected end of input — check for unclosed brackets or strings")
        else:
            hints.append(f"Syntax error: {error.message}")
            hints.append("Check the error line and the line above it for typos")

        return RootCauseAnalysis(
            primary_cause=f"Syntax error at {error.location}: {error.message}",
            category="syntax",
            confidence=0.95,
            affected_files=affected_files,
            affected_lines=affected_lines,
            suggested_investigation=["Check the exact line for typos, missing colons, brackets"],
            fix_hints=hints,
        )

    def _analyze_assertion(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze assertion/test failures."""
        affected_files = []
        affected_lines: dict[str, list[int]] = {}
        hints = []
        investigation = []

        # The failing test file
        if error.file_path:
            affected_files.append(error.file_path)
            if error.line_number:
                affected_lines[error.file_path] = [error.line_number]

        # The code under test — usually one frame up in the stack
        if len(error.stack_frames) >= 2:
            source_frame = error.stack_frames[-2]
            if source_frame.file not in affected_files:
                affected_files.append(source_frame.file)
            affected_lines.setdefault(source_frame.file, []).append(source_frame.line)
            investigation.append(f"Check the implementation in {source_frame.file}:{source_frame.line}")

        hints.append("Either the code under test has a bug, or the test expectation is wrong")
        investigation.append("Compare expected vs actual values in the assertion")

        return RootCauseAnalysis(
            primary_cause=f"Test assertion failed: {error.message}",
            category="assertion",
            confidence=0.7,
            affected_files=affected_files,
            affected_lines=affected_lines,
            suggested_investigation=investigation,
            fix_hints=hints,
        )

    def _analyze_runtime(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze runtime errors (ZeroDivision, IndexError, KeyError, etc.)."""
        affected_files = []
        affected_lines: dict[str, list[int]] = {}
        hints = []
        investigation = []

        if error.file_path:
            affected_files.append(error.file_path)
            if error.line_number:
                affected_lines[error.file_path] = [error.line_number]

        etype = error.error_type

        if etype == "ZeroDivisionError":
            hints.append("Add a zero-check before division")
            hints.append("Return a safe default (0, None, or raise a descriptive error)")
            investigation.append("Trace where the divisor value comes from")
            confidence = 0.95

        elif etype == "IndexError":
            hints.append("Check list/array length before accessing by index")
            hints.append("Use bounds checking or try/except")
            investigation.append("Check what determines the index value")
            confidence = 0.85

        elif etype == "KeyError":
            key_m = re.search(r"KeyError:\s*['\"]?([^'\"]+)", error.raw_text)
            key_name = key_m.group(1) if key_m else "unknown"
            hints.append(f"Key '{key_name}' not found — use .get() with a default value")
            hints.append("Or check key existence before access")
            investigation.append("Check where the dict is populated and what keys are expected")
            confidence = 0.9

        elif etype == "ValueError":
            hints.append("Invalid value passed to a function — add input validation")
            investigation.append("Check the input data and function expectations")
            confidence = 0.75

        elif etype == "NameError":
            var_m = re.search(r"name '([^']+)' is not defined", error.message)
            var_name = var_m.group(1) if var_m else "unknown"
            hints.append(f"Variable '{var_name}' is not defined — check spelling, scope, or add import")
            investigation.append("Check if the variable was defined in a different scope")
            confidence = 0.9

        elif etype == "FileNotFoundError":
            hints.append("File path does not exist — check the path or create the file")
            investigation.append("Check if the path is relative and the CWD is correct")
            confidence = 0.85

        else:
            hints.append(f"Runtime error: {error.message}")
            investigation.append("Add error handling around the failing code")
            confidence = 0.6

        # Add affected files from stack frames
        for frame in error.stack_frames:
            if frame.file not in affected_files:
                # Only add files that look like project files (not stdlib)
                if not self._is_stdlib_path(frame.file):
                    affected_files.append(frame.file)

        return RootCauseAnalysis(
            primary_cause=f"{etype}: {error.message}",
            category="runtime",
            confidence=confidence,
            affected_files=affected_files,
            affected_lines=affected_lines,
            suggested_investigation=investigation,
            fix_hints=hints,
        )

    def _analyze_permission(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze permission errors."""
        return RootCauseAnalysis(
            primary_cause=f"Permission denied: {error.message}",
            category="permission",
            confidence=0.8,
            affected_files=[error.file_path] if error.file_path else [],
            affected_lines={error.file_path: [error.line_number]} if error.file_path and error.line_number else {},
            suggested_investigation=["Check file permissions", "Check if running as correct user"],
            fix_hints=["Fix file permissions or run with appropriate privileges"],
        )

    def _analyze_network(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Analyze network/connection errors."""
        return RootCauseAnalysis(
            primary_cause=f"Network error: {error.message}",
            category="network",
            confidence=0.7,
            affected_files=[error.file_path] if error.file_path else [],
            affected_lines={error.file_path: [error.line_number]} if error.file_path and error.line_number else {},
            suggested_investigation=[
                "Check if the endpoint/host is reachable",
                "Check authentication/credentials",
                "Check for firewall or proxy issues",
            ],
            fix_hints=[
                "Add retry logic with exponential backoff",
                "Add connection timeout handling",
            ],
        )

    def _analyze_generic(
        self, error: ParsedError, codebase: CodebaseInfo,
        file_contents: dict[str, str] | None,
    ) -> RootCauseAnalysis:
        """Fallback analysis for unknown error categories."""
        return RootCauseAnalysis(
            primary_cause=f"{error.error_type}: {error.message}",
            category=error.category,
            confidence=0.5,
            affected_files=[error.file_path] if error.file_path else [],
            affected_lines={error.file_path: [error.line_number]} if error.file_path and error.line_number else {},
            suggested_investigation=["Review the error message and stack trace"],
            fix_hints=["Review code at the error location"],
        )

    # -- Helpers ------------------------------------------------------------------

    @staticmethod
    def _is_stdlib_path(file_path: str) -> bool:
        """Check if a file path looks like a standard library or site-packages path."""
        lower = file_path.lower().replace("\\", "/")
        skip = ("site-packages/", "lib/python", "/usr/lib/", "node_modules/",
                "<frozen", "<string>", "<module>")
        return any(s in lower for s in skip)
