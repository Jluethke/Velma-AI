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
blocks.py — Block structure, chain storage, and state root computation.

SkillChain blocks contain transactions for skill operations:
- SkillPublish:       Register a new skill on-chain
- TrustAttestation:   Record a trust attestation
- ValidationResult:   Record a skill validation outcome
- SkillPurchase:      Record a skill acquisition

Blocks are linked by prev_hash and contain a Merkle root of transactions
plus a state root representing cumulative chain state.

Storage uses SQLite for persistence with an in-memory cache for
recent blocks.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import hashlib
import json
import logging
import sqlite3
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional

logger = logging.getLogger("skillchain.protocol.blocks")


class TransactionType(str, Enum):
    """Types of transactions in a SkillChain block."""
    SKILL_PUBLISH = "skill_publish"
    TRUST_ATTESTATION = "trust_attestation"
    VALIDATION_RESULT = "validation_result"
    SKILL_PURCHASE = "skill_purchase"


@dataclass
class Transaction:
    """
    A single transaction in a SkillChain block.

    Transactions are the atomic units of state change. Each transaction
    carries a type, the sender, and type-specific data in the payload.
    """

    tx_type: TransactionType
    sender_id: str
    payload: dict = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    tx_hash: str = ""
    signature: str = ""

    def __post_init__(self) -> None:
        if not self.tx_hash:
            self.tx_hash = self.compute_hash()

    def compute_hash(self) -> str:
        """Compute the SHA-256 hash of this transaction.

        Returns
        -------
        str
            Hex-encoded SHA-256 hash of the canonical transaction data.
        """
        d = {
            "tx_type": self.tx_type.value,
            "sender_id": self.sender_id,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }
        canonical = json.dumps(d, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()

    def to_dict(self) -> dict:
        """Serialize to a dict for storage."""
        return {
            "tx_type": self.tx_type.value,
            "sender_id": self.sender_id,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "tx_hash": self.tx_hash,
            "signature": self.signature,
        }

    @classmethod
    def from_dict(cls, d: dict) -> Transaction:
        """Deserialize from a dict."""
        return cls(
            tx_type=TransactionType(d["tx_type"]),
            sender_id=d["sender_id"],
            payload=d.get("payload", {}),
            timestamp=d.get("timestamp", time.time()),
            tx_hash=d.get("tx_hash", ""),
            signature=d.get("signature", ""),
        )


def compute_merkle_root(hashes: list[str]) -> str:
    """Compute the Merkle root of a list of hex-encoded hashes.

    Uses SHA-256 to combine pairs of hashes bottom-up. If the number
    of hashes at any level is odd, the last hash is duplicated.

    Parameters
    ----------
    hashes : list[str]
        Hex-encoded hashes (e.g., transaction hashes).

    Returns
    -------
    str
        Hex-encoded Merkle root hash.
    """
    if not hashes:
        return hashlib.sha256(b"empty").hexdigest()

    # Convert to bytes
    level = [bytes.fromhex(h) for h in hashes]

    while len(level) > 1:
        next_level: list[bytes] = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else level[i]
            combined = hashlib.sha256(left + right).digest()
            next_level.append(combined)
        level = next_level

    return level[0].hex()


@dataclass
class BlockHeader:
    """
    Header of a SkillChain block.

    Contains all metadata needed to verify the block without loading
    the full transaction list.
    """

    height: int
    epoch: int
    slot: int
    timestamp: float
    prev_hash: str
    tx_root: str          # Merkle root of transactions
    state_root: str       # Cumulative state root
    proposer_id: str
    validator_count: int
    block_hash: str = ""

    def compute_hash(self) -> str:
        """Compute the SHA-256 hash of this block header.

        Returns
        -------
        str
            Hex-encoded SHA-256 hash of the canonical header data.
        """
        d = {
            "height": self.height,
            "epoch": self.epoch,
            "slot": self.slot,
            "timestamp": self.timestamp,
            "prev_hash": self.prev_hash,
            "tx_root": self.tx_root,
            "state_root": self.state_root,
            "proposer_id": self.proposer_id,
            "validator_count": self.validator_count,
        }
        canonical = json.dumps(d, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()


@dataclass
class Block:
    """
    A complete SkillChain block with header and transactions.

    Blocks are immutable once committed. The block_hash in the header
    covers all header fields (which includes the Merkle root of txs).
    """

    header: BlockHeader
    transactions: list[Transaction] = field(default_factory=list)
    signatures: dict[str, str] = field(default_factory=dict)  # validator_id -> sig hex

    def finalize(self) -> None:
        """Compute the Merkle root and block hash.

        Call this after adding all transactions and before proposing
        the block to the network.
        """
        tx_hashes = [tx.tx_hash for tx in self.transactions]
        self.header.tx_root = compute_merkle_root(tx_hashes)
        self.header.block_hash = self.header.compute_hash()

    @property
    def hash(self) -> str:
        return self.header.block_hash

    @property
    def height(self) -> int:
        return self.header.height

    def to_dict(self) -> dict:
        """Serialize the full block to a dict."""
        return {
            "header": {
                "height": self.header.height,
                "epoch": self.header.epoch,
                "slot": self.header.slot,
                "timestamp": self.header.timestamp,
                "prev_hash": self.header.prev_hash,
                "tx_root": self.header.tx_root,
                "state_root": self.header.state_root,
                "proposer_id": self.header.proposer_id,
                "validator_count": self.header.validator_count,
                "block_hash": self.header.block_hash,
            },
            "transactions": [tx.to_dict() for tx in self.transactions],
            "signatures": self.signatures,
        }

    @classmethod
    def from_dict(cls, d: dict) -> Block:
        """Deserialize a block from a dict."""
        h = d["header"]
        header = BlockHeader(
            height=h["height"],
            epoch=h["epoch"],
            slot=h["slot"],
            timestamp=h["timestamp"],
            prev_hash=h["prev_hash"],
            tx_root=h["tx_root"],
            state_root=h["state_root"],
            proposer_id=h["proposer_id"],
            validator_count=h["validator_count"],
            block_hash=h.get("block_hash", ""),
        )
        transactions = [Transaction.from_dict(t) for t in d.get("transactions", [])]
        signatures = d.get("signatures", {})
        return cls(header=header, transactions=transactions, signatures=signatures)


def validate_block(block: Block, prev_block: Optional[Block]) -> tuple[bool, str]:
    """Validate a block against the previous block.

    Checks:
    1. Block hash matches computed hash
    2. Transaction Merkle root matches
    3. Previous hash links correctly
    4. Height is sequential
    5. Timestamp is non-decreasing

    Parameters
    ----------
    block : Block
        The block to validate.
    prev_block : Block or None
        The previous block (None for genesis).

    Returns
    -------
    tuple[bool, str]
        (is_valid, error_message). If valid, error_message is empty.
    """
    # Verify tx root
    tx_hashes = [tx.tx_hash for tx in block.transactions]
    expected_tx_root = compute_merkle_root(tx_hashes)
    if block.header.tx_root != expected_tx_root:
        return False, f"tx_root mismatch: expected {expected_tx_root[:16]}, got {block.header.tx_root[:16]}"

    # Verify block hash
    expected_hash = block.header.compute_hash()
    if block.header.block_hash != expected_hash:
        return False, f"block_hash mismatch: expected {expected_hash[:16]}, got {block.header.block_hash[:16]}"

    if prev_block is None:
        # Genesis block
        if block.header.height != 0:
            return False, f"Genesis block must have height 0, got {block.header.height}"
        return True, ""

    # Check linkage
    if block.header.prev_hash != prev_block.header.block_hash:
        return False, "prev_hash does not match previous block"

    if block.header.height != prev_block.header.height + 1:
        return False, f"Height gap: expected {prev_block.header.height + 1}, got {block.header.height}"

    if block.header.timestamp < prev_block.header.timestamp:
        return False, "Block timestamp precedes previous block"

    return True, ""


def compute_state_root(prev_state_root: str, transactions: list[Transaction]) -> str:
    """Compute a new state root by hashing the previous root with new transactions.

    This is a simplified state root that chains the previous state
    with all transaction hashes. A full implementation would maintain
    a state trie, but this provides sufficient integrity guarantees.

    Parameters
    ----------
    prev_state_root : str
        The state root from the previous block.
    transactions : list[Transaction]
        Transactions in the new block.

    Returns
    -------
    str
        Hex-encoded new state root.
    """
    h = hashlib.sha256(bytes.fromhex(prev_state_root) if prev_state_root else b"\x00" * 32)
    for tx in transactions:
        h.update(bytes.fromhex(tx.tx_hash))
    return h.hexdigest()


# ── Genesis Block ──

def create_genesis_block() -> Block:
    """Create the genesis (first) block of the chain.

    Returns
    -------
    Block
        The genesis block with height 0, no transactions, and zero hashes.
    """
    header = BlockHeader(
        height=0,
        epoch=0,
        slot=0,
        timestamp=time.time(),
        prev_hash="0" * 64,
        tx_root=compute_merkle_root([]),
        state_root="0" * 64,
        proposer_id="genesis",
        validator_count=0,
    )
    block = Block(header=header)
    block.header.block_hash = header.compute_hash()
    return block


# ── Chain Storage ──

class ChainStore:
    """
    SQLite-backed storage for the SkillChain blockchain.

    Stores blocks and transactions with indexes for efficient lookup
    by height, hash, epoch, and sender.

    Usage:
        store = ChainStore("/path/to/chain.db")
        store.put_block(block)
        latest = store.get_latest_block()
        block = store.get_block_by_height(42)
    """

    def __init__(self, db_path: str | Path = ":memory:") -> None:
        self._db_path = str(db_path)
        self._conn = sqlite3.connect(self._db_path)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._create_tables()
        # In-memory cache for recent blocks
        self._cache: dict[int, Block] = {}
        self._cache_max = 100

    def _create_tables(self) -> None:
        """Create the database schema."""
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS blocks (
                height INTEGER PRIMARY KEY,
                epoch INTEGER NOT NULL,
                slot INTEGER NOT NULL,
                timestamp REAL NOT NULL,
                prev_hash TEXT NOT NULL,
                tx_root TEXT NOT NULL,
                state_root TEXT NOT NULL,
                proposer_id TEXT NOT NULL,
                validator_count INTEGER NOT NULL,
                block_hash TEXT NOT NULL UNIQUE,
                block_json TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(block_hash);
            CREATE INDEX IF NOT EXISTS idx_blocks_epoch ON blocks(epoch);

            CREATE TABLE IF NOT EXISTS transactions (
                tx_hash TEXT PRIMARY KEY,
                block_height INTEGER NOT NULL,
                tx_type TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                timestamp REAL NOT NULL,
                payload_json TEXT NOT NULL,
                FOREIGN KEY (block_height) REFERENCES blocks(height)
            );

            CREATE INDEX IF NOT EXISTS idx_tx_sender ON transactions(sender_id);
            CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(tx_type);
            CREATE INDEX IF NOT EXISTS idx_tx_block ON transactions(block_height);
        """)
        self._conn.commit()

    def put_block(self, block: Block) -> None:
        """Store a block and its transactions.

        Parameters
        ----------
        block : Block
            The block to store. Must have a valid block_hash.

        Raises
        ------
        ValueError
            If a block at this height already exists.
        """
        h = block.header
        block_json = json.dumps(block.to_dict())

        try:
            self._conn.execute(
                """INSERT INTO blocks
                   (height, epoch, slot, timestamp, prev_hash, tx_root,
                    state_root, proposer_id, validator_count, block_hash, block_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (h.height, h.epoch, h.slot, h.timestamp, h.prev_hash,
                 h.tx_root, h.state_root, h.proposer_id, h.validator_count,
                 h.block_hash, block_json),
            )

            for tx in block.transactions:
                self._conn.execute(
                    """INSERT OR IGNORE INTO transactions
                       (tx_hash, block_height, tx_type, sender_id, timestamp, payload_json)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (tx.tx_hash, h.height, tx.tx_type.value, tx.sender_id,
                     tx.timestamp, json.dumps(tx.payload)),
                )

            self._conn.commit()
        except sqlite3.IntegrityError as e:
            raise ValueError(f"Block at height {h.height} already exists: {e}") from e

        # Cache
        self._cache[h.height] = block
        if len(self._cache) > self._cache_max:
            oldest = min(self._cache.keys())
            del self._cache[oldest]

        logger.debug("Stored block height=%d hash=%s", h.height, h.block_hash[:16])

    def get_block_by_height(self, height: int) -> Optional[Block]:
        """Retrieve a block by its height.

        Parameters
        ----------
        height : int
            The block height.

        Returns
        -------
        Block or None
            The block, or None if not found.
        """
        if height in self._cache:
            return self._cache[height]

        row = self._conn.execute(
            "SELECT block_json FROM blocks WHERE height = ?", (height,)
        ).fetchone()
        if row is None:
            return None

        block = Block.from_dict(json.loads(row[0]))
        self._cache[height] = block
        return block

    def get_block_by_hash(self, block_hash: str) -> Optional[Block]:
        """Retrieve a block by its hash.

        Parameters
        ----------
        block_hash : str
            The hex-encoded block hash.

        Returns
        -------
        Block or None
            The block, or None if not found.
        """
        row = self._conn.execute(
            "SELECT block_json FROM blocks WHERE block_hash = ?", (block_hash,)
        ).fetchone()
        if row is None:
            return None
        return Block.from_dict(json.loads(row[0]))

    def get_latest_block(self) -> Optional[Block]:
        """Get the most recent block.

        Returns
        -------
        Block or None
            The block with the highest height, or None if chain is empty.
        """
        row = self._conn.execute(
            "SELECT block_json FROM blocks ORDER BY height DESC LIMIT 1"
        ).fetchone()
        if row is None:
            return None
        return Block.from_dict(json.loads(row[0]))

    def get_chain_height(self) -> int:
        """Get the current chain height.

        Returns
        -------
        int
            The height of the latest block, or -1 if chain is empty.
        """
        row = self._conn.execute(
            "SELECT MAX(height) FROM blocks"
        ).fetchone()
        if row is None or row[0] is None:
            return -1
        return row[0]

    def get_transactions_by_sender(self, sender_id: str, limit: int = 100) -> list[Transaction]:
        """Get transactions from a specific sender.

        Parameters
        ----------
        sender_id : str
            The sender's node_id.
        limit : int
            Maximum number of transactions to return.

        Returns
        -------
        list[Transaction]
            Transactions from this sender, most recent first.
        """
        rows = self._conn.execute(
            """SELECT tx_hash, block_height, tx_type, sender_id, timestamp, payload_json
               FROM transactions WHERE sender_id = ?
               ORDER BY timestamp DESC LIMIT ?""",
            (sender_id, limit),
        ).fetchall()

        return [
            Transaction(
                tx_type=TransactionType(row[2]),
                sender_id=row[3],
                payload=json.loads(row[5]),
                timestamp=row[4],
                tx_hash=row[0],
            )
            for row in rows
        ]

    def get_blocks_in_epoch(self, epoch: int) -> list[Block]:
        """Get all blocks in a given epoch.

        Parameters
        ----------
        epoch : int
            The epoch number.

        Returns
        -------
        list[Block]
            Blocks in this epoch, ordered by height.
        """
        rows = self._conn.execute(
            "SELECT block_json FROM blocks WHERE epoch = ? ORDER BY height",
            (epoch,),
        ).fetchall()
        return [Block.from_dict(json.loads(row[0])) for row in rows]

    def close(self) -> None:
        """Close the database connection."""
        self._conn.close()

    def stats(self) -> dict:
        """Return chain storage statistics."""
        height = self.get_chain_height()
        tx_count = self._conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
        return {
            "chain_height": height,
            "total_transactions": tx_count,
            "cached_blocks": len(self._cache),
            "db_path": self._db_path,
        }
