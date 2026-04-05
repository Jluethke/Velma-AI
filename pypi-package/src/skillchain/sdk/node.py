"""
node.py
=======

SkillChainNode -- the primary entry point for participating in the
SkillChain network.

A node encapsulates identity (key pair + on-chain registration), chain
interactions, IPFS content management, and skill lifecycle operations.

Usage::

    from skillchain.sdk import SkillChainNode
    from skillchain.sdk.config import SkillChainConfig

    config = SkillChainConfig.load()
    node = SkillChainNode(config)
    node.register()

    skill_id = node.publish_skill(Path("my_skill.md"))
    result = node.validate_skill(skill_id)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from .adapters import get_adapter
from .chain_client import ChainClient
from .config import SkillChainConfig
from .contracts.addresses import get_addresses
from .exceptions import ChainError, IdentityError, IPFSError, PackingError
from .ipfs_client import IPFSClient
from .shadow_runner import ShadowResult, ShadowRunner
from .skill_discovery import SkillDiscovery, SkillListing
from .skill_packer import (
    SkillManifest,
    SkillPackContents,
    pack,
    unpack,
    verify_provenance,
)

logger = logging.getLogger(__name__)


class SkillChainNode:
    """A participant node in the SkillChain network.

    Provides high-level operations for publishing, importing, and
    validating skills on the decentralized network.

    Args:
        config: SkillChainConfig instance.
    """

    def __init__(self, config: SkillChainConfig) -> None:
        self._config = config

        # Lazy-init components
        self._chain: Optional[ChainClient] = None
        self._ipfs: Optional[IPFSClient] = None
        self._shadow: ShadowRunner = ShadowRunner()
        self._discovery: Optional[SkillDiscovery] = None

        # Identity (loaded from keystore)
        self._node_id: str = config.node_id or ""
        self._wallet_address: str = ""
        self._domain_tags: List[str] = list(config.domain_tags)

    # -- Properties ------------------------------------------------------------

    @property
    def node_id(self) -> str:
        """This node's unique identifier."""
        return self._node_id

    @property
    def wallet_address(self) -> str:
        """This node's wallet address."""
        if not self._wallet_address and self._chain:
            self._wallet_address = self._chain.wallet_address
        return self._wallet_address

    @property
    def domain_tags(self) -> List[str]:
        """Domains this node specialises in."""
        return self._domain_tags

    @property
    def trust_score(self) -> float:
        """Fetch this node's on-chain trust score."""
        try:
            chain = self._get_chain()
            raw = chain.get_trust_score(self._node_id)
            return raw / 10_000  # stored as basis points -> [0, 1]
        except (ChainError, IdentityError):
            return 0.0

    @property
    def staking_tier(self) -> int:
        """Fetch this node's staking tier from chain."""
        try:
            chain = self._get_chain()
            return chain.get_staking_tier(self._node_id)
        except (ChainError, IdentityError):
            return 0

    # -- Lifecycle -------------------------------------------------------------

    def register(self) -> str:
        """Register this node on-chain.

        Generates a node ID if one doesn't exist, creates the keystore,
        and submits a registration transaction.

        Returns:
            The assigned node_id.

        Raises:
            IdentityError: If key generation or registration fails.
        """
        if not self._node_id:
            self._node_id = f"sc-{uuid.uuid4().hex[:12]}"
            self._config.node_id = self._node_id

        # Save config and keystore
        self._config.save()

        keystore = {
            "node_id": self._node_id,
            "wallet_address": self.wallet_address,
            "created_at": time.time(),
        }
        self._config.save_keystore(keystore)

        # Register on-chain
        try:
            chain = self._get_chain()
            # Use an empty public key placeholder; real key exchange happens
            # during peer-to-peer handshake.
            public_key = b"\x00" * 33
            chain.register_node(self._node_id, public_key, self._domain_tags)
            logger.info("Node registered: %s (wallet: %s)", self._node_id, self.wallet_address)
        except ChainError as exc:
            logger.warning("On-chain registration failed (offline mode): %s", exc)

        return self._node_id

    # -- Skill Publishing ------------------------------------------------------

    def publish_skill(
        self,
        skill_path: Path,
        manifest: Optional[SkillManifest] = None,
        test_cases: Optional[List[Dict[str, Any]]] = None,
        price: int = 0,
        license_type: str = "MIT",
    ) -> bytes:
        """Package, upload, and register a skill on the network.

        Args:
            skill_path: Path to the skill.md file.
            manifest: Skill manifest (auto-generated if None).
            test_cases: Shadow validation test cases.
            price: Skill price in SkillToken wei (0 = free).
            license_type: License identifier (MIT, APACHE2, GPL3, PROPRIETARY).

        Returns:
            On-chain skill_id (bytes32).

        Raises:
            PackingError: If packing fails.
            IPFSError: If IPFS upload fails.
            ChainError: If on-chain registration fails.
        """
        if not skill_path.exists():
            raise PackingError(f"Skill file not found: {skill_path}")

        # Auto-generate manifest if not provided
        if manifest is None:
            manifest = SkillManifest(
                name=skill_path.stem,
                version="1.0.0",
                domain="general",
                description=f"Skill: {skill_path.stem}",
                price=price,
                license=license_type,
                author_node_id=self._node_id,
            )

        # Pack into .skillpack
        identity = {
            "node_id": self._node_id,
            "wallet_address": self.wallet_address,
        }
        pack_path = pack(
            skill_path=skill_path,
            manifest=manifest,
            test_cases=test_cases,
            identity=identity,
            output_dir=self._config.skills_dir,
        )

        # Upload to IPFS
        ipfs = self._get_ipfs()
        pack_data = pack_path.read_bytes()
        cid = ipfs.upload(pack_data, name=pack_path.name)

        # Register on-chain
        chain = self._get_chain()
        skill_id, tx_result = chain.register_skill(
            ipfs_cid=cid,
            name=manifest.name,
            domain=manifest.domain,
            tags=manifest.tags,
            input_keys=manifest.inputs,
            output_keys=manifest.outputs,
            price=price,
            license_type=license_type,
        )

        logger.info(
            "Published skill '%s' -> skill_id=%s, cid=%s, tx=%s",
            manifest.name,
            skill_id.hex() if isinstance(skill_id, bytes) else skill_id,
            cid,
            tx_result.tx_hash,
        )

        return skill_id

    # -- Skill Import ----------------------------------------------------------

    def import_skill(
        self,
        skill_id: bytes,
        skip_validation: bool = False,
        target_dir: Optional[Path] = None,
    ) -> Path:
        """Download, validate, and install a skill from the network.

        Args:
            skill_id: On-chain skill ID (bytes32).
            skip_validation: Skip shadow validation (not recommended).
            target_dir: Where to install the skill (default: ~/.claude/skills/).

        Returns:
            Path to the installed skill.md file.

        Raises:
            ChainError: If skill lookup fails.
            IPFSError: If download fails.
            ValidationError: If shadow validation fails and skip_validation is False.
        """
        # Get skill info from chain
        chain = self._get_chain()
        info = chain.get_skill(skill_id)

        cid = info["ipfs_cid"]
        if not cid:
            raise IPFSError(f"Skill {skill_id.hex()} has no IPFS CID")

        # Download from IPFS
        ipfs = self._get_ipfs()
        skill_hex = skill_id.hex()[:16]
        pack_path = self._config.skills_dir / f"skill-{skill_hex}.skillpack"
        ipfs.download_to(cid, pack_path)

        # Unpack
        contents = unpack(pack_path)

        # Validate provenance
        if contents.provenance:
            if not verify_provenance(contents.provenance):
                logger.warning("Provenance verification failed for skill %s", skill_hex)

        # Shadow validation
        if not skip_validation and contents.test_cases:
            result = self._shadow.validate(contents.skill_content, contents.test_cases)
            if not result.passed:
                logger.warning(
                    "Skill %s failed shadow validation (%d/%d matched)",
                    skill_hex, result.match_count, result.shadow_count,
                )
                # Submit failed validation on-chain
                self._submit_validation(skill_id, result)
                from .exceptions import ValidationError as _VE
                raise _VE(
                    f"Skill {skill_hex} failed shadow validation "
                    f"({result.match_count}/{result.shadow_count} matched, "
                    f"avg_similarity={result.avg_similarity:.3f})"
                )
            # Submit passed validation
            self._submit_validation(skill_id, result)

        # Install via platform adapter
        adapter = get_adapter(self._config.agent_platform)
        skill_name = contents.manifest.name.replace(" ", "_").lower()

        manifest_dict = {
            "name": contents.manifest.name,
            "description": contents.manifest.description,
            "domain": contents.manifest.domain,
            "version": contents.manifest.version,
            "tags": contents.manifest.tags,
        }

        result = adapter.install(
            skill_content=contents.skill_content,
            skill_name=skill_name,
            manifest=manifest_dict,
            target_dir=target_dir,
        )

        logger.info(
            "Installed skill %s -> %s (platform: %s)",
            skill_hex, result.installed_path, adapter.platform_name,
        )

        # Track usage in user profile
        try:
            from .user_profile import ProfileManager
            pm = ProfileManager(config_dir=self._config.config_dir)
            if pm.exists():
                pm.update_usage(skill_name)
        except Exception:
            pass  # profile tracking is best-effort

        return result.installed_path

    # -- Validation ------------------------------------------------------------

    def validate_skill(self, skill_id: bytes) -> ShadowResult:
        """Run shadow validation on a network skill and report results.

        Performs 5 shadow runs, compares against test cases, and submits
        the validation result on-chain.

        Args:
            skill_id: On-chain skill ID (bytes32) to validate.

        Returns:
            ShadowResult with validation details.
        """
        # Get skill from chain + IPFS
        chain = self._get_chain()
        info = chain.get_skill(skill_id)

        ipfs = self._get_ipfs()
        skill_hex = skill_id.hex()[:16]
        pack_path = self._config.skills_dir / f"skill-{skill_hex}.skillpack"
        ipfs.download_to(info["ipfs_cid"], pack_path)

        contents = unpack(pack_path)

        if not contents.test_cases:
            from .exceptions import ValidationError
            raise ValidationError(f"Skill {skill_hex} has no test cases")

        # Run shadow validation
        result = self._shadow.validate(contents.skill_content, contents.test_cases)

        # Submit validation on-chain
        self._submit_validation(skill_id, result)

        logger.info(
            "Validated skill %s: %s (%d/%d, avg=%.3f)",
            skill_hex,
            "PASSED" if result.passed else "FAILED",
            result.match_count, result.shadow_count,
            result.avg_similarity,
        )

        # Track validation in user profile
        try:
            from .user_profile import ProfileManager
            pm = ProfileManager(config_dir=self._config.config_dir)
            if pm.exists():
                pm.update_usage(contents.manifest.name)
        except Exception:
            pass  # profile tracking is best-effort

        return result

    def _submit_validation(self, skill_id: bytes, result: ShadowResult) -> None:
        """Submit a validation result on-chain via ValidationRegistry."""
        try:
            chain = self._get_chain()
            # Convert avg_similarity from [0,1] float to basis points uint
            avg_sim_bps = int(result.avg_similarity * 10_000)
            chain.submit_validation(
                skill_id=skill_id,
                success=result.passed,
                shadow_run_count=result.shadow_count,
                match_count=result.match_count,
                avg_similarity=avg_sim_bps,
                result_ipfs_cid="",
            )
        except ChainError as exc:
            logger.warning("Failed to submit validation on-chain: %s", exc)

    # -- Trust & Staking -------------------------------------------------------

    def get_trust(self, node_id: str) -> float:
        """Get trust score for a node.

        Args:
            node_id: The target node's ID.

        Returns:
            Trust score in [0, 1] (converted from basis points).
        """
        try:
            chain = self._get_chain()
            raw = chain.get_trust_score(node_id)
            return raw / 10_000
        except ChainError:
            return 0.0

    def stake(self, amount: int) -> str:
        """Stake SkillTokens to increase node tier.

        Approves the staking contract to spend tokens, then stakes.

        Args:
            amount: Amount of SkillToken to stake (in wei).

        Returns:
            Transaction hash.
        """
        chain = self._get_chain()

        # Approve staking contract to spend tokens
        staking_addr = self._config_addresses().get("staking", "")
        if staking_addr and staking_addr != "0x" + "0" * 40:
            chain.approve_tokens(staking_addr, amount)

        result = chain.stake(self._node_id, amount)
        logger.info("Staked %d tokens, tx=%s", amount, result.tx_hash)
        return result.tx_hash

    def unstake(self, amount: int) -> str:
        """Request unstake of SkillTokens (subject to cooldown).

        Args:
            amount: Amount to unstake.

        Returns:
            Transaction hash.
        """
        chain = self._get_chain()
        result = chain.unstake(self._node_id, amount)
        logger.info("Unstake requested for %d tokens, tx=%s", amount, result.tx_hash)
        return result.tx_hash

    # -- Discovery passthrough -------------------------------------------------

    def discover(self, **kwargs: Any) -> List[SkillListing]:
        """Search for skills on the network.

        Kwargs are passed directly to SkillDiscovery.search().
        """
        disc = self._get_discovery()
        return disc.search(**kwargs)

    # -- Status ----------------------------------------------------------------

    def status(self) -> Dict[str, Any]:
        """Return full node status."""
        result: Dict[str, Any] = {
            "node_id": self._node_id,
            "wallet_address": self.wallet_address,
            "domain_tags": self._domain_tags,
            "network": self._config.network,
            "config_dir": str(self._config.config_dir),
        }

        try:
            chain = self._get_chain()
            balance = chain.get_balance()
            result["balance_wei"] = balance
            result["balance_eth"] = balance / 1e18
            result["token_balance"] = chain.token_balance()
        except (ChainError, IdentityError):
            result["balance_wei"] = 0
            result["balance_eth"] = 0.0
            result["token_balance"] = 0

        result["trust_score"] = self.trust_score
        result["staking_tier"] = self.staking_tier

        return result

    # -- Lazy component init ---------------------------------------------------

    def _get_chain(self) -> ChainClient:
        """Lazily initialise the chain client."""
        if self._chain is None:
            addresses = get_addresses(self._config.network)
            self._chain = ChainClient(
                rpc_url=self._config.rpc_url,
                private_key=self._config.private_key,
                contract_addresses=addresses,
            )
        return self._chain

    def _config_addresses(self) -> Dict[str, str]:
        """Return contract addresses for the configured network."""
        return get_addresses(self._config.network)

    def _get_ipfs(self) -> IPFSClient:
        """Lazily initialise the IPFS client."""
        if self._ipfs is None:
            self._ipfs = IPFSClient(
                api_url=self._config.ipfs_api,
                gateway_url=self._config.ipfs_gateway,
                api_key=self._config.ipfs_api_key,
            )
        return self._ipfs

    def _get_discovery(self) -> SkillDiscovery:
        """Lazily initialise the discovery engine."""
        if self._discovery is None:
            self._discovery = SkillDiscovery(chain_client=self._chain)
        return self._discovery
