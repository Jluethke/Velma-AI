# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Codebase scanner — detect language, framework, test runner, and project structure."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

from .config import DebugConfig

logger = logging.getLogger(__name__)

SKIP_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "__pycache__", ".tox", ".mypy_cache",
    ".pytest_cache", "venv", ".venv", "env", ".env", "dist", "build", "target",
    ".next", ".nuxt", "coverage", ".coverage", "htmlcov", "egg-info",
}


@dataclass
class CodebaseInfo:
    """Everything we learn about a codebase from scanning it."""

    repo_path: str
    language: str  # primary language
    languages_detected: dict[str, int] = field(default_factory=dict)  # lang -> file count
    framework: str | None = None
    test_runner: str | None = None
    test_command: str | None = None
    test_files: list[str] = field(default_factory=list)
    entry_points: list[str] = field(default_factory=list)
    structure: dict[str, list[str]] = field(default_factory=dict)  # dir -> files
    dependencies: list[str] = field(default_factory=list)
    config_files: list[str] = field(default_factory=list)


class CodebaseScanner:
    """Scans a repository to understand its structure before debugging."""

    def __init__(self, config: DebugConfig | None = None):
        self.config = config or DebugConfig()

    def scan(self, repo_path: Path | str) -> CodebaseInfo:
        """Scan a repository and return structured information about it."""
        repo_path = Path(repo_path).resolve()
        if not repo_path.is_dir():
            raise FileNotFoundError(f"Repository path does not exist: {repo_path}")

        info = CodebaseInfo(repo_path=str(repo_path), language="unknown")

        # 1. Walk the tree, count files by language
        self._scan_files(repo_path, info)

        # 2. Detect primary language from marker files, then file counts
        self._detect_language(repo_path, info)

        # 3. Detect framework
        self._detect_framework(repo_path, info)

        # 4. Detect test runner and build the test command
        self._detect_test_runner(repo_path, info)

        # 5. Find entry points
        self._find_entry_points(repo_path, info)

        # 6. Find dependencies
        self._find_dependencies(repo_path, info)

        logger.info(
            "Scanned %s: language=%s framework=%s test_cmd=%s",
            repo_path, info.language, info.framework, info.test_command,
        )
        return info

    # -- internals -----------------------------------------------------------------

    def _scan_files(self, root: Path, info: CodebaseInfo) -> None:
        """Walk the tree and classify files by language."""
        ext_to_lang: dict[str, str] = {}
        for lang, exts in self.config.language_extensions.items():
            for ext in exts:
                ext_to_lang[ext] = lang

        lang_counts: dict[str, int] = {}
        structure: dict[str, list[str]] = {}

        for path in self._walk(root):
            rel = str(path.relative_to(root))
            parent = str(path.parent.relative_to(root))
            structure.setdefault(parent, []).append(path.name)

            ext = path.suffix.lower()
            lang = ext_to_lang.get(ext)
            if lang:
                lang_counts[lang] = lang_counts.get(lang, 0) + 1

            # Track test files
            name_lower = path.name.lower()
            if (name_lower.startswith("test_") or name_lower.endswith("_test.py")
                    or name_lower.endswith(".test.js") or name_lower.endswith(".test.ts")
                    or name_lower.endswith(".test.tsx") or name_lower.endswith(".test.jsx")
                    or name_lower.endswith("_test.go") or name_lower.endswith("_test.rs")
                    or name_lower.startswith("test_") and name_lower.endswith(".py")):
                info.test_files.append(rel)

            # Track config files
            if path.name in (
                "pyproject.toml", "setup.py", "setup.cfg", "requirements.txt",
                "package.json", "tsconfig.json", "jest.config.js", "jest.config.ts",
                "vitest.config.ts", "vitest.config.js", "Cargo.toml", "go.mod",
                "pytest.ini", "conftest.py", ".eslintrc.json", "tox.ini",
            ):
                info.config_files.append(rel)

        info.languages_detected = lang_counts
        info.structure = structure

    def _detect_language(self, root: Path, info: CodebaseInfo) -> None:
        """Detect primary language — marker files first, then file counts."""
        # Check marker files (higher priority)
        for lang, markers in self.config.language_markers.items():
            for marker in markers:
                if (root / marker).exists():
                    info.language = lang
                    return

        # Fall back to file count majority
        if info.languages_detected:
            info.language = max(info.languages_detected, key=info.languages_detected.get)
        else:
            info.language = "unknown"

    def _detect_framework(self, root: Path, info: CodebaseInfo) -> None:
        """Detect framework from marker files and dependency declarations."""
        lang = info.language
        if lang not in self.config.framework_markers:
            return

        framework_markers = self.config.framework_markers[lang]

        # Check for marker files
        for framework, markers in framework_markers.items():
            for marker in markers:
                if (root / marker).exists():
                    info.framework = framework
                    return

        # Check dependencies for framework names
        deps_text = self._read_deps_text(root, lang)
        if deps_text:
            for framework, markers in framework_markers.items():
                for marker in markers:
                    if marker in deps_text:
                        info.framework = framework
                        return

    def _detect_test_runner(self, root: Path, info: CodebaseInfo) -> None:
        """Detect test runner and build the command to run tests."""
        lang = info.language

        if lang == "python":
            self._detect_python_test_runner(root, info)
        elif lang in ("javascript", "typescript"):
            self._detect_js_test_runner(root, info)
        elif lang == "rust":
            info.test_runner = "cargo test"
            info.test_command = "cargo test"
        elif lang == "go":
            info.test_runner = "go test"
            info.test_command = "go test ./..."

    def _detect_python_test_runner(self, root: Path, info: CodebaseInfo) -> None:
        """Detect Python test runner."""
        # Check for pytest markers
        if (root / "conftest.py").exists() or (root / "pytest.ini").exists():
            info.test_runner = "pytest"
            info.test_command = "python -m pytest -v"
            return

        # Check pyproject.toml for pytest config
        pyproject = root / "pyproject.toml"
        if pyproject.exists():
            try:
                text = pyproject.read_text(encoding="utf-8")
                if "pytest" in text or "[tool.pytest" in text:
                    info.test_runner = "pytest"
                    info.test_command = "python -m pytest -v"
                    return
            except OSError:
                pass

        # Check requirements for pytest
        for req_file in ("requirements.txt", "requirements-dev.txt", "requirements-test.txt"):
            req_path = root / req_file
            if req_path.exists():
                try:
                    text = req_path.read_text(encoding="utf-8").lower()
                    if "pytest" in text:
                        info.test_runner = "pytest"
                        info.test_command = "python -m pytest -v"
                        return
                except OSError:
                    pass

        # Check for unittest-style test files
        if any("test_" in f for f in info.test_files):
            info.test_runner = "unittest"
            info.test_command = "python -m unittest discover -v"
            return

        # Default for Python projects with test files
        if info.test_files:
            info.test_runner = "pytest"
            info.test_command = "python -m pytest -v"

    def _detect_js_test_runner(self, root: Path, info: CodebaseInfo) -> None:
        """Detect JavaScript/TypeScript test runner."""
        pkg_json = root / "package.json"
        if not pkg_json.exists():
            return

        try:
            pkg = json.loads(pkg_json.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return

        # Check scripts.test
        scripts = pkg.get("scripts", {})
        test_script = scripts.get("test", "")

        if "vitest" in test_script:
            info.test_runner = "vitest"
            info.test_command = "npx vitest run"
            return
        if "jest" in test_script:
            info.test_runner = "jest"
            info.test_command = "npx jest"
            return
        if "mocha" in test_script:
            info.test_runner = "mocha"
            info.test_command = "npx mocha"
            return

        # Check for config files
        for cfg in ("vitest.config.ts", "vitest.config.js"):
            if (root / cfg).exists():
                info.test_runner = "vitest"
                info.test_command = "npx vitest run"
                return

        for cfg in ("jest.config.js", "jest.config.ts", "jest.config.json"):
            if (root / cfg).exists():
                info.test_runner = "jest"
                info.test_command = "npx jest"
                return

        # Check devDependencies
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        if "vitest" in all_deps:
            info.test_runner = "vitest"
            info.test_command = "npx vitest run"
        elif "jest" in all_deps:
            info.test_runner = "jest"
            info.test_command = "npx jest"
        elif "mocha" in all_deps:
            info.test_runner = "mocha"
            info.test_command = "npx mocha"
        elif test_script:
            # Has a test script but unknown runner — use npm test
            info.test_runner = "npm"
            info.test_command = "npm test"

    def _find_entry_points(self, root: Path, info: CodebaseInfo) -> None:
        """Find likely entry point files."""
        candidates = [
            "main.py", "app.py", "server.py", "index.py", "run.py", "__main__.py",
            "index.js", "index.ts", "app.js", "app.ts", "server.js", "server.ts",
            "main.js", "main.ts", "main.rs", "lib.rs", "main.go",
        ]
        for path in self._walk(root):
            if path.name in candidates:
                info.entry_points.append(str(path.relative_to(root)))

    def _find_dependencies(self, root: Path, info: CodebaseInfo) -> None:
        """Extract dependency names."""
        lang = info.language

        if lang == "python":
            for req_file in ("requirements.txt",):
                req_path = root / req_file
                if req_path.exists():
                    try:
                        for line in req_path.read_text(encoding="utf-8").splitlines():
                            line = line.strip()
                            if line and not line.startswith("#") and not line.startswith("-"):
                                # Extract package name (before ==, >=, etc.)
                                name = line.split("==")[0].split(">=")[0].split("<=")[0].split("~=")[0].split("[")[0].strip()
                                if name:
                                    info.dependencies.append(name)
                    except OSError:
                        pass

        elif lang in ("javascript", "typescript"):
            pkg_json = root / "package.json"
            if pkg_json.exists():
                try:
                    pkg = json.loads(pkg_json.read_text(encoding="utf-8"))
                    info.dependencies.extend(pkg.get("dependencies", {}).keys())
                    info.dependencies.extend(pkg.get("devDependencies", {}).keys())
                except (OSError, json.JSONDecodeError):
                    pass

        elif lang == "rust":
            cargo = root / "Cargo.toml"
            if cargo.exists():
                try:
                    text = cargo.read_text(encoding="utf-8")
                    in_deps = False
                    for line in text.splitlines():
                        if line.strip().startswith("[dependencies") or line.strip().startswith("[dev-dependencies"):
                            in_deps = True
                            continue
                        if line.strip().startswith("[") and in_deps:
                            in_deps = False
                        if in_deps and "=" in line:
                            name = line.split("=")[0].strip()
                            if name:
                                info.dependencies.append(name)
                except OSError:
                    pass

        elif lang == "go":
            go_mod = root / "go.mod"
            if go_mod.exists():
                try:
                    text = go_mod.read_text(encoding="utf-8")
                    in_require = False
                    for line in text.splitlines():
                        if line.strip() == "require (":
                            in_require = True
                            continue
                        if line.strip() == ")" and in_require:
                            in_require = False
                        if in_require:
                            parts = line.strip().split()
                            if parts:
                                info.dependencies.append(parts[0])
                except OSError:
                    pass

    def _read_deps_text(self, root: Path, lang: str) -> str:
        """Read raw dependency text for framework detection."""
        if lang == "python":
            for f in ("requirements.txt", "pyproject.toml", "setup.py"):
                p = root / f
                if p.exists():
                    try:
                        return p.read_text(encoding="utf-8")
                    except OSError:
                        pass
        elif lang in ("javascript", "typescript"):
            p = root / "package.json"
            if p.exists():
                try:
                    return p.read_text(encoding="utf-8")
                except OSError:
                    pass
        elif lang == "rust":
            p = root / "Cargo.toml"
            if p.exists():
                try:
                    return p.read_text(encoding="utf-8")
                except OSError:
                    pass
        elif lang == "go":
            p = root / "go.mod"
            if p.exists():
                try:
                    return p.read_text(encoding="utf-8")
                except OSError:
                    pass
        return ""

    def _walk(self, root: Path):
        """Walk the directory tree, skipping irrelevant directories."""
        try:
            for entry in sorted(root.iterdir()):
                if entry.name in SKIP_DIRS:
                    continue
                if entry.is_file():
                    yield entry
                elif entry.is_dir():
                    yield from self._walk(entry)
        except PermissionError:
            pass
