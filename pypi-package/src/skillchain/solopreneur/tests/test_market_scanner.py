# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the MarketScanner."""

import pytest

from skillchain.solopreneur.market_scanner import MarketAnalysis, MarketScanner, _detect_type
from skillchain.solopreneur.validator import IdeaInput, IdeaValidator


@pytest.fixture
def scanner():
    return MarketScanner()


@pytest.fixture
def validator():
    return IdeaValidator()


def _saas_idea() -> IdeaInput:
    return IdeaInput(
        idea_description="SaaS platform for automated invoice processing",
        target_audience="Shopify store owners doing $10K-50K/month",
        business_type="saas",
        budget_range="$500/month",
    )


def _service_idea() -> IdeaInput:
    return IdeaInput(
        idea_description="Done-for-you social media management service",
        target_audience="Local restaurants with $500K-2M revenue",
        business_type="service",
    )


class TestDetectType:
    def test_explicit_type_used(self):
        idea = IdeaInput(
            idea_description="whatever",
            target_audience="anyone",
            business_type="consulting",
        )
        assert _detect_type(idea) == "consulting"

    def test_saas_signals(self):
        idea = IdeaInput(
            idea_description="SaaS tool for subscription management",
            target_audience="anyone",
        )
        assert _detect_type(idea) == "saas"

    def test_ecommerce_signals(self):
        idea = IdeaInput(
            idea_description="Online store selling handmade products",
            target_audience="anyone",
        )
        assert _detect_type(idea) == "ecommerce"


class TestMarketScanner:
    def test_scan_returns_market_analysis(self, scanner: MarketScanner, validator: IdeaValidator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert isinstance(result, MarketAnalysis)
        assert result.sizing.tam > 0
        assert result.sizing.sam > 0
        assert result.sizing.som > 0

    def test_tam_greater_than_sam_greater_than_som(self, scanner, validator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert result.sizing.tam > result.sizing.sam
        assert result.sizing.sam > result.sizing.som

    def test_competitors_populated(self, scanner, validator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert len(result.competitors) >= 2
        assert result.competitors[0].name  # has a name
        assert result.competitors[0].strengths  # has strengths

    def test_gaps_populated(self, scanner, validator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert len(result.gaps) > 0

    def test_positioning_has_three_angles(self, scanner, validator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert len(result.positioning_options) == 3
        names = [p.name for p in result.positioning_options]
        assert "The Specialist" in names
        assert "The Simplifier" in names
        assert "The Premium Alternative" in names

    def test_pricing_benchmarks_populated(self, scanner, validator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert len(result.pricing_benchmarks) > 0

    def test_distribution_channels_populated(self, scanner, validator):
        idea = _service_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert len(result.distribution_channels) > 0

    def test_revenue_model_template_populated(self, scanner, validator):
        idea = _saas_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        assert "MRR" in result.revenue_model_template

    def test_service_type_channels(self, scanner, validator):
        idea = _service_idea()
        validation = validator.validate(idea)
        result = scanner.scan(idea, validation)

        channel_text = " ".join(result.distribution_channels).lower()
        assert "linkedin" in channel_text or "referral" in channel_text
