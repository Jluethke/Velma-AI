"""
skill_state.py
==============

Persistent state storage for skills. Each skill gets its own
namespace under ~/.skillchain/state/<skill-name>/. State survives
between executions so skills can resume, accumulate context, and
track progress over time.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class PhaseResult:
    """Output from a single execution phase."""
    phase: str                      # e.g., "initialize", "analyze", "observe"
    status: str                     # "completed" | "failed" | "skipped"
    output: dict[str, Any]          # Phase-specific output data
    timestamp: str = ""             # ISO timestamp
    duration_ms: float = 0.0        # How long the phase took

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class SkillRun:
    """Record of a complete skill execution."""
    skill_name: str
    execution_pattern: str          # "orpa" | "phase_pipeline"
    started_at: str
    completed_at: str = ""
    status: str = "in_progress"     # "in_progress" | "completed" | "failed"
    phases: list[PhaseResult] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)  # User-defined


@dataclass
class SkillState:
    """Persistent state for a skill across multiple runs."""
    skill_name: str
    last_run: Optional[SkillRun] = None
    accumulated_data: dict[str, Any] = field(default_factory=dict)  # Persists across runs
    run_count: int = 0
    first_run: str = ""
    last_run_at: str = ""


class SkillStateStore:
    """
    File-based persistent state store for skills.

    Usage:
        store = SkillStateStore()  # uses ~/.skillchain/state/

        # Start a run
        run = store.start_run("ip-counsel", "phase_pipeline")

        # Record phase completions
        store.record_phase(run, "initialize", "completed", {"docs_found": 34, "families": ["A", "B"]})
        store.record_phase(run, "analyze", "completed", {"gaps": 3, "contradictions": 1})

        # Save accumulated data that persists across runs
        store.save_data("ip-counsel", "inventory", {"families": {...}, "last_scan": "2026-03-31"})

        # Complete the run
        store.complete_run(run)

        # Next session -- load previous state
        state = store.get_state("ip-counsel")
        if state.last_run:
            print(f"Last run: {state.last_run_at}, {state.run_count} total runs")
            inventory = store.load_data("ip-counsel", "inventory")
            if inventory:
                print(f"Existing inventory from {inventory.get('last_scan')}")
    """

    def __init__(self, base_dir: Optional[Path] = None):
        self._base = base_dir or Path.home() / ".skillchain" / "state"
        self._base.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _sanitize_name(name: str) -> str:
        """Sanitize a skill name to prevent path traversal.

        Strips directory separators, '..', and null bytes. Only allows
        alphanumeric chars, hyphens, underscores, and dots (not leading).
        """
        # Remove null bytes, slashes, and backslashes
        safe = name.replace("\0", "").replace("/", "").replace("\\", "")
        # Remove any '..' sequences
        while ".." in safe:
            safe = safe.replace("..", "")
        # Strip leading dots to prevent hidden files / traversal
        safe = safe.lstrip(".")
        if not safe:
            safe = "_unnamed"
        return safe

    def _skill_dir(self, skill_name: str) -> Path:
        safe_name = self._sanitize_name(skill_name)
        d = self._base / safe_name
        # Final check: ensure resolved path is under base
        if not str(d.resolve()).startswith(str(self._base.resolve())):
            raise ValueError(f"Invalid skill name: {skill_name}")
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _history_dir(self, skill_name: str) -> Path:
        d = self._skill_dir(skill_name) / "history"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _state_path(self, skill_name: str) -> Path:
        return self._skill_dir(skill_name) / "state.json"

    def _data_path(self, skill_name: str, key: str) -> Path:
        safe_key = self._sanitize_name(key)
        return self._skill_dir(skill_name) / f"data_{safe_key}.json"

    def get_state(self, skill_name: str) -> SkillState:
        """Load the current state for a skill. Returns empty state if none exists."""
        path = self._state_path(skill_name)
        if path.exists():
            try:
                raw = json.loads(path.read_text(encoding="utf-8"))
                state = SkillState(skill_name=skill_name)
                state.run_count = raw.get("run_count", 0)
                state.first_run = raw.get("first_run", "")
                state.last_run_at = raw.get("last_run_at", "")
                state.accumulated_data = raw.get("accumulated_data", {})
                if raw.get("last_run"):
                    lr = raw["last_run"]
                    phases = [PhaseResult(**p) for p in lr.get("phases", [])]
                    state.last_run = SkillRun(
                        skill_name=lr.get("skill_name", skill_name),
                        execution_pattern=lr.get("execution_pattern", ""),
                        started_at=lr.get("started_at", ""),
                        completed_at=lr.get("completed_at", ""),
                        status=lr.get("status", ""),
                        phases=phases,
                        metadata=lr.get("metadata", {}),
                    )
                return state
            except (json.JSONDecodeError, TypeError, KeyError) as exc:
                logger.warning("Corrupt state for %s: %s", skill_name, exc)
        return SkillState(skill_name=skill_name)

    def _save_state(self, state: SkillState) -> None:
        path = self._state_path(state.skill_name)
        data = {
            "skill_name": state.skill_name,
            "run_count": state.run_count,
            "first_run": state.first_run,
            "last_run_at": state.last_run_at,
            "accumulated_data": state.accumulated_data,
            "last_run": asdict(state.last_run) if state.last_run else None,
        }
        path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")

    def start_run(self, skill_name: str, execution_pattern: str, metadata: dict = None) -> SkillRun:
        """Start a new execution run for a skill."""
        now = datetime.now(timezone.utc).isoformat()
        run = SkillRun(
            skill_name=skill_name,
            execution_pattern=execution_pattern,
            started_at=now,
            metadata=metadata or {},
        )
        state = self.get_state(skill_name)
        if not state.first_run:
            state.first_run = now
        state.last_run = run
        state.last_run_at = now
        self._save_state(state)
        return run

    def record_phase(self, run: SkillRun, phase: str, status: str, output: dict, duration_ms: float = 0.0) -> PhaseResult:
        """Record the completion of a phase within a run."""
        result = PhaseResult(phase=phase, status=status, output=output, duration_ms=duration_ms)
        run.phases.append(result)
        state = self.get_state(run.skill_name)
        state.last_run = run
        self._save_state(state)
        return result

    def complete_run(self, run: SkillRun, status: str = "completed") -> None:
        """Mark a run as completed and archive to history."""
        run.completed_at = datetime.now(timezone.utc).isoformat()
        run.status = status
        state = self.get_state(run.skill_name)
        state.last_run = run
        state.run_count += 1
        state.last_run_at = run.completed_at
        self._save_state(state)
        # Archive to history
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
        history_path = self._history_dir(run.skill_name) / f"{date_str}.json"
        history_path.write_text(json.dumps(asdict(run), indent=2, default=str), encoding="utf-8")

    def save_data(self, skill_name: str, key: str, data: Any) -> None:
        """Save accumulated data that persists across runs."""
        path = self._data_path(skill_name, key)
        path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
        # Also store the key in accumulated_data index
        state = self.get_state(skill_name)
        state.accumulated_data[key] = {"updated_at": datetime.now(timezone.utc).isoformat(), "path": str(path)}
        self._save_state(state)

    def load_data(self, skill_name: str, key: str) -> Optional[Any]:
        """Load accumulated data by key. Returns None if not found."""
        path = self._data_path(skill_name, key)
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return None
        return None

    def clear_state(self, skill_name: str) -> None:
        """Clear all state for a skill (reset to fresh)."""
        import shutil
        skill_dir = self._skill_dir(skill_name)
        if skill_dir.exists():
            shutil.rmtree(skill_dir)

    def list_skills_with_state(self) -> list[str]:
        """List all skills that have persisted state."""
        if not self._base.exists():
            return []
        return [d.name for d in self._base.iterdir() if d.is_dir() and (d / "state.json").exists()]

    def get_run_history(self, skill_name: str, limit: int = 10) -> list[dict]:
        """Get recent run history for a skill."""
        history_dir = self._history_dir(skill_name)
        if not history_dir.exists():
            return []
        files = sorted(history_dir.glob("*.json"), reverse=True)[:limit]
        results = []
        for f in files:
            try:
                results.append(json.loads(f.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                continue
        return results
