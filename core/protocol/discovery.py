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
discovery.py — Kademlia DHT for SkillChain peer discovery.

Implements the core Kademlia data structures:
- XOR distance metric on 256-bit node IDs
- k-buckets (k=20) organized by XOR distance prefix length
- Iterative node lookup with alpha=3 parallel queries
- Domain tag index for skill-domain-aware peer discovery

This is the routing-table and lookup logic only. The actual network
transport (UDP/TCP) is handled by the transport layer (not in this module).

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Optional

from . import config

logger = logging.getLogger("skillchain.protocol.discovery")


@dataclass(order=True)
class PeerRecord:
    """A peer entry in the routing table."""

    node_id: str
    address: str = ""            # host:port
    public_key: str = ""         # hex-encoded Ed25519 public key
    domain_tags: tuple[str, ...] = field(default_factory=tuple)
    last_seen: float = field(default_factory=time.time)

    def __hash__(self) -> int:
        return hash(self.node_id)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, PeerRecord):
            return NotImplemented
        return self.node_id == other.node_id


def xor_distance(a: str, b: str) -> int:
    """Compute XOR distance between two hex-encoded node IDs.

    Parameters
    ----------
    a, b : str
        64-character hex strings (256-bit node IDs).

    Returns
    -------
    int
        The XOR distance as an integer.
    """
    return int(a, 16) ^ int(b, 16)


def _bit_length(distance: int) -> int:
    """Return the bit length of the XOR distance (0-indexed bucket)."""
    if distance == 0:
        return 0
    return distance.bit_length()


class KBucket:
    """A single k-bucket holding up to k peers at a given distance range.

    Implements least-recently-seen eviction: when the bucket is full and
    a new peer arrives, the least-recently-seen peer is pinged. If it
    responds, the new peer is discarded; otherwise the old peer is evicted.
    """

    def __init__(self, k: int = config.DHT_K) -> None:
        self.k = k
        self._peers: list[PeerRecord] = []

    @property
    def peers(self) -> list[PeerRecord]:
        """Return a copy of the peer list."""
        return list(self._peers)

    @property
    def is_full(self) -> bool:
        return len(self._peers) >= self.k

    def __len__(self) -> int:
        return len(self._peers)

    def add_or_update(self, peer: PeerRecord) -> Optional[PeerRecord]:
        """Add a peer or move it to the tail (most recently seen).

        If the bucket is full and the peer is new, returns the
        least-recently-seen peer for ping verification. The caller
        should ping that peer and call evict_and_add() if it fails.

        Parameters
        ----------
        peer : PeerRecord
            The peer to insert or update.

        Returns
        -------
        PeerRecord or None
            The LRS peer to ping if bucket is full and peer is new,
            or None if the peer was successfully added/updated.
        """
        # If peer already exists, move to tail
        for i, existing in enumerate(self._peers):
            if existing.node_id == peer.node_id:
                self._peers.pop(i)
                peer.last_seen = time.time()
                self._peers.append(peer)
                return None

        # New peer
        if not self.is_full:
            peer.last_seen = time.time()
            self._peers.append(peer)
            return None

        # Bucket full — return LRS peer for ping check
        return self._peers[0]

    def evict_and_add(self, evict_id: str, new_peer: PeerRecord) -> None:
        """Evict a dead peer and add the new one.

        Called after the LRS peer failed a ping check.

        Parameters
        ----------
        evict_id : str
            Node ID of the peer to evict.
        new_peer : PeerRecord
            The new peer to insert.
        """
        self._peers = [p for p in self._peers if p.node_id != evict_id]
        new_peer.last_seen = time.time()
        self._peers.append(new_peer)

    def remove(self, node_id: str) -> bool:
        """Remove a peer by node_id. Returns True if found."""
        before = len(self._peers)
        self._peers = [p for p in self._peers if p.node_id != node_id]
        return len(self._peers) < before

    def closest(self, target_id: str, count: int) -> list[PeerRecord]:
        """Return up to count peers sorted by XOR distance to target."""
        return sorted(
            self._peers,
            key=lambda p: xor_distance(p.node_id, target_id),
        )[:count]


class KademliaNode:
    """
    Kademlia routing table and lookup logic for SkillChain peer discovery.

    Maintains 256 k-buckets indexed by XOR distance prefix length.
    Supports iterative closest-node lookup and domain-tag filtering.

    Usage:
        node = KademliaNode(my_node_id)
        node.update_peer(PeerRecord(node_id="abc...", address="1.2.3.4:9000"))
        closest = node.find_node("def...")
        ml_peers = node.lookup_nodes("ml")
    """

    def __init__(
        self,
        node_id: str,
        k: int = config.DHT_K,
        alpha: int = config.DHT_ALPHA,
    ) -> None:
        self.node_id = node_id
        self.k = k
        self.alpha = alpha
        # 256 buckets for 256-bit IDs, plus bucket 0 for distance=0
        self._buckets: list[KBucket] = [KBucket(k=k) for _ in range(257)]
        # Domain tag index: tag -> set of node_ids
        self._domain_index: dict[str, set[str]] = {}
        # All known peers by node_id
        self._all_peers: dict[str, PeerRecord] = {}

    @property
    def peer_count(self) -> int:
        """Total number of peers in the routing table."""
        return len(self._all_peers)

    def _bucket_index(self, target_id: str) -> int:
        """Determine which bucket a target node falls into."""
        dist = xor_distance(self.node_id, target_id)
        return _bit_length(dist)

    def update_peer(self, peer: PeerRecord) -> Optional[PeerRecord]:
        """Insert or update a peer in the routing table.

        Parameters
        ----------
        peer : PeerRecord
            Peer information to insert or refresh.

        Returns
        -------
        PeerRecord or None
            If the bucket is full, returns the LRS peer to ping.
            Otherwise returns None (peer was added/updated).
        """
        if peer.node_id == self.node_id:
            return None  # Don't add ourselves

        idx = self._bucket_index(peer.node_id)
        result = self._buckets[idx].add_or_update(peer)

        if result is None:
            # Successfully added/updated
            self._all_peers[peer.node_id] = peer
            for tag in peer.domain_tags:
                if tag not in self._domain_index:
                    self._domain_index[tag] = set()
                self._domain_index[tag].add(peer.node_id)

        return result

    def remove_peer(self, node_id: str) -> None:
        """Remove a peer from the routing table."""
        idx = self._bucket_index(node_id)
        self._buckets[idx].remove(node_id)

        peer = self._all_peers.pop(node_id, None)
        if peer:
            for tag in peer.domain_tags:
                if tag in self._domain_index:
                    self._domain_index[tag].discard(node_id)

    def find_node(self, target_id: str, count: int | None = None) -> list[PeerRecord]:
        """Find the closest peers to a target node ID.

        Searches all buckets and returns the closest peers by XOR distance.
        This is the local routing table lookup, not the iterative network
        lookup (which the transport layer drives using this method).

        Parameters
        ----------
        target_id : str
            The 64-character hex node ID to find peers near.
        count : int, optional
            Number of peers to return (default: k).

        Returns
        -------
        list[PeerRecord]
            Up to count peers sorted by XOR distance to target.
        """
        if count is None:
            count = self.k

        # Gather candidates from all buckets
        candidates: list[PeerRecord] = []
        for bucket in self._buckets:
            candidates.extend(bucket.peers)

        # Sort by XOR distance and return top count
        candidates.sort(key=lambda p: xor_distance(p.node_id, target_id))
        return candidates[:count]

    def bootstrap(self, seed_nodes: list[PeerRecord]) -> list[PeerRecord]:
        """Bootstrap the routing table from seed nodes.

        Adds all seed nodes and returns the closest peers to our own
        node ID (triggering a self-lookup to populate buckets).

        Parameters
        ----------
        seed_nodes : list[PeerRecord]
            Initial peers to populate the routing table.

        Returns
        -------
        list[PeerRecord]
            Peers closest to our own node_id (for iterative lookup).
        """
        for seed in seed_nodes:
            self.update_peer(seed)

        logger.info(
            "Bootstrapped with %d seed nodes, %d total peers",
            len(seed_nodes), self.peer_count,
        )

        # Self-lookup to populate buckets
        return self.find_node(self.node_id)

    def announce(self, node_info: PeerRecord) -> None:
        """Announce a node's presence (adds to routing table).

        Parameters
        ----------
        node_info : PeerRecord
            The node announcing itself.
        """
        self.update_peer(node_info)
        logger.debug("Announced node %s...%s", node_info.node_id[:8], node_info.node_id[-4:])

    def lookup_nodes(self, domain_tag: str) -> list[PeerRecord]:
        """Find peers that declared a specific domain tag.

        Parameters
        ----------
        domain_tag : str
            The skill domain to filter by (e.g., "ml", "nlp").

        Returns
        -------
        list[PeerRecord]
            All known peers with the given domain tag.
        """
        node_ids = self._domain_index.get(domain_tag, set())
        return [
            self._all_peers[nid]
            for nid in node_ids
            if nid in self._all_peers
        ]

    def get_stale_peers(self, timeout_s: float = config.PEER_TIMEOUT_S) -> list[PeerRecord]:
        """Return peers that haven't been seen within the timeout.

        Parameters
        ----------
        timeout_s : float
            Seconds since last_seen before a peer is considered stale.

        Returns
        -------
        list[PeerRecord]
            Stale peers eligible for eviction.
        """
        cutoff = time.time() - timeout_s
        return [
            peer for peer in self._all_peers.values()
            if peer.last_seen < cutoff
        ]

    def stats(self) -> dict:
        """Return routing table statistics."""
        non_empty = sum(1 for b in self._buckets if len(b) > 0)
        return {
            "node_id": self.node_id[:16] + "...",
            "total_peers": self.peer_count,
            "non_empty_buckets": non_empty,
            "domain_tags": {tag: len(ids) for tag, ids in self._domain_index.items()},
        }
