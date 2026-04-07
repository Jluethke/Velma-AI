"""
exceptions.py
=============

Custom exception hierarchy for the SkillChain SDK.

All exceptions inherit from SkillChainError, enabling broad ``except
SkillChainError`` catches at the CLI boundary while still allowing
fine-grained handling deeper in the stack.
"""

from __future__ import annotations


class SkillChainError(Exception):
    """Base exception for all SkillChain SDK errors."""


class ValidationError(SkillChainError):
    """Raised when skill validation or manifest checks fail."""


class ChainError(SkillChainError):
    """Raised for on-chain transaction or RPC failures."""


class IPFSError(SkillChainError):
    """Raised for IPFS upload, download, or pinning failures."""


class IdentityError(SkillChainError):
    """Raised for key generation, identity resolution, or auth failures."""


class PackingError(SkillChainError):
    """Raised when .skillpack creation, extraction, or signing fails."""
