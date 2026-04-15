"""
gate.py — FlowFabric access tier gate.

Reads the user's configured TRUST tier from (in priority order):
  1. SKILLCHAIN_TIER env var  (e.g. export SKILLCHAIN_TIER=creator)
  2. ~/.skillchain/config.json  "trust_tier" field
  3. Falls back to "free"

Wallet address is read from:
  1. SKILLCHAIN_WALLET env var
  2. ~/.skillchain/config.json  "wallet_address" field

Tier levels and domain access:
  free    — all domains except engineering, ai, legal, meta
  builder — free + engineering + ai  (500 TRUST)
  creator — all domains including legal + meta  (2,500 TRUST)

  Aliases: "holder" == "builder",  "staker" == "creator"

Quick setup (no wallet needed):
  export SKILLCHAIN_TIER=creator   # grants full access immediately
  # or add to ~/.skillchain/config.json:  { "trust_tier": "creator" }
"""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Set

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Domain → tier requirements  (matches FlowFabric frontend: FlowDetail.tsx)
# ---------------------------------------------------------------------------

BUILDER_DOMAINS: Set[str] = {"engineering", "ai"}
CREATOR_DOMAINS: Set[str] = {"legal", "meta"}

FREE_SKILLS: Set[str] = set()   # reserved for explicit skill-level overrides
FREE_CHAINS: Set[str] = set()


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

@dataclass
class GateResult:
    tier: str = "free"
    wallet: Optional[str] = None
    balance: float = 0.0
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _tier_level(tier: str) -> int:
    """Convert tier name to a numeric level (0=free, 1=builder, 2=creator)."""
    t = tier.lower().strip()
    if t in ("builder", "holder"):
        return 1
    if t in ("creator", "staker"):
        return 2
    return 0  # free, unknown, or empty


def _load_config_file() -> dict:
    """Load ~/.skillchain/config.json; return empty dict on any failure."""
    config_file = Path.home() / ".skillchain" / "config.json"
    if config_file.exists():
        try:
            return json.loads(config_file.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning("gate: failed to read config.json: %s", exc)
    return {}


# ---------------------------------------------------------------------------
# Gate
# ---------------------------------------------------------------------------

class AccessGate:
    """Tier-aware access gate for FlowFabric flows and chains."""

    def __init__(self) -> None:
        self._result: Optional[GateResult] = None

    def check(self) -> GateResult:
        """Resolve the current user's tier and wallet, caching the result."""
        if self._result is not None:
            return self._result

        # Priority 1 — environment variables (fastest, no disk I/O)
        tier = os.environ.get("SKILLCHAIN_TIER", "").strip().lower()
        wallet = os.environ.get("SKILLCHAIN_WALLET", "").strip() or None

        # Priority 2 — config.json on disk
        if not tier or not wallet:
            cfg = _load_config_file()
            if not tier:
                tier = cfg.get("trust_tier", "").strip().lower()
            if not wallet:
                w = cfg.get("wallet_address", "").strip()
                wallet = w or None

        # Default
        if not tier:
            tier = "free"

        error: Optional[str] = None
        if not wallet:
            error = (
                "No wallet configured — defaulting to free tier. "
                "To unlock premium flows set the SKILLCHAIN_TIER env var "
                "(e.g. SKILLCHAIN_TIER=creator) or add 'trust_tier' and "
                "'wallet_address' to ~/.skillchain/config.json, "
                "then restart the MCP server."
            )

        self._result = GateResult(tier=tier, wallet=wallet, error=error)
        logger.debug("gate: tier=%s wallet=%s", tier, wallet)
        return self._result

    def is_skill_allowed(self, skill_name: str, domain: str = "") -> bool:
        """Return True if the current tier permits access to this skill/domain."""
        result = self.check()
        level = _tier_level(result.tier)
        d = domain.lower().strip()

        if d in CREATOR_DOMAINS:
            return level >= 2   # creator / staker required
        if d in BUILDER_DOMAINS:
            return level >= 1   # builder / holder required
        # Free domain or domain unknown — always allowed
        return True

    def is_chain_allowed(self, chain_name: str, domain: str = "") -> bool:
        return self.is_skill_allowed(chain_name, domain)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_gate: Optional[AccessGate] = None


def get_gate() -> AccessGate:
    global _gate
    if _gate is None:
        _gate = AccessGate()
    return _gate


def reset_gate() -> None:
    """Invalidate the cached gate result (e.g. after 'skillchain init')."""
    global _gate
    _gate = None
