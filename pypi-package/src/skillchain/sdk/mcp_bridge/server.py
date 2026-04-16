"""
FlowFabric MCP Server
=====================

Serves installed skills and flow pipelines as MCP tools and resources.
Claude Code connects to this server and can:
- List available skills
- Read skill content (as resources)
- Execute skill phases (as tools)
- Access skill state (persistent data)
- Discover and import new skills
- Run flow pipelines

Start with: skillchain mcp serve
Claude Code config: add to ~/.claude/settings.json
"""

from __future__ import annotations

import importlib
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
# Hot-reload helper
# ---------------------------------------------------------------------------

def _hot_import(module_path: str):
    """Import a module, reloading it if already loaded.

    Allows code changes to sdk modules (chain_miner, gamification, etc.)
    to take effect without restarting the MCP server process.
    """
    import sys as _sys
    if module_path in _sys.modules:
        return importlib.reload(_sys.modules[module_path])
    return importlib.import_module(module_path)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

import re as _re


def _parse_skill_inputs(skill_md: str) -> tuple[list[dict], list[dict]]:
    """Parse ## Inputs section from skill.md. Returns (required, optional) lists.

    Handles two formats:
      - field_name: type -- description
      - `field_name`: type -- description  (backtick variant)
    Optional markers: "(Optional)" or "(optional)" anywhere in the description.
    """
    required: list[dict] = []
    optional: list[dict] = []
    section = _re.search(r"## Inputs\n([\s\S]*?)(?=\n## |\n---)", skill_md)
    if not section:
        return required, optional
    for line in section.group(1).splitlines():
        m = _re.match(r"^-\s+`?(\w[\w-]*)`?:\s+\S\S*\s+--\s+(.+)", line)
        if not m:
            continue
        name, desc = m.group(1), m.group(2)
        if _re.search(r"\(optional\)", desc, _re.IGNORECASE):
            optional.append({"name": name, "desc": _re.sub(r"\(optional\)\s*", "", desc, flags=_re.IGNORECASE).strip()})
        else:
            required.append({"name": name, "desc": desc})
    return required, optional


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
    def list_flows() -> str:
        """List all available FlowFabric flows with their domains and descriptions."""
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
    def get_flow(flow_name: str) -> str:
        """Get the full definition of a FlowFabric flow."""
        skills = _installed_skills()
        path = skills.get(flow_name)
        if path and path.exists():
            return path.read_text(encoding="utf-8")
        return f"Flow '{flow_name}' not found. Use list_flows() to see available flows."

    @server.tool()
    def check_access(skill_name: str = "", flow_name: str = "") -> str:
        """Check if the user has access to a skill or flow pipeline.

        Returns the user's access tier (free, holder, staker) and whether
        the requested skill/flow is accessible.

        Args:
            skill_name: Skill to check (optional)
            flow_name: Flow pipeline to check (optional)
        """
        from ..connectors.gate import get_gate
        gate = get_gate()
        result = gate.check()
        allowed = True
        if skill_name:
            allowed = gate.is_skill_allowed(skill_name)
        elif flow_name:
            allowed = gate.is_chain_allowed(flow_name)
        return json.dumps({
            "tier": result.tier,
            "wallet": result.wallet,
            "balance": result.balance,
            "allowed": allowed,
            "error": result.error,
        }, indent=2, default=str)

    @server.tool()
    def start_flow_run(flow_name: str, execution_pattern: str = "orpa") -> str:
        """Start a tracked execution of a FlowFabric flow. Returns a run_id for tracking phases."""
        # Gate check: premium flows require TRUST tokens
        from ..connectors.gate import get_gate, FREE_SKILLS
        gate = get_gate()
        manifest = _load_manifest(flow_name)
        domain = manifest.get("domain", "")
        if not gate.is_skill_allowed(flow_name, domain):
            result = gate.check()
            return json.dumps({
                "error": "premium_flow",
                "message": (
                    f"'{flow_name}' (domain: {domain or 'unknown'}) requires a higher TRUST tier. "
                    f"Current tier: {result.tier}. "
                    "Set SKILLCHAIN_TIER=creator (or builder) in your MCP env, "
                    "or add trust_tier to ~/.skillchain/config.json and restart the server."
                ),
                "tier": result.tier,
                "wallet": result.wallet,
                "free_flows": sorted(list(FREE_SKILLS)),
            }, indent=2)
        run = store.start_run(flow_name, execution_pattern)
        run_id = uuid.uuid4().hex[:16]
        _active_runs[run_id] = run
        return json.dumps({
            "run_id": run_id,
            "flow_name": flow_name,
            "execution_pattern": execution_pattern,
            "started_at": run.started_at,
            "status": "in_progress",
        }, indent=2)

    @server.tool()
    def record_phase(run_id: str, phase: str, status: str, output: str = "{}") -> str:
        """Record completion of a flow execution phase. Called after each phase.

        Args:
            run_id: The run ID returned by start_flow_run.
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
    def complete_flow_run(run_id: str, status: str = "completed") -> str:
        """Mark a flow run as complete. Archives to history."""
        run = _active_runs.get(run_id)
        if not run:
            return json.dumps({"error": f"Run '{run_id}' not found."})
        store.complete_run(run, status=status)
        # Update profile usage
        try:
            profile_mgr.update_usage(run.skill_name)
        except Exception:
            pass
        # Update gamification
        try:
            from ..gamification import GamificationEngine
            gam = GamificationEngine()
            new_state = store.get_state(run.skill_name)
            gam.record_skill_run(run.skill_name, new_state.run_count)
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
    def save_flow_data(flow_name: str, key: str, data: str = "{}") -> str:
        """Save persistent data for a flow (survives between runs).

        Args:
            flow_name: Name of the flow.
            key: Data key (e.g. 'analysis', 'inventory', 'config').
            data: JSON string of data to persist.
        """
        try:
            data_obj = json.loads(data) if isinstance(data, str) else data
        except json.JSONDecodeError:
            data_obj = {"raw": data}
        store.save_data(flow_name, key, data_obj)
        return json.dumps({
            "flow_name": flow_name,
            "key": key,
            "saved": True,
        })

    @server.tool()
    def load_flow_data(flow_name: str, key: str) -> str:
        """Load persistent data from a previous flow run."""
        result = store.load_data(flow_name, key)
        if result is None:
            return json.dumps({"flow_name": flow_name, "key": key, "found": False, "data": None})
        return json.dumps({"flow_name": flow_name, "key": key, "found": True, "data": result}, default=str)

    @server.tool()
    def get_flow_history(flow_name: str, limit: int = 5) -> str:
        """Get recent execution history for a flow."""
        history = store.get_run_history(flow_name, limit=limit)
        return json.dumps({"flow_name": flow_name, "runs": history, "count": len(history)}, indent=2, default=str)

    @server.tool()
    def discover_flows(domain: str = "", max_results: int = 10) -> str:
        """Search for FlowFabric flows in the marketplace by domain.

        Returns flows from the local marketplace catalog.
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
    def import_flow(flow_name: str) -> str:
        """Import a flow from the FlowFabric marketplace into ~/.claude/skills/.

        Copies the flow definition from marketplace to the local skills directory.
        """
        # Sanitize flow_name to prevent path traversal
        safe_name = flow_name.replace("/", "").replace("\\", "").replace("\0", "")
        while ".." in safe_name:
            safe_name = safe_name.replace("..", "")
        safe_name = safe_name.lstrip(".")
        if not safe_name:
            return json.dumps({"error": "Invalid flow name."})
        source = _MARKETPLACE_DIR / safe_name / "skill.md"
        if not source.exists():
            return json.dumps({"error": f"Flow '{flow_name}' not found in marketplace."})
        dest_dir = _SKILLS_DIR_CLAUDE
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{safe_name}.md"
        dest.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
        return json.dumps({
            "flow_name": flow_name,
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
    def run_flow_pipeline(flow_name: str, initial_context: str = "{}") -> str:
        """Execute a multi-step FlowFabric flow pipeline by name.

        Args:
            flow_name: Name of the flow pipeline to run (e.g. 'job-search-blitz').
            initial_context: JSON string of initial context data.

        Prefer run_flow_step for human-in-the-loop step-by-step execution.
        """
        chain_name = flow_name  # internal alias
        # Gate check: premium flows require TRUST tokens
        from ..connectors.gate import get_gate, FREE_CHAINS
        gate = get_gate()
        manifest = _load_manifest(chain_name)
        domain = manifest.get("domain", "")
        if not gate.is_chain_allowed(chain_name, domain):
            result = gate.check()
            return json.dumps({
                "error": "premium_flow",
                "message": (
                    f"'{flow_name}' (domain: {domain or 'unknown'}) requires a higher TRUST tier. "
                    f"Current tier: {result.tier}. "
                    "Set SKILLCHAIN_TIER=creator (or builder) in your MCP env, "
                    "or add trust_tier to ~/.skillchain/config.json and restart the server."
                ),
                "tier": result.tier,
                "wallet": result.wallet,
                "free_flows": sorted(list(FREE_CHAINS)),
            }, indent=2)

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

        # Wire LLM executor for real skill execution
        try:
            from ..llm_executor import LLMStepExecutor

            def _resolve_from_server(skill_name: str):
                """Resolve skill.md using the server's marketplace path."""
                skills = _installed_skills()
                path = skills.get(skill_name)
                if path and path.exists():
                    return path.read_text(encoding="utf-8")
                return None

            chain_obj.set_executor(LLMStepExecutor(skill_resolver=_resolve_from_server))
        except Exception as exc:
            logger.warning("LLM executor not available (%s), using echo mode", exc)

        result = chain_obj.execute(initial_context=ctx, fail_fast=False)

        # Track chain usage + gamification
        try:
            profile_mgr.update_chain_usage(chain_name)
        except Exception:
            pass
        try:
            from ..gamification import GamificationEngine
            gam = GamificationEngine()
            for step in result.steps:
                if step.status == "completed":
                    gam.record_skill_run(step.skill_name)
            if result.success:
                gam.record_chain_run(chain_name, len(result.steps), result.total_duration_ms)
        except Exception:
            pass

        return json.dumps(asdict(result), indent=2, default=str)

    @server.tool()
    def list_flow_pipelines() -> str:
        """List all available multi-step FlowFabric pipelines (flows with multiple steps)."""
        chains = _available_chains()
        summaries = []
        for c in chains:
            summaries.append({
                "name": c.get("name", ""),
                "description": c.get("description", ""),
                "category": c.get("category", ""),
                "step_count": len(c.get("steps", [])),
                "flow_steps": [s.get("skill_name", "") for s in c.get("steps", [])],
            })
        return json.dumps(summaries, indent=2)

    @server.tool()
    def search_flows(query: str, max_results: int = 5) -> str:
        """Search for FlowFabric flows using plain English.

        Describe what you need in your own words and get ranked matches.

        Args:
            query: What you're looking for (e.g., "I'm scared of technology",
                   "help me find a job", "I need to start a business")
            max_results: Maximum number of results to return.
        """
        from ..chain_matcher import ChainMatcher

        chains = _available_chains()
        matcher = ChainMatcher(chains)
        matches = matcher.match(query, top_k=max_results)
        return json.dumps([asdict(m) for m in matches], indent=2, default=str)

    @server.tool()
    def preview_flow(flow_name: str = "", query: str = "") -> str:
        """Preview what a flow pipeline will do — shows each step, skill, and expected output.

        ALWAYS call this before run_flow_pipeline or find_and_run(auto_run=True).
        Show the preview to the user and get explicit approval before executing.

        Args:
            flow_name: Exact flow pipeline name to preview (e.g. 'job-search-blitz').
            query: Natural language query to find the best flow pipeline to preview.
                   Used only when flow_name is not provided.
        """
        chains = _available_chains()

        chain_data = None
        if flow_name:
            for c in chains:
                if c.get("name") == flow_name:
                    chain_data = c
                    break
        elif query:
            from ..chain_matcher import ChainMatcher
            matcher = ChainMatcher(chains)
            matches = matcher.match(query, top_k=1)
            if matches:
                for c in chains:
                    if c.get("name") == matches[0].chain_name:
                        chain_data = c
                        break

        if not chain_data:
            return json.dumps({
                "error": f"Flow '{flow_name or query}' not found.",
                "available": [c.get("name", "") for c in chains[:10]],
            })

        steps = chain_data.get("steps", [])
        step_previews = []
        for i, step in enumerate(steps):
            skill = step.get("skill_name", "")
            manifest = _load_manifest(skill)
            step_previews.append({
                "step": i + 1,
                "flow": skill,
                "alias": step.get("alias", skill),
                "description": manifest.get("description", step.get("description", "")),
                "output_type": manifest.get("output_type", "structured analysis"),
                "depends_on": step.get("depends_on", []),
            })

        return json.dumps({
            "flow_pipeline": chain_data.get("name"),
            "description": chain_data.get("description", ""),
            "category": chain_data.get("category", ""),
            "total_steps": len(steps),
            "steps": step_previews,
            "approval_required": True,
            "instructions": (
                "Show this plan to the user. Ask: 'Ready to run? I'll execute each "
                "flow one at a time and show you the output before continuing.' "
                "If approved, use run_flow_step to execute step by step."
            ),
        }, indent=2)

    @server.tool()
    def run_flow_step(
        flow_name: str,
        step_index: int,
        context: str = "{}",
    ) -> str:
        """Execute a single step of a flow pipeline. Shows output before the next step runs.

        Human-in-the-loop execution: run one step, show the user the output,
        get approval, then call this again with step_index + 1.

        Args:
            flow_name: Name of the flow pipeline (e.g. 'job-search-blitz').
            step_index: Zero-based index of the step to run (0 = first step).
            context: JSON string of accumulated context from previous steps.
        """
        chains = _available_chains()
        chain_data = None
        for c in chains:
            if c.get("name") == flow_name:
                chain_data = c
                break

        if not chain_data:
            return json.dumps({"error": f"Flow '{flow_name}' not found."})

        steps = chain_data.get("steps", [])
        if step_index < 0 or step_index >= len(steps):
            return json.dumps({
                "error": f"step_index {step_index} out of range (flow has {len(steps)} steps).",
                "total_steps": len(steps),
            })

        step = steps[step_index]
        flow_step_name = step.get("skill_name", "")

        try:
            ctx = json.loads(context) if isinstance(context, str) else context
        except json.JSONDecodeError:
            ctx = {}

        # Read the flow definition
        skills = _installed_skills()
        skill_path = skills.get(flow_step_name)
        skill_content = skill_path.read_text(encoding="utf-8") if skill_path and skill_path.exists() else None

        # Parse required/optional inputs from flow definition
        required_inputs, optional_inputs = (
            _parse_skill_inputs(skill_content) if skill_content else ([], [])
        )
        already_provided = list(ctx.keys())
        missing_required = [i for i in required_inputs if i["name"] not in already_provided]

        if missing_required:
            intake_lines = "\n".join(f"  • {i['name']}: {i['desc']}" for i in missing_required)
            opt_lines = ("\n\nAlso ask (optional, improves results):\n" +
                         "\n".join(f"  • {i['name']}: {i['desc']}" for i in optional_inputs)
                         ) if optional_inputs else ""
            intake_block = (
                f"STEP 1 — COLLECT INPUTS FIRST (do not skip):\n"
                f"Ask the user for the following before executing any phases:\n"
                f"{intake_lines}{opt_lines}\n\nSTEP 2 — EXECUTE once inputs are collected:\n"
            )
        else:
            intake_block = ""

        is_last = step_index == len(steps) - 1
        next_step = None if is_last else {
            "step_index": step_index + 1,
            "flow": steps[step_index + 1].get("skill_name", ""),
            "alias": steps[step_index + 1].get("alias", ""),
        }

        continue_msg = (
            "All done! Flow pipeline complete." if is_last
            else (
                f"Step {step_index + 1} complete. Show the full output, then ask: "
                f"'Ready for step {step_index + 2} "
                f"({next_step['flow'] if next_step else ''})?' "
                f"Call run_flow_step with step_index={step_index + 1} to continue."
            )
        )

        return json.dumps({
            "flow_pipeline": flow_name,
            "step": step_index + 1,
            "total_steps": len(steps),
            "flow": flow_step_name,
            "alias": step.get("alias", flow_step_name),
            "required_inputs": required_inputs,
            "optional_inputs": optional_inputs,
            "inputs_already_provided": already_provided,
            "flow_definition": skill_content,
            "context": ctx,
            "is_last_step": is_last,
            "next_step": next_step,
            "instructions": (
                f"{intake_block}Execute the '{flow_step_name}' flow using the flow definition "
                f"and all collected inputs. Show the user the complete output. Then: {continue_msg}"
            ),
        }, indent=2, default=str)

    @server.tool()
    def analyze_directory(
        directory: str,
        max_files: int = 50,
        max_depth: int = 2,
        read_content: bool = True,
    ) -> str:
        """Onboarding: learn about a user by analyzing their documents and files, then recommend personalized FlowFabric flows.

        Say: 'To learn more about you and recommend the right flows, share a folder or files you want me to analyze.'
        Reads documents, detects themes (finance, career, health, business, code), and surfaces the most relevant flows.
        Run this at the start of a new conversation to personalize the experience.

        Args:
            directory: Absolute path to the directory to analyze (e.g. /Users/you/Documents).
            max_files: Maximum number of files to read (default 50).
            max_depth: How deep to scan subdirectories (default 2).
            read_content: Read text file contents for deeper analysis (default True).
        """
        import os

        text_extensions = {
            ".txt", ".md", ".markdown", ".csv", ".json", ".yaml", ".yml",
            ".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".rs",
            ".html", ".htm", ".xml", ".toml", ".ini", ".cfg", ".conf",
            ".sh", ".bat", ".ps1", ".log", ".env",
        }
        doc_extensions = {
            ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt",
            ".odt", ".ods", ".odp", ".rtf",
        }
        stopwords = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "can", "this", "that", "these", "those",
            "i", "you", "we", "they", "it", "he", "she", "my", "your", "our",
            "its", "not", "no", "so", "as", "if", "than", "then", "when", "where",
            "what", "which", "who", "how", "all", "each", "more", "some", "any",
            "also", "just", "very", "get", "use", "used", "using", "make", "made",
            "new", "one", "two", "three", "first", "last", "next", "other",
        }

        if not os.path.isdir(directory):
            return json.dumps({"error": f"Directory not found: {directory}"})

        # Scan files recursively up to max_depth
        def scan_dir(path: str, depth: int = 0) -> list[str]:
            if depth > max_depth:
                return []
            result = []
            try:
                for entry in os.scandir(path):
                    if entry.name.startswith("."):
                        continue
                    if entry.is_dir(follow_symlinks=False) and depth < max_depth:
                        result.extend(scan_dir(entry.path, depth + 1))
                    elif entry.is_file():
                        result.append(entry.path)
            except PermissionError:
                pass
            return result

        all_paths = scan_dir(directory)[:max_files * 3]

        # Build inventory
        inventory = []
        for p in all_paths:
            name = os.path.basename(p)
            ext = ("." + name.rsplit(".", 1)[-1].lower()) if "." in name else ""
            inventory.append({
                "path": p, "name": name, "ext": ext,
                "readable": ext in text_extensions,
                "binary": ext in doc_extensions,
            })

        # Read content
        content_chunks: list[str] = []
        files_read = 0
        files_summary = []

        for f in inventory:
            if files_read >= max_files:
                break
            if f["readable"] and read_content:
                try:
                    raw = Path(f["path"]).read_text(encoding="utf-8", errors="ignore")[:3000]
                    content_chunks.append(f["name"] + " " + raw)
                    files_summary.append({"name": f["name"], "ext": f["ext"],
                                          "excerpt": raw[:120].replace("\n", " ")})
                    files_read += 1
                except OSError:
                    pass
            else:
                content_chunks.append(f["name"].replace(".", " ").replace("_", " ").replace("-", " "))
                files_summary.append({"name": f["name"], "ext": f["ext"]})
                files_read += 1

        # Extract keywords
        all_text = " ".join(content_chunks)
        freq: dict[str, int] = {}
        for word in _re.findall(r"[a-z][a-z'\-]{2,}", all_text.lower()):
            word = word.strip("'")
            if len(word) >= 3 and word not in stopwords:
                freq[word] = freq.get(word, 0) + 1
        top_keywords = [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:40]]

        # Detect domain signals
        ext_counts: dict[str, int] = {}
        for f in inventory:
            ext_counts[f["ext"]] = ext_counts.get(f["ext"], 0) + 1

        domain_signals: list[str] = []
        code_exts = {".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".rb"}
        data_exts = {".csv", ".xlsx", ".xls", ".json"}
        doc_exts = {".pdf", ".docx", ".doc"}

        if any(e in code_exts for e in ext_counts):
            domain_signals.append("code programming software development")
        if any(e in data_exts for e in ext_counts):
            domain_signals.append("data analysis spreadsheet")
        if any(e in doc_exts for e in ext_counts):
            domain_signals.append("documents reports")
        if _re.search(r"invoice|receipt|expense|budget|revenue|profit|loss", all_text, _re.I):
            domain_signals.append("finance budget money")
        if _re.search(r"resume|cv|cover letter|job|hiring|candidate", all_text, _re.I):
            domain_signals.append("resume job career hiring")
        if _re.search(r"marketing|seo|content|social media|campaign|funnel", all_text, _re.I):
            domain_signals.append("marketing content social media")
        if _re.search(r"customer|client|crm|lead|prospect|sales", all_text, _re.I):
            domain_signals.append("customer sales crm")
        if _re.search(r"contract|legal|agreement|terms|compliance|patent", all_text, _re.I):
            domain_signals.append("legal contract compliance")
        if _re.search(r"health|medical|patient|clinical|symptom|medication", all_text, _re.I):
            domain_signals.append("health medical")
        if _re.search(r"research|literature|paper|study|hypothesis|methodology", all_text, _re.I):
            domain_signals.append("research synthesis analysis")

        match_query = " ".join(top_keywords[:20] + domain_signals)

        # Match flows
        from ..chain_matcher import ChainMatcher
        chains = _available_chains()
        matcher = ChainMatcher(chains)
        matches = matcher.match(match_query, top_k=8)

        suggestions = []
        for m in matches[:6]:
            flow_text = (getattr(m, "description", "") + " " + " ".join(getattr(m, "skills", []))).lower()
            trigger_words = [k for k in top_keywords if k in flow_text][:4]
            suggestions.append({
                "flow": m.chain_name,
                "description": getattr(m, "description", ""),
                "category": getattr(m, "category", ""),
                "score": getattr(m, "score", 0),
                "why": (f'Found in your documents: "{", ".join(trigger_words)}"'
                        if trigger_words else getattr(m, "match_reason", "")),
            })

        top_flow = suggestions[0] if suggestions else None
        return json.dumps({
            "onboarding_message": "Here's what I found in your files and the flows I'd recommend based on them.",
            "directory": directory,
            "files_found": len(inventory),
            "files_read": files_read,
            "file_types": ext_counts,
            "detected_themes": domain_signals,
            "top_keywords": top_keywords[:20],
            "recommended_flows": suggestions,
            "files_analyzed": files_summary[:30],
            "next_step": (
                f"I'd suggest starting with '{top_flow['flow']}' — {top_flow['description']}. "
                f"Call preview_flow('{top_flow['flow']}') to see the plan and I'll walk you through it step by step."
                if top_flow else
                "I couldn't find a strong match. Tell me more about what you're working on and I'll find the right flow."
            ),
        }, indent=2, default=str)

    @server.tool()
    def find_and_run(query: str, auto_run: bool = False,
                     initial_context: str = "{}") -> str:
        """Find the best flow pipeline for what you need, and optionally run it.

        This is the main entry point for FlowFabric. Describe what you want
        in plain English and the system finds the right flow pipeline.

        Args:
            query: Plain English description of what you want
                   (e.g., "I need help budgeting and saving money",
                    "I'm starting a side business", "prepare me for a job interview")
            auto_run: If True, automatically execute the best matching flow pipeline.
            initial_context: JSON string of context data to pass to the flow
                             (e.g., '{"name": "Pat", "age": 45}')
        """
        from ..chain_matcher import ChainMatcher

        chains = _available_chains()
        matcher = ChainMatcher(chains)
        matches = matcher.match(query, top_k=5)

        if not matches:
            return json.dumps({"error": "No flow pipelines match your query.", "query": query})

        best = matches[0]
        result_data: dict[str, Any] = {
            "query": query,
            "best_match": asdict(best),
            "other_matches": [asdict(m) for m in matches[1:]],
        }

        if auto_run:
            # Find and execute the best chain
            chain_data = None
            for cd in chains:
                if cd.get("name") == best.chain_name:
                    chain_data = cd
                    break

            if chain_data:
                try:
                    ctx = json.loads(initial_context) if isinstance(initial_context, str) else initial_context
                except json.JSONDecodeError:
                    ctx = {}

                chain_obj = SkillChain.from_dict(chain_data)

                try:
                    from ..llm_executor import LLMStepExecutor

                    def _resolve(skill_name: str):
                        skills = _installed_skills()
                        path = skills.get(skill_name)
                        if path and path.exists():
                            return path.read_text(encoding="utf-8")
                        return None

                    chain_obj.set_executor(LLMStepExecutor(skill_resolver=_resolve))
                except Exception as exc:
                    logger.warning("LLM executor not available (%s)", exc)

                exec_result = chain_obj.execute(initial_context=ctx, fail_fast=False)
                result_data["execution"] = asdict(exec_result)

                try:
                    profile_mgr.update_chain_usage(best.chain_name)
                except Exception:
                    pass

        return json.dumps(result_data, indent=2, default=str)

    # ===================================================================
    # GAMIFICATION TOOLS
    # ===================================================================

    @server.tool()
    def get_trainer_profile() -> str:
        """Get your trainer card -- level, XP, streak, collection progress.

        Shows your SkillChain gamification stats: trainer level, XP progress,
        current streak, skills discovered, chains completed, and achievements.
        """
        try:
            mod = _hot_import("skillchain.sdk.gamification")
            engine = mod.GamificationEngine()
            return json.dumps(engine.get_trainer_card(), indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def get_achievements() -> str:
        """List all 30 achievements with locked/unlocked status.

        Achievements are earned by running skills, completing chains,
        maintaining streaks, mastering categories, and evolving skills.
        """
        try:
            mod = _hot_import("skillchain.sdk.gamification")
            engine = mod.GamificationEngine()
            return json.dumps(engine.get_achievements(), indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def get_skilldex() -> str:
        """Show your skill collection progress by category.

        Like a Pokedex but for AI skills. Shows how many of the 95 skills
        you've discovered, broken down by category (Life, Career, Business,
        Health, Developer, etc.).
        """
        try:
            mod = _hot_import("skillchain.sdk.gamification")
            engine = mod.GamificationEngine()
            return json.dumps(engine.get_skilldex(), indent=2, default=str)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def get_daily_quests() -> str:
        """Get today's 3 daily quests with completion status.

        Daily quests refresh each day and give bonus XP when completed.
        """
        try:
            mod = _hot_import("skillchain.sdk.gamification")
            engine = mod.GamificationEngine()
            return json.dumps(engine.get_daily_quests(), indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def mine_chains(mode: str = "scan", prompt: str = "") -> str:
        """Mine for new chain discoveries.

        Two mining modes:
          - "scan" (default): Passive mining. Scans your execution history
            for novel skill combinations that could become new chains.
          - "forge": Active mining. Takes a raw idea/prompt and runs the
            skill-to-chain meta-chain to CREATE a new skill and find which
            chains it fits into — or design new chains around it.

        Forge mode is the 2-phase pipeline:
          Phase 1 (Build): prompt → skill → tests → quality → optimize
          Phase 2 (Place): find chain fits → design new chains

        Anti-farming: 50 TRUST/day cap, diminishing returns, quality gates,
        7-day cooldowns, diversity requirements.

        Args:
            mode: "scan" for passive pattern detection, "forge" for active
                  skill creation + chain placement.
            prompt: Required for forge mode. The raw idea, workflow, or
                    problem statement to forge into a skill.
        """
        try:
            mod = _hot_import("skillchain.sdk.chain_miner")
            miner = mod.ChainMiner()

            if mode == "forge":
                if not prompt:
                    return json.dumps({
                        "error": "Forge mode requires a prompt. Describe the skill idea or workflow to forge."
                    })
                result = miner.forge(prompt)
                stats = miner.get_mining_stats()
                result["stats"] = stats
                return json.dumps(result, indent=2)

            # Default: passive scan
            discoveries = miner.scan()
            stats = miner.get_mining_stats()
            return json.dumps({
                "discoveries": [
                    {"name": d.name, "skills": d.skills, "categories": d.categories,
                     "reward": d.reward_trust, "pattern_id": d.pattern_id}
                    for d in discoveries
                ],
                "stats": stats,
            }, indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def what_now() -> str:
        """Ask what flow you should run right now.

        Reads your trainer state, flow history, streaks, time of day, category gaps,
        memory (L0 identity, L1 critical facts), and knowledge graph — then recommends
        the most relevant flow pipeline for this moment. No searching. No browsing.
        """
        try:
            mod = _hot_import("skillchain.sdk.velma_recommender")
            velma = mod.VelmaRecommender()
            recs = velma.what_now()
            return json.dumps([{
                "flow": r.chain_name,
                "nudge": r.nudge,
                "reason": r.reason,
                "priority": r.priority,
                "category": r.category,
            } for r in recs], indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

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
        """Generate a prompt for executing a full flow pipeline."""
        chain_data = None
        for cd in _available_chains():
            if cd.get("name") == chain_name:
                chain_data = cd
                break
        if not chain_data:
            return f"Flow '{chain_name}' not found. Use list_flow_pipelines() to see available flows."

        steps = chain_data.get("steps", [])
        step_desc = "\n".join(
            f"  {i+1}. **{s.get('alias', s['skill_name'])}** (`{s['skill_name']}`) "
            f"{'<- ' + ', '.join(s.get('depends_on', [])) if s.get('depends_on') else '(start)'}"
            for i, s in enumerate(steps)
        )

        return f"""You are executing the '{chain_name}' flow pipeline.

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

    # ===================================================================
    # DATA CONNECTORS — Real-world data sources
    # ===================================================================

    @server.tool()
    def list_connectors() -> str:
        """List all available data connectors and their connection status.

        Shows which real-world data sources are connected (bank, calendar, health)
        and how many records each has.
        """
        from ..connectors import ConnectorRegistry, BankConnector, CalendarConnector, HealthConnector
        # Ensure connectors are registered
        for cls in (BankConnector, CalendarConnector, HealthConnector):
            if cls.name not in ConnectorRegistry._connectors:
                ConnectorRegistry.register(cls())
        return json.dumps(ConnectorRegistry.statuses(), indent=2, default=str)

    @server.tool()
    def import_bank_csv(csv_content: str) -> str:
        """Import bank transactions from CSV content.

        Paste your bank statement CSV (from Chase, BofA, Wells Fargo, Capital One,
        or any bank with date/description/amount columns).

        Auto-categorizes transactions: groceries, dining, subscriptions, etc.

        Args:
            csv_content: The full CSV text content from your bank export
        """
        from ..connectors.bank import BankConnector
        connector = BankConnector()
        result = connector.import_csv(csv_content)
        return json.dumps(result, indent=2, default=str)

    @server.tool()
    def get_spending_summary(days: int = 30) -> str:
        """Get a spending summary for the last N days.

        Shows total spending, income, net, breakdown by category,
        and top merchants. Requires bank data to be imported first.

        Args:
            days: Number of days to analyze (default 30)
        """
        from ..connectors.bank import BankConnector
        connector = BankConnector()
        result = connector.spending_summary(days)
        return json.dumps(result, indent=2, default=str)

    @server.tool()
    def find_subscriptions() -> str:
        """Detect recurring charges and subscriptions in your bank data.

        Finds monthly/weekly charges, estimates annual cost,
        and identifies subscriptions you might want to cancel.
        """
        from ..connectors.bank import BankConnector
        connector = BankConnector()
        subs = connector.find_subscriptions()
        total_annual = sum(s["annual_cost"] for s in subs)
        return json.dumps({
            "subscriptions": subs,
            "total_monthly": round(total_annual / 12, 2),
            "total_annual": round(total_annual, 2),
        }, indent=2, default=str)

    @server.tool()
    def get_transactions(start_date: str = "", end_date: str = "",
                         category: str = "", search: str = "") -> str:
        """Query bank transactions with filters.

        Args:
            start_date: Filter from this date (YYYY-MM-DD)
            end_date: Filter to this date (YYYY-MM-DD)
            category: Filter by category (food_delivery, groceries, dining, subscriptions, etc.)
            search: Search transaction descriptions
        """
        from ..connectors.bank import BankConnector
        connector = BankConnector()
        results = connector.query(
            start_date=start_date or None,
            end_date=end_date or None,
            category=category or None,
            search=search or None,
        )
        return json.dumps(results[:100], indent=2, default=str)  # Cap at 100

    @server.tool()
    def import_calendar_ics(ics_content: str) -> str:
        """Import calendar events from an ICS file.

        Export your calendar from Google Calendar, Apple Calendar, or Outlook
        as an .ics file and paste the content here.

        Args:
            ics_content: The full ICS file content
        """
        from ..connectors.calendar import CalendarConnector
        connector = CalendarConnector()
        result = connector.import_ics(ics_content)
        return json.dumps(result, indent=2, default=str)

    @server.tool()
    def get_calendar_events(days_ahead: int = 7, search: str = "") -> str:
        """Get upcoming calendar events.

        Args:
            days_ahead: How many days ahead to look (default 7)
            search: Filter events by title
        """
        from ..connectors.calendar import CalendarConnector
        connector = CalendarConnector()
        results = connector.query(days_ahead=days_ahead, search=search or None)
        return json.dumps(results, indent=2, default=str)

    @server.tool()
    def get_free_time(date: str, work_start: str = "09:00", work_end: str = "17:00") -> str:
        """Find free time slots on a given date based on your calendar.

        Args:
            date: The date to check (YYYY-MM-DD)
            work_start: Start of your work day (HH:MM, default 09:00)
            work_end: End of your work day (HH:MM, default 17:00)
        """
        from ..connectors.calendar import CalendarConnector
        connector = CalendarConnector()
        slots = connector.free_slots(date, work_start, work_end)
        return json.dumps({"date": date, "free_slots": slots}, indent=2, default=str)

    @server.tool()
    def record_health(metric: str, value: float, date: str = "") -> str:
        """Record a health metric manually.

        Args:
            metric: One of: steps, heart_rate, sleep_hours, weight, calories, workouts, distance
            value: The numeric value (e.g., 8000 steps, 7.5 sleep hours, 175 weight)
            date: Date (YYYY-MM-DD), defaults to today
        """
        from ..connectors.health import HealthConnector
        connector = HealthConnector()
        result = connector.record(metric, value, date or None)
        return json.dumps(result, indent=2, default=str)

    @server.tool()
    def import_apple_health(xml_content: str) -> str:
        """Import health data from Apple Health export.

        On iPhone: Health app → Profile → Export All Health Data.
        Paste the export.xml content here.

        Extracts: steps, heart rate, sleep, weight, calories, distance.

        Args:
            xml_content: The XML content from Apple Health export
        """
        from ..connectors.health import HealthConnector
        connector = HealthConnector()
        result = connector.import_apple_health(xml_content)
        return json.dumps(result, indent=2, default=str)

    @server.tool()
    def get_health_metrics(metric: str = "", days: int = 30) -> str:
        """Get health metrics for a time period.

        Args:
            metric: Specific metric (steps, heart_rate, sleep_hours, weight, etc.) or empty for all
            days: Number of days to look back (default 30)
        """
        from ..connectors.health import HealthConnector
        connector = HealthConnector()
        results = connector.query(metric=metric or None, days=days)
        return json.dumps(results[:200], indent=2, default=str)

    @server.tool()
    def get_health_trends(metric: str, days: int = 30) -> str:
        """Analyze trends for a health metric.

        Shows average, min, max, and whether the metric is increasing,
        decreasing, or stable over the time period.

        Args:
            metric: The metric to analyze (steps, heart_rate, sleep_hours, weight, etc.)
            days: Number of days to analyze (default 30)
        """
        from ..connectors.health import HealthConnector
        connector = HealthConnector()
        result = connector.trends(metric, days)
        return json.dumps(result, indent=2, default=str)

    # ===================================================================
    # COGNITIVE FABRIC — TKG + Communication layer
    # ===================================================================

    # Lazy-init shared fabric instance (persisted to ~/.skillchain/fabric/)
    _fabric_instance: Any = None

    def _get_fabric() -> Any:
        nonlocal _fabric_instance
        if _fabric_instance is None:
            from ..cognitive_fabric import CognitiveFabric
            _fabric_instance = CognitiveFabric.create(persist=True)
        return _fabric_instance

    @server.tool()
    def tkg_query(
        query_text: str = "",
        subject: str = "",
        predicate: str = "",
        top_k: int = 20,
        min_confidence: float = 0.0,
    ) -> str:
        """Query the Temporal Knowledge Graph for active assertions.

        Returns the top-k most relevant assertions scored by confidence,
        importance (decay-adjusted), recency, and relevance to query_text.

        Args:
            query_text: Natural language search (token overlap scoring)
            subject:    Filter by subject ID
            predicate:  Filter by predicate (e.g. 'asserts', 'has_state')
            top_k:      Maximum results (default 20)
            min_confidence: Minimum confidence threshold (0.0–1.0)
        """
        try:
            fabric = _get_fabric()
            results = fabric.tkg.query(
                subject=subject or None,
                predicate=predicate or None,
                query_text=query_text,
                top_k=top_k,
                min_confidence=min_confidence,
            )
            return json.dumps([{
                "id": r.assertion.id[:12],
                "subject": r.assertion.subject,
                "predicate": r.assertion.predicate,
                "object": r.assertion.object,
                "confidence": round(r.assertion.confidence, 3),
                "importance": round(r.assertion.importance, 3),
                "score": round(r.score, 3),
                "valid_from": r.assertion.valid_from.isoformat(),
                "derivation_kind": r.assertion.derivation_kind,
            } for r in results], indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def tkg_write(
        subject: str,
        predicate: str,
        object: str,
        confidence: float = 0.9,
        source_agent: str = "claude",
    ) -> str:
        """Write an assertion directly to the Temporal Knowledge Graph.

        Runs contradiction detection — if a conflicting assertion exists
        for the same subject+predicate with lower confidence, it is
        automatically invalidated.

        Args:
            subject:      The entity being described
            predicate:    The relationship type (e.g. 'asserts', 'has_state')
            object:       The value or target
            confidence:   Confidence score 0.0–1.0 (default 0.9)
            source_agent: ID of the agent asserting this fact
        """
        try:
            from ..tkg import TKGAssertion
            from ..communication import ProvenanceNode
            import uuid as _uuid
            fabric = _get_fabric()

            assertion = TKGAssertion(
                subject=subject,
                predicate=predicate,
                object=object,
                confidence=confidence,
                source_agent=source_agent,
                derivation_kind="observed",
            )
            pnode = ProvenanceNode(
                object_id=assertion.id,
                object_type="Assertion",
                asserted_by_agent=source_agent,
                source_message_id=f"mcp:{_uuid.uuid4().hex[:8]}",
                derivation_kind="observed",
            )
            fabric.provenance.record(pnode)
            result = fabric.tkg.write(assertion)
            fabric.save()
            return json.dumps({
                "written": result["written"],
                "contradictions_resolved": result["contradictions_resolved"],
                "stats": fabric.tkg.stats(),
            }, indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def tkg_stats() -> str:
        """Get Temporal Knowledge Graph statistics.

        Returns counts of total, active, invalidated, and expired assertions,
        plus fabric-level stats (commitments, assumptions, open threads).
        """
        try:
            fabric = _get_fabric()
            return json.dumps(fabric.stats(), indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def send_agent_message(
        act: str,
        content_json: str = "{}",
        sender_id: str = "claude",
        receiver_id: str = "",
        thread_id: str = "",
        reply_to: str = "",
    ) -> str:
        """Send a typed agent message through the speech act dispatcher.

        Supported acts: ask, answer, propose, challenge, revise, confirm,
        reject, delegate, report, abort.

        For 'propose': content_json must include {id, goal_ref, steps, constraints}.
        For 'challenge': set reply_to to the message_id being challenged.
        For 'revise': content_json is the updated plan; set reply_to to challenge id.

        Args:
            act:          Speech act (propose / challenge / confirm / ask / revise)
            content_json: JSON payload for the message
            sender_id:    Sender agent ID
            receiver_id:  Receiver agent ID (empty = broadcast)
            thread_id:    Thread ID (empty = auto-generated)
            reply_to:     Message ID this responds to
        """
        try:
            from ..communication import AgentMessage
            import uuid as _uuid
            fabric = _get_fabric()
            content = json.loads(content_json) if content_json.strip() else {}
            msg = AgentMessage(
                sender_id=sender_id,
                receiver_id=receiver_id or None,
                act=act,  # type: ignore[arg-type]
                thread_id=thread_id or str(_uuid.uuid4()),
                reply_to=reply_to or None,
                content=content,
            )
            result = fabric.dispatch(msg)
            return json.dumps({"dispatched": act, "result": result, "message_id": msg.message_id}, indent=2)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

    @server.tool()
    def get_dialogue_thread(thread_id: str) -> str:
        """Get the full message history for a dialogue thread.

        Shows all messages in order with their speech acts, content, and
        whether the thread has open challenges or questions.

        Args:
            thread_id: The thread ID to retrieve
        """
        try:
            fabric = _get_fabric()
            thread = fabric.dialogue.get_thread(thread_id)
            if not thread:
                return json.dumps({"error": f"Thread {thread_id!r} not found"})
            return json.dumps({
                "thread_id": thread.thread_id,
                "participants": thread.participants,
                "status": thread.status,
                "open_challenges": thread.open_challenges,
                "open_questions": thread.open_questions,
                "messages": [m.to_dict() for m in thread.messages],
            }, indent=2, default=str)
        except Exception as exc:
            return json.dumps({"error": str(exc)})

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
