# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
identity.py — Node identity for SkillChain network.

Each node has an Ed25519 keypair that provides:
- node_id:         SHA-256 of public key (32 bytes, hex)
- wallet_address:  First 20 bytes of node_id (hex)
- domain_tags:     Declared skill domains this node participates in
- sign/verify:     Ed25519 signatures over arbitrary data

Key storage uses Fernet symmetric encryption with a passphrase-derived key
so private keys are never stored in plaintext on disk.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger("skillchain.protocol.identity")


def _derive_fernet_key(passphrase: str, salt: bytes) -> bytes:
    """Derive a Fernet-compatible key from a passphrase using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase.encode("utf-8")))


@dataclass
class NodeIdentity:
    """
    Cryptographic identity for a SkillChain node.

    Wraps an Ed25519 keypair and derives node_id (SHA-256 of public key)
    and wallet_address (first 20 bytes of node_id).

    Usage:
        # Generate a new identity
        identity = NodeIdentity.generate(domain_tags=("ml", "nlp"))

        # Sign data
        sig = identity.sign(b"hello")

        # Verify with public key
        assert NodeIdentity.verify(b"hello", sig, identity.public_key_bytes)

        # Save encrypted
        identity.save("/path/to/key.json", passphrase="secret")

        # Load from disk
        loaded = NodeIdentity.load("/path/to/key.json", passphrase="secret")
    """

    _private_key: Ed25519PrivateKey
    _public_key: Ed25519PublicKey
    domain_tags: tuple[str, ...] = field(default_factory=tuple)

    # Derived (set in __post_init__)
    node_id: str = field(init=False)
    wallet_address: str = field(init=False)

    def __post_init__(self) -> None:
        pub_bytes = self._public_key.public_bytes(
            serialization.Encoding.Raw,
            serialization.PublicFormat.Raw,
        )
        digest = hashlib.sha256(pub_bytes).digest()
        self.node_id = digest.hex()
        self.wallet_address = digest[:20].hex()

    @property
    def public_key_bytes(self) -> bytes:
        """Raw 32-byte Ed25519 public key."""
        return self._public_key.public_bytes(
            serialization.Encoding.Raw,
            serialization.PublicFormat.Raw,
        )

    @property
    def public_key_hex(self) -> str:
        """Hex-encoded public key for wire transmission."""
        return self.public_key_bytes.hex()

    def sign(self, data: bytes) -> bytes:
        """Sign arbitrary data with this node's private key.

        Parameters
        ----------
        data : bytes
            The data to sign.

        Returns
        -------
        bytes
            64-byte Ed25519 signature.
        """
        return self._private_key.sign(data)

    @staticmethod
    def verify(data: bytes, signature: bytes, public_key: bytes) -> bool:
        """Verify an Ed25519 signature against a public key.

        Parameters
        ----------
        data : bytes
            The original signed data.
        signature : bytes
            The 64-byte Ed25519 signature.
        public_key : bytes
            The 32-byte raw public key of the signer.

        Returns
        -------
        bool
            True if signature is valid, False otherwise.
        """
        try:
            pub = Ed25519PublicKey.from_public_bytes(public_key)
            pub.verify(signature, data)
            return True
        except Exception:
            return False

    # ── Factory Methods ──

    @classmethod
    def generate(
        cls,
        domain_tags: tuple[str, ...] = (),
    ) -> NodeIdentity:
        """Generate a new random Ed25519 identity.

        Parameters
        ----------
        domain_tags : tuple[str, ...]
            Skill domain tags this node declares competence in.

        Returns
        -------
        NodeIdentity
            A fresh identity with a new keypair.
        """
        private_key = Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        identity = cls(
            _private_key=private_key,
            _public_key=public_key,
            domain_tags=domain_tags,
        )
        logger.info(
            "Generated identity node_id=%s...%s wallet=%s domains=%s",
            identity.node_id[:8], identity.node_id[-4:],
            identity.wallet_address[:12],
            domain_tags,
        )
        return identity

    def save(self, path: str | Path, passphrase: str) -> None:
        """Save identity to disk with Fernet encryption.

        The private key is encrypted with a key derived from the passphrase
        via PBKDF2. The public key and metadata are stored in plaintext.

        Parameters
        ----------
        path : str | Path
            File path to write the identity JSON.
        passphrase : str
            Passphrase for encrypting the private key.
        """
        path = Path(path)
        salt = os.urandom(16)
        fernet_key = _derive_fernet_key(passphrase, salt)
        fernet = Fernet(fernet_key)

        private_bytes = self._private_key.private_bytes(
            serialization.Encoding.Raw,
            serialization.PrivateFormat.Raw,
            serialization.NoEncryption(),
        )
        encrypted_private = fernet.encrypt(private_bytes)

        doc = {
            "version": 1,
            "node_id": self.node_id,
            "wallet_address": self.wallet_address,
            "public_key": self.public_key_hex,
            "encrypted_private_key": base64.b64encode(encrypted_private).decode(),
            "salt": base64.b64encode(salt).decode(),
            "domain_tags": list(self.domain_tags),
        }

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(doc, indent=2), encoding="utf-8")
        logger.info("Saved identity to %s", path)

    @classmethod
    def load(cls, path: str | Path, passphrase: str) -> NodeIdentity:
        """Load identity from an encrypted key file.

        Parameters
        ----------
        path : str | Path
            Path to the identity JSON file.
        passphrase : str
            Passphrase to decrypt the private key.

        Returns
        -------
        NodeIdentity
            The loaded identity.

        Raises
        ------
        FileNotFoundError
            If the key file doesn't exist.
        cryptography.fernet.InvalidToken
            If the passphrase is wrong.
        """
        path = Path(path)
        doc = json.loads(path.read_text(encoding="utf-8"))

        salt = base64.b64decode(doc["salt"])
        fernet_key = _derive_fernet_key(passphrase, salt)
        fernet = Fernet(fernet_key)

        encrypted_private = base64.b64decode(doc["encrypted_private_key"])
        private_bytes = fernet.decrypt(encrypted_private)

        private_key = Ed25519PrivateKey.from_private_bytes(private_bytes)
        public_key = private_key.public_key()
        domain_tags = tuple(doc.get("domain_tags", []))

        identity = cls(
            _private_key=private_key,
            _public_key=public_key,
            domain_tags=domain_tags,
        )
        logger.info(
            "Loaded identity node_id=%s...%s from %s",
            identity.node_id[:8], identity.node_id[-4:], path,
        )
        return identity

    def to_peer_info(self) -> dict:
        """Export public identity info for peer exchange.

        Returns a dict suitable for wire transmission (no private key).
        """
        return {
            "node_id": self.node_id,
            "wallet_address": self.wallet_address,
            "public_key": self.public_key_hex,
            "domain_tags": list(self.domain_tags),
        }

    def __repr__(self) -> str:
        return (
            f"NodeIdentity(node_id={self.node_id[:12]}..., "
            f"wallet={self.wallet_address[:12]}..., "
            f"domains={self.domain_tags})"
        )
