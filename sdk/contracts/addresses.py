"""
addresses.py
============

Deployed contract addresses per network.

Update with real addresses after each deployment.
"""

from __future__ import annotations

from typing import Dict

_ZERO = "0x0000000000000000000000000000000000000000"

# Contract name -> address, keyed by network
CONTRACT_ADDRESSES: Dict[str, Dict[str, str]] = {
    "base_sepolia": {
        "skill_token": _ZERO,
        "node_registry": _ZERO,
        "skill_registry": _ZERO,
        "trust_oracle": _ZERO,
        "validation_registry": _ZERO,
        "marketplace": _ZERO,
        "staking": _ZERO,
        "governance_dao": _ZERO,
    },
    "base_mainnet": {
        "skill_token": _ZERO,
        "node_registry": _ZERO,
        "skill_registry": _ZERO,
        "trust_oracle": _ZERO,
        "validation_registry": _ZERO,
        "marketplace": _ZERO,
        "staking": _ZERO,
        "governance_dao": _ZERO,
    },
    # Local anvil deployment (chain 31337)
    "localhost": {
        "skill_token": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "node_registry": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        "skill_registry": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        "trust_oracle": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        "validation_registry": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        "staking": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
        "marketplace": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
        "governance_dao": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    },
    # Legacy aliases
    "sepolia": {
        "skill_token": _ZERO,
        "node_registry": _ZERO,
        "skill_registry": _ZERO,
        "trust_oracle": _ZERO,
        "validation_registry": _ZERO,
        "marketplace": _ZERO,
        "staking": _ZERO,
        "governance_dao": _ZERO,
    },
    "mainnet": {
        "skill_token": _ZERO,
        "node_registry": _ZERO,
        "skill_registry": _ZERO,
        "trust_oracle": _ZERO,
        "validation_registry": _ZERO,
        "marketplace": _ZERO,
        "staking": _ZERO,
        "governance_dao": _ZERO,
    },
}


def get_addresses(network: str) -> Dict[str, str]:
    """Return contract addresses for the given network.

    Args:
        network: ``"base_sepolia"``, ``"base_mainnet"``, ``"sepolia"``, or ``"mainnet"``.

    Returns:
        Dict mapping contract name to deployed address.
    """
    return CONTRACT_ADDRESSES.get(network, CONTRACT_ADDRESSES["base_sepolia"])
