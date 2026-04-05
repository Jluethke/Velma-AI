# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Parse error messages, stack traces, and test output into structured data."""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class StackFrame:
    """A single frame in a stack trace."""
    file: str
    line: int
    function: str | None = None
    code: str | None = None


@dataclass
class ParsedError:
    """Structured representation of a parsed error."""
    error_type: str  # e.g. "ZeroDivisionError", "TypeError", "SyntaxError"
    message: str  # Human-readable message
    file_path: str | None = None
    line_number: int | None = None
    column: int | None = None
    stack_frames: list[StackFrame] = field(default_factory=list)
    language: str | None = None
    category: str = "unknown"  # syntax, type, import, assertion, runtime, network, permission
    raw_text: str = ""

    @property
    def location(self) -> str:
        """Formatted location string."""
        parts = []
        if self.file_path:
            parts.append(self.file_path)
        if self.line_number is not None:
            parts.append(f"line {self.line_number}")
        if self.column is not None:
            parts.append(f"col {self.column}")
        return ":".join(parts) if parts else "unknown"


# Error type -> category mapping
_CATEGORY_MAP = {
    # Python
    "SyntaxError": "syntax",
    "IndentationError": "syntax",
    "TabError": "syntax",
    "TypeError": "type",
    "AttributeError": "type",
    "ImportError": "import",
    "ModuleNotFoundError": "import",
    "AssertionError": "assertion",
    "ZeroDivisionError": "runtime",
    "IndexError": "runtime",
    "KeyError": "runtime",
    "ValueError": "runtime",
    "NameError": "runtime",
    "UnboundLocalError": "runtime",
    "FileNotFoundError": "runtime",
    "RuntimeError": "runtime",
    "StopIteration": "runtime",
    "OverflowError": "runtime",
    "RecursionError": "runtime",
    "PermissionError": "permission",
    "ConnectionError": "network",
    "TimeoutError": "network",
    "OSError": "runtime",
    # JavaScript/TypeScript
    "ReferenceError": "runtime",
    "RangeError": "runtime",
    "URIError": "runtime",
    "EvalError": "runtime",
}


class ErrorParser:
    """Parse error messages and stack traces into structured data."""

    def parse(self, error_text: str, language: str | None = None) -> ParsedError:
        """
        Parse an error string into structured data.

        If language is not provided, attempts to auto-detect from the error format.
        """
        if not error_text or not error_text.strip():
            return ParsedError(
                error_type="Unknown",
                message="No error text provided",
                language=language,
                raw_text=error_text or "",
            )

        # Auto-detect language if not provided
        if language is None:
            language = self._detect_language(error_text)

        if language == "python":
            return self._parse_python(error_text)
        elif language in ("javascript", "typescript"):
            return self._parse_javascript(error_text, language)
        elif language == "rust":
            return self._parse_rust(error_text)
        elif language == "go":
            return self._parse_go(error_text)

        # Generic fallback
        return self._parse_generic(error_text, language)

    def parse_test_summary(self, output: str, language: str | None = None) -> dict:
        """
        Parse test runner output for pass/fail counts.

        Returns dict with: passed, failed, errors, skipped, total.
        """
        if language == "python" or "pytest" in output.lower() or "unittest" in output.lower():
            return self._parse_pytest_summary(output)
        elif language in ("javascript", "typescript") or "jest" in output.lower() or "vitest" in output.lower():
            return self._parse_jest_summary(output)
        elif language == "rust" or "cargo test" in output.lower():
            return self._parse_cargo_summary(output)
        elif language == "go" or "go test" in output.lower():
            return self._parse_go_summary(output)
        return self._parse_generic_summary(output)

    # -- Python -------------------------------------------------------------------

    def _parse_python(self, text: str) -> ParsedError:
        """Parse a Python traceback."""
        frames: list[StackFrame] = []
        error_type = "Unknown"
        message = ""
        file_path = None
        line_number = None

        # Match traceback frames: File "path", line N, in func
        frame_pattern = re.compile(
            r'File "([^"]+)", line (\d+)(?:, in (.+))?'
        )
        lines = text.splitlines()

        # Capture frames
        i = 0
        while i < len(lines):
            m = frame_pattern.search(lines[i])
            if m:
                code_line = None
                if i + 1 < len(lines) and not frame_pattern.search(lines[i + 1]):
                    candidate = lines[i + 1].strip()
                    if candidate and not candidate.startswith("File ") and not re.match(r"^\w+Error", candidate):
                        code_line = candidate
                frames.append(StackFrame(
                    file=m.group(1),
                    line=int(m.group(2)),
                    function=m.group(3),
                    code=code_line,
                ))
            i += 1

        # Find the error line (last line matching ErrorType: message)
        error_pattern = re.compile(r'^(\w+(?:Error|Exception|Warning))\s*:\s*(.*)')
        for line in reversed(lines):
            m = error_pattern.match(line.strip())
            if m:
                error_type = m.group(1)
                message = m.group(2).strip()
                break

        # Also check pytest "E" prefix lines: "E       ZeroDivisionError: message"
        if error_type == "Unknown":
            e_line_pattern = re.compile(r'^E\s+(\w+(?:Error|Exception))\s*:\s*(.*)')
            for line in reversed(lines):
                m = e_line_pattern.match(line)
                if m:
                    error_type = m.group(1)
                    message = m.group(2).strip()
                    break

        # Check pytest "FAILED ... - ErrorType: message" summary lines
        if error_type == "Unknown":
            failed_pattern = re.compile(r'FAILED\s+\S+\s*-\s*(\w+(?:Error|Exception))\s*:\s*(.*)')
            for line in lines:
                m = failed_pattern.search(line)
                if m:
                    error_type = m.group(1)
                    message = m.group(2).strip()
                    break

        # Also handle bare error types without colon (e.g. just "ZeroDivisionError")
        if error_type == "Unknown":
            for line in reversed(lines):
                stripped = line.strip()
                if stripped in _CATEGORY_MAP:
                    error_type = stripped
                    break

        # File and line from the deepest frame
        if frames:
            file_path = frames[-1].file
            line_number = frames[-1].line

        # If no frames found, check pytest file:line: ErrorType patterns
        if not frames:
            # Pattern: "broken_code.py:5: ZeroDivisionError"
            pytest_loc_pattern = re.compile(r'^([^\s:]+\.py):(\d+):\s*(\w+(?:Error|Exception))?')
            for line in reversed(lines):
                m = pytest_loc_pattern.match(line.strip())
                if m:
                    fp = m.group(1)
                    ln = int(m.group(2))
                    err = m.group(3)
                    frames.append(StackFrame(file=fp, line=ln, function=None, code=None))
                    if file_path is None:
                        file_path = fp
                        line_number = ln
                    if err and error_type == "Unknown":
                        error_type = err

        category = _CATEGORY_MAP.get(error_type, "runtime")

        return ParsedError(
            error_type=error_type,
            message=message,
            file_path=file_path,
            line_number=line_number,
            stack_frames=frames,
            language="python",
            category=category,
            raw_text=text,
        )

    # -- JavaScript / TypeScript --------------------------------------------------

    def _parse_javascript(self, text: str, language: str) -> ParsedError:
        """Parse a JavaScript/TypeScript error with stack trace."""
        frames: list[StackFrame] = []
        error_type = "Error"
        message = ""
        file_path = None
        line_number = None
        column = None

        lines = text.splitlines()

        # First line is usually "ErrorType: message"
        error_line_pattern = re.compile(r'^(\w*Error)\s*:\s*(.*)')
        for line in lines:
            m = error_line_pattern.match(line.strip())
            if m:
                error_type = m.group(1)
                message = m.group(2).strip()
                break

        # Parse stack frames: "    at funcName (file:line:col)" or "    at file:line:col"
        frame_pattern = re.compile(
            r'at\s+(?:(.+?)\s+\()?([^()]+?):(\d+):(\d+)\)?'
        )
        for line in lines:
            m = frame_pattern.search(line)
            if m:
                frames.append(StackFrame(
                    file=m.group(2),
                    line=int(m.group(3)),
                    function=m.group(1),
                    code=None,
                ))

        # TypeScript compiler errors: TS####: message
        ts_pattern = re.compile(r'(TS\d+)\s*:\s*(.*)')
        for line in lines:
            m = ts_pattern.search(line)
            if m:
                error_type = m.group(1)
                message = m.group(2).strip()
                # Try to find file:line before the TS error
                loc_pattern = re.compile(r'([^\s]+)\((\d+),(\d+)\)')
                loc = loc_pattern.search(line)
                if loc:
                    file_path = loc.group(1)
                    line_number = int(loc.group(2))
                    column = int(loc.group(3))
                break

        if frames and file_path is None:
            file_path = frames[0].file
            line_number = frames[0].line
            column = None

        category = _CATEGORY_MAP.get(error_type, "runtime")
        if error_type.startswith("TS"):
            category = "type"

        return ParsedError(
            error_type=error_type,
            message=message,
            file_path=file_path,
            line_number=line_number,
            column=column,
            stack_frames=frames,
            language=language,
            category=category,
            raw_text=text,
        )

    # -- Rust ---------------------------------------------------------------------

    def _parse_rust(self, text: str) -> ParsedError:
        """Parse a Rust compiler error."""
        error_type = "CompileError"
        message = ""
        file_path = None
        line_number = None
        column = None
        frames: list[StackFrame] = []

        lines = text.splitlines()

        # error[E0308]: mismatched types
        error_code_pattern = re.compile(r'error\[([A-Z]\d+)\]\s*:\s*(.*)')
        # error: message (without code)
        error_plain_pattern = re.compile(r'^error\s*:\s*(.*)')
        # --> src/main.rs:42:10
        location_pattern = re.compile(r'-->\s*([^:]+):(\d+):(\d+)')

        for line in lines:
            m = error_code_pattern.search(line)
            if m:
                error_type = m.group(1)
                message = m.group(2).strip()
                continue

            if not message:
                m = error_plain_pattern.search(line)
                if m:
                    message = m.group(1).strip()
                    continue

            m = location_pattern.search(line)
            if m:
                fp = m.group(1).strip()
                ln = int(m.group(2))
                col = int(m.group(3))
                if file_path is None:
                    file_path = fp
                    line_number = ln
                    column = col
                frames.append(StackFrame(file=fp, line=ln, function=None, code=None))

        category = "type" if "type" in message.lower() else "syntax" if "syntax" in message.lower() else "runtime"

        return ParsedError(
            error_type=error_type,
            message=message,
            file_path=file_path,
            line_number=line_number,
            column=column,
            stack_frames=frames,
            language="rust",
            category=category,
            raw_text=text,
        )

    # -- Go -----------------------------------------------------------------------

    def _parse_go(self, text: str) -> ParsedError:
        """Parse a Go error."""
        error_type = "CompileError"
        message = ""
        file_path = None
        line_number = None
        column = None
        frames: list[StackFrame] = []

        lines = text.splitlines()

        # Go compile errors: ./file.go:10:5: message
        compile_pattern = re.compile(r'(.+\.go):(\d+):(\d+):\s*(.*)')
        # Go runtime panic
        panic_pattern = re.compile(r'panic:\s*(.*)')
        # Goroutine stack: \tfile.go:42
        goroutine_pattern = re.compile(r'\t(.+\.go):(\d+)')

        for line in lines:
            m = panic_pattern.match(line.strip())
            if m:
                error_type = "Panic"
                message = m.group(1).strip()
                continue

            m = compile_pattern.search(line)
            if m:
                fp = m.group(1)
                ln = int(m.group(2))
                col = int(m.group(3))
                msg = m.group(4).strip()
                if file_path is None:
                    file_path = fp
                    line_number = ln
                    column = col
                    if not message:
                        message = msg
                frames.append(StackFrame(file=fp, line=ln, function=None, code=None))
                continue

            m = goroutine_pattern.search(line)
            if m:
                frames.append(StackFrame(
                    file=m.group(1), line=int(m.group(2)), function=None, code=None
                ))

        category = "runtime" if error_type == "Panic" else "syntax"

        return ParsedError(
            error_type=error_type,
            message=message,
            file_path=file_path,
            line_number=line_number,
            column=column,
            stack_frames=frames,
            language="go",
            category=category,
            raw_text=text,
        )

    # -- Generic ------------------------------------------------------------------

    def _parse_generic(self, text: str, language: str | None) -> ParsedError:
        """Best-effort parse for unknown error formats."""
        lines = text.strip().splitlines()
        error_type = "Unknown"
        message = lines[0] if lines else "Unknown error"

        # Try to extract an error type
        m = re.match(r'^(\w+(?:Error|Exception))\s*:\s*(.*)', message)
        if m:
            error_type = m.group(1)
            message = m.group(2)

        category = _CATEGORY_MAP.get(error_type, "runtime")

        return ParsedError(
            error_type=error_type,
            message=message,
            language=language,
            category=category,
            raw_text=text,
        )

    # -- Language detection -------------------------------------------------------

    def _detect_language(self, text: str) -> str | None:
        """Auto-detect language from error format."""
        if 'File "' in text and "Traceback" in text:
            return "python"
        if re.search(r'File ".*", line \d+', text):
            return "python"
        # Detect pytest output format
        if re.search(r'^E\s+\w+Error', text, re.MULTILINE):
            return "python"
        if re.search(r'\.py:\d+:\s*\w+Error', text):
            return "python"
        if "Error:" in text and re.search(r'at .+:\d+:\d+', text):
            return "javascript"
        if re.search(r'TS\d+:', text):
            return "typescript"
        if re.search(r'error\[E\d+\]', text):
            return "rust"
        if re.search(r'\.go:\d+:\d+:', text):
            return "go"
        # Check for Python-style error names
        if re.search(r'\b(ModuleNotFoundError|ImportError|TypeError|ValueError|ZeroDivisionError)\b', text):
            return "python"
        return None

    # -- Test summary parsers -----------------------------------------------------

    def _parse_pytest_summary(self, output: str) -> dict:
        """Parse pytest output summary."""
        result = {"passed": 0, "failed": 0, "errors": 0, "skipped": 0, "total": 0}

        # pytest summary: "X passed, Y failed, Z error" etc.
        patterns = {
            "passed": re.compile(r'(\d+)\s+passed'),
            "failed": re.compile(r'(\d+)\s+failed'),
            "errors": re.compile(r'(\d+)\s+error'),
            "skipped": re.compile(r'(\d+)\s+skipped'),
        }
        for key, pattern in patterns.items():
            m = pattern.search(output)
            if m:
                result[key] = int(m.group(1))

        result["total"] = result["passed"] + result["failed"] + result["errors"] + result["skipped"]
        return result

    def _parse_jest_summary(self, output: str) -> dict:
        """Parse Jest/Vitest output summary."""
        result = {"passed": 0, "failed": 0, "errors": 0, "skipped": 0, "total": 0}

        # Jest: "Tests:  2 failed, 3 passed, 5 total"
        m = re.search(r'Tests:\s+(.+)', output)
        if m:
            summary = m.group(1)
            for part in summary.split(","):
                part = part.strip()
                num_m = re.match(r'(\d+)\s+(\w+)', part)
                if num_m:
                    count = int(num_m.group(1))
                    label = num_m.group(2).lower()
                    if label == "passed":
                        result["passed"] = count
                    elif label == "failed":
                        result["failed"] = count
                    elif label == "total":
                        result["total"] = count
                    elif label in ("skipped", "pending"):
                        result["skipped"] = count

        if result["total"] == 0:
            result["total"] = result["passed"] + result["failed"] + result["errors"] + result["skipped"]

        return result

    def _parse_cargo_summary(self, output: str) -> dict:
        """Parse cargo test output summary."""
        result = {"passed": 0, "failed": 0, "errors": 0, "skipped": 0, "total": 0}

        # "test result: ok. 5 passed; 0 failed; 0 ignored"
        m = re.search(r'test result:.*?(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+ignored', output)
        if m:
            result["passed"] = int(m.group(1))
            result["failed"] = int(m.group(2))
            result["skipped"] = int(m.group(3))

        result["total"] = result["passed"] + result["failed"] + result["skipped"]
        return result

    def _parse_go_summary(self, output: str) -> dict:
        """Parse go test output summary."""
        result = {"passed": 0, "failed": 0, "errors": 0, "skipped": 0, "total": 0}

        for line in output.splitlines():
            stripped = line.strip()
            if stripped.startswith("ok"):
                result["passed"] += 1
                result["total"] += 1
            elif stripped.startswith("FAIL"):
                result["failed"] += 1
                result["total"] += 1
            elif stripped.startswith("---"):
                if "PASS" in stripped:
                    result["passed"] += 1
                    result["total"] += 1
                elif "FAIL" in stripped:
                    result["failed"] += 1
                    result["total"] += 1
                elif "SKIP" in stripped:
                    result["skipped"] += 1
                    result["total"] += 1

        return result

    def _parse_generic_summary(self, output: str) -> dict:
        """Fallback: count PASS/FAIL/ERROR lines."""
        result = {"passed": 0, "failed": 0, "errors": 0, "skipped": 0, "total": 0}

        for line in output.splitlines():
            upper = line.upper()
            if "PASS" in upper and "FAIL" not in upper:
                result["passed"] += 1
            elif "FAIL" in upper or "ERROR" in upper:
                result["failed"] += 1

        result["total"] = result["passed"] + result["failed"]
        return result
