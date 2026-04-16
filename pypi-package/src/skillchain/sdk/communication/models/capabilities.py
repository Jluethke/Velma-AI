"""
capabilities.py
===============
Agent capability profiles and negotiation.

Prevents semantic mismatch: if agent B cannot interpret Plan objects,
route or downgrade accordingly before sending.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set


@dataclass
class CapabilityProfile:
    """
    Describes what an agent can send, receive, and verify.
    Exchanged at session start via capability_advertisement messages.
    """
    agent_id: str
    protocol_versions: List[str] = field(default_factory=lambda: ["1.0"])
    supported_acts: List[str] = field(default_factory=list)
    supported_types: List[str] = field(default_factory=list)     # epistemic types
    supported_verifiers: List[str] = field(default_factory=list) # verification methods
    max_context_tokens: int = 32_000
    tool_permissions: List[str] = field(default_factory=list)
    unsupported_features: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return self.__dict__.copy()

    @classmethod
    def from_dict(cls, d: Dict) -> CapabilityProfile:
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})

    @classmethod
    def full(cls, agent_id: str) -> CapabilityProfile:
        """A profile that advertises support for everything."""
        from .epistemic import EPISTEMIC_TYPES
        from ..models.messages import SpeechAct
        import typing
        all_acts = list(typing.get_args(SpeechAct))
        return cls(
            agent_id=agent_id,
            protocol_versions=["1.0"],
            supported_acts=all_acts,
            supported_types=list(EPISTEMIC_TYPES.keys()),
            supported_verifiers=["self", "consensus", "simulation"],
            tool_permissions=["read", "write", "external_read"],
        )

    @classmethod
    def minimal(cls, agent_id: str) -> CapabilityProfile:
        """Bare minimum: ask / answer / confirm only."""
        return cls(
            agent_id=agent_id,
            supported_acts=["ask", "answer", "confirm", "reject"],
            supported_types=["Observation"],
        )


@dataclass
class NegotiatedSession:
    """The intersection of two capability profiles."""
    agent_a: str
    agent_b: str
    protocol: List[str]
    acts: List[str]
    types: List[str]
    verifiers: List[str]

    def can_use_act(self, act: str) -> bool:
        return act in self.acts

    def can_use_type(self, t: str) -> bool:
        return t in self.types


def negotiate_caps(a: CapabilityProfile, b: CapabilityProfile) -> NegotiatedSession:
    """
    Compute the intersection of two capability profiles.
    Both agents must support something for it to be usable in the session.
    """
    return NegotiatedSession(
        agent_a=a.agent_id,
        agent_b=b.agent_id,
        protocol=sorted(set(a.protocol_versions) & set(b.protocol_versions)),
        acts=sorted(set(a.supported_acts) & set(b.supported_acts)),
        types=sorted(set(a.supported_types) & set(b.supported_types)),
        verifiers=sorted(set(a.supported_verifiers) & set(b.supported_verifiers)),
    )
