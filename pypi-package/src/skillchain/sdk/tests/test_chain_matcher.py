# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Proprietary and Confidential.

"""Tests for ChainMatcher — plain-English chain discovery."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from skillchain.sdk.chain_matcher import ChainMatcher, ChainMatch


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def all_chains() -> list[dict]:
    """Load all real chain definitions from the marketplace."""
    chains_dir = Path(__file__).resolve().parent.parent.parent / "marketplace" / "chains"
    chains = []
    for f in sorted(chains_dir.glob("*.chain.json")):
        chains.append(json.loads(f.read_text(encoding="utf-8")))
    return chains


@pytest.fixture(scope="module")
def matcher(all_chains) -> ChainMatcher:
    """Create a matcher with all real chains."""
    return ChainMatcher(all_chains)


# ---------------------------------------------------------------------------
# Discovery: life situations
# ---------------------------------------------------------------------------

class TestLifeSituations:
    """People describing their situation in plain English."""

    def test_scared_of_technology(self, matcher):
        results = matcher.match("I'm scared of technology")
        assert results[0].chain_name == "tech-confidence-builder"

    def test_afraid_of_ai_and_crypto(self, matcher):
        results = matcher.match("I'm afraid of AI and crypto")
        top_names = [r.chain_name for r in results[:3]]
        assert "tech-confidence-builder" in top_names

    def test_moving_to_new_city(self, matcher):
        results = matcher.match("I need to move to a new city")
        top_names = [r.chain_name for r in results[:3]]
        assert any("moving" in n or "homeowner" in n for n in top_names)

    def test_retirement_planning(self, matcher):
        results = matcher.match("planning for retirement")
        top_names = [r.chain_name for r in results[:3]]
        assert "retirement-ready" in top_names

    def test_new_baby(self, matcher):
        results = matcher.match("we're having a baby and need to get ready")
        top_names = [r.chain_name for r in results[:3]]
        assert "family-ready" in top_names

    def test_health_reset(self, matcher):
        results = matcher.match("doctor said I need to exercise and eat better")
        top_names = [r.chain_name for r in results[:3]]
        assert any("health" in n for n in top_names)

    def test_vacation(self, matcher):
        results = matcher.match("plan a vacation trip")
        top_names = [r.chain_name for r in results[:3]]
        assert "vacation-planner" in top_names

    def test_party_planning(self, matcher):
        results = matcher.match("hosting a birthday party")
        top_names = [r.chain_name for r in results[:3]]
        assert "event-host-pro" in top_names


# ---------------------------------------------------------------------------
# Discovery: career
# ---------------------------------------------------------------------------

class TestCareer:
    def test_job_search(self, matcher):
        results = matcher.match("help me find a job")
        assert results[0].chain_name == "job-search-blitz"

    def test_resume_and_interview(self, matcher):
        results = matcher.match("I need help with my resume and interview prep")
        top_names = [r.chain_name for r in results[:3]]
        assert "job-search-blitz" in top_names

    def test_career_change(self, matcher):
        results = matcher.match("I want to change careers")
        top_names = [r.chain_name for r in results[:3]]
        assert "career-pivot" in top_names

    def test_parent_returning(self, matcher):
        results = matcher.match("returning to work after having kids")
        top_names = [r.chain_name for r in results[:3]]
        assert "parent-relaunch" in top_names


# ---------------------------------------------------------------------------
# Discovery: business
# ---------------------------------------------------------------------------

class TestBusiness:
    def test_start_business(self, matcher):
        results = matcher.match("I want to start a side business")
        top_names = [r.chain_name for r in results[:3]]
        assert any("business" in n or "hustle" in n or "micro" in n for n in top_names)

    def test_startup_validation(self, matcher):
        results = matcher.match("validate my startup idea")
        top_names = [r.chain_name for r in results[:3]]
        assert "startup-validation" in top_names

    def test_content_marketing(self, matcher):
        results = matcher.match("grow my business with social media content")
        top_names = [r.chain_name for r in results[:5]]
        assert any("content" in n for n in top_names)


# ---------------------------------------------------------------------------
# Discovery: money
# ---------------------------------------------------------------------------

class TestMoney:
    def test_budget(self, matcher):
        results = matcher.match("I need help budgeting my money")
        top_names = [r.chain_name for r in results[:5]]
        assert any("money" in n or "financial" in n or "budget" in n for n in top_names)

    def test_scam_protection(self, matcher):
        results = matcher.match("protect myself from scams and fraud")
        top_names = [r.chain_name for r in results[:3]]
        assert any("confidence" in n or "digital" in n for n in top_names)


# ---------------------------------------------------------------------------
# Discovery: developer
# ---------------------------------------------------------------------------

class TestDeveloper:
    def test_debug(self, matcher):
        results = matcher.match("debug my code")
        top_names = [r.chain_name for r in results[:3]]
        assert "debug-and-fix" in top_names

    def test_build_api(self, matcher):
        results = matcher.match("build an API")
        top_names = [r.chain_name for r in results[:3]]
        assert "api-build" in top_names


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_query_returns_all(self, matcher):
        results = matcher.match("", top_k=100)
        assert len(results) > 0
        assert all(r.score == 0.0 for r in results)

    def test_nonsense_query(self, matcher):
        results = matcher.match("xyzzy foobar baz")
        # May return empty or low-scoring matches
        if results:
            assert results[0].score < 0.5

    def test_top_k_limits(self, matcher):
        results = matcher.match("help", top_k=3)
        assert len(results) <= 3

    def test_result_has_all_fields(self, matcher):
        results = matcher.match("job search")
        assert len(results) > 0
        r = results[0]
        assert r.chain_name
        assert r.description
        assert r.score > 0
        assert r.match_reason
        assert r.skills
        assert r.step_count > 0

    def test_scores_are_sorted(self, matcher):
        results = matcher.match("I need help with everything in my life")
        for i in range(len(results) - 1):
            assert results[i].score >= results[i + 1].score
