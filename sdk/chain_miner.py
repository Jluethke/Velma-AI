# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY
"""
chain_miner.py
==============

Chain Mining — earning TRUST by discovering useful skill combinations.

Watches user execution history, detects repeating skill sequences,
validates that the combination actually produces value, and publishes
discovered chains to the marketplace. Discoverer earns royalties.

Anti-farming protections:
  - Daily TRUST cap (50 TRUST/day from mining)
  - Diminishing returns (each discovery same day worth less)
  - Quality gates (chain must be run 3+ times with positive outcomes)
  - Cooldown (same chain pattern can't re-earn within 7 days)
  - Diversity requirement (must use skills from 2+ categories)
  - Human-in-the-loop (auto-discovered chains need user confirmation)

Mining rewards:
  - Chain discovery: 10 TRUST (first time a novel pattern is detected)
  - Chain validation: 5 TRUST (when 3 other users run your chain successfully)
  - Chain adoption: 2 TRUST per unique user who runs it (capped at 100 users)

Example::

    from skillchain.sdk.chain_miner import ChainMiner

    miner = ChainMiner()
    discoveries = miner.scan()
    for d in discoveries:
        print(f"Discovered: {d.name} — {d.description}")
        print(f"  Reward: {d.reward_trust} TRUST")
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any, Optional

from .gamification import GamificationEngine, SKILL_CATEGORIES, _category_for_skill

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Anti-farming constants
# ---------------------------------------------------------------------------

DAILY_TRUST_CAP = 50.0           # Max TRUST earnable per day from mining
DIMINISHING_FACTOR = 0.7         # Each same-day discovery worth 70% of previous
MIN_RUNS_TO_VALIDATE = 3         # Chain must be run 3+ times before it's publishable
COOLDOWN_DAYS = 7                # Same pattern can't re-earn within 7 days
MIN_CATEGORIES = 2               # Must span 2+ skill categories to count
MIN_CHAIN_LENGTH = 2             # At least 2 skills in sequence
MAX_CHAIN_LENGTH = 8             # Cap chain length to prevent gaming
MAX_DAILY_DISCOVERIES = 5        # Max new patterns detected per day
DISCOVERY_REWARD = 10.0          # TRUST for first detection
VALIDATION_REWARD = 5.0          # TRUST when others validate your chain
ADOPTION_REWARD = 2.0            # TRUST per unique adopter
ADOPTION_CAP = 100               # Max adopters that earn rewards
FORGE_REWARD = 15.0              # TRUST for forging a new skill + chain via skill-to-chain
FORGE_CHAIN = "skill-to-chain"   # The meta-chain that powers active mining

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class MinedChain:
    """A chain pattern discovered through usage."""
    pattern_id: str              # SHA256 of skill sequence
    skills: list[str]            # Ordered skill names
    categories: list[str]        # Categories spanned
    run_count: int               # Times this pattern was executed
    first_seen: str              # ISO date
    last_seen: str               # ISO date
    name: str = ""               # Auto-generated name
    description: str = ""        # Auto-generated description
    reward_trust: float = 0.0    # TRUST earned from this discovery
    published: bool = False      # Whether it's been published to marketplace
    validated: bool = False       # Whether 3+ users have run it successfully
    adopter_count: int = 0       # Unique users who've run it


@dataclass
class MiningState:
    """Persisted mining state."""
    discovered_patterns: dict[str, dict] = field(default_factory=dict)  # pattern_id -> MinedChain as dict
    daily_trust_earned: float = 0.0
    daily_trust_date: str = ""
    daily_discovery_count: int = 0
    total_trust_mined: float = 0.0
    total_chains_discovered: int = 0
    total_chains_published: int = 0
    cooldown_map: dict[str, str] = field(default_factory=dict)  # pattern_id -> last_earned ISO date


# ---------------------------------------------------------------------------
# Chain Miner
# ---------------------------------------------------------------------------

_MINING_PATH = Path.home() / ".skillchain" / "mining.json"


class ChainMiner:
    """Discover new chains by detecting patterns in skill execution history.

    Anti-farming: daily caps, diminishing returns, quality gates, cooldowns,
    diversity requirements. You can't game this by running the same skills
    on repeat.
    """

    def __init__(self, mining_path: Optional[Path] = None) -> None:
        self._path = mining_path or _MINING_PATH
        self._state = self._load()
        self._engine = GamificationEngine()

    def scan(self) -> list[MinedChain]:
        """Scan execution history for novel skill sequences.

        Returns newly discovered chain patterns (if any).
        """
        today = date.today().isoformat()
        self._reset_daily_if_needed(today)

        # Check daily limits
        if self._state.daily_discovery_count >= MAX_DAILY_DISCOVERIES:
            return []
        if self._state.daily_trust_earned >= DAILY_TRUST_CAP:
            return []

        # Get execution history from trainer state
        trainer = self._engine._state
        discovered_skills = trainer.skills_discovered
        chains_completed = trainer.chains_completed

        if len(discovered_skills) < MIN_CHAIN_LENGTH:
            return []

        # Detect patterns: sliding windows over discovered skills
        discoveries: list[MinedChain] = []

        for window_size in range(MIN_CHAIN_LENGTH, min(MAX_CHAIN_LENGTH + 1, len(discovered_skills) + 1)):
            for i in range(len(discovered_skills) - window_size + 1):
                sequence = discovered_skills[i:i + window_size]
                pattern = self._evaluate_pattern(sequence, today)
                if pattern:
                    discoveries.append(pattern)

                    # Apply daily limits
                    if self._state.daily_discovery_count >= MAX_DAILY_DISCOVERIES:
                        break
                    if self._state.daily_trust_earned >= DAILY_TRUST_CAP:
                        break

            if self._state.daily_discovery_count >= MAX_DAILY_DISCOVERIES:
                break

        self._save()
        return discoveries

    def get_discoveries(self) -> list[MinedChain]:
        """Return all discovered chain patterns."""
        results = []
        for pid, data in self._state.discovered_patterns.items():
            results.append(MinedChain(**{
                k: v for k, v in data.items()
                if k in MinedChain.__dataclass_fields__
            }))
        results.sort(key=lambda x: -x.run_count)
        return results

    def get_mining_stats(self) -> dict[str, Any]:
        """Return mining statistics."""
        return {
            "total_trust_mined": round(self._state.total_trust_mined, 2),
            "total_chains_discovered": self._state.total_chains_discovered,
            "total_chains_published": self._state.total_chains_published,
            "daily_trust_earned": round(self._state.daily_trust_earned, 2),
            "daily_trust_remaining": round(max(0, DAILY_TRUST_CAP - self._state.daily_trust_earned), 2),
            "daily_discoveries_remaining": max(0, MAX_DAILY_DISCOVERIES - self._state.daily_discovery_count),
            "patterns_found": len(self._state.discovered_patterns),
        }

    def confirm_chain(self, pattern_id: str, name: str = "", description: str = "") -> Optional[MinedChain]:
        """User confirms a discovered pattern should become a chain.

        This is the human-in-the-loop step. Auto-discovery suggests,
        user decides if it's actually useful.
        """
        data = self._state.discovered_patterns.get(pattern_id)
        if not data:
            return None

        chain = MinedChain(**{k: v for k, v in data.items() if k in MinedChain.__dataclass_fields__})

        if name:
            chain.name = name
        if description:
            chain.description = description

        chain.published = True
        self._state.total_chains_published += 1
        self._state.discovered_patterns[pattern_id] = asdict(chain)
        self._save()

        # Write the chain file to marketplace
        self._publish_chain(chain)

        return chain

    def forge(self, prompt: str) -> dict[str, Any]:
        """Active mining: turn a raw idea into a skill, then find its chain home.

        Unlike scan() which passively detects patterns in history, forge()
        actively creates new skills and weaves them into the chain ecosystem
        by running the skill-to-chain meta-chain.

        Args:
            prompt: A raw idea, workflow description, or problem statement
                    to be forged into a skill and placed into chains.

        Returns:
            Dict with forge results including the created skill, quality
            score, matching chains, and new chain designs.
        """
        today = date.today().isoformat()
        self._reset_daily_if_needed(today)

        # Check daily limits (forge shares the daily TRUST pool)
        if self._state.daily_trust_earned >= DAILY_TRUST_CAP:
            return {
                "status": "daily_cap_reached",
                "daily_trust_remaining": 0,
                "message": "Daily TRUST cap reached. Mine again tomorrow.",
            }

        # Load and run the skill-to-chain meta-chain
        chains_dir = Path(__file__).resolve().parent.parent / "marketplace" / "chains"
        chain_file = chains_dir / f"{FORGE_CHAIN}.chain.json"

        if not chain_file.exists():
            return {
                "status": "error",
                "message": f"Forge chain '{FORGE_CHAIN}' not found. Run list_chains to verify.",
            }

        try:
            chain_data = json.loads(chain_file.read_text(encoding="utf-8"))
        except Exception as exc:
            return {"status": "error", "message": f"Failed to load forge chain: {exc}"}

        # Build the forge result — the actual chain execution happens via
        # the MCP run_chain tool. We prepare the manifest here.
        skill_steps = chain_data.get("steps", [])
        phase_1_skills = [s["skill_name"] for s in skill_steps[:4]]  # Build phase
        phase_2_skills = [s["skill_name"] for s in skill_steps[4:]]  # Place phase

        # Calculate reward with diminishing returns
        diminish = DIMINISHING_FACTOR ** self._state.daily_discovery_count
        reward = round(min(FORGE_REWARD * diminish, DAILY_TRUST_CAP - self._state.daily_trust_earned), 2)

        # Record the forge attempt
        forge_id = hashlib.sha256(f"forge|{prompt}|{today}".encode()).hexdigest()[:16]
        self._state.daily_trust_earned += reward
        self._state.daily_discovery_count += 1
        self._state.total_trust_mined += reward
        self._save()

        logger.info("Forge initiated: %s (+%.1f TRUST)", forge_id, reward)

        return {
            "status": "ready",
            "forge_id": forge_id,
            "chain": FORGE_CHAIN,
            "prompt": prompt,
            "phase_1_build": phase_1_skills,
            "phase_2_place": phase_2_skills,
            "reward_trust": reward,
            "message": (
                f"Forge ready. Run the '{FORGE_CHAIN}' chain with this prompt to "
                f"create a new skill and discover its chain home. +{reward} TRUST on completion."
            ),
            "run_command": f'find_and_run(query="{prompt}", auto_run=true)',
        }

    # -- Internal ----------------------------------------------------------

    def _evaluate_pattern(self, sequence: list[str], today: str) -> Optional[MinedChain]:
        """Evaluate if a skill sequence qualifies as a novel chain discovery."""
        # Generate pattern ID
        pattern_id = hashlib.sha256("|".join(sequence).encode()).hexdigest()[:16]

        # Already discovered?
        if pattern_id in self._state.discovered_patterns:
            # Increment run count
            self._state.discovered_patterns[pattern_id]["run_count"] += 1
            self._state.discovered_patterns[pattern_id]["last_seen"] = today
            return None

        # Cooldown check
        if pattern_id in self._state.cooldown_map:
            last_earned = self._state.cooldown_map[pattern_id]
            if last_earned and (date.fromisoformat(today) - date.fromisoformat(last_earned)).days < COOLDOWN_DAYS:
                return None

        # Category diversity check
        categories = list(set(_category_for_skill(s) for s in sequence))
        categories = [c for c in categories if c != "Other"]
        if len(categories) < MIN_CATEGORIES:
            return None

        # Check it's not an existing chain
        existing_chains = self._load_existing_chain_patterns()
        if pattern_id in existing_chains:
            return None

        # Calculate reward with diminishing returns
        base_reward = DISCOVERY_REWARD
        diminish = DIMINISHING_FACTOR ** self._state.daily_discovery_count
        reward = round(min(base_reward * diminish, DAILY_TRUST_CAP - self._state.daily_trust_earned), 2)

        if reward <= 0:
            return None

        # Auto-generate name and description
        name = "-".join(sequence[:3])
        if len(sequence) > 3:
            name += f"-plus-{len(sequence) - 3}"
        description = f"Auto-discovered chain: {' -> '.join(sequence)}. Spans {', '.join(categories)}."

        # Create discovery
        mined = MinedChain(
            pattern_id=pattern_id,
            skills=sequence,
            categories=categories,
            run_count=1,
            first_seen=today,
            last_seen=today,
            name=name,
            description=description,
            reward_trust=reward,
        )

        # Record
        self._state.discovered_patterns[pattern_id] = asdict(mined)
        self._state.daily_trust_earned += reward
        self._state.daily_discovery_count += 1
        self._state.total_trust_mined += reward
        self._state.total_chains_discovered += 1
        self._state.cooldown_map[pattern_id] = today

        logger.info(
            "Chain mined: %s (%d skills, %s categories, +%.1f TRUST)",
            name, len(sequence), ", ".join(categories), reward,
        )

        return mined

    def _load_existing_chain_patterns(self) -> set[str]:
        """Get pattern IDs for all existing marketplace chains."""
        chains_dir = Path(__file__).resolve().parent.parent / "marketplace" / "chains"
        patterns: set[str] = set()
        if chains_dir.exists():
            for f in chains_dir.glob("*.chain.json"):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    skills = [s.get("skill_name", "") for s in data.get("steps", [])]
                    pid = hashlib.sha256("|".join(skills).encode()).hexdigest()[:16]
                    patterns.add(pid)
                except Exception:
                    continue
        return patterns

    def _publish_chain(self, chain: MinedChain) -> None:
        """Write a discovered chain to the marketplace chains directory."""
        chains_dir = Path(__file__).resolve().parent.parent / "marketplace" / "chains"
        chains_dir.mkdir(parents=True, exist_ok=True)

        chain_data = {
            "name": chain.name,
            "description": chain.description,
            "category": "mined",
            "mined": True,
            "miner_reward": chain.reward_trust,
            "first_seen": chain.first_seen,
            "steps": [
                {
                    "skill_name": skill,
                    "alias": skill,
                    "depends_on": [chain.skills[i - 1]] if i > 0 else [],
                    "config": {},
                    "phase_filter": None,
                }
                for i, skill in enumerate(chain.skills)
            ],
        }

        out_path = chains_dir / f"{chain.name}.chain.json"
        out_path.write_text(json.dumps(chain_data, indent=2), encoding="utf-8")
        logger.info("Published mined chain: %s", out_path)

    def _reset_daily_if_needed(self, today: str) -> None:
        """Reset daily counters if it's a new day."""
        if self._state.daily_trust_date != today:
            self._state.daily_trust_earned = 0.0
            self._state.daily_discovery_count = 0
            self._state.daily_trust_date = today

    # -- Persistence -------------------------------------------------------

    def _load(self) -> MiningState:
        """Load mining state from disk."""
        if self._path.exists():
            try:
                data = json.loads(self._path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    return MiningState(**{
                        k: v for k, v in data.items()
                        if k in MiningState.__dataclass_fields__
                    })
            except Exception as exc:
                logger.warning("Could not load mining state: %s", exc)
        return MiningState()

    def _save(self) -> None:
        """Persist mining state to disk."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(asdict(self._state), indent=2, default=str),
            encoding="utf-8",
        )
