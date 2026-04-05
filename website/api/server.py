# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.
"""
SkillChain Website API
======================

REST API that wraps the SkillChain SDK for the web frontend.
Thin HTTP layer — all logic lives in the SDK.

Start: uvicorn skillchain.website.api.server:app --port 8420
"""

from __future__ import annotations

import json
import logging
import sys
from dataclasses import asdict
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add repo root to path so SDK imports work
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from skillchain.sdk.mcp_bridge.server import _installed_skills, _available_chains, _load_manifest
from skillchain.sdk.chain_matcher import ChainMatcher
from skillchain.sdk.gamification import GamificationEngine
from skillchain.sdk.skill_chain import SkillChain
from skillchain.sdk.tiers import Tier, TIER_PRICING, get_tier_limits, check_rate_limit

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SkillChain API",
    version="0.1.0",
    description="REST API for the SkillChain AI Skill Marketplace",
)

_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://velma.ai",
    "https://www.velma.ai",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: str
    max_results: int = 10


class RunChainRequest(BaseModel):
    initial_context: dict[str, Any] = {}


class FindAndRunRequest(BaseModel):
    query: str
    auto_run: bool = False
    initial_context: dict[str, Any] = {}


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    primary_goal: Optional[str] = None


# ---------------------------------------------------------------------------
# Skills
# ---------------------------------------------------------------------------

@app.get("/api/skills")
def list_skills():
    """List all available skills with metadata."""
    skills = _installed_skills()
    result = []
    for name, path in sorted(skills.items()):
        manifest = _load_manifest(name)
        content = path.read_text(encoding="utf-8") if path.exists() else ""
        # Extract first line as description if manifest doesn't have one
        desc = manifest.get("description", "")
        if not desc and content:
            for line in content.split("\n"):
                line = line.strip()
                if line and not line.startswith("#") and not line.startswith(">"):
                    desc = line[:200]
                    break
        result.append({
            "name": name,
            "domain": manifest.get("domain", "general"),
            "description": desc,
            "tags": manifest.get("tags", []),
            "execution_pattern": manifest.get("execution_pattern", ""),
            "price": manifest.get("price", "0"),
            "license": manifest.get("license", "OPEN"),
        })
    return result


@app.get("/api/skills/{name}")
def get_skill(name: str):
    """Get full skill content and metadata."""
    skills = _installed_skills()
    path = skills.get(name)
    if not path or not path.exists():
        raise HTTPException(404, f"Skill '{name}' not found")
    manifest = _load_manifest(name)
    return {
        "name": name,
        "content": path.read_text(encoding="utf-8"),
        "manifest": manifest,
    }


@app.get("/api/skills/{name}/manifest")
def get_skill_manifest(name: str):
    """Get skill manifest/metadata only."""
    manifest = _load_manifest(name)
    if manifest.get("name") == name and len(manifest) == 1:
        raise HTTPException(404, f"No manifest for '{name}'")
    return manifest


# ---------------------------------------------------------------------------
# Chains
# ---------------------------------------------------------------------------

@app.get("/api/chains")
def list_chains():
    """List all available skill chains."""
    chains = _available_chains()
    result = []
    for c in chains:
        result.append({
            "name": c.get("name", ""),
            "description": c.get("description", ""),
            "category": c.get("category", ""),
            "steps": len(c.get("steps", [])),
            "skills": [s.get("skill_name", "") for s in c.get("steps", [])],
        })
    return result


@app.post("/api/chains/search")
def search_chains(req: SearchRequest):
    """Search chains by plain English query."""
    chains = _available_chains()
    matcher = ChainMatcher(chains)
    matches = matcher.match(req.query, top_k=req.max_results)
    return [asdict(m) for m in matches]


@app.post("/api/chains/{name}/run")
def run_chain(name: str, req: RunChainRequest):
    """Execute a skill chain by name."""
    chains = _available_chains()
    chain_data = None
    for c in chains:
        if c.get("name") == name:
            chain_data = c
            break
    if not chain_data:
        raise HTTPException(404, f"Chain '{name}' not found")

    chain_obj = SkillChain.from_dict(chain_data)

    # Wire LLM executor
    try:
        from skillchain.sdk.llm_executor import LLMStepExecutor

        def _resolve(skill_name: str):
            skills = _installed_skills()
            p = skills.get(skill_name)
            if p and p.exists():
                return p.read_text(encoding="utf-8")
            return None

        chain_obj.set_executor(LLMStepExecutor(skill_resolver=_resolve))
    except Exception as exc:
        logger.warning("LLM executor not available: %s", exc)

    result = chain_obj.execute(initial_context=req.initial_context, fail_fast=False)

    # Gamification
    gam_result = {}
    try:
        engine = GamificationEngine()
        all_unlocked = []
        for step in result.steps:
            if step.status == "completed":
                unlocked = engine.record_skill_run(step.skill_name)
                all_unlocked.extend(unlocked)
        if result.success:
            unlocked = engine.record_chain_run(
                result.chain_name, len(result.steps), result.total_duration_ms
            )
            all_unlocked.extend(unlocked)
        gam_result = {
            "trainer": engine.get_trainer_card(),
            "unlocked": [{"name": a.name, "description": a.description, "xp": a.xp_reward} for a in all_unlocked],
        }
    except Exception:
        pass

    return {
        "chain": asdict(result),
        "gamification": gam_result,
    }


@app.post("/api/chains/find-and-run")
def find_and_run(req: FindAndRunRequest):
    """Find best chain for a query and optionally run it."""
    chains = _available_chains()
    matcher = ChainMatcher(chains)
    matches = matcher.match(req.query, top_k=5)

    if not matches:
        return {"matches": [], "query": req.query}

    result: dict[str, Any] = {
        "query": req.query,
        "best_match": asdict(matches[0]),
        "other_matches": [asdict(m) for m in matches[1:]],
    }

    if req.auto_run:
        # Run the best match
        run_result = run_chain(matches[0].chain_name, RunChainRequest(initial_context=req.initial_context))
        result["execution"] = run_result

    return result


# ---------------------------------------------------------------------------
# Gamification
# ---------------------------------------------------------------------------

@app.get("/api/trainer")
def get_trainer():
    """Get trainer card (level, XP, streak, stats)."""
    return GamificationEngine().get_trainer_card()


@app.get("/api/achievements")
def get_achievements():
    """Get all 30 achievements with lock/unlock status."""
    return GamificationEngine().get_achievements()


@app.get("/api/skilldex")
def get_skilldex():
    """Get skill collection progress by category."""
    return GamificationEngine().get_skilldex()


@app.get("/api/quests")
def get_quests():
    """Get today's daily quests."""
    return GamificationEngine().get_daily_quests()


@app.get("/api/evolutions")
def get_evolutions():
    """Get top evolved skills."""
    return GamificationEngine().get_evolutions()


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@app.get("/api/profile")
def get_profile():
    """Get user profile."""
    try:
        from skillchain.sdk.user_profile import ProfileManager
        pm = ProfileManager()
        profile = pm.load()
        return asdict(profile)
    except Exception:
        return {"name": "", "role": ""}


@app.post("/api/profile")
def update_profile(req: ProfileUpdate):
    """Update user profile."""
    try:
        from skillchain.sdk.user_profile import ProfileManager
        pm = ProfileManager()
        profile = pm.load()
        if req.name is not None:
            profile.name = req.name
        if req.role is not None:
            profile.role = req.role
        if req.industry is not None:
            profile.industry = req.industry
        if req.primary_goal is not None:
            profile.primary_goal = req.primary_goal
        pm.save(profile)
        return {"status": "updated"}
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Pricing & Tiers
# ---------------------------------------------------------------------------

@app.get("/api/pricing")
def get_pricing():
    """Get subscription tier pricing and features."""
    return {
        tier.value: info for tier, info in TIER_PRICING.items()
    }


@app.get("/api/tiers/{tier_name}")
def get_tier_info(tier_name: str):
    """Get details for a specific tier."""
    try:
        tier = Tier(tier_name)
    except ValueError:
        raise HTTPException(404, f"Unknown tier: {tier_name}")
    from dataclasses import asdict
    return {
        "tier": tier.value,
        "pricing": TIER_PRICING[tier],
        "limits": asdict(get_tier_limits(tier)),
    }


# ---------------------------------------------------------------------------
# Mining
# ---------------------------------------------------------------------------

@app.get("/api/mining")
def get_mining_stats():
    """Get chain mining statistics."""
    try:
        from skillchain.sdk.chain_miner import ChainMiner
        miner = ChainMiner()
        return miner.get_mining_stats()
    except Exception:
        return {"total_trust_mined": 0, "patterns_found": 0}


@app.post("/api/mining/scan")
def scan_for_chains():
    """Scan for new chain patterns to mine."""
    try:
        from skillchain.sdk.chain_miner import ChainMiner
        miner = ChainMiner()
        discoveries = miner.scan()
        return {
            "discoveries": [
                {"name": d.name, "skills": d.skills, "categories": d.categories,
                 "reward": d.reward_trust, "pattern_id": d.pattern_id}
                for d in discoveries
            ],
            "stats": miner.get_mining_stats(),
        }
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ---------------------------------------------------------------------------
# Velma Recommender
# ---------------------------------------------------------------------------

@app.get("/api/velma/what-now")
def what_now():
    """Ask Velma what you should do right now."""
    try:
        from skillchain.sdk.velma_recommender import VelmaRecommender
        velma = VelmaRecommender()
        recs = velma.what_now()
        return [
            {"chain": r.chain_name, "nudge": r.nudge, "reason": r.reason,
             "priority": r.priority, "category": r.category}
            for r in recs
        ]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    """Health check."""
    skills = _installed_skills()
    chains = _available_chains()
    return {
        "status": "ok",
        "skills": len(skills),
        "chains": len(chains),
    }
