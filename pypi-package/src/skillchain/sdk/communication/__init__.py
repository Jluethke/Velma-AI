"""
communication/
==============
The semantic layer above IPC transport.

This package implements typed speech acts, epistemic objects, dialogue
state, capability negotiation, provenance graphs, and policy enforcement.

Quick start — MVP four-act protocol::

    from skillchain.sdk.communication import (
        AgentMessage, SpeechActDispatcher, DialogueStore,
        CommitmentStore, AssumptionStore, PolicyVM,
        NegotiationSession,
    )
    from pathlib import Path

    dialogue = DialogueStore()
    commitments = CommitmentStore()
    assumptions = AssumptionStore()
    plan_store = {}
    sessions = {}
    policy_vm = PolicyVM()

    dispatcher = SpeechActDispatcher.build(
        dialogue, commitments, assumptions, plan_store, sessions, policy_vm
    )

    msg = AgentMessage(
        sender_id="planner",
        receiver_id="executor",
        act="propose",
        content={"id": "p1", "goal_ref": "g1", "steps": [], "constraints": []},
    )
    result = dispatcher.dispatch(msg)
    # → {"status": "proposed", "plan_id": "p1", "thread_id": ...}
"""

from .models import (
    AgentMessage, SpeechAct, Verifiability,
    EpistemicObject, Observation, Inference, Hypothesis,
    Assumption, Constraint, Goal, Plan, Risk,
    Commitment, Policy, Counterevidence,
    TKG_ELIGIBLE, EPISTEMIC_TYPES,
    CapabilityProfile, NegotiatedSession, negotiate_caps,
)
from .storage import (
    DialogueStore, DialogueThread,
    AssumptionStore,
    CommitmentStore,
    ProvenanceStore, ProvenanceNode,
)
from .runtime import (
    SpeechActDispatcher,
    NegotiationSession,
    CapabilityNegotiator,
    maybe_promote_to_tkg, promotion_summary,
    PolicyVM,
)

__all__ = [
    # Messages
    "AgentMessage", "SpeechAct", "Verifiability",
    # Epistemic objects
    "EpistemicObject", "Observation", "Inference", "Hypothesis",
    "Assumption", "Constraint", "Goal", "Plan", "Risk",
    "Commitment", "Policy", "Counterevidence",
    "TKG_ELIGIBLE", "EPISTEMIC_TYPES",
    # Capabilities
    "CapabilityProfile", "NegotiatedSession", "negotiate_caps",
    # Storage
    "DialogueStore", "DialogueThread",
    "AssumptionStore", "CommitmentStore",
    "ProvenanceStore", "ProvenanceNode",
    # Runtime
    "SpeechActDispatcher", "CapabilityNegotiator",
    "maybe_promote_to_tkg", "promotion_summary",
    "PolicyVM",
]
