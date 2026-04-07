"""
SkillChain SDK — Decentralized AI Skill-Sharing Network.

This package provides the Python SDK and CLI for participating in the
SkillChain network: publishing, discovering, importing, and validating
AI skills on a decentralized blockchain.

Quick start::

    from skillchain.sdk.config import SkillChainConfig
    from skillchain.sdk.skill_chain import SkillChain

    config = SkillChainConfig.load()
"""

from __future__ import annotations

__version__ = "0.2.0"

from .config import SkillChainConfig
from .exceptions import (
    ChainError,
    IdentityError,
    IPFSError,
    PackingError,
    SkillChainError,
    ValidationError,
)
from .chain_matcher import ChainMatch, ChainMatcher
from .gamification import GamificationEngine
from .skill_chain import ChainResult, SkillChain, SkillStep, StepResult
from .skill_state import PhaseResult, SkillRun, SkillState, SkillStateStore
from .agent_social import (
    ActivityEvent,
    AgentMatch,
    AgentMessage,
    AgentProfile,
    CollaborationRequest,
    SkillBounty,
    SocialManager,
    SuggestedTeam,
    compute_reputation_tier,
)
from .user_profile import (
    ChainRecommendation,
    ProfileManager,
    SkillRecommendation,
    UserProfile,
)

__all__ = [
    "SkillChainConfig",
    "SkillChainError",
    "ChainError",
    "IdentityError",
    "IPFSError",
    "PackingError",
    "ValidationError",
    "ChainResult",
    "SkillChain",
    "SkillStep",
    "StepResult",
    "PhaseResult",
    "SkillRun",
    "SkillState",
    "SkillStateStore",
    "ActivityEvent",
    "AgentMatch",
    "AgentMessage",
    "AgentProfile",
    "CollaborationRequest",
    "SkillBounty",
    "SocialManager",
    "SuggestedTeam",
    "compute_reputation_tier",
    "UserProfile",
    "ProfileManager",
    "SkillRecommendation",
    "ChainRecommendation",
    "ChainMatch",
    "ChainMatcher",
    "GamificationEngine",
    "__version__",
]
