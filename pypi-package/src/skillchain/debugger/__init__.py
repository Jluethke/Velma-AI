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
SkillChain Debugger — Automated debug-and-fix engine.

Drop a repo path, get working code back.

Usage::

    from skillchain.debugger import DebugEngine

    engine = DebugEngine()
    result = engine.run("/path/to/broken/repo")
    print(result.report.summary)
"""

from .engine import DebugEngine, DebugResult
from .scanner import CodebaseScanner, CodebaseInfo
from .error_parser import ErrorParser, ParsedError, StackFrame
from .root_cause import RootCauseAnalyzer, RootCauseAnalysis
from .fix_generator import FixGenerator, ProposedFix, FileChange
from .test_runner import TestRunner, TestResults, TestFailure
from .reporter import DebugReporter, DebugReport
from .sandbox import SandboxManager
from .tournament import FixTournament, TournamentResult, CandidateResult
from .config import DebugConfig

__all__ = [
    "DebugEngine",
    "DebugResult",
    "CodebaseScanner",
    "CodebaseInfo",
    "ErrorParser",
    "ParsedError",
    "StackFrame",
    "RootCauseAnalyzer",
    "RootCauseAnalysis",
    "FixGenerator",
    "ProposedFix",
    "FileChange",
    "TestRunner",
    "TestResults",
    "TestFailure",
    "DebugReporter",
    "DebugReport",
    "SandboxManager",
    "FixTournament",
    "TournamentResult",
    "CandidateResult",
    "DebugConfig",
]
