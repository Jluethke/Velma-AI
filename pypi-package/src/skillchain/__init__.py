"""
SkillChain — Decentralized AI Skill Marketplace.

Publish once, works everywhere. Skills are validated procedures, not documents.
Quality proven by shadow testing, not reviews. Trust earned through competence.

Subpackages:
    skillchain.sdk           — Core SDK, CLI, adapters, node management
    skillchain.debugger      — Verified Fix Mode debug engine
    skillchain.solopreneur   — Idea-to-business launch engine
    skillchain.graduation    — Skill promotion and composition pipeline
    skillchain.governance_net — Neural trust model (GovernanceNet)
"""

from __future__ import annotations

# Re-export version from sdk
from skillchain.sdk import __version__

# Convenience re-exports for the most common entry points
from skillchain.sdk import SkillChainNode, SkillChainConfig, SkillChainError

__all__ = [
    "__version__",
    "SkillChainNode",
    "SkillChainConfig",
    "SkillChainError",
]
