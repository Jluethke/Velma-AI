"""
dialogue_store.py
=================
Thread-keyed store for message history, unresolved questions,
pending challenges, and revisions.

NOT a fact store — dialogue is provisional and mutable.
"""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from ..models.messages import AgentMessage


@dataclass
class DialogueThread:
    thread_id: str
    participants: List[str] = field(default_factory=list)
    messages: List[AgentMessage] = field(default_factory=list)
    open_challenges: List[str] = field(default_factory=list)   # message_ids
    open_questions: List[str] = field(default_factory=list)    # message_ids
    status: str = "active"

    def append(self, msg: AgentMessage) -> None:
        self.messages.append(msg)
        if msg.sender_id not in self.participants:
            self.participants.append(msg.sender_id)
        if msg.act == "challenge":
            self.open_challenges.append(msg.message_id)
        elif msg.act == "ask":
            self.open_questions.append(msg.message_id)
        elif msg.act in ("answer", "confirm", "reject"):
            # resolve the most recent unanswered question
            if self.open_questions:
                self.open_questions.pop()
        elif msg.act == "revise":
            # a revision resolves the last challenge
            if self.open_challenges and msg.reply_to in self.open_challenges:
                self.open_challenges.remove(msg.reply_to)

    def last_message(self) -> Optional[AgentMessage]:
        return self.messages[-1] if self.messages else None

    def unresolved(self) -> bool:
        return bool(self.open_challenges or self.open_questions)


class DialogueStore:
    """In-memory dialogue store with optional disk persistence."""

    def __init__(self, persist_path: Optional[Path] = None):
        self._threads: Dict[str, DialogueThread] = {}
        self._persist_path = persist_path

    # ── Write ──────────────────────────────────────────────────────────────────

    def append(self, thread_id: str, msg: AgentMessage) -> None:
        if thread_id not in self._threads:
            self._threads[thread_id] = DialogueThread(thread_id=thread_id)
        self._threads[thread_id].append(msg)

    def close_thread(self, thread_id: str) -> None:
        if thread_id in self._threads:
            self._threads[thread_id].status = "closed"

    # ── Read ───────────────────────────────────────────────────────────────────

    def get_thread(self, thread_id: str) -> Optional[DialogueThread]:
        return self._threads.get(thread_id)

    def get_messages(self, thread_id: str) -> List[AgentMessage]:
        t = self._threads.get(thread_id)
        return t.messages if t else []

    def open_threads(self) -> List[DialogueThread]:
        return [t for t in self._threads.values() if t.status == "active"]

    def threads_with_open_challenges(self) -> List[DialogueThread]:
        return [t for t in self._threads.values() if t.open_challenges]

    # ── Persist ────────────────────────────────────────────────────────────────

    def save(self) -> None:
        if not self._persist_path:
            return
        self._persist_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            tid: {
                "thread_id": t.thread_id,
                "participants": t.participants,
                "messages": [m.to_dict() for m in t.messages],
                "open_challenges": t.open_challenges,
                "open_questions": t.open_questions,
                "status": t.status,
            }
            for tid, t in self._threads.items()
        }
        self._persist_path.write_text(json.dumps(data, indent=2, default=str))

    def load(self) -> None:
        if not self._persist_path or not self._persist_path.exists():
            return
        data = json.loads(self._persist_path.read_text())
        for tid, raw in data.items():
            thread = DialogueThread(
                thread_id=raw["thread_id"],
                participants=raw.get("participants", []),
                open_challenges=raw.get("open_challenges", []),
                open_questions=raw.get("open_questions", []),
                status=raw.get("status", "active"),
            )
            thread.messages = [AgentMessage.from_dict(m) for m in raw.get("messages", [])]
            self._threads[tid] = thread
