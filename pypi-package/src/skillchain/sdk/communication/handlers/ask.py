"""
ask.py — Handler for the "ask" speech act.

Records the question in the dialogue thread and returns an acknowledgement.
The actual answer is provided by a separate "answer" response message.
"""

from __future__ import annotations

from typing import Any, Dict

from .base import BaseHandler
from ..models.messages import AgentMessage
from ..storage.dialogue_store import DialogueStore


class AskHandler(BaseHandler):
    def __init__(self, dialogue_store: DialogueStore):
        self.dialogue = dialogue_store

    def handle(self, msg: AgentMessage) -> Dict[str, Any]:
        self.dialogue.append(msg.thread_id, msg)
        return {
            "status": "question_received",
            "thread_id": msg.thread_id,
            "message_id": msg.message_id,
        }
