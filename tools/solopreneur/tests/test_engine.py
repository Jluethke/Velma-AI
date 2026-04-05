# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the SolopreneurEngine — full end-to-end pipeline."""

import pytest

from skillchain.tools.solopreneur.engine import LaunchResult, SolopreneurEngine


@pytest.fixture
def engine():
    return SolopreneurEngine()


class TestSolopreneurEngine:
    def test_full_pipeline(self, engine):
        result = engine.run(
            idea="AI-powered invoice processing for freelancers",
            target_audience="freelancers doing $50K-200K/year with 10+ clients",
            founder_skills=["python", "ML", "was a freelancer for 5 years"],
            budget="$500/month",
            business_type="saas",
        )

        assert isinstance(result, LaunchResult)
        assert result.success is True
        assert result.error == ""

    def test_all_stages_populated(self, engine):
        result = engine.run(
            idea="AI invoice processing for freelancers",
            target_audience="freelancers doing $50K-200K/year",
            founder_skills=["python", "ML"],
            budget="$500/month",
        )

        assert result.validation is not None
        assert result.market_analysis is not None
        assert result.strategy_tournament is not None
        assert result.business_plan is not None
        assert result.outreach_pack is not None
        assert result.ops_system is not None

    def test_report_generated(self, engine):
        result = engine.run(
            idea="Done-for-you social media management",
            target_audience="local restaurants with $500K-2M revenue",
            business_type="service",
        )

        assert result.report
        assert "SOLOPRENEUR LAUNCH REPORT" in result.report
        assert result.full_report
        assert len(result.full_report) > len(result.report)

    def test_duration_tracked(self, engine):
        result = engine.run(
            idea="Newsletter about AI trends",
            target_audience="tech professionals",
            business_type="content",
        )

        assert result.total_duration_ms > 0

    def test_validate_only(self, engine):
        result = engine.validate_only(
            idea="Online marketplace connecting freelance chefs with home diners",
            target_audience="urban professionals who want chef-quality meals at home",
        )

        assert result.overall_score > 0
        assert result.recommendation in ("strong go", "go with caveats", "pivot", "no go")
        assert len(result.scores) == 5

    def test_outreach_only(self, engine):
        pack = engine.outreach_only(
            idea="B2B consulting for supply chain optimization",
            target_audience="mid-market manufacturers with $10M-100M revenue",
            business_type="consulting",
        )

        assert len(pack.cold_emails) == 5
        assert len(pack.linkedin_sequences) == 5
        assert len(pack.social_posts) == 10
        assert pack.landing_page.headline
        assert pack.elevator_pitch

    def test_auto_detects_business_type(self, engine):
        result = engine.run(
            idea="SaaS platform for subscription management and billing",
            target_audience="SaaS founders",
        )

        assert result.business_plan.business_type == "saas"

    def test_works_with_minimal_input(self, engine):
        result = engine.run(
            idea="help restaurants manage their online reviews",
            target_audience="restaurant owners",
        )

        assert result.success is True
        assert result.report

    def test_handles_all_business_types(self, engine):
        for biz_type in ["saas", "service", "ecommerce", "marketplace",
                         "content", "agency", "consulting"]:
            result = engine.run(
                idea=f"A {biz_type} for testing",
                target_audience="test audience",
                business_type=biz_type,
            )
            assert result.success, f"Failed for {biz_type}: {result.error}"

    def test_strategy_winner_determines_plan(self, engine):
        result = engine.run(
            idea="Premium consulting for enterprise data strategy",
            target_audience="CTOs at Fortune 500 companies",
            business_type="consulting",
        )

        winner_name = result.strategy_tournament.winner.name.lower()
        assert result.business_plan.strategy_type == winner_name

    def test_report_contains_deliverables(self, engine):
        result = engine.run(
            idea="AI content writer for LinkedIn",
            target_audience="B2B sales professionals",
            business_type="saas",
        )

        assert "cold email" in result.report.lower()
        assert "linkedin" in result.report.lower() or "LinkedIn" in result.report
        assert "social post" in result.report.lower()
        assert "landing page" in result.report.lower()
