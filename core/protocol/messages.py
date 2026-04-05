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
messages.py — Extended message types and wire format for SkillChain.

Extends the existing MeshMessage pattern with Ed25519 signatures,
canonical JSON serialization, and timestamp freshness checks.

All messages are signed by the sender's Ed25519 key. Recipients verify
the signature before processing. Messages older than MESSAGE_FRESHNESS_S
are rejected to prevent replay attacks.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Optional

from . import config
from .identity import NodeIdentity

import logging

logger = logging.getLogger("skillchain.protocol.messages")


class MessageType(str, Enum):
    """All SkillChain protocol message types."""

    # ── Peer Lifecycle ──
    HEARTBEAT = "heartbeat"
    JOIN = "join"
    LEAVE = "leave"
    ACK = "ack"
    LEADER_ELECT = "leader_elect"

    # ── Skill Operations ──
    SKILL_PUBLISH = "skill_publish"
    SKILL_QUERY = "skill_query"
    SKILL_QUERY_RESPONSE = "skill_query_response"
    SKILL_REQUEST = "skill_request"
    SKILL_TRANSFER = "skill_transfer"

    # ── Validation ──
    VALIDATION_REQUEST = "validation_request"
    VALIDATION_RESULT = "validation_result"
    VALIDATION_CHALLENGE = "validation_challenge"

    # ── Consensus ──
    BLOCK_PROPOSE = "block_propose"
    BLOCK_VOTE = "block_vote"
    BLOCK_COMMIT = "block_commit"
    EPOCH_BOUNDARY = "epoch_boundary"

    # ── Trust ──
    TRUST_ATTESTATION = "trust_attestation"
    TRUST_DISPUTE = "trust_dispute"


def _canonical_json(obj: dict) -> bytes:
    """Produce deterministic JSON bytes for signing.

    Keys are sorted, no whitespace, and values are serialized consistently.
    This ensures the same logical message always produces the same bytes
    for signature verification.

    Parameters
    ----------
    obj : dict
        The message payload to serialize.

    Returns
    -------
    bytes
        Canonical UTF-8 JSON bytes.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


@dataclass
class SignedMessage:
    """
    A cryptographically signed SkillChain protocol message.

    Every message carries an Ed25519 signature over the canonical JSON
    of (msg_type, sender_id, payload, msg_id, timestamp). Recipients
    MUST verify the signature before processing.

    Usage:
        # Create and sign
        msg = SignedMessage.create(
            msg_type=MessageType.HEARTBEAT,
            sender=identity,
            payload={"trust": 0.85},
        )

        # Serialize for wire
        wire = msg.serialize()

        # Deserialize and verify
        msg2 = SignedMessage.deserialize(wire)
        assert msg2.verify(sender_public_key)
    """

    msg_type: MessageType
    sender_id: str
    sender_public_key: str     # hex-encoded Ed25519 public key
    payload: dict[str, Any] = field(default_factory=dict)
    msg_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = field(default_factory=time.time)
    target_id: Optional[str] = None    # None = broadcast
    signature: str = ""                # hex-encoded Ed25519 signature

    @property
    def _signable_dict(self) -> dict:
        """The dict of fields that are covered by the signature."""
        d: dict[str, Any] = {
            "msg_type": self.msg_type.value,
            "sender_id": self.sender_id,
            "sender_public_key": self.sender_public_key,
            "payload": self.payload,
            "msg_id": self.msg_id,
            "timestamp": self.timestamp,
        }
        if self.target_id is not None:
            d["target_id"] = self.target_id
        return d

    @property
    def signable_bytes(self) -> bytes:
        """Canonical JSON bytes used for signing and verification."""
        return _canonical_json(self._signable_dict)

    def sign(self, identity: NodeIdentity) -> None:
        """Sign this message with the given identity.

        Parameters
        ----------
        identity : NodeIdentity
            The sender's identity (must match sender_id).
        """
        sig = identity.sign(self.signable_bytes)
        self.signature = sig.hex()

    def verify(self, public_key: Optional[bytes] = None) -> bool:
        """Verify the message signature.

        Parameters
        ----------
        public_key : bytes, optional
            The signer's raw 32-byte public key. If not provided,
            uses the sender_public_key field (hex-decoded).

        Returns
        -------
        bool
            True if the signature is valid.
        """
        if not self.signature:
            return False

        if public_key is None:
            try:
                public_key = bytes.fromhex(self.sender_public_key)
            except ValueError:
                return False

        try:
            sig_bytes = bytes.fromhex(self.signature)
        except ValueError:
            return False

        return NodeIdentity.verify(self.signable_bytes, sig_bytes, public_key)

    def is_fresh(self, max_age_s: float = config.MESSAGE_FRESHNESS_S) -> bool:
        """Check if the message timestamp is within the freshness window.

        Prevents replay attacks by rejecting old messages.

        Parameters
        ----------
        max_age_s : float
            Maximum allowed age in seconds.

        Returns
        -------
        bool
            True if the message is fresh enough.
        """
        return abs(time.time() - self.timestamp) <= max_age_s

    def message_hash(self) -> str:
        """SHA-256 hash of the signable content (used as dedup key)."""
        return hashlib.sha256(self.signable_bytes).hexdigest()

    # ── Serialization ──

    def serialize(self) -> str:
        """Serialize to JSON string for wire transmission.

        Returns
        -------
        str
            JSON string containing all message fields including signature.
        """
        d: dict[str, Any] = {
            "msg_type": self.msg_type.value,
            "sender_id": self.sender_id,
            "sender_public_key": self.sender_public_key,
            "payload": self.payload,
            "msg_id": self.msg_id,
            "timestamp": self.timestamp,
            "signature": self.signature,
        }
        if self.target_id is not None:
            d["target_id"] = self.target_id
        return json.dumps(d)

    @classmethod
    def deserialize(cls, data: str) -> SignedMessage:
        """Deserialize from JSON string.

        Parameters
        ----------
        data : str
            JSON string from wire.

        Returns
        -------
        SignedMessage
            The deserialized message (signature not yet verified).
        """
        d = json.loads(data)
        return cls(
            msg_type=MessageType(d["msg_type"]),
            sender_id=d["sender_id"],
            sender_public_key=d.get("sender_public_key", ""),
            payload=d.get("payload", {}),
            msg_id=d.get("msg_id", str(uuid.uuid4())),
            timestamp=d.get("timestamp", time.time()),
            target_id=d.get("target_id"),
            signature=d.get("signature", ""),
        )

    # ── Factory ──

    @classmethod
    def create(
        cls,
        msg_type: MessageType,
        sender: NodeIdentity,
        payload: dict[str, Any] | None = None,
        target_id: str | None = None,
    ) -> SignedMessage:
        """Create a signed message from a sender identity.

        Parameters
        ----------
        msg_type : MessageType
            The type of message.
        sender : NodeIdentity
            The sender's identity (used for sender_id, public_key, and signing).
        payload : dict, optional
            Message payload.
        target_id : str, optional
            Target node ID for directed messages (None for broadcast).

        Returns
        -------
        SignedMessage
            A signed message ready for wire transmission.
        """
        msg = cls(
            msg_type=msg_type,
            sender_id=sender.node_id,
            sender_public_key=sender.public_key_hex,
            payload=payload or {},
            target_id=target_id,
        )
        msg.sign(sender)
        return msg

    def __repr__(self) -> str:
        return (
            f"SignedMessage(type={self.msg_type.value}, "
            f"sender={self.sender_id[:12]}..., "
            f"id={self.msg_id[:8]})"
        )
