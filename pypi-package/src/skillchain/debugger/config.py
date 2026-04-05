# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Configuration for the SkillChain debugger engine."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class DebugConfig:
    """All tunables for the debug-and-fix pipeline."""

    # Retry budget
    max_fix_attempts: int = 3

    # Test execution
    test_timeout_s: int = 120

    # Supported languages and their test runners
    supported_languages: list[str] = field(default_factory=lambda: [
        "python", "javascript", "typescript", "rust", "go",
    ])

    supported_test_runners: dict[str, list[str]] = field(default_factory=lambda: {
        "python": ["pytest", "unittest", "nose2"],
        "javascript": ["jest", "mocha", "vitest"],
        "typescript": ["jest", "vitest"],
        "rust": ["cargo test"],
        "go": ["go test"],
    })

    # File extensions per language
    language_extensions: dict[str, list[str]] = field(default_factory=lambda: {
        "python": [".py"],
        "javascript": [".js", ".jsx", ".mjs", ".cjs"],
        "typescript": [".ts", ".tsx", ".mts", ".cts"],
        "rust": [".rs"],
        "go": [".go"],
    })

    # Marker files for language detection (ordered by priority)
    language_markers: dict[str, list[str]] = field(default_factory=lambda: {
        "python": ["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt",
                    "Pipfile", "poetry.lock"],
        "javascript": ["package.json"],
        "typescript": ["tsconfig.json"],
        "rust": ["Cargo.toml"],
        "go": ["go.mod"],
    })

    # Framework markers
    framework_markers: dict[str, dict[str, list[str]]] = field(default_factory=lambda: {
        "python": {
            "django": ["manage.py", "django"],
            "flask": ["flask"],
            "fastapi": ["fastapi"],
            "pytest": ["conftest.py", "pytest.ini", "pyproject.toml"],
        },
        "javascript": {
            "react": ["react"],
            "express": ["express"],
            "next": ["next.config"],
        },
        "typescript": {
            "react": ["react"],
            "angular": ["angular.json"],
            "next": ["next.config"],
        },
        "rust": {
            "actix": ["actix-web"],
            "tokio": ["tokio"],
        },
        "go": {
            "gin": ["gin-gonic"],
            "echo": ["labstack/echo"],
        },
    })

    # How many lines of context to read around an error location
    error_context_lines: int = 10

    # Maximum file size to read (bytes) — skip giant generated files
    max_file_size: int = 1_000_000  # 1 MB

    # Multi-candidate verification
    candidate_count: int = 5              # Generate 5 fix candidates
    parallel_sandboxes: bool = True       # Run tests in parallel
    consensus_threshold: float = 0.6      # 3/5 candidates must agree on approach for high confidence
    sandbox_isolation: bool = True        # Each candidate gets its own copy of the repo
