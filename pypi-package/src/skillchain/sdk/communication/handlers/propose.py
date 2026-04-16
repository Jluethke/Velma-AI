"""
propose.py — Handler for the "propose" speech act.

Validates the plan, runs policy check, saves to plan store,
and registers the negotiation session as "proposed".
"""

from __future__ import annotations

import uuid
from typing import Any, Dict

from .base import BaseHandler
from ..models.messages import AgentMessage
from ..storage.dialogue_store import DialogueStore


REQUIRED_PLAN_FIELDS = ("id", "goal_ref", "steps", "constraints")


class ProposeHandler(BaseHandler):
    def __init__(
        self,
        dialogue_store: DialogueStore,
        plan_store: Dict[str, Any],
        policy_vm: Any,
        negotiation_sessions: Dict[str, Any],
    ):
        self.dialogue = dialogue_store
        self.plan_store = plan_store
        self.policy_vm = policy_vm
        self.sessions = negotiation_sessions

    def handle(self, msg: AgentMessage) -> Dict[str, Any]:
        plan = msg.content or {}
        self._validate(plan)
        self.policy_vm.check_message(msg)

        self.plan_store[plan["id"]] = plan
        self.dialogue.append(msg.thread_id, msg)

        # Create or update negotiation session
        session = self.sessions.get(msg.thread_id)
        if session:
            session.proposal_id = plan["id"]
            session.current_version = str(plan.get("version", 1))
            session.state = "proposed"
        else:
            from ..runtime.negotiation import NegotiationSession
            self.sessions[msg.thread_id] = NegotiationSession(
                thread_id=msg.thread_id,
                proposal_id=plan["id"],
                current_version=str(plan.get("version", 1)),
                state="proposed",
                participants=[msg.sender_id],
            )

        return {"status": "proposed", "plan_id": plan["id"], "thread_id": msg.thread_id}

    def _validate(self, plan: Dict) -> None:
        for key in REQUIRED_PLAN_FIELDS:
            if key not in plan:
                raise ValueError(f"Proposal missing required field: {key!r}")
