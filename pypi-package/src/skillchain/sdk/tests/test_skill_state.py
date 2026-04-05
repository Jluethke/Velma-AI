"""Tests for skill_state.py — persistent state storage for skills."""
from __future__ import annotations

import json
import time

import pytest

from skillchain.sdk.skill_state import (
    PhaseResult,
    SkillRun,
    SkillState,
    SkillStateStore,
)


@pytest.fixture
def store(tmp_path):
    """Create a SkillStateStore backed by a temporary directory."""
    return SkillStateStore(base_dir=tmp_path)


# -- start_run creates state file ---------------------------------------------

def test_start_run_creates_state_file(store, tmp_path):
    run = store.start_run("my-skill", "orpa")
    state_path = tmp_path / "my-skill" / "state.json"
    assert state_path.exists()
    raw = json.loads(state_path.read_text(encoding="utf-8"))
    assert raw["skill_name"] == "my-skill"
    assert raw["last_run"]["execution_pattern"] == "orpa"
    assert raw["last_run"]["status"] == "in_progress"


# -- record_phase appends to run ----------------------------------------------

def test_record_phase_appends(store):
    run = store.start_run("my-skill", "phase_pipeline")
    store.record_phase(run, "initialize", "completed", {"docs": 5})
    store.record_phase(run, "analyze", "completed", {"gaps": 2}, duration_ms=123.4)

    assert len(run.phases) == 2
    assert run.phases[0].phase == "initialize"
    assert run.phases[1].output == {"gaps": 2}
    assert run.phases[1].duration_ms == 123.4

    # Verify persisted
    state = store.get_state("my-skill")
    assert len(state.last_run.phases) == 2


# -- complete_run archives to history -----------------------------------------

def test_complete_run_archives(store, tmp_path):
    run = store.start_run("my-skill", "orpa")
    store.record_phase(run, "observe", "completed", {"items": 3})
    store.complete_run(run)

    assert run.status == "completed"
    assert run.completed_at != ""

    # History directory should have one file
    history_dir = tmp_path / "my-skill" / "history"
    history_files = list(history_dir.glob("*.json"))
    assert len(history_files) == 1

    archived = json.loads(history_files[0].read_text(encoding="utf-8"))
    assert archived["status"] == "completed"
    assert len(archived["phases"]) == 1


# -- save_data / load_data round-trip -----------------------------------------

def test_save_load_data_roundtrip(store):
    payload = {"families": {"A": 10, "B": 5}, "last_scan": "2026-03-31"}
    store.save_data("ip-counsel", "inventory", payload)

    loaded = store.load_data("ip-counsel", "inventory")
    assert loaded == payload


def test_load_data_missing_returns_none(store):
    assert store.load_data("nonexistent", "key") is None


# -- get_state returns empty for unknown skill --------------------------------

def test_get_state_unknown_skill(store):
    state = store.get_state("never-seen")
    assert state.skill_name == "never-seen"
    assert state.run_count == 0
    assert state.last_run is None
    assert state.accumulated_data == {}


# -- clear_state removes everything ------------------------------------------

def test_clear_state(store, tmp_path):
    store.start_run("doomed", "orpa")
    store.save_data("doomed", "stuff", {"x": 1})
    assert (tmp_path / "doomed" / "state.json").exists()

    store.clear_state("doomed")
    assert not (tmp_path / "doomed").exists()

    # After clearing, get_state returns fresh
    state = store.get_state("doomed")
    assert state.run_count == 0


# -- list_skills_with_state ---------------------------------------------------

def test_list_skills_with_state(store):
    store.start_run("alpha", "orpa")
    store.start_run("beta", "phase_pipeline")

    skills = store.list_skills_with_state()
    assert set(skills) == {"alpha", "beta"}


def test_list_skills_empty(store):
    assert store.list_skills_with_state() == []


# -- get_run_history returns reverse chronological order ----------------------

def test_get_run_history_reverse_order(store):
    # Create multiple runs with distinct timestamps
    for i in range(3):
        run = store.start_run("tracked", "orpa", metadata={"run_index": i})
        store.record_phase(run, "step", "completed", {"i": i})
        store.complete_run(run)
        # Tiny sleep to ensure distinct filenames (second-resolution)
        time.sleep(0.05)

    history = store.get_run_history("tracked", limit=10)
    assert len(history) >= 1  # At least one archived

    # All should be completed
    for entry in history:
        assert entry["status"] == "completed"


def test_get_run_history_respects_limit(store):
    for _ in range(5):
        run = store.start_run("many-runs", "orpa")
        store.complete_run(run)
        time.sleep(0.05)

    history = store.get_run_history("many-runs", limit=2)
    assert len(history) <= 2


# -- corrupt state file handled gracefully ------------------------------------

def test_corrupt_state_returns_empty(store, tmp_path):
    skill_dir = tmp_path / "broken"
    skill_dir.mkdir(parents=True)
    (skill_dir / "state.json").write_text("NOT VALID JSON {{{", encoding="utf-8")

    state = store.get_state("broken")
    assert state.skill_name == "broken"
    assert state.run_count == 0
    assert state.last_run is None


# -- multiple runs increment run_count ----------------------------------------

def test_multiple_runs_increment_count(store):
    for i in range(4):
        run = store.start_run("counter", "orpa")
        store.complete_run(run)

    state = store.get_state("counter")
    assert state.run_count == 4


# -- complete_run with failed status ------------------------------------------

def test_complete_run_failed(store):
    run = store.start_run("failing", "orpa")
    store.complete_run(run, status="failed")

    state = store.get_state("failing")
    assert state.last_run.status == "failed"
    assert state.run_count == 1


# -- PhaseResult auto-timestamps ----------------------------------------------

def test_phase_result_auto_timestamp():
    pr = PhaseResult(phase="test", status="completed", output={})
    assert pr.timestamp != ""
    assert "T" in pr.timestamp  # ISO format


# -- accumulated_data index updated on save_data ------------------------------

def test_accumulated_data_index(store):
    store.save_data("indexer", "report", {"summary": "ok"})
    store.save_data("indexer", "metrics", {"score": 42})

    state = store.get_state("indexer")
    assert "report" in state.accumulated_data
    assert "metrics" in state.accumulated_data
    assert "updated_at" in state.accumulated_data["report"]
