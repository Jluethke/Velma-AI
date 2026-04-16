"""
base.py
=======
Base handler interface for speech act dispatch.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict

from ..models.messages import AgentMessage


class BaseHandler(ABC):
    @abstractmethod
    def handle(self, msg: AgentMessage) -> Dict[str, Any]:
        """Process a message. Returns a result dict."""
        ...
