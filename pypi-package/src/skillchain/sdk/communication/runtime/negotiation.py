"""
negotiation.py
==============
NegotiationSession — machine-debatable planning state machine.

States:
  draft → proposed → challenged → revised → confirmed → executing → completed
                               ↘ rejected
                  ↘ aborted (from any state)

Transitions enforce that confirmations cannot bypass open challenges,
and revisions can only follow challenges.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Literal, Set

NegotiationState = Literal[
    "draft",
    "proposed",
    "challenged",
    "revised",
    "confirmed",
    "rejected",
    "executing",
    "completed",
    "aborted",
]

# Valid transitions: {from_state: {action → to_state}}
TRANSITIONS: Dict[str, Dict[str, str]] = {
    "draft":      {"propose": "proposed", "abort": "aborted"},
    "proposed":   {"challenge": "challenged", "confirm": "confirmed",
                   "reject": "rejected", "abort": "aborted"},
    "challenged": {"revise": "revised", "reject": "rejected", "abort": "aborted"},
    "revised":    {"challenge": "challenged", "confirm": "confirmed",
                   "reject": "rejected", "abort": "aborted"},
    "confirmed":  {"delegate": "executing", "report": "completed", "abort": "aborted"},
    "executing":  {"report": "completed", "abort": "aborted"},
}


@dataclass
class NegotiationSession:
    thread_id: str
    proposal_id: str
    current_version: str
    state: NegotiationState = "draft"
    open_challenges: List[str] = field(default_factory=list)
    participants: List[str] = field(default_factory=list)

    def transition(self, action: str) -> None:
        allowed = TRANSITIONS.get(self.state, {})
        if action not in allowed:
            raise ValueError(
                f"Action {action!r} is not valid from state {self.state!r}. "
                f"Allowed: {list(allowed.keys())}"
            )
        self.state = allowed[action]  # type: ignore[assignment]

    def is_terminal(self) -> bool:
        return self.state in ("completed", "rejected", "aborted")

    def can_confirm(self) -> bool:
        return self.state in ("proposed", "revised") and not self.open_challenges
