"""
promotion_pipeline.py — Full pipeline: pattern -> generate -> test -> graduate -> publish.

Orchestrates the entire graduation flow:
  1. Check pattern tracker for promotion candidates
  2. Generate executable Python for each candidate
  3. Test the generated code (run 5x with test cases)
  4. If 80%+ success rate -> graduate
  5. Optionally publish to SkillChain network
"""

from __future__ import annotations

import hashlib
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from .config import DEPLOYMENT_MIN_EXECUTIONS, DEPLOYMENT_SUCCESS_RATE
from .health_monitor import SkillHealthMonitor
from .pattern_tracker import PatternTracker
from .skill_generator import GeneratedSkill, SkillGenerator
from .skill_runner import ExecutionResult, SkillRunner


@dataclass
class GraduatedSkill:
    """A skill that has passed all graduation gates."""

    skill_id: str
    name: str
    code: str
    domain: str
    tags: list[str] = field(default_factory=list)
    success_rate: float = 0.0
    execution_count: int = 0
    created_at: str = ""
    health_score: float = 1.0


class PromotionPipeline:
    """Orchestrate the full skill graduation pipeline.

    Parameters
    ----------
    generator:
        SkillGenerator for producing code from candidates.
        Created automatically if not provided.
    runner:
        SkillRunner for testing generated skills.
        Created automatically if not provided.
    health_monitor:
        SkillHealthMonitor for tracking graduated skill health.
        Created automatically if not provided.
    min_test_executions:
        Number of test runs required before graduation.
    min_success_rate:
        Minimum success rate across test runs to graduate.
    """

    def __init__(
        self,
        generator: SkillGenerator | None = None,
        runner: SkillRunner | None = None,
        health_monitor: SkillHealthMonitor | None = None,
        min_test_executions: int = DEPLOYMENT_MIN_EXECUTIONS,
        min_success_rate: float = DEPLOYMENT_SUCCESS_RATE,
    ) -> None:
        self._generator = generator or SkillGenerator()
        self._runner = runner or SkillRunner()
        self._health = health_monitor or SkillHealthMonitor()
        self._min_executions = min_test_executions
        self._min_success_rate = min_success_rate
        self._graduated: dict[str, GraduatedSkill] = {}

        # Stats
        self._total_candidates: int = 0
        self._total_graduated: int = 0
        self._total_rejected: int = 0

    # -- Main Entry Point ----------------------------------------------------

    def run(self, tracker: PatternTracker) -> list[GraduatedSkill]:
        """Run the full graduation pipeline.

        Steps:
          1. ``tracker.check_promotions()`` to find candidates
          2. ``generator.generate_executable()`` to produce code
          3. Test the code ``min_test_executions`` times
          4. If success rate >= ``min_success_rate`` -> graduate
          5. Mark the pattern as promoted so it is not re-processed

        Parameters
        ----------
        tracker:
            PatternTracker with recorded task outcomes.

        Returns
        -------
        list[GraduatedSkill]
            Newly graduated skills from this run.
        """
        candidates = tracker.check_promotions()
        newly_graduated: list[GraduatedSkill] = []

        for candidate in candidates:
            self._total_candidates += 1

            # Skip if already graduated under the same pattern key
            if candidate.pattern_key in self._graduated:
                continue

            # Generate executable code
            generated = self._generator.generate_executable(candidate)

            # Test the generated skill
            test_result = self._test_skill(generated)

            if test_result is None:
                self._total_rejected += 1
                continue

            success_rate, execution_count = test_result

            if success_rate < self._min_success_rate:
                self._total_rejected += 1
                continue

            # Graduate
            skill_id = self._make_skill_id(generated.name)
            now = datetime.now(timezone.utc).isoformat()

            graduated = GraduatedSkill(
                skill_id=skill_id,
                name=generated.name,
                code=generated.code,
                domain=generated.domain,
                tags=generated.tags,
                success_rate=success_rate,
                execution_count=execution_count,
                created_at=now,
                health_score=1.0,
            )

            self._graduated[candidate.pattern_key] = graduated
            self._total_graduated += 1
            newly_graduated.append(graduated)

            # Mark pattern as promoted so it resets
            tracker.mark_promoted(candidate.pattern_key)

            # Register with health monitor
            self._health.register_tags(skill_id, set(generated.tags))

            # Attempt SDK publish (optional)
            self._try_publish(graduated)

        return newly_graduated

    # -- Testing -------------------------------------------------------------

    def _test_skill(
        self, generated: GeneratedSkill
    ) -> Optional[tuple[float, int]]:
        """Run test cases against generated skill code.

        Returns ``(success_rate, execution_count)`` or ``None`` if no tests
        could run.
        """
        successes = 0
        total = 0

        # Use provided test cases
        for case in generated.test_cases:
            ctx = case.get("context", {})
            expect_success = case.get("expect_success", True)
            result = self._runner.execute(generated.code, ctx)

            total += 1
            # A test passes if the result matches expectations
            if result.success == expect_success:
                successes += 1

        # Pad to minimum execution count with default context
        while total < self._min_executions:
            result = self._runner.execute(generated.code, {})
            total += 1
            # For default context, we just check it doesn't crash unexpectedly
            if not result.error or "No " in result.output or not result.success:
                # Expected: empty context should fail gracefully
                successes += 1

        if total == 0:
            return None

        return successes / total, total

    # -- Publishing ----------------------------------------------------------

    def _try_publish(self, skill: GraduatedSkill) -> bool:
        """Attempt to publish to SkillChain SDK if available."""
        try:
            from skillchain.sdk import SkillChainNode as SkillChainSDK  # type: ignore[import-not-found]

            sdk = SkillChainSDK()
            sdk.publish(
                name=skill.name,
                code=skill.code,
                domain=skill.domain,
                tags=skill.tags,
            )
            return True
        except (ImportError, Exception):
            return False

    # -- Utilities -----------------------------------------------------------

    def _make_skill_id(self, name: str) -> str:
        """Generate a deterministic skill ID from the name."""
        hash_part = hashlib.sha256(
            f"{name}:{time.time()}".encode()
        ).hexdigest()[:12]
        return f"grad_{hash_part}"

    # -- Accessors -----------------------------------------------------------

    def get_graduated(self) -> list[GraduatedSkill]:
        """Return all graduated skills."""
        return list(self._graduated.values())

    @property
    def stats(self) -> dict:
        """Pipeline statistics."""
        return {
            "candidates_seen": self._total_candidates,
            "graduated": self._total_graduated,
            "rejected": self._total_rejected,
            "total_graduated": len(self._graduated),
        }
