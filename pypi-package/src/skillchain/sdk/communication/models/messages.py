"""
messages.py
===========
Typed agent message envelope with speech act semantics.

This sits ABOVE IPC transport — transport carries bytes,
this layer carries *meaning*.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

# ── Speech act vocabulary ─────────────────────────────────────────────────────

SpeechAct = Literal[
    "ask",
    "answer",
    "propose",
    "challenge",
    "revise",
    "confirm",
    "reject",
    "delegate",
    "report",
    "abort",
    "capability_advertisement",
    "capability_request",
]

# ── Verifiability levels ──────────────────────────────────────────────────────

Verifiability = Literal[
    "asserted",          # speaker claims it — no external check
    "checkable",         # can be verified against a known source
    "simulation_required",
    "consensus_required",
    "unverifiable",
]


# ── Core envelope ─────────────────────────────────────────────────────────────

@dataclass
class AgentMessage:
    """
    The universal envelope for agent-to-agent communication.

    Every message MUST declare what speech act it performs
    (ask / propose / challenge / confirm …) so receivers can
    dispatch by *intent*, not by inspection of free-form content.
    """

    # Identity
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    protocol_version: str = "1.0"
    sender_id: str = ""
    receiver_id: Optional[str] = None          # None = broadcast
    thread_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    # Intent
    act: SpeechAct = "report"

    # Content
    content_type: str = "text/plain"
    content_ref: Optional[str] = None          # IPFS CID or URI for large payloads
    content: Optional[Dict[str, Any]] = None

    # Epistemic metadata
    confidence: Optional[float] = None         # 0.0–1.0
    verifiability: Optional[Verifiability] = None

    # Threading
    reply_to: Optional[str] = None             # message_id being responded to
    revision_of: Optional[str] = None          # message_id being revised

    # Lifecycle
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    # Permission token — used by PolicyVM
    permissions: Optional[Dict[str, Any]] = None

    # Freeform extension bag
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "message_id": self.message_id,
            "protocol_version": self.protocol_version,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "thread_id": self.thread_id,
            "act": self.act,
            "content_type": self.content_type,
            "content_ref": self.content_ref,
            "content": self.content,
            "confidence": self.confidence,
            "verifiability": self.verifiability,
            "reply_to": self.reply_to,
            "revision_of": self.revision_of,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "permissions": self.permissions,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> AgentMessage:
        d = dict(d)
        for ts_field in ("created_at", "expires_at"):
            if isinstance(d.get(ts_field), str):
                d[ts_field] = datetime.fromisoformat(d[ts_field])
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})
