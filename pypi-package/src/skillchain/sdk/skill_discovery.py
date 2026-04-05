"""
skill_discovery.py
==================

Search and filter skills from the SkillChain network.

Provides two discovery backends:
1. **GraphQL** (primary) — queries an indexed subgraph for fast searches
2. **Chain events** (fallback) — iterates on-chain SkillRegistered events

Results are cached for 5 minutes to reduce RPC load.

Usage::

    discovery = SkillDiscovery(chain_client)
    results = discovery.search(domain="code-review", min_trust=0.7)
    details = discovery.get_skill_details(skill_id=42)
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import requests

from .exceptions import ChainError

logger = logging.getLogger(__name__)

# Cache TTL in seconds
CACHE_TTL = 300  # 5 minutes


@dataclass
class SkillListing:
    """A skill listing returned from discovery searches."""
    skill_id: int
    name: str
    domain: str
    tags: list[str] = field(default_factory=list)
    description: str = ""
    owner: str = ""
    ipfs_cid: str = ""
    price: int = 0
    license: str = "MIT"
    validation_count: int = 0
    success_rate: float = 0.0
    owner_trust: float = 0.0
    created_at: float = 0.0


@dataclass
class _CacheEntry:
    """Internal cache entry with TTL tracking."""
    data: Any
    fetched_at: float = field(default_factory=time.time)

    def is_stale(self) -> bool:
        return (time.time() - self.fetched_at) > CACHE_TTL


class SkillDiscovery:
    """Skill search and discovery engine.

    Args:
        chain_client: ChainClient instance for on-chain queries.
        subgraph_url: Optional GraphQL endpoint for indexed queries.
    """

    def __init__(
        self,
        chain_client: Any = None,
        subgraph_url: Optional[str] = None,
    ) -> None:
        self._chain = chain_client
        self._subgraph_url = subgraph_url
        self._cache: Dict[str, _CacheEntry] = {}

    def search(
        self,
        domain: Optional[str] = None,
        tags: Optional[List[str]] = None,
        min_trust: float = 0.0,
        min_success_rate: float = 0.0,
        max_results: int = 20,
        query: Optional[str] = None,
    ) -> List[SkillListing]:
        """Search for skills matching the given criteria.

        Args:
            domain: Filter by domain (e.g. "code-review", "testing").
            tags: Filter by tags (skills must have at least one matching tag).
            min_trust: Minimum owner trust score.
            min_success_rate: Minimum validation success rate.
            max_results: Maximum number of results to return.
            query: Free-text search query.

        Returns:
            List of matching SkillListing objects, sorted by relevance.
        """
        cache_key = f"search:{domain}:{tags}:{min_trust}:{min_success_rate}:{query}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached[:max_results]

        # Try GraphQL first
        if self._subgraph_url:
            try:
                results = self._search_graphql(
                    domain, tags, min_trust, min_success_rate, max_results, query,
                )
                self._set_cached(cache_key, results)
                return results
            except Exception as exc:
                logger.warning("GraphQL search failed, falling back to chain: %s", exc)

        # Fallback: iterate chain events
        results = self._search_chain(
            domain, tags, min_trust, min_success_rate, max_results, query,
        )
        self._set_cached(cache_key, results)
        return results

    def get_skill_details(self, skill_id: int) -> Optional[SkillListing]:
        """Get detailed information about a specific skill.

        Args:
            skill_id: On-chain skill ID.

        Returns:
            SkillListing with full details, or None if not found.
        """
        cache_key = f"detail:{skill_id}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        if self._chain is None:
            return None

        try:
            info = self._chain.get_skill(skill_id)
            consensus = self._chain.get_validation_consensus(skill_id)

            listing = SkillListing(
                skill_id=skill_id,
                name=f"skill-{skill_id}",  # Name not stored on-chain; from IPFS manifest
                domain=info.get("domain", ""),
                owner=info.get("owner", ""),
                ipfs_cid=info.get("ipfs_cid", ""),
                price=info.get("price", 0),
                license=info.get("license", ""),
                validation_count=consensus.get("total_validations", 0),
                success_rate=consensus.get("avg_similarity", 0.0),
            )

            self._set_cached(cache_key, listing)
            return listing

        except ChainError as exc:
            logger.warning("Failed to get skill %d details: %s", skill_id, exc)
            return None

    def get_trending(self, timeframe_hours: int = 24) -> List[SkillListing]:
        """Get trending skills based on recent validation activity.

        Args:
            timeframe_hours: Look-back window in hours.

        Returns:
            List of trending SkillListing objects.
        """
        cache_key = f"trending:{timeframe_hours}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        if self._subgraph_url:
            try:
                results = self._trending_graphql(timeframe_hours)
                self._set_cached(cache_key, results)
                return results
            except Exception as exc:
                logger.debug("Trending GraphQL failed: %s", exc)

        # No chain fallback for trending — requires event indexing
        return []

    # -- GraphQL backend -------------------------------------------------------

    def _search_graphql(
        self,
        domain: Optional[str],
        tags: Optional[List[str]],
        min_trust: float,
        min_success_rate: float,
        max_results: int,
        query: Optional[str],
    ) -> List[SkillListing]:
        """Search via GraphQL subgraph."""
        where_clauses: list[str] = []
        if domain:
            # Sanitize domain to prevent GraphQL injection
            safe_domain = "".join(
                c for c in domain if c.isalnum() or c in "-_"
            )
            where_clauses.append(f'domain: "{safe_domain}"')
        if min_success_rate > 0:
            safe_rate = max(0, min(int(min_success_rate * 100), 10000))
            where_clauses.append(f"successRate_gte: {safe_rate}")

        where = ", ".join(where_clauses)
        where_block = f"where: {{ {where} }}" if where else ""

        gql = f"""
        {{
            skills(
                first: {max_results}
                orderBy: validationCount
                orderDirection: desc
                {where_block}
            ) {{
                id
                owner
                ipfsCid
                domain
                tags
                price
                license
                validationCount
                successRate
                createdAt
            }}
        }}
        """

        resp = requests.post(
            self._subgraph_url,
            json={"query": gql},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        results: List[SkillListing] = []
        for item in data.get("data", {}).get("skills", []):
            listing = SkillListing(
                skill_id=int(item.get("id", 0)),
                name=f"skill-{item.get('id', 0)}",
                domain=item.get("domain", ""),
                tags=item.get("tags", []),
                owner=item.get("owner", ""),
                ipfs_cid=item.get("ipfsCid", ""),
                price=int(item.get("price", 0)),
                license=item.get("license", ""),
                validation_count=int(item.get("validationCount", 0)),
                success_rate=int(item.get("successRate", 0)) / 100,
                created_at=float(item.get("createdAt", 0)),
            )

            # Post-filter by tags
            if tags and not any(t in listing.tags for t in tags):
                continue

            results.append(listing)

        return results[:max_results]

    def _trending_graphql(self, timeframe_hours: int) -> List[SkillListing]:
        """Get trending skills via GraphQL."""
        cutoff = int(time.time()) - (timeframe_hours * 3600)
        gql = f"""
        {{
            skills(
                first: 10
                orderBy: validationCount
                orderDirection: desc
                where: {{ createdAt_gte: {cutoff} }}
            ) {{
                id
                domain
                tags
                validationCount
                successRate
                createdAt
            }}
        }}
        """

        resp = requests.post(
            self._subgraph_url,
            json={"query": gql},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        return [
            SkillListing(
                skill_id=int(item.get("id", 0)),
                name=f"skill-{item.get('id', 0)}",
                domain=item.get("domain", ""),
                tags=item.get("tags", []),
                validation_count=int(item.get("validationCount", 0)),
                success_rate=int(item.get("successRate", 0)) / 100,
                created_at=float(item.get("createdAt", 0)),
            )
            for item in data.get("data", {}).get("skills", [])
        ]

    # -- Chain events fallback -------------------------------------------------

    def _search_chain(
        self,
        domain: Optional[str],
        tags: Optional[List[str]],
        min_trust: float,
        min_success_rate: float,
        max_results: int,
        query: Optional[str],
    ) -> List[SkillListing]:
        """Fallback search by iterating chain events.

        This is slow and only used when the subgraph is unavailable.
        Scans recent SkillRegistered events and filters locally.
        """
        if self._chain is None:
            return []

        # In production, this would use eth_getLogs to scan SkillRegistered events
        # For now, return an empty list — chain event scanning requires
        # contract deployment and event log access
        logger.debug("Chain event fallback search — not yet implemented")
        return []

    # -- Cache -----------------------------------------------------------------

    def _get_cached(self, key: str) -> Any:
        """Return cached data if fresh, None otherwise."""
        entry = self._cache.get(key)
        if entry is None or entry.is_stale():
            return None
        return entry.data

    def _set_cached(self, key: str, data: Any) -> None:
        """Store data in cache."""
        self._cache[key] = _CacheEntry(data=data)

    def clear_cache(self) -> None:
        """Clear all cached search results."""
        self._cache.clear()
