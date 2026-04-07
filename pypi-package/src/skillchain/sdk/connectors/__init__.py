"""
Connectors stub for standalone package.

The full connector suite (bank, calendar, health) requires the Velma
ecosystem.  This stub provides enough for the MCP server to start
without crashing.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class ConnectorRegistry:
    """Minimal connector registry."""
    _connectors: Dict[str, Any] = {}

    @classmethod
    def register(cls, connector: Any) -> None:
        cls._connectors[connector.name] = connector

    @classmethod
    def statuses(cls) -> List[Dict[str, Any]]:
        return [
            {"name": name, "connected": False, "records": 0}
            for name in cls._connectors
        ]


class _StubConnector:
    """Base stub that returns empty results for all queries."""

    name: str = "stub"

    def _not_connected(self) -> Dict[str, Any]:
        return {"error": f"{self.name} connector not available in standalone mode. Install the full Velma ecosystem for data connectors."}


class BankConnector(_StubConnector):
    name = "bank"

    def import_csv(self, csv_content: str) -> Dict[str, Any]:
        return self._not_connected()

    def spending_summary(self, days: int = 30) -> Dict[str, Any]:
        return self._not_connected()

    def find_subscriptions(self) -> List[Dict[str, Any]]:
        return []

    def query(self, **kwargs: Any) -> List[Dict[str, Any]]:
        return []


class CalendarConnector(_StubConnector):
    name = "calendar"

    def import_ics(self, ics_content: str) -> Dict[str, Any]:
        return self._not_connected()

    def query(self, **kwargs: Any) -> List[Dict[str, Any]]:
        return []

    def free_slots(self, date: str, work_start: str = "09:00", work_end: str = "17:00") -> List[Dict[str, Any]]:
        return []


class HealthConnector(_StubConnector):
    name = "health"

    def record(self, metric: str, value: float, date: Optional[str] = None) -> Dict[str, Any]:
        return self._not_connected()

    def import_apple_health(self, xml_content: str) -> Dict[str, Any]:
        return self._not_connected()

    def query(self, **kwargs: Any) -> List[Dict[str, Any]]:
        return []

    def trends(self, metric: str, days: int = 30) -> Dict[str, Any]:
        return self._not_connected()
