"""
confirm.py — Handler for the "confirm" speech act.

Records the confirmation, creates a Commitment in the CommitmentStore,
and marks the negotiation session as confirmed.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict

from .base import BaseHandler
from ..models.messages import AgentMessage
from ..models.epistemic import Commitment
from ..storage.dialogue_store import DialogueStore
from ..storage.commitment_store import CommitmentStore


class ConfirmHandler(BaseHandler):
    def __init__(
        self,
        dialogue_store: DialogueStore,
        commitment_store: CommitmentStore,
        plan_store: Dict[str, Any],
        negotiation_sessions: Dict[str, Any],
    ):
        self.dialogue = dialogue_store
        self.commitments = commitment_store
        self.plan_store = plan_store
        self.sessions = negotiation_sessions

    def handle(self, msg: AgentMessage) -> Dict[str, Any]:
        self.dialogue.append(msg.thread_id, msg)

        session = self.sessions.get(msg.thread_id)
        if session:
            if session.open_challenges:
                raise ValueError(
                    f"Cannot confirm: {len(session.open_challenges)} open challenge(s) remain."
                )
            session.transition("confirm")

        # Record the commitment
        plan = self.plan_store.get(session.proposal_id if session else "") or {}
        commitment = Commitment(
            id=str(uuid.uuid4()),
            agent_id=msg.sender_id,
            action=f"Execute plan {plan.get('id', 'unknown')}",
            preconditions=plan.get("constraints", []),
            thread_id=msg.thread_id,
            plan_ref=plan.get("id"),
            status="active",
        )
        self.commitments.record(commitment)

        return {
            "status": "confirmed",
            "commitment_id": commitment.id,
            "thread_id": msg.thread_id,
        }
