"""
Stub access gate for standalone package.

In the full Velma ecosystem, the gate checks TRUST token balance
to determine access tier.  In standalone mode, everything is free.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Set


FREE_SKILLS: Set[str] = set()   # empty = no restrictions
FREE_CHAINS: Set[str] = set()


@dataclass
class GateResult:
    tier: str = "free"
    wallet: Optional[str] = None
    balance: float = 0.0
    error: Optional[str] = None


class AccessGate:
    """Stub gate that always grants access."""

    def check(self) -> GateResult:
        return GateResult(tier="free")

    def is_skill_allowed(self, skill_name: str) -> bool:
        return True

    def is_chain_allowed(self, chain_name: str) -> bool:
        return True


_gate: Optional[AccessGate] = None


def get_gate() -> AccessGate:
    global _gate
    if _gate is None:
        _gate = AccessGate()
    return _gate
