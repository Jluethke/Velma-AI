"""
SkillChain MCP Server
=====================

Serves installed skills as MCP tools and resources.
Claude Code connects to this server and can:
- List available skills
- Read skill content (as resources)
- Execute skill phases (as tools)
- Access skill state (persistent data)
- Discover and import new skills
- Run skill chains

Start with: skillchain mcp serve
Claude Code config: add to ~/.claude/settings.json
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict
from pathlib import Path
from typing import Any, Optional

from mcp.server.fastmcp import FastMCP

from .config import MCP_SERVER_NAME, MCP_SERVER_VERSION

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_SKILLS_DIR_CLAUDE = Path.home() / ".claude" / "skills"
_SKILLS_DIR_SC = Path.home() / ".skillchain" / "skills"
_MARKETPLACE_DIR = Path(__file__).resolve().parent.parent.parent / "marketplace"
_CHAINS_DIR = _MARKETPLACE_DIR / "chains"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _installed_skills() -> dict[str, Path]:
    """Return {name: path} of all installed skills across known directories."""
    skills: dict[str, Path] = {}
    for d in (_SKILLS_DIR_CLAUDE, _SKILLS_DIR_SC):
        if d.exists():
            for f in d.iterdir():
                if f.suffix == ".md" and f.is_file():
                    skills[f.stem] = f
    # Also check marketplace directories (each has a skill.md)
    if _MARKETPLACE_DIR.exists():
        for d in _MARKETPLACE_DIR.iterdir():
            if d.is_dir() and (d / "skill.md").exists():
                skills[d.name] = d / "skill.md"
    return skills


def _load_manifest(skill_name: str) -> dict[str, Any]:
    """Load a skill's manifest.json if it exists."""
    # Check marketplace first
    mkt = _MARKETPLACE_DIR / skill_name / "manifest.json"
    if mkt.exists():
        try:
            return json.loads(mkt.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {"name": skill_name}


def _available_chains() -> list[dict[str, Any]]:
    """List all chain definitions from marketplace/chains/."""
    chains: list[dict[str, Any]] = []
    if _CHAINS_DIR.exists():
        for f in sorted(_CHAINS_DIR.glob("*.chain.json")):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                chains.append(data)
            except (json.JSONDecodeError, OSError):
                continue
    return chains


# ---------------------------------------------------------------------------
# In-memory run tracking (keyed by run_id)
# ---------------------------------------------------------------------------

_active_runs: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Server factory
# ---------------------------------------------------------------------------

def create_server() -> FastMCP:
    """Create and configure the SkillChain MCP server."""
    from ..skill_state import SkillStateStore
    from ..user_profile import ProfileManager
    from ..agent_social import SocialManager
    from ..skill_chain import SkillChain

    server = FastMCP(MCP_SERVER_NAME)

    store = SkillStateStore()
    profile_mgr = ProfileManager()
    social_mgr = SocialManager()

    # ===================================================================
    # RESOURCES
    # ===================================================================

    @server.resource("skill://{skill_name}")
    def read_skill(skill_name: str) -> str:
        """Read the full skill.md content for an installed skill."""
        skills = _installed_skills()
        path = skills.get(skill_name)
        if path and path.exists():
            return path.read_text(encoding="utf-8")
        return f"Skill '{skill_name}' not found."

    @server.resource("skill://{skill_name}/state")
    def read_skill_state(skill_name: str) -> str:
        """Read the current persistent state for a skill."""
        state = store.get_state(skill_name)
        return json.dumps({
            "skill_name": state.skill_name,
            "run_count": state.run_count,
            "first_run": state.first_run,
            "last_run_at": state.last_run_at,
            "accumulated_data": state.accumulated_data,
        }, indent=2, default=str)

    @server.resource("skill://{skill_name}/manifest")
    def read_skill_manifest(skill_name: str) -> str:
        """Read the manifest.json for a skill."""
        manifest = _load_manifest(skill_name)
        return json.dumps(manifest, indent=2)

    @server.resource("profile://me")
    def read_profile() -> str:
        """Read the user's SkillChain profile."""
        profile = profile_mgr.load()
        return json.dumps(asdict(profile), indent=2, default=str)

    @server.resource("chain://{chain_name}")
    def read_chain(chain_name: str) -> str:
        """Read a chain definition by name."""
        for chain_data in _available_chains():
            if chain_data.get("name") == chain_name:
                return json.dumps(chain_data, indent=2)
        return f"Chain '{chain_name}' not found."

    @server.resource("catalog://skills")
    def read_catalog() -> str:
        """Full catalog of available skills (installed + marketplace)."""
        installed = _installed_skills()
        catalog: list[dict[str, Any]] = []
        for name, path in sorted(installed.items()):
            manifest = _load_manifest(name)
            catalog.append({
                "name": name,
                "installed": True,
                "path": str(path),
                "domain": manifest.get("domain", "general"),
                "tags": manifest.get("tags", []),
                "execution_pattern": manifest.get("execution_pattern", ""),
                "description": manifest.get("description", ""),
            })
        return json.dumps(catalog, indent=2)

    # ===================================================================
    # TOOLS
    # ===================================================================

    @server.tool()
    def list_skills() -> str:
        """List all installed skills with their execution patterns and descriptions."""
        installed = _installed_skills()
        results: list[dict[str, Any]] = []
        for name in sorted(installed.keys()):
            manifest = _load_manifest(name)
            results.append({
                "name": name,
                "domain": manifest.get("domain", "general"),
                "execution_pattern": manifest.get("execution_pattern", ""),
                "description": manifest.get("description", ""),
                "tags": manifest.get("tags", []),
            })
        return json.dumps(results, indent=2)

    @server.tool()
    def get_skill(skill_name: str) -> str:
        """Get the full content of an installed skill."""
        skills = _installed_skills()
        path = skills.get(skill_name)
        if path and path.exists():
            return path.read_text(encoding="utf-8")
        return f"Skill '{skill_name}' not found. Use list_skills() to see available skills."

    @server.tool()
    def start_skill_run(skill_name: str, execution_pattern: str = "orpa") -> str:
        """Start a tracked execution of a skill. Returns a run_id for tracking phases."""
        run = store.start_run(skill_name, execution_pattern)
        run_id = uuid.uuid4().hex[:16]
        _active_runs[run_id] = run
        return json.dumps({
            "run_id": run_id,
            "skill_name": skill_name,
            "execution_pattern": execution_pattern,
            "started_at": run.started_at,
            "status": "in_progress",
        }, indent=2)

    @server.tool()
    def record_phase(run_id: str, phase: str, status: str, output: str = "{}") -> str:
        """Record completion of a skill phase. Called after each execution phase.

        Args:
            run_id: The run ID returned by start_skill_run.
            phase: Phase name (e.g. 'observe', 'reflect', 'plan', 'act').
            status: Phase status ('completed', 'failed', 'skipped').
            output: JSON string of phase output data.
        """
        run = _active_runs.get(run_id)
        if not run:
            return json.dumps({"error": f"Run '{run_id}' not found. Start a run first."})
        try:
            output_data = json.loads(output) if isinstance(output, str) else output
        except json.JSONDecodeError:
            output_data = {"raw": output}
        result = store.record_phase(run, phase, status, output_data)
        return json.dumps({
            "run_id": run_id,
            "phase": phase,
            "status": status,
            "timestamp": result.timestamp,
            "total_phases": len(run.phases),
        }, indent=2)

    @server.tool()
    def complete_skill_run(run_id: str, status: str = "completed") -> str:
        """Mark a skill run as complete. Archives to history."""
        run = _active_runs.get(run_id)
        if not run:
            return json.dumps({"error": f"Run '{run_id}' not found."})
        store.complete_run(run, status=status)
        # Update profile usage
        try:
            profile_mgr.update_usage(run.skill_name)
        except Exception:
            pass
        # Clean up active run
        _active_runs.pop(run_id, None)
        return json.dumps({
            "run_id": run_id,
            "skill_name": run.skill_name,
            "status": status,
            "completed_at": run.completed_at,
            "phases_completed": len(run.phases),
        }, indent=2)

    @server.tool()
    def save_skill_data(skill_name: str, key: str, data: str = "{}") -> str:
        """Save persistent data for a skill (survives between runs).

        Args:
            skill_name: Name of the skill.
            key: Data key (e.g. 'analysis', 'inventory', 'config').
            data: JSON string of data to persist.
        """
        try:
            data_obj = json.loads(data) if isinstance(data, str) else data
        except json.JSONDecodeError:
            data_obj = {"raw": data}
        store.save_data(skill_name, key, data_obj)
        return json.dumps({
            "skill_name": skill_name,
            "key": key,
            "saved": True,
        })

    @server.tool()
    def load_skill_data(skill_name: str, key: str) -> str:
        """Load persistent data from a previous skill run."""
        result = store.load_data(skill_name, key)
        if result is None:
            return json.dumps({"skill_name": skill_name, "key": key, "found": False, "data": None})
        return json.dumps({"skill_name": skill_name, "key": key, "found": True, "data": result}, default=str)

    @server.tool()
    def get_skill_history(skill_name: str, limit: int = 5) -> str:
        """Get recent execution history for a skill."""
        history = store.get_run_history(skill_name, limit=limit)
        return json.dumps({"skill_name": skill_name, "runs": history, "count": len(history)}, indent=2, default=str)

    @server.tool()
    def discover_skills(domain: str = "", max_results: int = 10) -> str:
        """Search for skills in the SkillChain marketplace by domain.

        Returns skills from the local marketplace catalog. For on-chain
        discovery, use the full SkillChain CLI.
        """
        installed = _installed_skills()
        results: list[dict[str, Any]] = []
        for name in sorted(installed.keys()):
            manifest = _load_manifest(name)
            skill_domain = manifest.get("domain", "general")
            if domain and domain.lower() not in skill_domain.lower() and domain.lower() not in name.lower():
                # Also check tags
                tags = [t.lower() for t in manifest.get("tags", [])]
                if not any(domain.lower() in t for t in tags):
                    continue
            results.append({
                "name": name,
                "domain": skill_domain,
                "description": manifest.get("description", ""),
                "tags": manifest.get("tags", []),
                "execution_pattern": manifest.get("execution_pattern", ""),
            })
            if len(results) >= max_results:
                break
        return json.dumps(results, indent=2)

    @server.tool()
    def import_skill(skill_name: str) -> str:
        """Import a skill from the marketplace into ~/.claude/skills/.

        Copies the skill.md from marketplace to the Claude skills directory.
        """
        # Sanitize skill_name to prevent path traversal
        safe_name = skill_name.replace("/", "").replace("\\", "").replace("\0", "")
        while ".." in safe_name:
            safe_name = safe_name.replace("..", "")
        safe_name = safe_name.lstrip(".")
        if not safe_name:
            return json.dumps({"error": "Invalid skill name."})
        source = _MARKETPLACE_DIR / safe_name / "skill.md"
        if not source.exists():
            return json.dumps({"error": f"Skill '{skill_name}' not found in marketplace."})
        dest_dir = _SKILLS_DIR_CLAUDE
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{safe_name}.md"
        dest.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
        return json.dumps({
            "skill_name": skill_name,
            "installed_to": str(dest),
            "success": True,
        })

    @server.tool()
    def get_profile() -> str:
        """Get the user's SkillChain profile (role, goals, tech stack, etc.)."""
        profile = profile_mgr.load()
        return json.dumps(asdict(profile), indent=2, default=str)

    @server.tool()
    def get_recommendations() -> str:
        """Get personalized skill and chain recommendations based on the user's profile."""
        installed = list(_installed_skills().keys())
        skill_recs = profile_mgr.suggest_skills(installed_skills=installed)
        chain_recs = profile_mgr.suggest_chains()
        return json.dumps({
            "skill_recommendations": [asdict(r) for r in skill_recs[:15]],
            "chain_recommendations": [asdict(r) for r in chain_recs],
        }, indent=2)

    @server.tool()
    def run_chain(chain_name: str, initial_context: str = "{}") -> str:
        """Execute a skill chain by name. Returns results from all steps.

        Args:
            chain_name: Name of the chain to run (e.g. 'startup-validation').
            initial_context: JSON string of initial context data.
        """
        # Find the chain definition
        chain_data = None
        for cd in _available_chains():
            if cd.get("name") == chain_name:
                chain_data = cd
                break
        if not chain_data:
            return json.dumps({"error": f"Chain '{chain_name}' not found."})

        try:
            ctx = json.loads(initial_context) if isinstance(initial_context, str) else initial_context
        except json.JSONDecodeError:
            ctx = {}

        chain_obj = SkillChain.from_dict(chain_data)
        result = chain_obj.execute(initial_context=ctx, fail_fast=False)

        # Track chain usage
        try:
            profile_mgr.update_chain_usage(chain_name)
        except Exception:
            pass

        return json.dumps(asdict(result), indent=2, default=str)

    @server.tool()
    def list_chains() -> str:
        """List all available pre-built skill chains."""
        chains = _available_chains()
        summaries = []
        for c in chains:
            summaries.append({
                "name": c.get("name", ""),
                "description": c.get("description", ""),
                "category": c.get("category", ""),
                "steps": len(c.get("steps", [])),
                "skills": [s.get("skill_name", "") for s in c.get("steps", [])],
            })
        return json.dumps(summaries, indent=2)

    @server.tool()
    def list_bounties(domain: str = "") -> str:
        """List open skill bounties on the network."""
        bounties = social_mgr.list_bounties(domain=domain or None)
        return json.dumps([asdict(b) for b in bounties], indent=2, default=str)

    @server.tool()
    def get_matches() -> str:
        """Find agents that complement your profile and skills."""
        matches = social_mgr.find_matches()
        return json.dumps([asdict(m) for m in matches[:10]], indent=2, default=str)

    # ===================================================================
    # PROMPTS
    # ===================================================================

    @server.prompt()
    def skill_execution_prompt(skill_name: str) -> str:
        """Generate a prompt that guides Claude through executing a specific skill."""
        skills = _installed_skills()
        path = skills.get(skill_name)
        if not path or not path.exists():
            return f"Skill '{skill_name}' not found. Use list_skills() to see available skills."

        skill_content = path.read_text(encoding="utf-8")
        manifest = _load_manifest(skill_name)
        state = store.get_state(skill_name)
        pattern = manifest.get("execution_pattern", "orpa")

        # Build state summary
        state_lines: list[str] = []
        if state.run_count > 0:
            state_lines.append(f"- Previously run {state.run_count} time(s), last at {state.last_run_at}")
            if state.accumulated_data:
                keys = list(state.accumulated_data.keys())
                state_lines.append(f"- Stored data keys: {', '.join(keys)}")
            if state.last_run and state.last_run.phases:
                phases_done = [p.phase for p in state.last_run.phases]
                state_lines.append(f"- Last phases completed: {', '.join(phases_done)}")
        else:
            state_lines.append("- First time running this skill. No previous state.")

        state_summary = "\n".join(state_lines)

        return f"""You are executing the '{skill_name}' skill.

## Execution Pattern: {pattern.upper()}

{_pattern_instructions(pattern)}

## Skill Content

{skill_content}

## Previous State

{state_summary}

## Instructions

1. Use `start_skill_run("{skill_name}", "{pattern}")` to begin tracked execution.
2. Execute each phase according to the {pattern} pattern.
3. After completing each phase, call `record_phase(run_id, phase_name, "completed", output_json)`.
4. Use `save_skill_data("{skill_name}", key, data_json)` to persist important results.
5. When all phases are done, call `complete_skill_run(run_id)`.
6. If you loaded previous data, reference it to provide continuity.
"""

    @server.prompt()
    def chain_execution_prompt(chain_name: str) -> str:
        """Generate a prompt for executing a full skill chain."""
        chain_data = None
        for cd in _available_chains():
            if cd.get("name") == chain_name:
                chain_data = cd
                break
        if not chain_data:
            return f"Chain '{chain_name}' not found. Use list_chains() to see available chains."

        steps = chain_data.get("steps", [])
        step_desc = "\n".join(
            f"  {i+1}. **{s.get('alias', s['skill_name'])}** (`{s['skill_name']}`) "
            f"{'<- ' + ', '.join(s.get('depends_on', [])) if s.get('depends_on') else '(start)'}"
            for i, s in enumerate(steps)
        )

        return f"""You are executing the '{chain_name}' skill chain.

## Description
{chain_data.get('description', 'No description.')}

## Pipeline Steps
{step_desc}

## Instructions

Execute each skill in order. For each skill:
1. Call `start_skill_run(skill_name, pattern)` to track it.
2. Read the skill content with `get_skill(skill_name)`.
3. Execute the skill phases, calling `record_phase()` after each.
4. Save key outputs with `save_skill_data()`.
5. Call `complete_skill_run(run_id)`.
6. Pass outputs from earlier skills as context to later ones.

The chain flows top-to-bottom. Each step receives outputs from its dependencies.
"""

    return server


# ---------------------------------------------------------------------------
# Pattern instruction helper
# ---------------------------------------------------------------------------

def _pattern_instructions(pattern: str) -> str:
    """Return execution instructions for a given pattern."""
    if pattern == "orpa":
        return """**ORPA Cycle (Observe-Reflect-Plan-Act):**
- **Observe**: Gather information, read inputs, scan context
- **Reflect**: Analyze what you found, identify patterns and gaps
- **Plan**: Formulate a strategy based on observations and reflection
- **Act**: Execute the plan, generate outputs, deliver results"""
    elif pattern == "phase_pipeline":
        return """**Phase Pipeline:**
Execute each phase defined in the skill sequentially. Each phase has specific
inputs and outputs. Complete one phase before moving to the next."""
    else:
        return f"Execute according to the '{pattern}' pattern defined in the skill."
