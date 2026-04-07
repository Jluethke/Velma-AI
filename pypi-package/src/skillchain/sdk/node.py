"""
Stub SkillChainNode for standalone package.

The full node implementation requires web3, IPFS, and the Velma
ecosystem. This stub allows the CLI to import without crashing
and provides basic offline functionality.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .config import SkillChainConfig
from .exceptions import SkillChainError

logger = logging.getLogger(__name__)


class SkillChainNode:
    """Minimal node stub for standalone operation."""

    def __init__(self, config: SkillChainConfig):
        self.config = config
        self.node_id = config.node_id or "standalone"

    def register(self) -> str:
        """Register node (stub — returns local node ID)."""
        logger.warning("SkillChainNode.register() is a stub in standalone mode.")
        return self.node_id

    def publish(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        raise SkillChainError("Publishing requires the full Velma ecosystem (web3 + IPFS).")

    def discover(self, *args: Any, **kwargs: Any) -> List[Dict[str, Any]]:
        raise SkillChainError("On-chain discovery requires the full Velma ecosystem.")

    def validate(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        raise SkillChainError("On-chain validation requires the full Velma ecosystem.")

    def import_skill(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        raise SkillChainError("On-chain import requires the full Velma ecosystem.")
