"""
SkillChain Graduation Pipeline
==============================

Evolves skills from LLM-dependent patterns into standalone executable Python.

Pipeline: pattern_tracker -> skill_generator -> skill_runner (test) -> promotion_pipeline -> publish

Ported from the Velma/NeurOS learning loop, skill runner, composer, and health monitor.
"""

from __future__ import annotations

from .config import (
    PROMOTION_THRESHOLD,
    PROMOTION_SUCCESS_RATE,
    DEPLOYMENT_SUCCESS_RATE,
    DEPLOYMENT_MIN_EXECUTIONS,
    QUARANTINE_HEALTH_THRESHOLD,
    MAX_CHAIN_DEPTH,
)
from .pattern_tracker import PatternTracker, PromotionCandidate
from .skill_generator import SkillGenerator, GeneratedSkill
from .skill_runner import SkillRunner, ExecutionResult
from .skill_composer import SkillComposer, CompositeSkill
from .health_monitor import SkillHealthMonitor
from .promotion_pipeline import PromotionPipeline, GraduatedSkill

__all__ = [
    "PatternTracker",
    "PromotionCandidate",
    "SkillGenerator",
    "GeneratedSkill",
    "SkillRunner",
    "ExecutionResult",
    "SkillComposer",
    "CompositeSkill",
    "SkillHealthMonitor",
    "PromotionPipeline",
    "GraduatedSkill",
    "PROMOTION_THRESHOLD",
    "PROMOTION_SUCCESS_RATE",
    "DEPLOYMENT_SUCCESS_RATE",
    "DEPLOYMENT_MIN_EXECUTIONS",
    "QUARANTINE_HEALTH_THRESHOLD",
    "MAX_CHAIN_DEPTH",
]
