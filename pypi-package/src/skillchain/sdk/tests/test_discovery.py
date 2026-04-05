"""
test_discovery.py
=================

Tests for the SkillDiscovery search engine.

Verifies caching, search filtering, and fallback behaviour.
"""

from __future__ import annotations

import time

import pytest

from skillchain.sdk.skill_discovery import (
    CACHE_TTL,
    SkillDiscovery,
    SkillListing,
    _CacheEntry,
)


# -- Fixtures ------------------------------------------------------------------

@pytest.fixture
def discovery() -> SkillDiscovery:
    """Create a SkillDiscovery without chain or subgraph."""
    return SkillDiscovery(chain_client=None, subgraph_url=None)


# -- Cache ---------------------------------------------------------------------

class TestCache:
    """Tests for the internal cache."""

    def test_cache_entry_fresh(self) -> None:
        entry = _CacheEntry(data="test")
        assert not entry.is_stale()

    def test_cache_entry_stale(self) -> None:
        entry = _CacheEntry(data="test", fetched_at=time.time() - CACHE_TTL - 1)
        assert entry.is_stale()

    def test_set_and_get_cached(self, discovery: SkillDiscovery) -> None:
        discovery._set_cached("key1", [1, 2, 3])
        result = discovery._get_cached("key1")
        assert result == [1, 2, 3]

    def test_get_missing_returns_none(self, discovery: SkillDiscovery) -> None:
        assert discovery._get_cached("nonexistent") is None

    def test_get_stale_returns_none(self, discovery: SkillDiscovery) -> None:
        discovery._cache["old"] = _CacheEntry(
            data="stale", fetched_at=time.time() - CACHE_TTL - 1,
        )
        assert discovery._get_cached("old") is None

    def test_clear_cache(self, discovery: SkillDiscovery) -> None:
        discovery._set_cached("k1", "v1")
        discovery._set_cached("k2", "v2")
        discovery.clear_cache()
        assert discovery._get_cached("k1") is None
        assert discovery._get_cached("k2") is None


# -- Search --------------------------------------------------------------------

class TestSearch:
    """Tests for the search method."""

    def test_empty_search_returns_empty(self, discovery: SkillDiscovery) -> None:
        results = discovery.search()
        assert results == []

    def test_search_uses_cache(self, discovery: SkillDiscovery) -> None:
        listings = [
            SkillListing(skill_id=1, name="s1", domain="test"),
            SkillListing(skill_id=2, name="s2", domain="test"),
        ]
        # Pre-populate cache
        cache_key = f"search:test:None:0.0:0.0:None"
        discovery._set_cached(cache_key, listings)

        results = discovery.search(domain="test")
        assert len(results) == 2

    def test_search_max_results(self, discovery: SkillDiscovery) -> None:
        listings = [
            SkillListing(skill_id=i, name=f"s{i}", domain="test")
            for i in range(10)
        ]
        cache_key = f"search:test:None:0.0:0.0:None"
        discovery._set_cached(cache_key, listings)

        results = discovery.search(domain="test", max_results=3)
        assert len(results) == 3


# -- Skill details -------------------------------------------------------------

class TestSkillDetails:
    """Tests for get_skill_details."""

    def test_no_chain_returns_none(self, discovery: SkillDiscovery) -> None:
        assert discovery.get_skill_details(42) is None

    def test_details_cache(self, discovery: SkillDiscovery) -> None:
        listing = SkillListing(skill_id=42, name="cached", domain="test")
        discovery._set_cached("detail:42", listing)

        result = discovery.get_skill_details(42)
        assert result is not None
        assert result.name == "cached"


# -- Trending ------------------------------------------------------------------

class TestTrending:
    """Tests for get_trending."""

    def test_no_subgraph_returns_empty(self, discovery: SkillDiscovery) -> None:
        assert discovery.get_trending() == []

    def test_trending_uses_cache(self, discovery: SkillDiscovery) -> None:
        listings = [SkillListing(skill_id=1, name="hot", domain="code")]
        discovery._set_cached("trending:24", listings)

        results = discovery.get_trending(timeframe_hours=24)
        assert len(results) == 1
        assert results[0].name == "hot"


# -- SkillListing dataclass ----------------------------------------------------

class TestSkillListing:
    """Tests for the SkillListing dataclass."""

    def test_default_values(self) -> None:
        listing = SkillListing(skill_id=1, name="test", domain="general")
        assert listing.price == 0
        assert listing.license == "MIT"
        assert listing.validation_count == 0
        assert listing.success_rate == 0.0
        assert listing.owner_trust == 0.0

    def test_all_fields(self) -> None:
        listing = SkillListing(
            skill_id=42,
            name="my-skill",
            domain="code-review",
            tags=["python", "review"],
            description="Reviews code",
            owner="0xabc",
            ipfs_cid="QmXyz",
            price=1000,
            license="Apache-2.0",
            validation_count=15,
            success_rate=0.92,
            owner_trust=0.87,
        )
        assert listing.skill_id == 42
        assert listing.tags == ["python", "review"]
        assert listing.success_rate == 0.92
