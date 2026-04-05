"""
config.py — Graduation thresholds and constants.

All tunables for the skill graduation pipeline live here.
"""

from __future__ import annotations

# -- Pattern Promotion -------------------------------------------------------
# A pattern must be seen this many times with a success rate above the
# threshold before it becomes a promotion candidate.
PROMOTION_THRESHOLD: int = 3
PROMOTION_SUCCESS_RATE: float = 0.75

# -- Deployment Gate ---------------------------------------------------------
# After code generation, the skill must pass this many test executions at
# this success rate before it graduates.
DEPLOYMENT_SUCCESS_RATE: float = 0.80
DEPLOYMENT_MIN_EXECUTIONS: int = 5

# -- Health Monitor ----------------------------------------------------------
QUARANTINE_HEALTH_THRESHOLD: float = 0.30
HEALTH_RECENCY_WEIGHT: float = 0.4
HEALTH_SUCCESS_WEIGHT: float = 0.4
HEALTH_OVERLAP_WEIGHT: float = 0.2

# -- Skill Composition ------------------------------------------------------
MAX_CHAIN_DEPTH: int = 4

# -- Pattern Tracker Limits --------------------------------------------------
MAX_PATTERNS: int = 500
MAX_DESCRIPTIONS_PER_PATTERN: int = 10

# -- Import Security ---------------------------------------------------------
IMPORT_WHITELIST: frozenset[str] = frozenset({
    "os.path", "json", "re", "datetime", "collections",
    "itertools", "math", "statistics", "hashlib", "pathlib",
})

IMPORT_BLACKLIST: frozenset[str] = frozenset({
    "subprocess", "socket", "requests", "urllib", "http",
    "shutil.rmtree", "os.remove",
})
