"""
commitment_store.py
===================
Accepted promises / delegated duties.

A commitment is created when an agent confirms or accepts a delegation.
It is the accountability unit — drives auditing and trust updates.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from ..models.epistemic import Commitment


class CommitmentStore:
    def __init__(self) -> None:
        self._items: Dict[str, Commitment] = {}

    def record(self, commitment: Commitment) -> None:
        self._items[commitment.id] = commitment

    def get(self, commitment_id: str) -> Optional[Commitment]:
        return self._items.get(commitment_id)

    def mark_done(self, commitment_id: str) -> None:
        self._update_status(commitment_id, "done")

    def mark_failed(self, commitment_id: str) -> None:
        self._update_status(commitment_id, "failed")

    def cancel(self, commitment_id: str) -> None:
        self._update_status(commitment_id, "cancelled")

    def active(self) -> List[Commitment]:
        return [c for c in self._items.values() if c.status in ("pending", "active")]

    def for_agent(self, agent_id: str) -> List[Commitment]:
        return [c for c in self._items.values() if c.agent_id == agent_id]

    def for_thread(self, thread_id: str) -> List[Commitment]:
        return [c for c in self._items.values() if c.thread_id == thread_id]

    def _update_status(self, commitment_id: str, status: str) -> None:
        if commitment_id in self._items:
            self._items[commitment_id].status = status  # type: ignore[assignment]
