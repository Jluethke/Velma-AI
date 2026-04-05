"""
test_skill_chain.py
===================

Tests for the SkillChain pipeline composition system.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from skillchain.sdk.skill_chain import (
    ChainResult,
    SkillChain,
    SkillStep,
    StepResult,
    _StepExecutor,
)
from skillchain.sdk.exceptions import SkillChainError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class EchoExecutor(_StepExecutor):
    """Executor that echoes context back with a marker."""

    def run(self, step: SkillStep, context: dict[str, Any]) -> dict[str, Any]:
        output = dict(context)
        output[f"{step.alias}_done"] = True
        return output


class FailOnExecutor(_StepExecutor):
    """Executor that fails when it hits a specific alias."""

    def __init__(self, fail_alias: str) -> None:
        self._fail_alias = fail_alias

    def run(self, step: SkillStep, context: dict[str, Any]) -> dict[str, Any]:
        if step.alias == self._fail_alias:
            raise RuntimeError(f"Simulated failure in {step.alias}")
        output = dict(context)
        output[f"{step.alias}_done"] = True
        return output


class PhaseAwareExecutor(_StepExecutor):
    """Executor that records which phases were requested."""

    def run(self, step: SkillStep, context: dict[str, Any]) -> dict[str, Any]:
        return {
            "phases_requested": step.phase_filter,
            f"{step.alias}_done": True,
        }


# ---------------------------------------------------------------------------
# Tests: building chains
# ---------------------------------------------------------------------------

class TestChainBuilding:
    def test_add_single_step(self):
        chain = SkillChain("test")
        chain.add("my-skill", alias="s1")
        assert len(chain._steps) == 1
        assert chain._steps[0].alias == "s1"

    def test_alias_defaults_to_skill_name(self):
        chain = SkillChain("test")
        chain.add("research-synthesizer")
        assert chain._steps[0].alias == "research-synthesizer"

    def test_duplicate_alias_raises(self):
        chain = SkillChain("test")
        chain.add("skill-a", alias="x")
        with pytest.raises(SkillChainError, match="Duplicate alias"):
            chain.add("skill-b", alias="x")

    def test_fluent_chaining(self):
        chain = (
            SkillChain("test")
            .add("a", alias="a")
            .add("b", alias="b", depends_on="a")
        )
        assert len(chain._steps) == 2

    def test_depends_on_string_normalised_to_list(self):
        chain = SkillChain("test")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        assert chain._steps[1].depends_on == ["a"]

    def test_depends_on_list(self):
        chain = SkillChain("test")
        chain.add("a", alias="a")
        chain.add("b", alias="b")
        chain.add("c", alias="c", depends_on=["a", "b"])
        assert chain._steps[2].depends_on == ["a", "b"]


# ---------------------------------------------------------------------------
# Tests: validation
# ---------------------------------------------------------------------------

class TestValidation:
    def test_empty_chain(self):
        chain = SkillChain("empty")
        errors = chain.validate()
        assert any("no steps" in e.lower() for e in errors)

    def test_valid_linear_chain(self):
        chain = SkillChain("test")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        assert chain.validate() == []

    def test_unresolved_dependency(self):
        chain = SkillChain("test")
        chain.add("a", alias="a", depends_on="nonexistent")
        errors = chain.validate()
        assert any("nonexistent" in e for e in errors)

    def test_circular_dependency_detected(self):
        chain = SkillChain("test")
        chain.add("a", alias="a", depends_on="b")
        chain.add("b", alias="b", depends_on="a")
        errors = chain.validate()
        assert any("ircular" in e for e in errors)

    def test_self_dependency_detected(self):
        chain = SkillChain("test")
        chain.add("a", alias="a", depends_on="a")
        errors = chain.validate()
        # Self-dep is a cycle
        assert len(errors) > 0


# ---------------------------------------------------------------------------
# Tests: topological sort
# ---------------------------------------------------------------------------

class TestTopologicalSort:
    def test_linear_order(self):
        chain = SkillChain("test")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        order = chain._topological_sort()
        aliases = [s.alias for s in order]
        assert aliases == ["a", "b", "c"]

    def test_parallel_then_merge(self):
        chain = SkillChain("test")
        chain.add("a", alias="a")
        chain.add("b", alias="b")
        chain.add("c", alias="c", depends_on=["a", "b"])
        order = chain._topological_sort()
        aliases = [s.alias for s in order]
        # a and b before c, order between a/b doesn't matter
        assert aliases.index("a") < aliases.index("c")
        assert aliases.index("b") < aliases.index("c")

    def test_diamond_dependency(self):
        chain = SkillChain("test")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="a")
        chain.add("d", alias="d", depends_on=["b", "c"])
        order = chain._topological_sort()
        aliases = [s.alias for s in order]
        assert aliases[0] == "a"
        assert aliases[-1] == "d"
        assert aliases.index("b") < aliases.index("d")
        assert aliases.index("c") < aliases.index("d")

    def test_cycle_raises(self):
        chain = SkillChain("test")
        chain.add("a", alias="a", depends_on="c")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        with pytest.raises(SkillChainError, match="ircular"):
            chain._topological_sort()


# ---------------------------------------------------------------------------
# Tests: execution
# ---------------------------------------------------------------------------

class TestExecution:
    def test_linear_chain_data_flows(self):
        chain = SkillChain("linear")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        chain.set_executor(EchoExecutor())

        result = chain.execute(initial_context={"seed": 42})

        assert result.success is True
        assert len(result.steps) == 3
        assert all(s.status == "completed" for s in result.steps)
        # Step C should have received data from B which had data from A
        step_c = result.steps[2]
        assert step_c.output.get("a_done") is True
        assert step_c.output.get("b_done") is True
        assert step_c.output.get("seed") == 42

    def test_parallel_chain_both_feed_merge(self):
        chain = SkillChain("parallel")
        chain.add("a", alias="a")
        chain.add("b", alias="b")
        chain.add("c", alias="c", depends_on=["a", "b"])
        chain.set_executor(EchoExecutor())

        result = chain.execute(initial_context={"x": 1})

        assert result.success is True
        step_c = [s for s in result.steps if s.alias == "c"][0]
        assert step_c.output.get("a_done") is True
        assert step_c.output.get("b_done") is True
        assert "a" in step_c.upstream_data_received
        assert "b" in step_c.upstream_data_received

    def test_diamond_dependency_correct_merge(self):
        chain = SkillChain("diamond")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="a")
        chain.add("d", alias="d", depends_on=["b", "c"])
        chain.set_executor(EchoExecutor())

        result = chain.execute(initial_context={"root": True})

        assert result.success is True
        step_d = [s for s in result.steps if s.alias == "d"][0]
        assert step_d.output.get("a_done") is True
        assert step_d.output.get("b_done") is True
        assert step_d.output.get("c_done") is True
        assert step_d.output.get("root") is True

    def test_initial_context_available_to_all_steps(self):
        chain = SkillChain("ctx")
        chain.add("a", alias="a")
        chain.add("b", alias="b")  # No dependency on a
        chain.set_executor(EchoExecutor())

        result = chain.execute(initial_context={"global_key": "hello"})

        for step in result.steps:
            assert step.output.get("global_key") == "hello"

    def test_step_failure_fail_fast(self):
        chain = SkillChain("fail")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        chain.set_executor(FailOnExecutor("b"))

        result = chain.execute(initial_context={})

        assert result.success is False
        assert result.steps[0].status == "completed"
        assert result.steps[1].status == "failed"
        assert len(result.steps) == 2  # c never ran (fail-fast)

    def test_step_failure_no_fail_fast_skips_downstream(self):
        chain = SkillChain("noff")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        chain.set_executor(FailOnExecutor("b"))

        result = chain.execute(initial_context={}, fail_fast=False)

        assert result.success is False
        assert result.steps[0].status == "completed"
        assert result.steps[1].status == "failed"
        assert result.steps[2].status == "skipped"

    def test_validation_failure_raises(self):
        chain = SkillChain("bad")
        chain.add("a", alias="a", depends_on="missing")
        with pytest.raises(SkillChainError, match="validation failed"):
            chain.execute()

    def test_total_duration_tracked(self):
        chain = SkillChain("dur")
        chain.add("a", alias="a")
        chain.set_executor(EchoExecutor())
        result = chain.execute()
        assert result.total_duration_ms >= 0

    def test_default_executor_echoes_context(self):
        """Without a custom executor, the default produces output."""
        chain = SkillChain("default")
        chain.add("a", alias="a")
        result = chain.execute(initial_context={"key": "val"})
        assert result.success is True
        assert result.steps[0].output.get("key") == "val"
        assert result.steps[0].output.get("processed") is True


# ---------------------------------------------------------------------------
# Tests: phase filter
# ---------------------------------------------------------------------------

class TestPhaseFilter:
    def test_phase_filter_passed_to_executor(self):
        chain = SkillChain("phases")
        chain.add("a", alias="a", phase_filter=["analyze", "generate"])
        chain.set_executor(PhaseAwareExecutor())
        result = chain.execute()
        assert result.success is True
        assert result.steps[0].output["phases_requested"] == ["analyze", "generate"]

    def test_no_phase_filter_passes_none(self):
        chain = SkillChain("nophase")
        chain.add("a", alias="a")
        chain.set_executor(PhaseAwareExecutor())
        result = chain.execute()
        assert result.steps[0].output["phases_requested"] is None


# ---------------------------------------------------------------------------
# Tests: serialisation
# ---------------------------------------------------------------------------

class TestSerialisation:
    def test_to_dict_from_dict_roundtrip(self):
        chain = SkillChain("roundtrip", description="Test chain")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a", config={"x": 1})
        chain.add("c", alias="c", depends_on=["a", "b"], phase_filter=["run"])

        data = chain.to_dict()
        restored = SkillChain.from_dict(data)

        assert restored.name == chain.name
        assert restored.description == chain.description
        assert len(restored._steps) == len(chain._steps)
        for orig, rest in zip(chain._steps, restored._steps):
            assert rest.skill_name == orig.skill_name
            assert rest.alias == orig.alias
            assert rest.depends_on == orig.depends_on
            assert rest.config == orig.config
            assert rest.phase_filter == orig.phase_filter

    def test_save_load_roundtrip(self, tmp_path: Path):
        chain = SkillChain("saveload", description="Persist me")
        chain.add("x", alias="x")
        chain.add("y", alias="y", depends_on="x")

        fpath = tmp_path / "chain.json"
        chain.save(fpath)
        assert fpath.exists()

        loaded = SkillChain.load(fpath)
        assert loaded.name == "saveload"
        assert loaded.description == "Persist me"
        assert len(loaded._steps) == 2
        assert loaded._steps[1].depends_on == ["x"]

    def test_save_creates_parent_dirs(self, tmp_path: Path):
        chain = SkillChain("nested")
        chain.add("a", alias="a")
        fpath = tmp_path / "sub" / "dir" / "chain.json"
        chain.save(fpath)
        assert fpath.exists()

    def test_json_is_valid(self, tmp_path: Path):
        chain = SkillChain("json-check")
        chain.add("s", alias="s")
        fpath = tmp_path / "c.json"
        chain.save(fpath)
        data = json.loads(fpath.read_text(encoding="utf-8"))
        assert data["name"] == "json-check"


# ---------------------------------------------------------------------------
# Tests: visualise
# ---------------------------------------------------------------------------

class TestVisualise:
    def test_empty_chain(self):
        chain = SkillChain("empty")
        viz = chain.visualize()
        assert "empty" in viz

    def test_linear_chain_format(self):
        chain = SkillChain("linear")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")
        chain.add("c", alias="c", depends_on="b")
        viz = chain.visualize()
        assert "linear" in viz
        assert "a" in viz
        assert "b" in viz
        assert "c" in viz

    def test_parallel_chain_format(self):
        chain = SkillChain("parallel")
        chain.add("a", alias="a")
        chain.add("b", alias="b")
        chain.add("c", alias="c", depends_on=["a", "b"])
        viz = chain.visualize()
        assert "a" in viz
        assert "b" in viz
        assert "c" in viz


# ---------------------------------------------------------------------------
# Tests: skillpack export
# ---------------------------------------------------------------------------

class TestSkillpackExport:
    def test_to_skillpack_generates_structure(self, tmp_path: Path):
        chain = SkillChain("my-chain", description="A test chain")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")

        pack_dir = chain.to_skillpack(tmp_path)

        assert pack_dir.exists()
        assert pack_dir.name == "my-chain.skillpack"
        assert (pack_dir / "manifest.json").exists()
        assert (pack_dir / "chain.json").exists()
        assert (pack_dir / "skill.md").exists()

    def test_manifest_has_composition(self, tmp_path: Path):
        chain = SkillChain("comp")
        chain.add("x", alias="x")
        chain.add("y", alias="y", depends_on="x")

        pack_dir = chain.to_skillpack(tmp_path)
        manifest = json.loads(
            (pack_dir / "manifest.json").read_text(encoding="utf-8")
        )

        assert manifest["type"] == "composite"
        assert manifest["composition"] == ["x", "y"]
        assert "execution_order" in manifest

    def test_chain_json_matches_to_dict(self, tmp_path: Path):
        chain = SkillChain("match")
        chain.add("a", alias="a")
        chain.add("b", alias="b", depends_on="a")

        pack_dir = chain.to_skillpack(tmp_path)
        chain_data = json.loads(
            (pack_dir / "chain.json").read_text(encoding="utf-8")
        )

        assert chain_data == chain.to_dict()

    def test_skill_md_describes_steps(self, tmp_path: Path):
        chain = SkillChain("doc", description="Documented chain")
        chain.add("step-one", alias="s1")
        chain.add("step-two", alias="s2", depends_on="s1")

        pack_dir = chain.to_skillpack(tmp_path)
        md = (pack_dir / "skill.md").read_text(encoding="utf-8")

        assert "doc" in md
        assert "s1" in md
        assert "s2" in md
        assert "step-one" in md
