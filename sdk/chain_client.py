"""
chain_client.py
===============

Web3.py client for interacting with SkillChain smart contracts on Base.

Handles gas estimation, nonce management, receipt waiting, and retry
with exponential backoff.  All on-chain reads are free (view calls);
writes require a funded wallet and consume gas.

The contracts use **bytes32** for skill IDs and node IDs, and the
**SkillToken** ERC-20 for all value transfer (no native ETH payments).

Usage::

    client = ChainClient(rpc_url, private_key, addresses)
    skill_id = client.register_skill(cid, "MySkill", "reasoning", ...)
    info = client.get_skill(skill_id)
"""

from __future__ import annotations

import hashlib
import logging
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from .exceptions import ChainError

logger = logging.getLogger(__name__)


# -- License enum (mirrors SkillRegistry.LicenseType) -------------------------

LICENSE_TYPES = {
    "MIT": 0,
    "APACHE2": 1,
    "GPL3": 2,
    "PROPRIETARY": 3,
}


@dataclass
class TransactionResult:
    """Result of a submitted transaction."""
    tx_hash: str
    block_number: int
    gas_used: int
    status: int  # 1 = success, 0 = revert


class ChainClient:
    """Web3.py wrapper for SkillChain contract interactions.

    Args:
        rpc_url: JSON-RPC endpoint (e.g. ``https://sepolia.base.org``).
        private_key: Hex-encoded private key for signing transactions.
        contract_addresses: Dict mapping contract names to deployed addresses.
        max_retries: Maximum retry count for failed transactions.
        gas_multiplier: Safety margin on gas estimates (1.2 = 20% buffer).
    """

    MAX_RETRIES = 3
    BACKOFF_BASE = 2.0

    def __init__(
        self,
        rpc_url: str,
        private_key: str,
        contract_addresses: Dict[str, str],
        max_retries: int = MAX_RETRIES,
        gas_multiplier: float = 1.2,
    ) -> None:
        self._rpc_url = rpc_url
        self._private_key = private_key
        self._addresses = contract_addresses
        self._max_retries = max_retries
        self._gas_multiplier = gas_multiplier

        self._w3 = None
        self._account = None
        self._contracts: Dict[str, Any] = {}
        self._nonce: Optional[int] = None

    # -- Lazy initialisation ---------------------------------------------------

    def _ensure_web3(self) -> None:
        """Lazily initialise web3 connection and contracts."""
        if self._w3 is not None:
            return

        try:
            from web3 import Web3
            from web3.middleware import ExtraDataToPOAMiddleware
        except ImportError as exc:
            raise ChainError(
                "web3 package not installed. Run: pip install web3>=6.0"
            ) from exc

        self._w3 = Web3(Web3.HTTPProvider(self._rpc_url))
        # Base is a PoA chain -- inject middleware
        try:
            self._w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        except Exception:
            pass

        if not self._w3.is_connected():
            raise ChainError(f"Cannot connect to RPC: {self._rpc_url}")

        if self._private_key:
            self._account = self._w3.eth.account.from_key(self._private_key)
        else:
            raise ChainError("Private key required for chain operations")

        self._load_contracts()

    def _load_contracts(self) -> None:
        """Load contract instances from ABIs and addresses."""
        from .contracts.abis import (
            GOVERNANCE_DAO_ABI,
            MARKETPLACE_ABI,
            NODE_REGISTRY_ABI,
            SKILL_REGISTRY_ABI,
            SKILL_TOKEN_ABI,
            STAKING_ABI,
            TRUST_ORACLE_ABI,
            VALIDATION_REGISTRY_ABI,
        )

        mapping = {
            "skill_token": SKILL_TOKEN_ABI,
            "skill_registry": SKILL_REGISTRY_ABI,
            "node_registry": NODE_REGISTRY_ABI,
            "trust_oracle": TRUST_ORACLE_ABI,
            "validation_registry": VALIDATION_REGISTRY_ABI,
            "marketplace": MARKETPLACE_ABI,
            "staking": STAKING_ABI,
            "governance_dao": GOVERNANCE_DAO_ABI,
        }

        for name, abi in mapping.items():
            addr = self._addresses.get(name)
            if addr and addr != "0x" + "0" * 40:
                self._contracts[name] = self._w3.eth.contract(
                    address=self._w3.to_checksum_address(addr),
                    abi=abi,
                )

    # -- Nonce management ------------------------------------------------------

    def _get_nonce(self) -> int:
        """Get the next nonce, tracking locally for rapid-fire txns."""
        if self._nonce is None:
            self._nonce = self._w3.eth.get_transaction_count(self._account.address)
        else:
            self._nonce += 1
        return self._nonce

    def _reset_nonce(self) -> None:
        """Force re-fetch nonce from chain."""
        self._nonce = None

    # -- Transaction plumbing --------------------------------------------------

    def _send_tx(self, contract_name: str, fn_name: str, *args: Any,
                 value: int = 0) -> TransactionResult:
        """Build, sign, send, and wait for a transaction.

        Retries with exponential backoff on transient failures.
        """
        self._ensure_web3()
        contract = self._contracts.get(contract_name)
        if contract is None:
            raise ChainError(f"Contract '{contract_name}' not loaded")

        fn = getattr(contract.functions, fn_name)(*args)

        for attempt in range(self._max_retries):
            try:
                nonce = self._get_nonce()
                tx = fn.build_transaction({
                    "from": self._account.address,
                    "nonce": nonce,
                    "value": value,
                    "gas": int(fn.estimate_gas({"from": self._account.address, "value": value})
                               * self._gas_multiplier),
                    "maxFeePerGas": self._w3.eth.gas_price * 2,
                    "maxPriorityFeePerGas": self._w3.to_wei(0.1, "gwei"),
                })
                signed = self._w3.eth.account.sign_transaction(tx, self._private_key)
                tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = self._w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

                if receipt["status"] == 0:
                    raise ChainError(f"Transaction reverted: {tx_hash.hex()}")

                return TransactionResult(
                    tx_hash=tx_hash.hex(),
                    block_number=receipt["blockNumber"],
                    gas_used=receipt["gasUsed"],
                    status=receipt["status"],
                )

            except ChainError:
                raise
            except Exception as exc:
                logger.warning(
                    "Transaction attempt %d/%d failed: %s",
                    attempt + 1, self._max_retries, exc,
                )
                self._reset_nonce()
                if attempt < self._max_retries - 1:
                    time.sleep(self.BACKOFF_BASE ** attempt)
                else:
                    raise ChainError(
                        f"Transaction '{fn_name}' failed after {self._max_retries} attempts: {exc}"
                    ) from exc

        raise ChainError(f"Transaction '{fn_name}' exhausted retries")  # unreachable

    def _call(self, contract_name: str, fn_name: str, *args: Any) -> Any:
        """Execute a read-only contract call."""
        self._ensure_web3()
        contract = self._contracts.get(contract_name)
        if contract is None:
            raise ChainError(f"Contract '{contract_name}' not loaded")

        fn = getattr(contract.functions, fn_name)(*args)
        try:
            return fn.call()
        except Exception as exc:
            raise ChainError(f"Call '{fn_name}' failed: {exc}") from exc

    # -- Helpers ---------------------------------------------------------------

    @property
    def wallet_address(self) -> str:
        """Return the wallet address derived from the private key."""
        self._ensure_web3()
        return self._account.address

    def get_balance(self) -> int:
        """Get ETH balance in wei."""
        self._ensure_web3()
        return self._w3.eth.get_balance(self._account.address)

    def make_hash(self, data: str) -> bytes:
        """Create a bytes32 hash from arbitrary string data."""
        return hashlib.sha256(data.encode()).digest()

    def _to_bytes32(self, value: str) -> bytes:
        """Convert a string node/skill ID to bytes32 for contract calls."""
        return hashlib.sha256(value.encode()).digest()

    def _get_node_id_bytes(self) -> bytes:
        """Get this wallet's registered node ID as bytes32."""
        self._ensure_web3()
        return self._call("node_registry", "ownerToNode", self._account.address)

    # -- Public API: SkillToken ------------------------------------------------

    def approve_tokens(self, spender: str, amount: int) -> TransactionResult:
        """Approve ``spender`` to transfer ``amount`` of SkillToken."""
        self._ensure_web3()
        return self._send_tx(
            "skill_token", "approve",
            self._w3.to_checksum_address(spender), amount,
        )

    def token_balance(self, address: Optional[str] = None) -> int:
        """Get SkillToken balance for an address (defaults to own wallet)."""
        self._ensure_web3()
        addr = self._w3.to_checksum_address(address) if address else self._account.address
        return self._call("skill_token", "balanceOf", addr)

    def token_allowance(self, owner: str, spender: str) -> int:
        """Get SkillToken allowance."""
        self._ensure_web3()
        return self._call(
            "skill_token", "allowance",
            self._w3.to_checksum_address(owner),
            self._w3.to_checksum_address(spender),
        )

    # -- Public API: Node operations -------------------------------------------

    def register_node(
        self,
        node_id: str,
        public_key: bytes,
        domain_tags: List[str],
    ) -> TransactionResult:
        """Register this node on-chain.

        Args:
            node_id: Human-readable node ID (hashed to bytes32).
            public_key: Node's public key bytes.
            domain_tags: List of domain expertise tags.
        """
        node_id_bytes = self._to_bytes32(node_id)
        return self._send_tx(
            "node_registry", "registerNode",
            node_id_bytes, public_key, domain_tags,
        )

    def deregister_node(self, node_id: str) -> TransactionResult:
        """Deregister a node from the network."""
        return self._send_tx(
            "node_registry", "deregisterNode",
            self._to_bytes32(node_id),
        )

    def get_node(self, node_id: str) -> Dict[str, Any]:
        """Fetch on-chain node info by node ID.

        Returns dict with: node_id, owner, public_key, domain_tags,
        stake_amount, active, registered_at.
        """
        result = self._call(
            "node_registry", "getNode",
            self._to_bytes32(node_id),
        )
        return {
            "node_id": result[0].hex() if isinstance(result[0], bytes) else result[0],
            "owner": result[1],
            "public_key": result[2],
            "domain_tags": result[3],
            "stake_amount": result[4],
            "active": result[5],
            "registered_at": result[6],
        }

    def is_node_registered(self, node_id: str) -> bool:
        """Check if a node ID is registered."""
        return self._call(
            "node_registry", "isRegistered",
            self._to_bytes32(node_id),
        )

    def owner_to_node(self, address: str) -> bytes:
        """Look up the node ID for a wallet address."""
        self._ensure_web3()
        return self._call(
            "node_registry", "ownerToNode",
            self._w3.to_checksum_address(address),
        )

    # -- Public API: Trust operations ------------------------------------------

    def report_trust(
        self,
        target_node_id: str,
        trust_score: int,
        evidence: bytes = b"",
    ) -> TransactionResult:
        """Submit a trust attestation for a peer node.

        Args:
            target_node_id: The target node's ID (hashed to bytes32).
            trust_score: Trust score (uint256, e.g. 0-10000 for basis points).
            evidence: Optional evidence bytes.
        """
        return self._send_tx(
            "trust_oracle", "reportTrust",
            self._to_bytes32(target_node_id),
            trust_score,
            evidence,
        )

    def get_trust_score(self, node_id: str) -> int:
        """Get aggregated trust score for a node (uint256)."""
        return self._call(
            "trust_oracle", "getTrustScore",
            self._to_bytes32(node_id),
        )

    def get_trust_weighted_vote(self, node_id: str) -> int:
        """Get trust-weighted voting power for a node."""
        return self._call(
            "trust_oracle", "getTrustWeightedVote",
            self._to_bytes32(node_id),
        )

    # -- Public API: Skill operations ------------------------------------------

    def register_skill(
        self,
        ipfs_cid: str,
        name: str,
        domain: str,
        tags: List[str],
        input_keys: List[str],
        output_keys: List[str],
        price: int = 0,
        license_type: str = "MIT",
    ) -> Tuple[bytes, TransactionResult]:
        """Register a new skill on-chain.

        Args:
            ipfs_cid: IPFS content identifier for the skill pack.
            name: Human-readable skill name.
            domain: Skill domain (e.g. "reasoning", "code").
            tags: Searchable tags.
            input_keys: Expected input parameter names.
            output_keys: Expected output parameter names.
            price: Price in SkillToken wei (0 = free).
            license_type: One of MIT, APACHE2, GPL3, PROPRIETARY.

        Returns:
            Tuple of (skill_id bytes32, transaction_result).
        """
        license_enum = LICENSE_TYPES.get(license_type.upper(), 0)
        result = self._send_tx(
            "skill_registry", "registerSkill",
            ipfs_cid, name, domain, tags, input_keys, output_keys,
            price, license_enum,
        )
        # Decode skill_id from SkillRegistered event logs
        skill_id = self._decode_event_bytes32(result, "skill_registry", "SkillRegistered", "skillId")
        return skill_id, result

    def update_skill(
        self,
        skill_id: bytes,
        new_ipfs_cid: str,
        new_price: int,
    ) -> TransactionResult:
        """Update an existing skill's CID and price."""
        return self._send_tx(
            "skill_registry", "updateSkill",
            skill_id, new_ipfs_cid, new_price,
        )

    def deactivate_skill(self, skill_id: bytes) -> TransactionResult:
        """Deactivate a skill (creator only)."""
        return self._send_tx("skill_registry", "deactivateSkill", skill_id)

    def get_skill(self, skill_id: bytes) -> Dict[str, Any]:
        """Fetch on-chain skill info.

        Args:
            skill_id: bytes32 skill identifier.

        Returns dict with: creator, ipfs_cid, name, domain, price,
        license_type, version, active, total_validations, success_rate.
        """
        result = self._call("skill_registry", "getSkill", skill_id)
        return {
            "creator": result[0],
            "ipfs_cid": result[1],
            "name": result[2],
            "domain": result[3],
            "price": result[4],
            "license_type": result[5],
            "version": result[6],
            "active": result[7],
            "total_validations": result[8],
            "success_rate": result[9],
        }

    # -- Public API: Validation ------------------------------------------------

    def submit_validation(
        self,
        skill_id: bytes,
        success: bool,
        shadow_run_count: int,
        match_count: int,
        avg_similarity: int,
        result_ipfs_cid: str = "",
    ) -> TransactionResult:
        """Submit a shadow validation result on-chain.

        Args:
            skill_id: bytes32 skill identifier.
            success: Whether the validation passed.
            shadow_run_count: Number of shadow runs performed.
            match_count: Number of runs that matched expected output.
            avg_similarity: Average similarity score (uint256, e.g. 0-10000 bps).
            result_ipfs_cid: IPFS CID for detailed results (optional).
        """
        return self._send_tx(
            "validation_registry", "submitValidation",
            skill_id, success, shadow_run_count, match_count,
            avg_similarity, result_ipfs_cid,
        )

    def get_validation_consensus(self, skill_id: bytes) -> Dict[str, Any]:
        """Get validation consensus for a skill.

        Returns dict with: has_consensus, num_validators, success_rate_bps.
        """
        result = self._call(
            "validation_registry", "getValidationConsensus", skill_id,
        )
        return {
            "has_consensus": result[0],
            "num_validators": result[1],
            "success_rate_bps": result[2],
        }

    def challenge_validation(
        self,
        skill_id: bytes,
        target_validation_idx: int,
    ) -> TransactionResult:
        """Challenge a specific validation result."""
        return self._send_tx(
            "validation_registry", "challengeValidation",
            skill_id, target_validation_idx,
        )

    def resolve_challenge(
        self,
        challenge_id: int,
        upheld: bool,
    ) -> TransactionResult:
        """Resolve a validation challenge (arbitrator only)."""
        return self._send_tx(
            "validation_registry", "resolveChallenge",
            challenge_id, upheld,
        )

    # -- Public API: Marketplace -----------------------------------------------

    def purchase_skill(self, skill_id: bytes) -> TransactionResult:
        """Purchase access to a skill (requires prior token approval)."""
        return self._send_tx("marketplace", "purchaseSkill", skill_id)

    def claim_royalties(self, skill_id: bytes) -> TransactionResult:
        """Claim accumulated royalties for a skill you created."""
        return self._send_tx("marketplace", "claimRoyalties", skill_id)

    def claim_validator_rewards(self, node_id: str) -> TransactionResult:
        """Claim accumulated validator rewards."""
        return self._send_tx(
            "marketplace", "claimValidatorRewards",
            self._to_bytes32(node_id),
        )

    def check_access(self, user_address: str, skill_id: bytes) -> bool:
        """Check if a user has access to a skill."""
        self._ensure_web3()
        return self._call(
            "marketplace", "checkAccess",
            self._w3.to_checksum_address(user_address), skill_id,
        )

    def subscribe(self, tier: int) -> TransactionResult:
        """Subscribe to a marketplace tier (requires prior token approval).

        Args:
            tier: Subscription tier (uint8 enum).
        """
        return self._send_tx("marketplace", "subscribe", tier)

    # -- Public API: Staking ---------------------------------------------------

    def stake(self, node_id: str, amount: int) -> TransactionResult:
        """Stake SkillTokens for a node (requires prior token approval).

        Args:
            node_id: Node ID string (hashed to bytes32).
            amount: Amount of SkillToken to stake (in wei).
        """
        return self._send_tx(
            "staking", "stake",
            self._to_bytes32(node_id), amount,
        )

    def unstake(self, node_id: str, amount: int) -> TransactionResult:
        """Request unstake (subject to cooldown).

        Args:
            node_id: Node ID string.
            amount: Amount to unstake.
        """
        return self._send_tx(
            "staking", "unstake",
            self._to_bytes32(node_id), amount,
        )

    def complete_unstake(self, node_id: str) -> TransactionResult:
        """Complete a pending unstake after cooldown period."""
        return self._send_tx(
            "staking", "completeUnstake",
            self._to_bytes32(node_id),
        )

    def get_stake(self, node_id: str) -> int:
        """Get staked amount for a node."""
        return self._call(
            "staking", "stakedAmount",
            self._to_bytes32(node_id),
        )

    def get_staking_tier(self, node_id: str) -> int:
        """Get staking tier for a node (0=None, 1=Bronze, 2=Silver, 3=Gold, 4=Diamond)."""
        return self._call(
            "staking", "getTier",
            self._to_bytes32(node_id),
        )

    # -- Public API: Governance ------------------------------------------------

    def propose(
        self,
        proposal_type: int,
        data: bytes,
        description: str,
    ) -> Tuple[int, TransactionResult]:
        """Submit a governance proposal.

        Args:
            proposal_type: Proposal type enum (uint8).
            data: Encoded proposal data.
            description: Human-readable description.

        Returns:
            Tuple of (proposal_id, transaction_result).
        """
        result = self._send_tx(
            "governance_dao", "propose",
            proposal_type, data, description,
        )
        # Decode proposal_id from ProposalCreated event
        proposal_id = self._decode_event_uint(result, "governance_dao", "ProposalCreated", "proposalId")
        return proposal_id, result

    def vote(self, proposal_id: int, support: bool) -> TransactionResult:
        """Vote on a governance proposal."""
        return self._send_tx(
            "governance_dao", "vote",
            proposal_id, support,
        )

    def execute_proposal(self, proposal_id: int) -> TransactionResult:
        """Execute a passed governance proposal after timelock."""
        return self._send_tx("governance_dao", "execute", proposal_id)

    # -- Event decoding helpers ------------------------------------------------

    def _decode_event_bytes32(
        self, tx_result: TransactionResult, contract_name: str,
        event_name: str, field: str,
    ) -> bytes:
        """Decode a bytes32 field from an event in the transaction receipt."""
        try:
            self._ensure_web3()
            contract = self._contracts.get(contract_name)
            if contract is None:
                return b"\x00" * 32

            receipt = self._w3.eth.get_transaction_receipt(tx_result.tx_hash)
            event = getattr(contract.events, event_name)()
            logs = event.process_receipt(receipt)
            if logs:
                return logs[0]["args"][field]
        except Exception as exc:
            logger.warning("Failed to decode event %s.%s: %s", event_name, field, exc)

        return b"\x00" * 32

    def _decode_event_uint(
        self, tx_result: TransactionResult, contract_name: str,
        event_name: str, field: str,
    ) -> int:
        """Decode a uint field from an event in the transaction receipt."""
        try:
            self._ensure_web3()
            contract = self._contracts.get(contract_name)
            if contract is None:
                return 0

            receipt = self._w3.eth.get_transaction_receipt(tx_result.tx_hash)
            event = getattr(contract.events, event_name)()
            logs = event.process_receipt(receipt)
            if logs:
                return logs[0]["args"][field]
        except Exception as exc:
            logger.warning("Failed to decode event %s.%s: %s", event_name, field, exc)

        return 0
