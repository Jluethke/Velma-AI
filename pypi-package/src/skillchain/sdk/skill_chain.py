"""
skill_chain.py
==============

Compose multiple skills into executable pipelines. Output of one skill
feeds as input to the next. Chains can be saved, shared, and published
as composite skills on SkillChain.

Example::

    chain = SkillChain("market-launch")
    chain.add("research-synthesizer", alias="research")
    chain.add("competitor-teardown", alias="competitors", depends_on="research")
    chain.add("market-entry-analyzer", alias="strategy", depends_on=["research", "competitors"])
    chain.add("growth-content-system", alias="content", depends_on="strategy")

    result = chain.execute(initial_context={"topic": "AI skill marketplace"})
"""

from __future__ import annotations

import json
import logging
import time
from collections import deque
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from .exceptions import SkillChainError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# File reference resolution
# ---------------------------------------------------------------------------

# Max bytes to inline per file (prevent context blowout)
_MAX_FILE_BYTES = 200_000

# Extensions we'll read as text
_TEXT_EXTENSIONS = {
    ".md", ".txt", ".py", ".ts", ".js", ".json", ".yaml", ".yml",
    ".toml", ".cfg", ".ini", ".rst", ".csv", ".html", ".xml",
    ".c", ".cpp", ".h", ".rs", ".go", ".java", ".sol",
}


def _resolve_file_references(context: dict[str, Any]) -> dict[str, Any]:
    """Expand file path references in context to actual file contents.

    Recognises two patterns:
      1. ``source_paths`` key containing a list of file/directory paths.
         Each path is expanded: files are read inline, directories have their
         text files read and concatenated.
      2. Any string value starting with ``file:`` — the remainder is treated
         as a path and replaced with the file content.

    Returns a new context dict (does not mutate the original).
    """
    ctx = dict(context)

    # Pattern 1: source_paths list
    if "source_paths" in ctx and isinstance(ctx["source_paths"], list):
        loaded: dict[str, str] = {}
        for raw_path in ctx["source_paths"]:
            p = Path(str(raw_path))
            if not p.is_absolute():
                # Try relative to cwd
                p = Path.cwd() / p
            if p.is_file() and p.suffix in _TEXT_EXTENSIONS:
                try:
                    content = p.read_text(encoding="utf-8", errors="replace")
                    if len(content) <= _MAX_FILE_BYTES:
                        loaded[str(raw_path)] = content
                    else:
                        loaded[str(raw_path)] = (
                            content[:_MAX_FILE_BYTES]
                            + f"\n\n... [truncated at {_MAX_FILE_BYTES:,} bytes]"
                        )
                except OSError as exc:
                    loaded[str(raw_path)] = f"[ERROR reading file: {exc}]"
            elif p.is_dir():
                dir_content: list[str] = []
                for child in sorted(p.rglob("*")):
                    if child.is_file() and child.suffix in _TEXT_EXTENSIONS:
                        try:
                            text = child.read_text(encoding="utf-8", errors="replace")
                            rel = child.relative_to(p)
                            header = f"### {rel}\n"
                            if len(text) > _MAX_FILE_BYTES:
                                text = text[:_MAX_FILE_BYTES] + "\n... [truncated]"
                            dir_content.append(header + text)
                        except OSError:
                            continue
                        # Stop if accumulated content is too large
                        total = sum(len(s) for s in dir_content)
                        if total > _MAX_FILE_BYTES * 3:
                            dir_content.append("\n... [remaining files omitted]")
                            break
                if dir_content:
                    loaded[str(raw_path)] = "\n\n".join(dir_content)
                else:
                    loaded[str(raw_path)] = f"[No readable text files in {raw_path}]"
            else:
                loaded[str(raw_path)] = f"[Path not found: {raw_path}]"

        ctx["source_contents"] = loaded

    # Pattern 2: file: prefix on string values
    for key, val in list(ctx.items()):
        if isinstance(val, str) and val.startswith("file:"):
            fpath = Path(val[5:].strip())
            if not fpath.is_absolute():
                fpath = Path.cwd() / fpath
            if fpath.is_file():
                try:
                    text = fpath.read_text(encoding="utf-8", errors="replace")
                    if len(text) > _MAX_FILE_BYTES:
                        text = text[:_MAX_FILE_BYTES] + "\n... [truncated]"
                    ctx[key] = text
                except OSError as exc:
                    ctx[key] = f"[ERROR reading {fpath}: {exc}]"
            else:
                ctx[key] = f"[File not found: {fpath}]"

    return ctx


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class SkillStep:
    """A single step in a skill chain."""

    skill_name: str
    alias: str
    depends_on: list[str] = field(default_factory=list)
    config: dict[str, Any] = field(default_factory=dict)
    phase_filter: list[str] | None = None


@dataclass
class StepResult:
    """Result from executing one step in a chain."""

    skill_name: str
    alias: str
    status: str  # "completed" | "failed" | "skipped"
    output: dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
    upstream_data_received: dict[str, Any] = field(default_factory=dict)
    error: str = ""


@dataclass
class ChainResult:
    """Result from executing an entire chain."""

    chain_name: str
    steps: list[StepResult] = field(default_factory=list)
    total_duration_ms: float = 0.0
    success: bool = False
    final_output: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# SkillChain
# ---------------------------------------------------------------------------

class SkillChain:
    """Compose multiple skills into an executable DAG pipeline.

    Parameters
    ----------
    name:
        Human-readable chain name.
    description:
        Optional description of what the chain does.
    """

    def __init__(self, name: str, description: str = "") -> None:
        self.name = name
        self.description = description
        self._steps: list[SkillStep] = []
        self._alias_index: dict[str, SkillStep] = {}
        self._executor: Optional[_StepExecutor] = None

    # -- Building the chain -------------------------------------------------

    def add(
        self,
        skill_name: str,
        alias: str | None = None,
        depends_on: str | list[str] | None = None,
        config: dict | None = None,
        phase_filter: list[str] | None = None,
    ) -> "SkillChain":
        """Add a step to the chain.

        Parameters
        ----------
        skill_name:
            Name of the skill (must match a marketplace skill or local file).
        alias:
            Short name for referencing this step. Defaults to *skill_name*.
        depends_on:
            Alias(es) of upstream steps whose output feeds this step.
        config:
            Step-specific configuration overrides.
        phase_filter:
            If provided, only run these phases of the skill.

        Returns
        -------
        SkillChain
            Self, for fluent chaining.
        """
        resolved_alias = alias or skill_name

        if resolved_alias in self._alias_index:
            raise SkillChainError(
                f"Duplicate alias '{resolved_alias}' in chain '{self.name}'."
            )

        if depends_on is None:
            deps: list[str] = []
        elif isinstance(depends_on, str):
            deps = [depends_on]
        else:
            deps = list(depends_on)

        step = SkillStep(
            skill_name=skill_name,
            alias=resolved_alias,
            depends_on=deps,
            config=config or {},
            phase_filter=phase_filter,
        )
        self._steps.append(step)
        self._alias_index[resolved_alias] = step
        return self

    def set_executor(self, executor: "_StepExecutor") -> None:
        """Inject a custom step executor (for testing or custom runtimes)."""
        self._executor = executor

    # -- Validation ---------------------------------------------------------

    def validate(self) -> list[str]:
        """Check the chain for structural errors.

        Returns a list of error strings. An empty list means the chain is
        valid.
        """
        errors: list[str] = []

        if not self._steps:
            errors.append("Chain has no steps.")
            return errors

        known_aliases = {s.alias for s in self._steps}

        # Check for unresolved dependencies
        for step in self._steps:
            for dep in step.depends_on:
                if dep not in known_aliases:
                    errors.append(
                        f"Step '{step.alias}' depends on unknown alias '{dep}'."
                    )

        # Check for circular dependencies
        cycle = self._detect_cycle()
        if cycle:
            errors.append(f"Circular dependency: {' -> '.join(cycle)}")

        return errors

    # -- Execution ----------------------------------------------------------

    def execute(
        self,
        initial_context: dict[str, Any] | None = None,
        fail_fast: bool = True,
        fabric: Optional[Any] = None,
    ) -> ChainResult:
        """Execute the chain in topological order.

        Parameters
        ----------
        initial_context:
            Starting context dict available to all steps.
        fail_fast:
            If True (default), stop on the first failed step. If False,
            skip downstream dependents and continue parallel branches.
        fabric:
            Optional CognitiveFabric. When provided, each completed step
            emits an Observation into the TKG and the chain result emits
            a chain-level Inference on completion.

        Returns
        -------
        ChainResult
        """
        errors = self.validate()
        if errors:
            raise SkillChainError(
                f"Chain validation failed: {'; '.join(errors)}"
            )

        context = _resolve_file_references(dict(initial_context or {}))
        order = self._topological_sort()
        step_outputs: dict[str, dict[str, Any]] = {}
        results: list[StepResult] = []
        failed_aliases: set[str] = set()
        t0 = time.perf_counter()

        for step in order:
            # Skip if any upstream dependency failed
            upstream_failed = any(d in failed_aliases for d in step.depends_on)
            if upstream_failed:
                results.append(StepResult(
                    skill_name=step.skill_name,
                    alias=step.alias,
                    status="skipped",
                    error="Upstream dependency failed.",
                ))
                failed_aliases.add(step.alias)
                if fabric is not None:
                    fabric.on_step_complete(
                        chain_name=self.name,
                        step_alias=step.alias,
                        skill_name=step.skill_name,
                        status="skipped",
                        output={},
                        duration_ms=0.0,
                        error="Upstream dependency failed.",
                    )
                continue

            # Merge upstream outputs into step input
            step_context = dict(context)
            upstream_received: dict[str, Any] = {}
            for dep_alias in step.depends_on:
                if dep_alias in step_outputs:
                    step_context.update(step_outputs[dep_alias])
                    upstream_received[dep_alias] = step_outputs[dep_alias]

            # Apply step-specific config overrides
            step_context.update(step.config)

            # Execute
            result = self._execute_step(step, step_context)
            result.upstream_data_received = upstream_received
            results.append(result)

            # Emit observation into CognitiveFabric if present
            if fabric is not None:
                fabric.on_step_complete(
                    chain_name=self.name,
                    step_alias=step.alias,
                    skill_name=step.skill_name,
                    status=result.status,
                    output=result.output,
                    duration_ms=result.duration_ms,
                    error=result.error,
                )

            if result.status == "failed":
                failed_aliases.add(step.alias)
                if fail_fast:
                    break
            else:
                step_outputs[step.alias] = result.output

        elapsed = (time.perf_counter() - t0) * 1000
        chain_result = ChainResult(
            chain_name=self.name,
            steps=results,
            success=all(r.status == "completed" for r in results),
            final_output=self._merge_outputs(step_outputs),
            total_duration_ms=elapsed,
        )

        # Emit chain-level inference into CognitiveFabric
        if fabric is not None:
            fabric.on_chain_complete(
                chain_name=self.name,
                success=chain_result.success,
                total_duration_ms=elapsed,
                step_count=len(results),
            )

        return chain_result

    # -- Serialisation ------------------------------------------------------

    def to_dict(self) -> dict[str, Any]:
        """Serialise the chain definition to a plain dict."""
        return {
            "name": self.name,
            "description": self.description,
            "steps": [
                {
                    "skill_name": s.skill_name,
                    "alias": s.alias,
                    "depends_on": s.depends_on,
                    "config": s.config,
                    "phase_filter": s.phase_filter,
                }
                for s in self._steps
            ],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SkillChain":
        """Deserialise a chain definition from a plain dict."""
        chain = cls(
            name=data.get("name", "unnamed"),
            description=data.get("description", ""),
        )
        for s in data.get("steps", []):
            chain.add(
                skill_name=s["skill_name"],
                alias=s.get("alias"),
                depends_on=s.get("depends_on"),
                config=s.get("config"),
                phase_filter=s.get("phase_filter"),
            )
        return chain

    def save(self, path: Path) -> None:
        """Save the chain definition as JSON."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(self.to_dict(), indent=2),
            encoding="utf-8",
        )

    @classmethod
    def load(cls, path: Path) -> "SkillChain":
        """Load a chain definition from a JSON file."""
        path = Path(path)
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_dict(data)

    # -- Composite skill export ---------------------------------------------

    def to_skillpack(self, output_dir: Path) -> Path:
        """Export the chain as a publishable ``.skillpack`` directory.

        The generated skillpack contains:
        - ``manifest.json`` with a ``composition`` field listing sub-skills
        - ``skill.md`` describing the chain
        - ``chain.json`` with the full chain definition

        Returns the path to the generated skillpack directory.
        """
        output_dir = Path(output_dir)
        pack_dir = output_dir / f"{self.name}.skillpack"
        pack_dir.mkdir(parents=True, exist_ok=True)

        # manifest.json
        manifest = {
            "name": self.name,
            "version": "1.0.0",
            "type": "composite",
            "description": self.description,
            "composition": [s.skill_name for s in self._steps],
            "execution_order": [s.alias for s in self._topological_sort()],
        }
        (pack_dir / "manifest.json").write_text(
            json.dumps(manifest, indent=2), encoding="utf-8",
        )

        # chain.json
        (pack_dir / "chain.json").write_text(
            json.dumps(self.to_dict(), indent=2), encoding="utf-8",
        )

        # skill.md
        md_lines = [
            f"# {self.name}",
            "",
            self.description or "Composite skill chain.",
            "",
            "## Pipeline",
            "",
        ]
        for step in self._steps:
            deps = ", ".join(step.depends_on) if step.depends_on else "(start)"
            md_lines.append(f"- **{step.alias}** (`{step.skill_name}`) <- {deps}")
        md_lines.append("")
        md_lines.append("## Execution")
        md_lines.append("")
        md_lines.append("This skill executes the above pipeline in topological order,")
        md_lines.append("passing output from each step as input to its dependents.")
        (pack_dir / "skill.md").write_text("\n".join(md_lines), encoding="utf-8")

        return pack_dir

    # -- Visualisation ------------------------------------------------------

    def visualize(self) -> str:
        """Return an ASCII visualisation of the chain DAG."""
        if not self._steps:
            return f"{self.name}\n  (empty chain)"

        lines = [self.name]

        # Build adjacency: alias -> list of downstream aliases
        downstream: dict[str, list[str]] = {s.alias: [] for s in self._steps}
        for step in self._steps:
            for dep in step.depends_on:
                if dep in downstream:
                    downstream[dep].append(step.alias)

        # Find roots (no dependencies)
        roots = [s.alias for s in self._steps if not s.depends_on]
        if not roots:
            roots = [self._steps[0].alias]

        visited: set[str] = set()

        def _render(alias: str, prefix: str, is_last: bool) -> None:
            if alias in visited:
                return
            visited.add(alias)
            step = self._alias_index[alias]
            connector = "└── " if is_last else "├── "
            lines.append(f"{prefix}{connector}{step.alias} ({step.skill_name})")
            child_prefix = prefix + ("    " if is_last else "│   ")
            children = downstream.get(alias, [])
            for i, child in enumerate(children):
                _render(child, child_prefix, i == len(children) - 1)

        for i, root in enumerate(roots):
            _render(root, "", i == len(roots) - 1)

        # Render any nodes not yet visited (disconnected)
        for step in self._steps:
            if step.alias not in visited:
                _render(step.alias, "", True)

        return "\n".join(lines)

    # -- Internal -----------------------------------------------------------

    def _topological_sort(self) -> list[SkillStep]:
        """Kahn's algorithm. Raises on cycles."""
        in_degree: dict[str, int] = {s.alias: 0 for s in self._steps}
        adj: dict[str, list[str]] = {s.alias: [] for s in self._steps}

        for step in self._steps:
            for dep in step.depends_on:
                if dep in adj:
                    adj[dep].append(step.alias)
                    in_degree[step.alias] += 1

        queue: deque[str] = deque(
            alias for alias, deg in in_degree.items() if deg == 0
        )
        order: list[str] = []

        while queue:
            alias = queue.popleft()
            order.append(alias)
            for child in adj.get(alias, []):
                in_degree[child] -= 1
                if in_degree[child] == 0:
                    queue.append(child)

        if len(order) != len(self._steps):
            # Find the cycle for error message
            remaining = [s.alias for s in self._steps if s.alias not in order]
            raise SkillChainError(
                f"Circular dependency detected among: {' -> '.join(remaining)}"
            )

        return [self._alias_index[a] for a in order]

    def _detect_cycle(self) -> list[str] | None:
        """Return cycle path if one exists, else None."""
        try:
            self._topological_sort()
            return None
        except SkillChainError:
            # Find cycle via DFS
            WHITE, GRAY, BLACK = 0, 1, 2
            color: dict[str, int] = {s.alias: WHITE for s in self._steps}
            parent: dict[str, str | None] = {s.alias: None for s in self._steps}
            adj: dict[str, list[str]] = {s.alias: [] for s in self._steps}
            for step in self._steps:
                for dep in step.depends_on:
                    if dep in adj:
                        adj[dep].append(step.alias)

            cycle_path: list[str] = []

            def dfs(node: str) -> bool:
                color[node] = GRAY
                for child in adj.get(node, []):
                    if color.get(child) == GRAY:
                        # Found cycle
                        cycle_path.append(child)
                        cycle_path.append(node)
                        cycle_path.append(child)
                        return True
                    if color.get(child) == WHITE:
                        parent[child] = node
                        if dfs(child):
                            return True
                color[node] = BLACK
                return False

            for alias in color:
                if color[alias] == WHITE:
                    if dfs(alias):
                        return cycle_path

            return ["(unknown cycle)"]

    def _execute_step(
        self,
        step: SkillStep,
        context: dict[str, Any],
    ) -> StepResult:
        """Execute a single step."""
        t0 = time.perf_counter()

        if self._executor:
            try:
                output = self._executor.run(step, context)
                elapsed = (time.perf_counter() - t0) * 1000
                return StepResult(
                    skill_name=step.skill_name,
                    alias=step.alias,
                    status="completed",
                    output=output,
                    duration_ms=elapsed,
                )
            except Exception as exc:
                elapsed = (time.perf_counter() - t0) * 1000
                return StepResult(
                    skill_name=step.skill_name,
                    alias=step.alias,
                    status="failed",
                    error=str(exc),
                    duration_ms=elapsed,
                )

        # Default executor: simulate by echoing context through
        elapsed = (time.perf_counter() - t0) * 1000
        return StepResult(
            skill_name=step.skill_name,
            alias=step.alias,
            status="completed",
            output={"skill": step.skill_name, "processed": True, **context},
            duration_ms=elapsed,
        )

    @staticmethod
    def _merge_outputs(step_outputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
        """Merge all step outputs into a single dict.

        Later steps overwrite earlier ones on key conflicts. Each step's
        output is also available under its alias key.
        """
        merged: dict[str, Any] = {}
        for alias, output in step_outputs.items():
            merged.update(output)
            merged[alias] = output
        return merged


# ---------------------------------------------------------------------------
# Step executor protocol
# ---------------------------------------------------------------------------

class _StepExecutor:
    """Protocol for custom step executors (used in testing and custom runtimes)."""

    def run(self, step: SkillStep, context: dict[str, Any]) -> dict[str, Any]:
        """Execute a step and return its output dict."""
        raise NotImplementedError
