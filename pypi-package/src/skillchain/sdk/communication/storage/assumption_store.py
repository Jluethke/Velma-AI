"""
assumption_store.py
===================
Provisional planning assumptions.

Key invariant: nothing here may be written to the TKG.
Assumptions exist only for the duration of a planning session
and must be explicitly withdrawn or allowed to expire.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from ..models.epistemic import Assumption


class AssumptionStore:
    def __init__(self) -> None:
        self._items: Dict[str, Assumption] = {}

    def put(self, assumption: Assumption) -> None:
        self._items[assumption.id] = assumption

    def get(self, assumption_id: str) -> Optional[Assumption]:
        return self._items.get(assumption_id)

    def withdraw(self, assumption_id: str) -> None:
        if assumption_id in self._items:
            self._items[assumption_id].status = "withdrawn"

    def active(self) -> List[Assumption]:
        return [a for a in self._items.values() if a.status == "active"]

    def for_scope(self, scope: str) -> List[Assumption]:
        return [a for a in self._items.values() if a.scope == scope]

    def purge_withdrawn(self) -> int:
        before = len(self._items)
        self._items = {k: v for k, v in self._items.items() if v.status != "withdrawn"}
        return before - len(self._items)
