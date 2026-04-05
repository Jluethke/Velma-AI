# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# Proprietary and Confidential.

"""Tests for skillchain.protocol.identity — Node identity and Ed25519 crypto."""

from __future__ import annotations

import os
import tempfile

import pytest

from skillchain.core.protocol.identity import NodeIdentity


class TestNodeIdentityGeneration:
    """Test identity generation and basic properties."""

    def test_generate_creates_valid_identity(self) -> None:
        identity = NodeIdentity.generate()
        assert len(identity.node_id) == 64  # 32 bytes hex
        assert len(identity.wallet_address) == 40  # 20 bytes hex
        assert identity.domain_tags == ()

    def test_generate_with_domain_tags(self) -> None:
        identity = NodeIdentity.generate(domain_tags=("ml", "nlp"))
        assert identity.domain_tags == ("ml", "nlp")

    def test_node_id_is_sha256_of_pubkey(self) -> None:
        import hashlib
        identity = NodeIdentity.generate()
        expected = hashlib.sha256(identity.public_key_bytes).hexdigest()
        assert identity.node_id == expected

    def test_wallet_is_first_20_bytes_of_node_id(self) -> None:
        identity = NodeIdentity.generate()
        assert identity.wallet_address == identity.node_id[:40]

    def test_two_identities_are_different(self) -> None:
        a = NodeIdentity.generate()
        b = NodeIdentity.generate()
        assert a.node_id != b.node_id
        assert a.wallet_address != b.wallet_address

    def test_public_key_bytes_is_32_bytes(self) -> None:
        identity = NodeIdentity.generate()
        assert len(identity.public_key_bytes) == 32

    def test_public_key_hex_roundtrips(self) -> None:
        identity = NodeIdentity.generate()
        assert bytes.fromhex(identity.public_key_hex) == identity.public_key_bytes


class TestSignAndVerify:
    """Test Ed25519 sign/verify operations."""

    def test_sign_and_verify(self) -> None:
        identity = NodeIdentity.generate()
        data = b"hello skillchain"
        sig = identity.sign(data)
        assert len(sig) == 64  # Ed25519 signature is 64 bytes
        assert NodeIdentity.verify(data, sig, identity.public_key_bytes)

    def test_verify_wrong_data_fails(self) -> None:
        identity = NodeIdentity.generate()
        sig = identity.sign(b"correct data")
        assert not NodeIdentity.verify(b"wrong data", sig, identity.public_key_bytes)

    def test_verify_wrong_key_fails(self) -> None:
        a = NodeIdentity.generate()
        b = NodeIdentity.generate()
        sig = a.sign(b"test data")
        assert not NodeIdentity.verify(b"test data", sig, b.public_key_bytes)

    def test_verify_corrupted_signature_fails(self) -> None:
        identity = NodeIdentity.generate()
        sig = identity.sign(b"data")
        corrupted = bytes([sig[0] ^ 0xFF]) + sig[1:]
        assert not NodeIdentity.verify(b"data", corrupted, identity.public_key_bytes)

    def test_verify_invalid_key_returns_false(self) -> None:
        identity = NodeIdentity.generate()
        sig = identity.sign(b"data")
        assert not NodeIdentity.verify(b"data", sig, b"\x00" * 32)


class TestKeyPersistence:
    """Test saving and loading encrypted keys."""

    def test_save_and_load_roundtrip(self) -> None:
        identity = NodeIdentity.generate(domain_tags=("trading", "ml"))
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "test_key.json")
            identity.save(path, passphrase="test_pass_123")

            loaded = NodeIdentity.load(path, passphrase="test_pass_123")
            assert loaded.node_id == identity.node_id
            assert loaded.wallet_address == identity.wallet_address
            assert loaded.domain_tags == identity.domain_tags
            assert loaded.public_key_hex == identity.public_key_hex

    def test_load_wrong_passphrase_fails(self) -> None:
        identity = NodeIdentity.generate()
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "test_key.json")
            identity.save(path, passphrase="correct")

            with pytest.raises(Exception):
                NodeIdentity.load(path, passphrase="wrong")

    def test_loaded_identity_can_sign(self) -> None:
        identity = NodeIdentity.generate()
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "test_key.json")
            identity.save(path, passphrase="pass")
            loaded = NodeIdentity.load(path, passphrase="pass")

            sig = loaded.sign(b"test")
            assert NodeIdentity.verify(b"test", sig, identity.public_key_bytes)

    def test_load_nonexistent_file_raises(self) -> None:
        with pytest.raises(FileNotFoundError):
            NodeIdentity.load("/nonexistent/path/key.json", passphrase="x")


class TestPeerInfo:
    """Test peer info export."""

    def test_to_peer_info(self) -> None:
        identity = NodeIdentity.generate(domain_tags=("ml",))
        info = identity.to_peer_info()
        assert info["node_id"] == identity.node_id
        assert info["wallet_address"] == identity.wallet_address
        assert info["public_key"] == identity.public_key_hex
        assert info["domain_tags"] == ["ml"]
