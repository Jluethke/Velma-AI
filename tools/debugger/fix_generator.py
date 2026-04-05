# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Generate minimal code fixes as diffs/patches."""

from __future__ import annotations

import difflib
import logging
import re
import uuid
from dataclasses import dataclass, field

from .root_cause import RootCauseAnalysis

logger = logging.getLogger(__name__)


@dataclass
class FileChange:
    """A single file modification."""
    file_path: str
    original_content: str
    fixed_content: str
    diff: str  # Unified diff
    line_range: tuple[int, int] = (0, 0)

    @property
    def changed(self) -> bool:
        return self.original_content != self.fixed_content


@dataclass
class ProposedFix:
    """A proposed fix with metadata."""
    fix_id: str
    description: str
    confidence: float
    files_changed: list[FileChange] = field(default_factory=list)
    explanation: str = ""

    @property
    def has_changes(self) -> bool:
        return any(fc.changed for fc in self.files_changed)


class FixGenerator:
    """Generate code fixes as diffs/patches, ordered by confidence."""

    def generate(
        self,
        analysis: RootCauseAnalysis,
        file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """
        Generate fix proposals ordered by confidence.

        Args:
            analysis: Root cause analysis from RootCauseAnalyzer
            file_contents: Dict of file_path -> file content string

        Returns:
            List of ProposedFix, highest confidence first.
        """
        fixes: list[ProposedFix] = []

        category = analysis.category

        if category == "runtime":
            fixes.extend(self._fix_runtime(analysis, file_contents))
        elif category == "import":
            fixes.extend(self._fix_import(analysis, file_contents))
        elif category == "type":
            fixes.extend(self._fix_type(analysis, file_contents))
        elif category == "syntax":
            fixes.extend(self._fix_syntax(analysis, file_contents))
        elif category == "assertion":
            fixes.extend(self._fix_assertion(analysis, file_contents))
        else:
            # Generic: try to apply hint-based fixes
            fixes.extend(self._fix_generic(analysis, file_contents))

        # Sort by confidence (highest first)
        fixes.sort(key=lambda f: f.confidence, reverse=True)

        # Filter out fixes with no actual changes
        fixes = [f for f in fixes if f.has_changes]

        return fixes

    def generate_candidates(
        self,
        analysis: RootCauseAnalysis,
        file_contents: dict[str, str],
        count: int = 5,
    ) -> list[ProposedFix]:
        """
        Generate multiple DIFFERENT fix candidates for the same error.

        Strategy:
        1. Primary fix: the highest-confidence approach (same as current generate())
        2. Alternative fixes: different approaches to the same problem
        3. Deduplicate: don't return identical fixes

        Returns: list of ProposedFix ordered by initial confidence, capped at *count*.
        """
        # Start with the standard set of fixes from generate()
        fixes = self.generate(analysis, file_contents)

        # Generate additional alternative strategies if we don't have enough
        category = analysis.category
        cause = analysis.primary_cause

        if category == "runtime":
            if "ZeroDivisionError" in cause:
                fixes.extend(self._alt_zero_division(analysis, file_contents))
            elif "IndexError" in cause:
                fixes.extend(self._alt_index_error(analysis, file_contents))
            elif "KeyError" in cause:
                fixes.extend(self._alt_key_error(analysis, file_contents))
        elif category == "type":
            if "nonetype" in cause.lower() or "'none'" in cause.lower():
                fixes.extend(self._alt_none_access(analysis, file_contents))
        elif category == "import":
            fixes.extend(self._alt_import(analysis, file_contents))

        # Deduplicate: remove fixes whose fixed_content is identical
        seen: set[str] = set()
        deduped: list[ProposedFix] = []
        for fix in fixes:
            key = "|".join(
                fc.fixed_content for fc in fix.files_changed if fc.changed
            )
            if key and key not in seen:
                seen.add(key)
                deduped.append(fix)

        deduped.sort(key=lambda f: f.confidence, reverse=True)
        return deduped[:count]

    # -- Alternative fix strategies -----------------------------------------------

    def _alt_zero_division(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Alternative ZeroDivisionError fixes: early return, assertion, caller validation."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)

            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                div_match = re.search(r'(\S+)\s*/\s*(\S+)', line)
                if not div_match:
                    continue

                divisor = div_match.group(2).rstrip(":,)")
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                # Alt 1: Early return before the division line
                new_lines_er = list(source_lines)
                if stripped.startswith("return "):
                    early_ret = f"{indent_str}if {divisor} == 0:\n{indent_str}    return 0\n"
                else:
                    var_name = stripped.split("=")[0].strip() if "=" in stripped else "_"
                    early_ret = f"{indent_str}if {divisor} == 0:\n{indent_str}    {var_name} = 0\n{indent_str}    # Skip division\n"
                new_lines_er.insert(line_num - 1, early_ret)
                fixed_er = "".join(new_lines_er)
                if fixed_er != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Early return when {divisor} is zero",
                        confidence=0.75,
                        files_changed=[self._make_change(file_path, content, fixed_er, (line_num, line_num))],
                        explanation=f"Return early with a safe default when '{divisor}' is zero.",
                    ))

                # Alt 2: Assertion at function entry (find enclosing def)
                func_line_idx = self._find_enclosing_function(source_lines, line_num - 1)
                if func_line_idx is not None:
                    func_line = source_lines[func_line_idx]
                    func_indent = len(func_line) - len(func_line.lstrip())
                    body_indent = " " * (func_indent + 4)
                    # Insert assertion after the def line (skip docstring if present)
                    insert_at = func_line_idx + 1
                    if insert_at < len(source_lines) and '"""' in source_lines[insert_at]:
                        # Skip single-line docstring
                        if source_lines[insert_at].count('"""') >= 2:
                            insert_at += 1
                        else:
                            # Multi-line docstring
                            insert_at += 1
                            while insert_at < len(source_lines) and '"""' not in source_lines[insert_at]:
                                insert_at += 1
                            insert_at += 1  # Past closing """

                    new_lines_assert = list(source_lines)
                    assertion = f"{body_indent}assert {divisor} != 0, f\"{divisor} must not be zero\"\n"
                    new_lines_assert.insert(insert_at, assertion)
                    fixed_assert = "".join(new_lines_assert)
                    if fixed_assert != content:
                        fixes.append(ProposedFix(
                            fix_id=self._make_id(),
                            description=f"Assert {divisor} != 0 at function entry",
                            confidence=0.55,
                            files_changed=[self._make_change(file_path, content, fixed_assert, (insert_at + 1, insert_at + 1))],
                            explanation=f"Fail fast with a clear error if '{divisor}' is zero.",
                        ))

                # Alt 3: max(divisor, 1) inline replacement
                new_lines_max = list(source_lines)
                new_line_max = line.replace(f"/ {divisor}", f"/ max({divisor}, 1)")
                if new_line_max == line:
                    new_line_max = line.replace(f"/{divisor}", f"/ max({divisor}, 1)")
                new_lines_max[line_num - 1] = new_line_max
                fixed_max = "".join(new_lines_max)
                if fixed_max != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Replace divisor with max({divisor}, 1)",
                        confidence=0.60,
                        files_changed=[self._make_change(file_path, content, fixed_max, (line_num, line_num))],
                        explanation=f"Clamp the divisor to a minimum of 1 to prevent division by zero.",
                    ))

        return fixes

    def _alt_index_error(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Alternative IndexError fixes: try/except, min(idx, len-1), iterator."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                idx_match = re.search(r'(\w+)\[(.+?)\]', stripped)
                if not idx_match:
                    continue

                collection = idx_match.group(1)
                index_expr = idx_match.group(2)

                # Alt 1: try/except with empty default
                new_lines_te = list(source_lines)
                try_line = f"{indent_str}try:\n"
                indented = f"{indent_str}    {stripped}\n"
                except_line = f"{indent_str}except IndexError:\n"
                if stripped.startswith("return "):
                    fallback = f"{indent_str}    return None\n"
                else:
                    fallback = f"{indent_str}    pass  # index out of range\n"
                new_lines_te[line_num - 1:line_num] = [try_line, indented, except_line, fallback]
                fixed_te = "".join(new_lines_te)
                if fixed_te != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Try/except IndexError for {collection}[{index_expr}]",
                        confidence=0.65,
                        files_changed=[self._make_change(file_path, content, fixed_te, (line_num, line_num))],
                        explanation=f"Catch IndexError and use a safe default.",
                    ))

                # Alt 2: min(index, len-1) clamping
                new_lines_min = list(source_lines)
                clamped = stripped.replace(
                    f"{collection}[{index_expr}]",
                    f"{collection}[min({index_expr}, len({collection}) - 1)]",
                )
                new_lines_min[line_num - 1] = f"{indent_str}{clamped}\n"
                fixed_min = "".join(new_lines_min)
                if fixed_min != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Clamp index with min({index_expr}, len({collection})-1)",
                        confidence=0.60,
                        files_changed=[self._make_change(file_path, content, fixed_min, (line_num, line_num))],
                        explanation=f"Clamp the index so it never exceeds the last valid position.",
                    ))

        return fixes

    def _alt_key_error(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Alternative KeyError fixes: if-check, try/except, defaultdict."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                key_match = re.search(r'(\w+)\[([\'"][^\'"]+[\'"])\]', stripped)
                if not key_match:
                    continue

                dict_name = key_match.group(1)
                key_expr = key_match.group(2)

                # Alt 1: if key in dict guard
                new_lines_if = list(source_lines)
                guard = f"{indent_str}if {key_expr} in {dict_name}:\n"
                indented = f"{indent_str}    {stripped}\n"
                new_lines_if[line_num - 1:line_num] = [guard, indented]
                fixed_if = "".join(new_lines_if)
                if fixed_if != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Guard with 'if {key_expr} in {dict_name}'",
                        confidence=0.75,
                        files_changed=[self._make_change(file_path, content, fixed_if, (line_num, line_num))],
                        explanation=f"Check key existence before accessing dict.",
                    ))

                # Alt 2: try/except KeyError
                new_lines_te = list(source_lines)
                try_line = f"{indent_str}try:\n"
                indented_te = f"{indent_str}    {stripped}\n"
                except_line = f"{indent_str}except KeyError:\n"
                fallback = f"{indent_str}    pass  # key not found\n"
                new_lines_te[line_num - 1:line_num] = [try_line, indented_te, except_line, fallback]
                fixed_te = "".join(new_lines_te)
                if fixed_te != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Try/except KeyError for {dict_name}[{key_expr}]",
                        confidence=0.65,
                        files_changed=[self._make_change(file_path, content, fixed_te, (line_num, line_num))],
                        explanation=f"Catch KeyError and handle missing key gracefully.",
                    ))

        return fixes

    def _alt_none_access(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Alternative None access fixes: Optional default, guard at function top, try/except."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                obj_match = re.search(r'(\w+)\.(\w+)', stripped)
                if not obj_match:
                    continue

                obj_name = obj_match.group(1)
                attr_name = obj_match.group(2)

                # Alt 1: Optional with default value (or "")
                new_lines_opt = list(source_lines)
                if stripped.startswith("return "):
                    opt_line = f"{indent_str}return {obj_name}.{attr_name} if {obj_name} is not None else None\n"
                    new_lines_opt[line_num - 1] = opt_line
                else:
                    opt_line = f"{indent_str}{obj_name} = {obj_name} if {obj_name} is not None else ''\n"
                    new_lines_opt.insert(line_num - 1, opt_line)
                fixed_opt = "".join(new_lines_opt)
                if fixed_opt != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Optional default for '{obj_name}' before .{attr_name}",
                        confidence=0.70,
                        files_changed=[self._make_change(file_path, content, fixed_opt, (line_num, line_num))],
                        explanation=f"Provide a default value when '{obj_name}' is None.",
                    ))

                # Alt 2: try/except with logging
                new_lines_te = list(source_lines)
                try_line = f"{indent_str}try:\n"
                indented = f"{indent_str}    {stripped}\n"
                except_line = f"{indent_str}except (TypeError, AttributeError):\n"
                if stripped.startswith("return "):
                    fallback = f"{indent_str}    return None\n"
                else:
                    fallback = f"{indent_str}    pass  # {obj_name} was None\n"
                new_lines_te[line_num - 1:line_num] = [try_line, indented, except_line, fallback]
                fixed_te = "".join(new_lines_te)
                if fixed_te != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Try/except around {obj_name}.{attr_name} access",
                        confidence=0.60,
                        files_changed=[self._make_change(file_path, content, fixed_te, (line_num, line_num))],
                        explanation=f"Catch TypeError/AttributeError if '{obj_name}' is None.",
                    ))

                # Alt 3: Guard clause at enclosing function top
                func_line_idx = self._find_enclosing_function(source_lines, line_num - 1)
                if func_line_idx is not None:
                    func_line = source_lines[func_line_idx]
                    func_indent = len(func_line) - len(func_line.lstrip())
                    body_indent = " " * (func_indent + 4)
                    insert_at = func_line_idx + 1
                    # Skip docstring
                    if insert_at < len(source_lines) and '"""' in source_lines[insert_at]:
                        if source_lines[insert_at].count('"""') >= 2:
                            insert_at += 1
                        else:
                            insert_at += 1
                            while insert_at < len(source_lines) and '"""' not in source_lines[insert_at]:
                                insert_at += 1
                            insert_at += 1

                    new_lines_guard = list(source_lines)
                    guard = f"{body_indent}if {obj_name} is None:\n{body_indent}    return None\n"
                    new_lines_guard.insert(insert_at, guard)
                    fixed_guard = "".join(new_lines_guard)
                    if fixed_guard != content:
                        fixes.append(ProposedFix(
                            fix_id=self._make_id(),
                            description=f"Guard clause for {obj_name} at function entry",
                            confidence=0.65,
                            files_changed=[self._make_change(file_path, content, fixed_guard, (insert_at + 1, insert_at + 1))],
                            explanation=f"Early return if '{obj_name}' is None — fail fast at function entry.",
                        ))

        return fixes

    def _alt_import(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Alternative import fixes: try/except ImportError, lazy import, conditional import."""
        fixes: list[ProposedFix] = []

        module_match = re.search(r"'([^']+)'", analysis.primary_cause)
        if not module_match:
            return fixes

        module_name = module_match.group(1)

        for file_path in analysis.affected_files:
            content = file_contents.get(file_path)
            if content is None:
                continue

            if "cannot import name" in analysis.primary_cause:
                continue

            source_lines = content.splitlines(keepends=True)
            insert_idx = self._find_import_insertion_point(source_lines)

            # Alt 1: try/except ImportError with fallback
            new_lines_te = list(source_lines)
            import_block = (
                f"try:\n"
                f"    import {module_name}\n"
                f"except ImportError:\n"
                f"    {module_name} = None  # Optional dependency\n"
            )
            new_lines_te.insert(insert_idx, import_block)
            fixed_te = "".join(new_lines_te)
            if fixed_te != content:
                fixes.append(ProposedFix(
                    fix_id=self._make_id(),
                    description=f"Try/except ImportError for '{module_name}'",
                    confidence=0.6,
                    files_changed=[self._make_change(file_path, content, fixed_te, (insert_idx + 1, insert_idx + 1))],
                    explanation=f"Import '{module_name}' with a fallback if not installed.",
                ))

            # Alt 2: Lazy import at usage site
            for line_num, line_text in analysis.affected_lines.items() if isinstance(analysis.affected_lines, dict) else []:
                pass  # Lazy import is harder to generate generically — skip for now

        return fixes

    @staticmethod
    def _find_enclosing_function(source_lines: list[str], target_idx: int) -> int | None:
        """Find the line index of the def/class enclosing target_idx."""
        for i in range(target_idx, -1, -1):
            stripped = source_lines[i].lstrip()
            if stripped.startswith("def ") or stripped.startswith("async def "):
                return i
        return None

    # -- Runtime fixes ------------------------------------------------------------

    def _fix_runtime(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Generate fixes for runtime errors."""
        fixes: list[ProposedFix] = []
        cause = analysis.primary_cause

        if "ZeroDivisionError" in cause:
            fixes.extend(self._fix_zero_division(analysis, file_contents))
        elif "IndexError" in cause:
            fixes.extend(self._fix_index_error(analysis, file_contents))
        elif "KeyError" in cause:
            fixes.extend(self._fix_key_error(analysis, file_contents))
        elif "NameError" in cause:
            fixes.extend(self._fix_name_error(analysis, file_contents))
        else:
            fixes.extend(self._fix_generic(analysis, file_contents))

        return fixes

    def _fix_zero_division(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix ZeroDivisionError by adding zero-check."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)

            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]

                # Pattern: return a / b  or  result = a / b
                div_match = re.search(r'(\S+)\s*/\s*(\S+)', line)
                if not div_match:
                    continue

                divisor = div_match.group(2).rstrip(":,)")
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]

                # Fix 1: Guard with if-check (higher confidence)
                new_lines = list(source_lines)
                original_line = new_lines[line_num - 1]
                # Find what comes after the division expression
                stripped = original_line.strip()

                if stripped.startswith("return "):
                    # return a / b  ->  return a / b if b != 0 else 0
                    guarded = original_line.rstrip("\n\r") + f" if {divisor} != 0 else 0\n"
                    new_lines[line_num - 1] = guarded
                else:
                    # x = a / b  ->  insert if-guard above
                    guard_line = f"{indent_str}if {divisor} == 0:\n"
                    safe_line = f"{indent_str}    {stripped.split('=')[0].strip()} = 0\n"
                    else_line = f"{indent_str}else:\n"
                    indented_orig = f"{indent_str}    {stripped}\n"
                    new_lines[line_num - 1:line_num] = [guard_line, safe_line, else_line, indented_orig]

                fixed_content = "".join(new_lines)
                if fixed_content != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Add zero-check before division by {divisor}",
                        confidence=0.9,
                        files_changed=[self._make_change(file_path, content, fixed_content, (line_num, line_num))],
                        explanation=f"The divisor '{divisor}' can be zero. Adding a guard to return 0 when divisor is 0.",
                    ))

                # Fix 2: try/except (lower confidence)
                new_lines2 = list(source_lines)
                original_line = new_lines2[line_num - 1]
                stripped = original_line.strip()
                try_line = f"{indent_str}try:\n"
                indented = f"{indent_str}    {stripped}\n"
                except_line = f"{indent_str}except ZeroDivisionError:\n"
                if stripped.startswith("return "):
                    fallback = f"{indent_str}    return 0\n"
                else:
                    var_name = stripped.split("=")[0].strip() if "=" in stripped else "result"
                    fallback = f"{indent_str}    {var_name} = 0\n"
                new_lines2[line_num - 1:line_num] = [try_line, indented, except_line, fallback]

                fixed_content2 = "".join(new_lines2)
                if fixed_content2 != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Wrap division in try/except ZeroDivisionError",
                        confidence=0.7,
                        files_changed=[self._make_change(file_path, content, fixed_content2, (line_num, line_num))],
                        explanation="Catch ZeroDivisionError and return a safe default.",
                    ))

        return fixes

    def _fix_index_error(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix IndexError by adding bounds check."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                # Pattern: something[index]
                idx_match = re.search(r'(\w+)\[(.+?)\]', stripped)
                if not idx_match:
                    continue

                collection = idx_match.group(1)
                index_expr = idx_match.group(2)

                new_lines = list(source_lines)
                guard = f"{indent_str}if len({collection}) > {index_expr}:\n"
                indented = f"{indent_str}    {stripped}\n"
                new_lines[line_num - 1:line_num] = [guard, indented]

                fixed_content = "".join(new_lines)
                if fixed_content != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Add bounds check for {collection}[{index_expr}]",
                        confidence=0.75,
                        files_changed=[self._make_change(file_path, content, fixed_content, (line_num, line_num))],
                        explanation=f"Check length of '{collection}' before accessing index {index_expr}.",
                    ))

        return fixes

    def _fix_key_error(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix KeyError by using .get() with default."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]

                # Replace dict[key] with dict.get(key, default)
                new_line = re.sub(
                    r'(\w+)\[([\'"][^\'"]+[\'"])\]',
                    r'\1.get(\2, None)',
                    line,
                )
                if new_line != line:
                    new_lines = list(source_lines)
                    new_lines[line_num - 1] = new_line
                    fixed_content = "".join(new_lines)

                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description="Replace dict[key] with dict.get(key, None)",
                        confidence=0.8,
                        files_changed=[self._make_change(file_path, content, fixed_content, (line_num, line_num))],
                        explanation="Using .get() returns None instead of raising KeyError when key is missing.",
                    ))

        return fixes

    def _fix_name_error(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix NameError — try to find the correct import or variable."""
        # This is harder to fix automatically without more context.
        # We generate a hint-based fix.
        return self._fix_generic(analysis, file_contents)

    # -- Import fixes -------------------------------------------------------------

    def _fix_import(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix missing imports."""
        fixes: list[ProposedFix] = []

        # Extract module name from the cause
        module_match = re.search(r"'([^']+)'", analysis.primary_cause)
        if not module_match:
            return fixes

        module_name = module_match.group(1)

        for file_path in analysis.affected_files:
            content = file_contents.get(file_path)
            if content is None:
                continue

            # Check if it's a "cannot import name" vs "no module named"
            if "cannot import name" in analysis.primary_cause:
                # The name exists but can't be imported — harder to fix
                continue

            # Add import at the top of the file (after any existing imports)
            source_lines = content.splitlines(keepends=True)
            insert_idx = self._find_import_insertion_point(source_lines)

            new_lines = list(source_lines)
            import_line = f"import {module_name}\n"
            new_lines.insert(insert_idx, import_line)

            fixed_content = "".join(new_lines)
            if fixed_content != content:
                fixes.append(ProposedFix(
                    fix_id=self._make_id(),
                    description=f"Add 'import {module_name}' statement",
                    confidence=0.7,
                    files_changed=[self._make_change(file_path, content, fixed_content, (insert_idx + 1, insert_idx + 1))],
                    explanation=f"Module '{module_name}' is used but not imported. Adding import statement.",
                ))

        return fixes

    # -- Type fixes ---------------------------------------------------------------

    def _fix_type(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix type errors."""
        fixes: list[ProposedFix] = []
        cause_lower = analysis.primary_cause.lower()

        if "nonetype" in cause_lower or "'none'" in cause_lower:
            fixes.extend(self._fix_none_access(analysis, file_contents))
        elif "not callable" in cause_lower:
            # Harder to fix automatically
            pass
        elif "argument" in cause_lower:
            # Wrong number of arguments — harder to fix without signature info
            pass

        if not fixes:
            fixes.extend(self._fix_generic(analysis, file_contents))

        return fixes

    def _fix_none_access(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix NoneType attribute access by adding null check."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                # Find the object being accessed: obj.attr or obj.method()
                obj_match = re.search(r'(\w+)\.(\w+)', stripped)
                if not obj_match:
                    continue

                obj_name = obj_match.group(1)

                new_lines = list(source_lines)
                guard = f"{indent_str}if {obj_name} is not None:\n"
                indented = f"{indent_str}    {stripped}\n"
                new_lines[line_num - 1:line_num] = [guard, indented]

                fixed_content = "".join(new_lines)
                if fixed_content != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Add None-check for '{obj_name}' before attribute access",
                        confidence=0.75,
                        files_changed=[self._make_change(file_path, content, fixed_content, (line_num, line_num))],
                        explanation=f"'{obj_name}' can be None. Adding guard to prevent NoneType error.",
                    ))

        return fixes

    # -- Syntax fixes -------------------------------------------------------------

    def _fix_syntax(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """Fix syntax errors — bracket matching, missing colons, indentation."""
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)

            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                stripped = line.rstrip("\n\r")

                # Missing colon after def/class/if/else/for/while/try/except/finally/with
                colon_pattern = re.compile(
                    r'^(\s*(?:def|class|if|elif|else|for|while|try|except|finally|with)\b.+[^:])\s*$'
                )
                m = colon_pattern.match(stripped)
                if m:
                    new_lines = list(source_lines)
                    new_lines[line_num - 1] = m.group(1) + ":\n"
                    fixed_content = "".join(new_lines)
                    if fixed_content != content:
                        fixes.append(ProposedFix(
                            fix_id=self._make_id(),
                            description="Add missing colon at end of statement",
                            confidence=0.9,
                            files_changed=[self._make_change(file_path, content, fixed_content, (line_num, line_num))],
                            explanation="Python compound statements require a colon at the end.",
                        ))

                # Unmatched brackets — check the whole file
                bracket_fix = self._fix_unmatched_brackets(content, file_path)
                if bracket_fix:
                    fixes.append(bracket_fix)

        return fixes

    def _fix_unmatched_brackets(self, content: str, file_path: str) -> ProposedFix | None:
        """Try to fix unmatched brackets/parentheses."""
        openers = {"(": ")", "[": "]", "{": "}"}
        closers = {v: k for k, v in openers.items()}
        stack: list[tuple[str, int]] = []

        lines = content.splitlines(keepends=True)
        in_string = False
        string_char = None

        for i, line in enumerate(lines):
            for ch in line:
                if in_string:
                    if ch == string_char:
                        in_string = False
                    continue
                if ch in ('"', "'"):
                    in_string = True
                    string_char = ch
                    continue
                if ch in openers:
                    stack.append((ch, i))
                elif ch in closers:
                    if stack and stack[-1][0] == closers[ch]:
                        stack.pop()

        if not stack:
            return None

        # There's an unmatched opener — add closer at end of the line
        opener, line_idx = stack[-1]
        closer = openers[opener]
        new_lines = list(lines)
        new_lines[line_idx] = new_lines[line_idx].rstrip("\n\r") + closer + "\n"

        fixed_content = "".join(new_lines)
        if fixed_content != content:
            return ProposedFix(
                fix_id=self._make_id(),
                description=f"Add missing closing '{closer}' on line {line_idx + 1}",
                confidence=0.7,
                files_changed=[self._make_change(file_path, content, fixed_content, (line_idx + 1, line_idx + 1))],
                explanation=f"Unmatched '{opener}' on line {line_idx + 1}. Adding closing '{closer}'.",
            )
        return None

    # -- Assertion fixes ----------------------------------------------------------

    def _fix_assertion(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """
        Fix assertion failures.

        For assertion errors, we fix the CODE rather than the TEST.
        The test defines the contract — the code should match.
        """
        # Assertion fixes are context-heavy. We return generic hints.
        return self._fix_generic(analysis, file_contents)

    # -- Generic / fallback -------------------------------------------------------

    def _fix_generic(
        self, analysis: RootCauseAnalysis, file_contents: dict[str, str],
    ) -> list[ProposedFix]:
        """
        Generic fix generator — adds try/except around the failing line.

        This is the lowest-confidence fallback.
        """
        fixes: list[ProposedFix] = []

        for file_path, lines_list in analysis.affected_lines.items():
            content = file_contents.get(file_path)
            if content is None:
                continue

            source_lines = content.splitlines(keepends=True)
            for line_num in lines_list:
                if line_num < 1 or line_num > len(source_lines):
                    continue

                line = source_lines[line_num - 1]
                indent = len(line) - len(line.lstrip())
                indent_str = line[:indent]
                stripped = line.strip()

                # Don't wrap lines that are already error handling
                if any(kw in stripped for kw in ("try:", "except", "finally:", "raise")):
                    continue

                new_lines = list(source_lines)
                try_line = f"{indent_str}try:\n"
                indented = f"{indent_str}    {stripped}\n"
                except_line = f"{indent_str}except Exception:\n"
                pass_line = f"{indent_str}    pass  # TODO: handle error properly\n"
                new_lines[line_num - 1:line_num] = [try_line, indented, except_line, pass_line]

                fixed_content = "".join(new_lines)
                if fixed_content != content:
                    fixes.append(ProposedFix(
                        fix_id=self._make_id(),
                        description=f"Wrap line {line_num} in try/except",
                        confidence=0.3,
                        files_changed=[self._make_change(file_path, content, fixed_content, (line_num, line_num))],
                        explanation="Fallback fix: wrap the failing line in a try/except block.",
                    ))

        return fixes

    # -- Helpers ------------------------------------------------------------------

    @staticmethod
    def _make_id() -> str:
        return f"fix-{uuid.uuid4().hex[:8]}"

    @staticmethod
    def _make_change(
        file_path: str, original: str, fixed: str, line_range: tuple[int, int],
    ) -> FileChange:
        diff = "".join(difflib.unified_diff(
            original.splitlines(keepends=True),
            fixed.splitlines(keepends=True),
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
        ))
        return FileChange(
            file_path=file_path,
            original_content=original,
            fixed_content=fixed,
            diff=diff,
            line_range=line_range,
        )

    @staticmethod
    def _find_import_insertion_point(lines: list[str]) -> int:
        """Find the best line index to insert a new import statement."""
        last_import = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("import ") or stripped.startswith("from "):
                last_import = i + 1
            elif stripped.startswith("#") or stripped.startswith('"""') or not stripped:
                continue
            elif last_import > 0:
                break
        return last_import
