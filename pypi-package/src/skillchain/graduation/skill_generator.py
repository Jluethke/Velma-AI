"""
skill_generator.py — Generate executable Python from successful patterns.

Takes a PromotionCandidate (a pattern that has proven itself through
repeated successful execution) and produces a standalone ``execute(context)``
function as a Python string.

Uses template-based generation for common pattern types (file analysis,
data processing, git operations) — no LLM required.
"""

from __future__ import annotations

import hashlib
import re
import textwrap
from dataclasses import dataclass, field
from typing import Optional

from .pattern_tracker import PromotionCandidate


@dataclass
class GeneratedSkill:
    """A skill generated from a promotion candidate."""

    name: str
    code: str
    domain: str
    tags: list[str] = field(default_factory=list)
    test_cases: list[dict] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Templates for common pattern categories
# ---------------------------------------------------------------------------

_TEMPLATE_FILE_ANALYSIS = textwrap.dedent('''\
    """Auto-generated skill: {name}

    Domain: {domain}
    Generated from {count} successful observations.
    """

    from __future__ import annotations
    import json
    import os.path
    import re
    from pathlib import Path


    def execute(context: dict) -> dict:
        """Analyze files based on the provided context.

        Parameters
        ----------
        context : dict
            Must contain 'path' or 'file_path' pointing to the target.
            May contain 'pattern' for regex matching within files.

        Returns
        -------
        dict
            {{"success": bool, "result": str, "data": dict}}
        """
        try:
            target = context.get("path") or context.get("file_path", "")
            pattern = context.get("pattern", "")

            if not target:
                return {{"success": False, "result": "No path provided", "data": {{}}}}

            path = Path(target)
            if not path.exists():
                return {{"success": False, "result": f"Path not found: {{target}}", "data": {{}}}}

            if path.is_file():
                content = path.read_text(encoding="utf-8", errors="replace")
                lines = content.splitlines()
                matches = []
                if pattern:
                    regex = re.compile(pattern)
                    matches = [
                        {{"line": i + 1, "text": line}}
                        for i, line in enumerate(lines)
                        if regex.search(line)
                    ]
                data = {{
                    "file": str(path),
                    "line_count": len(lines),
                    "size_bytes": path.stat().st_size,
                    "matches": matches,
                }}
                result = f"Analyzed {{path.name}}: {{len(lines)}} lines, {{len(matches)}} matches"
                return {{"success": True, "result": result, "data": data}}

            if path.is_dir():
                files = list(path.iterdir())
                data = {{
                    "directory": str(path),
                    "file_count": len([f for f in files if f.is_file()]),
                    "dir_count": len([f for f in files if f.is_dir()]),
                    "entries": [f.name for f in sorted(files)[:50]],
                }}
                result = f"Listed {{path.name}}: {{data['file_count']}} files, {{data['dir_count']}} dirs"
                return {{"success": True, "result": result, "data": data}}

            return {{"success": False, "result": f"Unknown path type: {{target}}", "data": {{}}}}
        except Exception as exc:
            return {{"success": False, "result": str(exc), "data": {{}}}}
''')


_TEMPLATE_DATA_PROCESSING = textwrap.dedent('''\
    """Auto-generated skill: {name}

    Domain: {domain}
    Generated from {count} successful observations.
    """

    from __future__ import annotations
    import json
    import math
    import statistics


    def execute(context: dict) -> dict:
        """Process data from the provided context.

        Parameters
        ----------
        context : dict
            Must contain 'data' (list or dict) to process.
            May contain 'operation' (e.g. "summarize", "filter", "aggregate").

        Returns
        -------
        dict
            {{"success": bool, "result": str, "data": dict}}
        """
        try:
            data = context.get("data")
            operation = context.get("operation", "summarize")

            if data is None:
                return {{"success": False, "result": "No data provided", "data": {{}}}}

            if isinstance(data, list):
                numeric = [x for x in data if isinstance(x, (int, float))]
                result_data: dict = {{"count": len(data), "type": "list"}}
                if numeric:
                    result_data["mean"] = statistics.mean(numeric)
                    result_data["median"] = statistics.median(numeric)
                    result_data["stdev"] = statistics.stdev(numeric) if len(numeric) > 1 else 0.0
                    result_data["min"] = min(numeric)
                    result_data["max"] = max(numeric)
                result = f"Processed {{len(data)}} items ({{len(numeric)}} numeric)"
                return {{"success": True, "result": result, "data": result_data}}

            if isinstance(data, dict):
                result_data = {{"keys": list(data.keys()), "count": len(data), "type": "dict"}}
                result = f"Processed dict with {{len(data)}} keys"
                return {{"success": True, "result": result, "data": result_data}}

            return {{"success": True, "result": f"Data type: {{type(data).__name__}}", "data": {{"value": str(data)[:500]}}}}
        except Exception as exc:
            return {{"success": False, "result": str(exc), "data": {{}}}}
''')


_TEMPLATE_GIT_OPERATIONS = textwrap.dedent('''\
    """Auto-generated skill: {name}

    Domain: {domain}
    Generated from {count} successful observations.
    """

    from __future__ import annotations
    import json
    import re
    from pathlib import Path


    def execute(context: dict) -> dict:
        """Perform git-related analysis (read-only, no subprocess).

        Parameters
        ----------
        context : dict
            Must contain 'repo_path' pointing to the git repository root.
            May contain 'operation' (e.g. "status", "log_parse", "config").

        Returns
        -------
        dict
            {{"success": bool, "result": str, "data": dict}}
        """
        try:
            repo_path = Path(context.get("repo_path", "."))
            git_dir = repo_path / ".git"

            if not git_dir.is_dir():
                return {{"success": False, "result": f"Not a git repo: {{repo_path}}", "data": {{}}}}

            head = (git_dir / "HEAD").read_text(encoding="utf-8").strip()
            branch = ""
            if head.startswith("ref: refs/heads/"):
                branch = head[len("ref: refs/heads/"):]

            config_path = git_dir / "config"
            remotes: list[str] = []
            if config_path.exists():
                config_text = config_path.read_text(encoding="utf-8", errors="replace")
                remotes = re.findall(r'url = (.+)', config_text)

            data = {{
                "branch": branch,
                "head": head,
                "remotes": remotes,
                "git_dir": str(git_dir),
            }}
            result = f"Git repo on branch '{{branch}}' with {{len(remotes)}} remote(s)"
            return {{"success": True, "result": result, "data": data}}
        except Exception as exc:
            return {{"success": False, "result": str(exc), "data": {{}}}}
''')


_TEMPLATE_GENERIC = textwrap.dedent('''\
    """Auto-generated skill: {name}

    Domain: {domain}
    Generated from {count} successful observations.
    Description: {description}
    """

    from __future__ import annotations
    import json


    def execute(context: dict) -> dict:
        """Execute the skill with the given context.

        Parameters
        ----------
        context : dict
            Arbitrary key-value pairs relevant to the task.

        Returns
        -------
        dict
            {{"success": bool, "result": str, "data": dict}}
        """
        try:
            result_parts: list[str] = []
            data: dict = {{}}

            for key, value in context.items():
                if isinstance(value, str):
                    data[key] = value[:200]
                elif isinstance(value, (int, float, bool)):
                    data[key] = value
                elif isinstance(value, (list, dict)):
                    data[key + "_size"] = len(value)

            result_parts.append(f"Processed {{len(context)}} context keys")
            result = "; ".join(result_parts)
            return {{"success": True, "result": result, "data": data}}
        except Exception as exc:
            return {{"success": False, "result": str(exc), "data": {{}}}}
''')


# Map domain keywords to templates
_DOMAIN_TEMPLATES: dict[str, str] = {
    "file": _TEMPLATE_FILE_ANALYSIS,
    "analysis": _TEMPLATE_FILE_ANALYSIS,
    "data": _TEMPLATE_DATA_PROCESSING,
    "processing": _TEMPLATE_DATA_PROCESSING,
    "statistics": _TEMPLATE_DATA_PROCESSING,
    "git": _TEMPLATE_GIT_OPERATIONS,
    "repository": _TEMPLATE_GIT_OPERATIONS,
    "vcs": _TEMPLATE_GIT_OPERATIONS,
}


class SkillGenerator:
    """Generate executable Python code from promotion candidates.

    Uses template-based generation: picks the best template for the
    candidate's domain and fills in metadata. No LLM required.
    """

    def generate_executable(self, candidate: PromotionCandidate) -> GeneratedSkill:
        """Generate a standalone ``execute(context) -> dict`` function.

        Parameters
        ----------
        candidate:
            The promotion candidate containing pattern descriptions,
            domain, and sample outputs.

        Returns
        -------
        GeneratedSkill
            Contains the generated code, name, domain, tags, and test cases.
        """
        name = self._derive_name(candidate)
        template = self._select_template(candidate)
        description = candidate.descriptions[0] if candidate.descriptions else ""

        code = template.format(
            name=name,
            domain=candidate.domain,
            count=candidate.count,
            description=description[:200],
        )

        tags = self._derive_tags(candidate)
        test_cases = self._generate_test_cases(candidate)

        return GeneratedSkill(
            name=name,
            code=code,
            domain=candidate.domain,
            tags=tags,
            test_cases=test_cases,
        )

    # -- Internal ------------------------------------------------------------

    def _derive_name(self, candidate: PromotionCandidate) -> str:
        """Derive a skill name from the pattern key."""
        parts = candidate.pattern_key.replace("|", "_")
        # Sanitize to valid Python identifier
        name = re.sub(r"[^a-z0-9_]", "_", parts.lower())
        name = re.sub(r"_+", "_", name).strip("_")
        if not name:
            name = "skill_" + hashlib.md5(
                candidate.pattern_key.encode()
            ).hexdigest()[:8]
        return name

    def _select_template(self, candidate: PromotionCandidate) -> str:
        """Pick the best template for the candidate's domain."""
        domain_lower = candidate.domain.lower()
        for keyword, template in _DOMAIN_TEMPLATES.items():
            if keyword in domain_lower:
                return template

        # Check descriptions for domain hints
        all_text = " ".join(candidate.descriptions).lower()
        for keyword, template in _DOMAIN_TEMPLATES.items():
            if keyword in all_text:
                return template

        return _TEMPLATE_GENERIC

    def _derive_tags(self, candidate: PromotionCandidate) -> list[str]:
        """Derive tags from the candidate's domain and descriptions."""
        tags = [candidate.domain]
        key_words = candidate.pattern_key.split("|")
        tags.extend(w for w in key_words if w and w not in tags)
        return tags[:5]

    def _generate_test_cases(self, candidate: PromotionCandidate) -> list[dict]:
        """Generate basic test cases for the skill."""
        cases: list[dict] = []

        # Always include an empty-context test (should not crash)
        cases.append({
            "name": "empty_context",
            "context": {},
            "expect_success": False,
        })

        # Domain-specific test cases
        domain = candidate.domain.lower()
        if "file" in domain or "analysis" in domain:
            cases.append({
                "name": "nonexistent_file",
                "context": {"path": "/nonexistent/test/path.txt"},
                "expect_success": False,
            })
        elif "data" in domain or "processing" in domain:
            cases.append({
                "name": "numeric_list",
                "context": {"data": [1, 2, 3, 4, 5]},
                "expect_success": True,
            })
        elif "git" in domain:
            cases.append({
                "name": "not_a_repo",
                "context": {"repo_path": "/tmp/not_a_repo"},
                "expect_success": False,
            })

        return cases
