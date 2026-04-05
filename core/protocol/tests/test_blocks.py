# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# Proprietary and Confidential.

"""Tests for skillchain.protocol.blocks — Block structure and chain storage."""

from __future__ import annotations

import pytest

from skillchain.core.protocol.blocks import (
    Block,
    BlockHeader,
    ChainStore,
    Transaction,
    TransactionType,
    compute_merkle_root,
    compute_state_root,
    create_genesis_block,
    validate_block,
)


class TestTransaction:
    """Test transaction creation and hashing."""

    def test_create_transaction(self) -> None:
        tx = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="sender_abc",
            payload={"skill_name": "hello_world"},
        )
        assert tx.tx_type == TransactionType.SKILL_PUBLISH
        assert tx.sender_id == "sender_abc"
        assert len(tx.tx_hash) == 64

    def test_hash_is_deterministic(self) -> None:
        tx1 = Transaction(
            tx_type=TransactionType.TRUST_ATTESTATION,
            sender_id="s1",
            payload={"x": 1},
            timestamp=1000.0,
        )
        tx2 = Transaction(
            tx_type=TransactionType.TRUST_ATTESTATION,
            sender_id="s1",
            payload={"x": 1},
            timestamp=1000.0,
        )
        assert tx1.tx_hash == tx2.tx_hash

    def test_different_payload_different_hash(self) -> None:
        tx1 = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="s", payload={"a": 1}, timestamp=1.0,
        )
        tx2 = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="s", payload={"a": 2}, timestamp=1.0,
        )
        assert tx1.tx_hash != tx2.tx_hash

    def test_roundtrip_dict(self) -> None:
        tx = Transaction(
            tx_type=TransactionType.SKILL_PURCHASE,
            sender_id="buyer",
            payload={"price": 100},
        )
        d = tx.to_dict()
        tx2 = Transaction.from_dict(d)
        assert tx2.tx_type == tx.tx_type
        assert tx2.sender_id == tx.sender_id
        assert tx2.tx_hash == tx.tx_hash


class TestMerkleRoot:
    """Test Merkle tree computation."""

    def test_empty_list(self) -> None:
        root = compute_merkle_root([])
        assert len(root) == 64

    def test_single_hash(self) -> None:
        h = "a" * 64
        root = compute_merkle_root([h])
        assert len(root) == 64

    def test_two_hashes(self) -> None:
        h1 = "a" * 64
        h2 = "b" * 64
        root = compute_merkle_root([h1, h2])
        assert len(root) == 64
        # Different from single
        assert root != compute_merkle_root([h1])

    def test_deterministic(self) -> None:
        hashes = ["ab" * 32, "cd" * 32, "ef" * 32]
        assert compute_merkle_root(hashes) == compute_merkle_root(hashes)

    def test_order_matters(self) -> None:
        h1 = "ab" * 32
        h2 = "cd" * 32
        assert compute_merkle_root([h1, h2]) != compute_merkle_root([h2, h1])


class TestBlock:
    """Test block creation and validation."""

    def test_genesis_block(self) -> None:
        genesis = create_genesis_block()
        assert genesis.height == 0
        assert genesis.header.prev_hash == "0" * 64
        assert len(genesis.hash) == 64

    def test_finalize_computes_hash(self) -> None:
        header = BlockHeader(
            height=1, epoch=0, slot=1, timestamp=1000.0,
            prev_hash="0" * 64, tx_root="", state_root="0" * 64,
            proposer_id="proposer", validator_count=3,
        )
        tx = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="s1", payload={"name": "skill_1"},
        )
        block = Block(header=header, transactions=[tx])
        block.finalize()

        assert len(block.hash) == 64
        assert block.header.tx_root != ""

    def test_validate_genesis(self) -> None:
        genesis = create_genesis_block()
        valid, err = validate_block(genesis, None)
        assert valid, f"Genesis validation failed: {err}"

    def test_validate_linked_blocks(self) -> None:
        genesis = create_genesis_block()

        header = BlockHeader(
            height=1, epoch=0, slot=1,
            timestamp=genesis.header.timestamp + 6.0,
            prev_hash=genesis.hash,
            tx_root="", state_root="0" * 64,
            proposer_id="p1", validator_count=3,
        )
        block1 = Block(header=header)
        block1.finalize()

        valid, err = validate_block(block1, genesis)
        assert valid, f"Block 1 validation failed: {err}"

    def test_validate_wrong_prev_hash(self) -> None:
        genesis = create_genesis_block()

        header = BlockHeader(
            height=1, epoch=0, slot=1,
            timestamp=genesis.header.timestamp + 6.0,
            prev_hash="f" * 64,  # Wrong!
            tx_root="", state_root="0" * 64,
            proposer_id="p1", validator_count=3,
        )
        block = Block(header=header)
        block.finalize()

        valid, err = validate_block(block, genesis)
        assert not valid
        assert "prev_hash" in err

    def test_validate_height_gap(self) -> None:
        genesis = create_genesis_block()

        header = BlockHeader(
            height=5,  # Gap!
            epoch=0, slot=1,
            timestamp=genesis.header.timestamp + 6.0,
            prev_hash=genesis.hash,
            tx_root="", state_root="0" * 64,
            proposer_id="p1", validator_count=3,
        )
        block = Block(header=header)
        block.finalize()

        valid, err = validate_block(block, genesis)
        assert not valid
        assert "Height" in err

    def test_roundtrip_dict(self) -> None:
        genesis = create_genesis_block()
        d = genesis.to_dict()
        restored = Block.from_dict(d)
        assert restored.hash == genesis.hash
        assert restored.height == genesis.height


class TestStateRoot:
    """Test state root computation."""

    def test_state_root_changes_with_transactions(self) -> None:
        tx1 = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="s", payload={"a": 1}, timestamp=1.0,
        )
        tx2 = Transaction(
            tx_type=TransactionType.TRUST_ATTESTATION,
            sender_id="s", payload={"b": 2}, timestamp=2.0,
        )
        root1 = compute_state_root("0" * 64, [tx1])
        root2 = compute_state_root("0" * 64, [tx1, tx2])
        assert root1 != root2

    def test_state_root_chains(self) -> None:
        tx = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="s", payload={}, timestamp=1.0,
        )
        root1 = compute_state_root("0" * 64, [tx])
        root2 = compute_state_root(root1, [tx])
        assert root1 != root2


class TestChainStore:
    """Test SQLite chain storage."""

    def test_empty_store(self) -> None:
        store = ChainStore(":memory:")
        assert store.get_chain_height() == -1
        assert store.get_latest_block() is None

    def test_put_and_get(self) -> None:
        store = ChainStore(":memory:")
        genesis = create_genesis_block()
        store.put_block(genesis)

        assert store.get_chain_height() == 0
        retrieved = store.get_block_by_height(0)
        assert retrieved is not None
        assert retrieved.hash == genesis.hash

    def test_get_by_hash(self) -> None:
        store = ChainStore(":memory:")
        genesis = create_genesis_block()
        store.put_block(genesis)

        retrieved = store.get_block_by_hash(genesis.hash)
        assert retrieved is not None
        assert retrieved.height == 0

    def test_latest_block(self) -> None:
        store = ChainStore(":memory:")
        genesis = create_genesis_block()
        store.put_block(genesis)

        header = BlockHeader(
            height=1, epoch=0, slot=1,
            timestamp=genesis.header.timestamp + 6.0,
            prev_hash=genesis.hash,
            tx_root="", state_root="0" * 64,
            proposer_id="p", validator_count=1,
        )
        block1 = Block(header=header)
        block1.finalize()
        store.put_block(block1)

        latest = store.get_latest_block()
        assert latest is not None
        assert latest.height == 1

    def test_duplicate_height_raises(self) -> None:
        store = ChainStore(":memory:")
        genesis = create_genesis_block()
        store.put_block(genesis)

        with pytest.raises(ValueError):
            store.put_block(genesis)

    def test_transactions_by_sender(self) -> None:
        store = ChainStore(":memory:")
        tx = Transaction(
            tx_type=TransactionType.SKILL_PUBLISH,
            sender_id="publisher_node",
            payload={"skill": "test"},
        )
        header = BlockHeader(
            height=0, epoch=0, slot=0, timestamp=1000.0,
            prev_hash="0" * 64, tx_root="", state_root="0" * 64,
            proposer_id="p", validator_count=1,
        )
        block = Block(header=header, transactions=[tx])
        block.finalize()
        store.put_block(block)

        txs = store.get_transactions_by_sender("publisher_node")
        assert len(txs) == 1
        assert txs[0].sender_id == "publisher_node"

    def test_blocks_in_epoch(self) -> None:
        store = ChainStore(":memory:")
        genesis = create_genesis_block()
        store.put_block(genesis)

        blocks = store.get_blocks_in_epoch(0)
        assert len(blocks) == 1

    def test_stats(self) -> None:
        store = ChainStore(":memory:")
        genesis = create_genesis_block()
        store.put_block(genesis)
        stats = store.stats()
        assert stats["chain_height"] == 0
