# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""Tests for the fix generator — verify correct diffs for common bug patterns."""

from __future__ import annotations

import pytest

from skillchain.debugger.fix_generator import FixGenerator
from skillchain.debugger.root_cause import RootCauseAnalysis


@pytest.fixture
def fixer():
    return FixGenerator()


class TestZeroDivisionFix:
    def test_guard_division(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="ZeroDivisionError: division by zero",
            category="runtime",
            confidence=0.95,
            affected_files=["math_utils.py"],
            affected_lines={"math_utils.py": [3]},
        )
        contents = {
            "math_utils.py": "def divide(a, b):\n    \"\"\"Divide a by b.\"\"\"\n    return a / b\n",
        }

        fixes = fixer.generate(analysis, contents)
        assert len(fixes) >= 1

        # Highest confidence fix should be the zero-guard
        best = fixes[0]
        assert best.confidence >= 0.7
        assert best.has_changes
        assert len(best.files_changed) == 1

        fixed = best.files_changed[0].fixed_content
        # The fixed code should handle b == 0
        assert "0" in fixed  # Should reference zero somehow
        assert fixed != contents["math_utils.py"]

        # Diff should be non-empty
        assert best.files_changed[0].diff

    def test_multiple_fixes_generated(self, fixer: FixGenerator):
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

        fixes = fixer.generate(analysis, contents)
        # Should have at least 2 approaches (guard + try/except)
        assert len(fixes) >= 2
        # Sorted by confidence
        assert fixes[0].confidence >= fixes[-1].confidence


class TestImportFix:
    def test_add_missing_import(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="Missing import: 'os'",
            category="import",
            confidence=0.9,
            affected_files=["app.py"],
            affected_lines={"app.py": [3]},
        )
        contents = {
            "app.py": "import sys\n\npath = os.path.join('a', 'b')\n",
        }

        fixes = fixer.generate(analysis, contents)
        assert len(fixes) >= 1

        best = fixes[0]
        fixed = best.files_changed[0].fixed_content
        assert "import os" in fixed

    def test_import_after_existing_imports(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="Missing import: 'json'",
            category="import",
            confidence=0.9,
            affected_files=["app.py"],
            affected_lines={"app.py": [5]},
        )
        contents = {
            "app.py": "import sys\nimport os\n\ndef load():\n    return json.loads('{}')\n",
        }

        fixes = fixer.generate(analysis, contents)
        assert len(fixes) >= 1

        fixed = fixes[0].files_changed[0].fixed_content
        lines = fixed.splitlines()
        # The import should appear after existing imports
        json_idx = next(i for i, l in enumerate(lines) if "import json" in l)
        sys_idx = next(i for i, l in enumerate(lines) if "import sys" in l)
        assert json_idx > sys_idx


class TestKeyErrorFix:
    def test_use_get_default(self, fixer: FixGenerator):
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

        fixes = fixer.generate(analysis, contents)
        assert len(fixes) >= 1

        fixed = fixes[0].files_changed[0].fixed_content
        assert ".get(" in fixed


class TestSyntaxFix:
    def test_missing_colon(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="Syntax error at app.py:line 1: invalid syntax",
            category="syntax",
            confidence=0.95,
            affected_files=["app.py"],
            affected_lines={"app.py": [1]},
        )
        contents = {
            "app.py": "def hello()\n    return 'hi'\n",
        }

        fixes = fixer.generate(analysis, contents)
        assert len(fixes) >= 1

        # One fix should add the missing colon
        colon_fixes = [f for f in fixes if "colon" in f.description.lower()]
        assert len(colon_fixes) >= 1
        fixed = colon_fixes[0].files_changed[0].fixed_content
        assert "def hello():" in fixed


class TestNoneAccessFix:
    def test_add_none_check(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="Type error: 'NoneType' object has no attribute 'strip'",
            category="type",
            confidence=0.85,
            affected_files=["process.py"],
            affected_lines={"process.py": [2]},
        )
        contents = {
            "process.py": "def clean(text):\n    return text.strip()\n",
        }

        fixes = fixer.generate(analysis, contents)
        assert len(fixes) >= 1

        best = fixes[0]
        fixed = best.files_changed[0].fixed_content
        assert "is not None" in fixed or "None" in fixed


class TestNoChangesNeeded:
    def test_no_fix_for_missing_file(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="Something broke",
            category="runtime",
            confidence=0.5,
            affected_files=["missing.py"],
            affected_lines={"missing.py": [10]},
        )
        # File not in contents dict
        contents = {}

        fixes = fixer.generate(analysis, contents)
        # Should return empty or only fixes with no changes
        assert all(not f.has_changes for f in fixes) or len(fixes) == 0


class TestDiffFormat:
    def test_unified_diff_format(self, fixer: FixGenerator):
        analysis = RootCauseAnalysis(
            primary_cause="ZeroDivisionError: division by zero",
            category="runtime",
            confidence=0.95,
            affected_files=["calc.py"],
            affected_lines={"calc.py": [2]},
        )
        contents = {
            "calc.py": "def divide(a, b):\n    return a / b\n",
        }

        fixes = fixer.generate(analysis, contents)
        best = fixes[0]
        diff = best.files_changed[0].diff
        assert "---" in diff
        assert "+++" in diff
        assert "@@" in diff
