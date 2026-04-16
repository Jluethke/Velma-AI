"""
capability_negotiation.py
=========================
Session-level capability exchange.

At the start of a multi-agent session, each agent advertises its
CapabilityProfile. This module computes the intersection (what both
can do) and advises on routing/downgrade when a receiver lacks support.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..models.capabilities import CapabilityProfile, NegotiatedSession, negotiate_caps
from ..models.messages import AgentMessage


class CapabilityNegotiator:
    """
    Maintains a registry of known agent profiles and negotiated sessions.
    """

    def __init__(self) -> None:
        self._profiles: Dict[str, CapabilityProfile] = {}
        self._sessions: Dict[str, NegotiatedSession] = {}   # keyed by "a:b"

    def register(self, profile: CapabilityProfile) -> None:
        self._profiles[profile.agent_id] = profile

    def get_profile(self, agent_id: str) -> Optional[CapabilityProfile]:
        return self._profiles.get(agent_id)

    def negotiate(self, agent_a_id: str, agent_b_id: str) -> NegotiatedSession:
        """Compute and cache the intersection of two agents' capabilities."""
        a = self._profiles.get(agent_a_id)
        b = self._profiles.get(agent_b_id)
        if a is None:
            raise ValueError(f"No profile registered for agent {agent_a_id!r}")
        if b is None:
            raise ValueError(f"No profile registered for agent {agent_b_id!r}")
        session = negotiate_caps(a, b)
        key = f"{agent_a_id}:{agent_b_id}"
        self._sessions[key] = session
        return session

    def get_session(self, agent_a_id: str, agent_b_id: str) -> Optional[NegotiatedSession]:
        return self._sessions.get(f"{agent_a_id}:{agent_b_id}") or \
               self._sessions.get(f"{agent_b_id}:{agent_a_id}")

    def check_message(self, msg: AgentMessage) -> Dict[str, Any]:
        """
        Verify that a message's act and content type are supported
        by the receiver. Returns {ok: bool, reason: str}.
        """
        if not msg.receiver_id:
            return {"ok": True, "reason": "broadcast"}

        session = self.get_session(msg.sender_id, msg.receiver_id)
        if session is None:
            return {"ok": False, "reason": "no negotiated session — call negotiate() first"}

        if not session.can_use_act(msg.act):
            return {
                "ok": False,
                "reason": f"act={msg.act!r} not in negotiated acts={session.acts}",
            }

        if msg.content_type and msg.content_type not in session.types:
            # soft warning — content_type is informational, not blocking
            return {
                "ok": True,
                "warning": f"content_type={msg.content_type!r} not in negotiated types",
            }

        return {"ok": True, "reason": ""}
