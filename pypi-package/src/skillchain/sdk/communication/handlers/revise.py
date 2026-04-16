"""
revise.py — Handler for the "revise" speech act.

Replaces the current plan version, resolves the referenced challenge,
and moves the session back to "revised".
"""

from __future__ import annotations

from typing import Any, Dict

from .base import BaseHandler
from ..models.messages import AgentMessage
from ..storage.dialogue_store import DialogueStore


class ReviseHandler(BaseHandler):
    def __init__(
        self,
        dialogue_store: DialogueStore,
        plan_store: Dict[str, Any],
        negotiation_sessions: Dict[str, Any],
    ):
        self.dialogue = dialogue_store
        self.plan_store = plan_store
        self.sessions = negotiation_sessions

    def handle(self, msg: AgentMessage) -> Dict[str, Any]:
        plan = msg.content or {}
        if "id" not in plan:
            raise ValueError("Revision must include a plan with an 'id' field.")

        self.plan_store[plan["id"]] = plan
        self.dialogue.append(msg.thread_id, msg)

        session = self.sessions.get(msg.thread_id)
        if session:
            session.transition("revise")
            session.current_version = str(plan.get("version", session.current_version))
            # Resolve the challenge this revision addresses
            if msg.reply_to and msg.reply_to in session.open_challenges:
                session.open_challenges.remove(msg.reply_to)

        return {
            "status": "revised",
            "plan_id": plan["id"],
            "version": plan.get("version"),
            "thread_id": msg.thread_id,
        }
