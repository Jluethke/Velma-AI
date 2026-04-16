"""
challenge.py — Handler for the "challenge" speech act.

Records the challenge in the thread and moves the negotiation
session into "challenged" state.
"""

from __future__ import annotations

from typing import Any, Dict

from .base import BaseHandler
from ..models.messages import AgentMessage
from ..storage.dialogue_store import DialogueStore


class ChallengeHandler(BaseHandler):
    def __init__(
        self,
        dialogue_store: DialogueStore,
        negotiation_sessions: Dict[str, Any],
    ):
        self.dialogue = dialogue_store
        self.sessions = negotiation_sessions

    def handle(self, msg: AgentMessage) -> Dict[str, Any]:
        self.dialogue.append(msg.thread_id, msg)

        session = self.sessions.get(msg.thread_id)
        if session:
            if session.state not in ("proposed", "revised"):
                raise ValueError(
                    f"Cannot challenge from state={session.state!r}. "
                    "Expected 'proposed' or 'revised'."
                )
            session.transition("challenge")
            if msg.message_id not in session.open_challenges:
                session.open_challenges.append(msg.message_id)

        return {
            "status": "challenged",
            "challenge_id": msg.message_id,
            "thread_id": msg.thread_id,
        }
