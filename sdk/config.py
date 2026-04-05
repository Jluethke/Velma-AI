"""
config.py
=========

Configuration management for the SkillChain SDK.

Manages the ``~/.skillchain/`` directory tree::

    ~/.skillchain/
        config.json      -- RPC endpoints, IPFS gateway, network selection
        keystore.json    -- Encrypted private key + node identity
        trust_cache.json -- Cached peer trust scores
        skills/          -- Downloaded .skillpack cache
        validations/     -- Shadow-run validation results

Environment variable overrides (highest precedence):
    SKILLCHAIN_RPC_URL, SKILLCHAIN_IPFS_GATEWAY, SKILLCHAIN_PRIVATE_KEY

Network presets:
    BASE_SEPOLIA  -- Testnet (default)
    BASE_MAINNET  -- Production
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

from .exceptions import IdentityError

logger = logging.getLogger(__name__)

# -- Network presets ----------------------------------------------------------

NETWORK_PRESETS: Dict[str, Dict[str, str]] = {
    "sepolia": {
        "rpc_url": "https://sepolia.base.org",
        "chain_id": "84532",
        "ipfs_gateway": "https://gateway.pinata.cloud/ipfs/",
        "ipfs_api": "https://api.pinata.cloud",
        "explorer": "https://sepolia.basescan.org",
    },
    "mainnet": {
        "rpc_url": "https://mainnet.base.org",
        "chain_id": "8453",
        "ipfs_gateway": "https://gateway.pinata.cloud/ipfs/",
        "ipfs_api": "https://api.pinata.cloud",
        "explorer": "https://basescan.org",
    },
}


@dataclass
class SkillChainConfig:
    """Central configuration for the SkillChain SDK.

    Resolved in order: env vars > config.json > network preset defaults.
    """

    network: str = "sepolia"
    rpc_url: str = ""
    chain_id: str = ""
    ipfs_gateway: str = ""
    ipfs_api: str = ""
    ipfs_api_key: str = ""
    ipfs_provider: str = "auto"  # "pinata", "local", "public", "auto"
    pinata_api_key: str = ""  # from env var PINATA_API_KEY
    pinata_secret_key: str = ""  # from env var PINATA_SECRET_KEY
    explorer: str = ""
    private_key: str = ""
    node_id: str = ""
    agent_platform: str = "claude"
    domain_tags: list[str] = field(default_factory=list)

    # Paths (populated by resolve_paths)
    config_dir: Path = field(default_factory=lambda: Path.home() / ".skillchain")
    config_file: Path = field(default_factory=lambda: Path.home() / ".skillchain" / "config.json")
    keystore_file: Path = field(default_factory=lambda: Path.home() / ".skillchain" / "keystore.json")
    trust_cache_file: Path = field(default_factory=lambda: Path.home() / ".skillchain" / "trust_cache.json")
    skills_dir: Path = field(default_factory=lambda: Path.home() / ".skillchain" / "skills")
    validations_dir: Path = field(default_factory=lambda: Path.home() / ".skillchain" / "validations")

    # -- Factory ---------------------------------------------------------------

    @classmethod
    def load(cls, network: Optional[str] = None) -> SkillChainConfig:
        """Load configuration from disk + env vars + network preset.

        Args:
            network: Override network name (sepolia or mainnet).

        Returns:
            Fully resolved SkillChainConfig.
        """
        cfg = cls()
        cfg._resolve_paths()

        # Layer 1: network preset
        net = network or os.environ.get("SKILLCHAIN_NETWORK", "sepolia")
        preset = NETWORK_PRESETS.get(net, NETWORK_PRESETS["sepolia"])
        cfg.network = net
        cfg.rpc_url = preset["rpc_url"]
        cfg.chain_id = preset["chain_id"]
        cfg.ipfs_gateway = preset["ipfs_gateway"]
        cfg.ipfs_api = preset["ipfs_api"]
        cfg.explorer = preset["explorer"]

        # Layer 2: config.json on disk
        if cfg.config_file.exists():
            try:
                disk = json.loads(cfg.config_file.read_text(encoding="utf-8"))
                for key in ("rpc_url", "chain_id", "ipfs_gateway", "ipfs_api",
                            "ipfs_api_key", "explorer", "node_id", "domain_tags",
                            "agent_platform"):
                    if key in disk:
                        setattr(cfg, key, disk[key])
            except Exception as exc:
                logger.warning("Failed to read config.json: %s", exc)

        # Layer 3: env vars (highest precedence)
        if url := os.environ.get("SKILLCHAIN_RPC_URL"):
            cfg.rpc_url = url
        if gw := os.environ.get("SKILLCHAIN_IPFS_GATEWAY"):
            cfg.ipfs_gateway = gw
        if pk := os.environ.get("SKILLCHAIN_PRIVATE_KEY"):
            cfg.private_key = pk
        if api_key := os.environ.get("SKILLCHAIN_IPFS_API_KEY"):
            cfg.ipfs_api_key = api_key
        if ipfs_prov := os.environ.get("SKILLCHAIN_IPFS_PROVIDER"):
            cfg.ipfs_provider = ipfs_prov
        # Pinata keys (distinct from the generic ipfs_api_key)
        if pinata_key := os.environ.get("PINATA_API_KEY"):
            cfg.pinata_api_key = pinata_key
        if pinata_secret := os.environ.get("PINATA_SECRET_KEY"):
            cfg.pinata_secret_key = pinata_secret

        return cfg

    # -- Persistence -----------------------------------------------------------

    def save(self) -> None:
        """Write current config to ~/.skillchain/config.json."""
        self._resolve_paths()
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.skills_dir.mkdir(parents=True, exist_ok=True)
        self.validations_dir.mkdir(parents=True, exist_ok=True)

        # NOTE: private_key and ipfs_api_key are intentionally excluded
        # from the serialized config. They must be supplied via env vars
        # (SKILLCHAIN_PRIVATE_KEY, SKILLCHAIN_IPFS_API_KEY) or keystore.
        data = {
            "network": self.network,
            "rpc_url": self.rpc_url,
            "chain_id": self.chain_id,
            "ipfs_gateway": self.ipfs_gateway,
            "ipfs_api": self.ipfs_api,
            "explorer": self.explorer,
            "node_id": self.node_id,
            "agent_platform": self.agent_platform,
            "domain_tags": self.domain_tags,
        }
        self.config_file.write_text(
            json.dumps(data, indent=2), encoding="utf-8",
        )
        logger.info("Config saved to %s", self.config_file)

    def save_keystore(self, keystore_data: Dict[str, Any]) -> None:
        """Write keystore data (encrypted private key + node identity)."""
        self._resolve_paths()
        self.keystore_file.write_text(
            json.dumps(keystore_data, indent=2), encoding="utf-8",
        )
        # Restrict permissions on Unix
        try:
            self.keystore_file.chmod(0o600)
        except OSError:
            pass

    def load_keystore(self) -> Dict[str, Any]:
        """Load keystore data from disk."""
        if not self.keystore_file.exists():
            raise IdentityError(
                f"Keystore not found at {self.keystore_file}. "
                "Run 'skillchain init' first."
            )
        return json.loads(self.keystore_file.read_text(encoding="utf-8"))

    def load_trust_cache(self) -> Dict[str, float]:
        """Load cached trust scores."""
        if not self.trust_cache_file.exists():
            return {}
        try:
            return json.loads(self.trust_cache_file.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def save_trust_cache(self, cache: Dict[str, float]) -> None:
        """Persist trust cache to disk."""
        self.trust_cache_file.write_text(
            json.dumps(cache, indent=2), encoding="utf-8",
        )

    # -- Internal --------------------------------------------------------------

    def _resolve_paths(self) -> None:
        """Ensure all path fields point to the right places."""
        self.config_dir = Path.home() / ".skillchain"
        self.config_file = self.config_dir / "config.json"
        self.keystore_file = self.config_dir / "keystore.json"
        self.trust_cache_file = self.config_dir / "trust_cache.json"
        self.skills_dir = self.config_dir / "skills"
        self.validations_dir = self.config_dir / "validations"

    def to_dict(self) -> Dict[str, Any]:
        """Serialisable dictionary (excludes private key and paths)."""
        return {
            "network": self.network,
            "rpc_url": self.rpc_url,
            "chain_id": self.chain_id,
            "ipfs_gateway": self.ipfs_gateway,
            "explorer": self.explorer,
            "node_id": self.node_id,
            "agent_platform": self.agent_platform,
            "domain_tags": self.domain_tags,
        }
