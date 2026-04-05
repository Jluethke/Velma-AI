# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the PlanGenerator."""

import pytest

from skillchain.solopreneur.config import SUPPORTED_BUSINESS_TYPES
from skillchain.solopreneur.market_scanner import MarketScanner
from skillchain.solopreneur.plan_generator import BusinessPlan, PlanGenerator
from skillchain.solopreneur.validator import IdeaInput, IdeaValidator


@pytest.fixture
def planner():
    return PlanGenerator()


@pytest.fixture
def scanner():
    return MarketScanner()


@pytest.fixture
def validator():
    return IdeaValidator()


def _make_idea(biz_type: str) -> IdeaInput:
    return IdeaInput(
        idea_description=f"A {biz_type} business for test purposes",
        target_audience="test audience with $10K/month revenue",
        business_type=biz_type,
        budget_range="$300/month",
        founder_skills=["python", "sales", "5 years experience"],
    )


class TestPlanGenerator:
    def test_generates_valid_plan(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert isinstance(plan, BusinessPlan)
        assert plan.one_liner
        assert plan.value_prop
        assert plan.business_type == "saas"

    def test_mvp_scope_populated(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert len(plan.mvp_scope) > 0
        assert len(plan.cut_list) > 0

    def test_pricing_has_tiers(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert len(plan.pricing) >= 2
        assert plan.pricing[0].name
        assert plan.pricing[0].price

    def test_timeline_has_weeks(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert len(plan.timeline) > 0
        assert plan.timeline[0].week == 1
        assert len(plan.timeline[0].tasks) > 0

    def test_milestones_populated(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert len(plan.milestones) == 5
        assert plan.milestones[0].name
        assert plan.milestones[0].metric

    def test_risks_populated(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert len(plan.risks) == 5
        assert plan.risks[0].risk
        assert plan.risks[0].mitigation

    def test_first_10_customers_populated(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert len(plan.first_10_customers) >= 3

    @pytest.mark.parametrize("biz_type", SUPPORTED_BUSINESS_TYPES)
    def test_generates_plan_for_every_type(self, planner, scanner, validator, biz_type):
        idea = _make_idea(biz_type)
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert plan.business_type == biz_type
        assert plan.one_liner
        assert len(plan.pricing) >= 1
        assert len(plan.mvp_scope) >= 1

    def test_lean_strategy_shorter_timeline(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        lean = planner.generate(idea, market, strategy_type="lean")
        premium = planner.generate(idea, market, strategy_type="premium")

        assert lean.mvp_timeline_weeks <= premium.mvp_timeline_weeks

    def test_lean_strategy_fewer_mvp_items(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        lean = planner.generate(idea, market, strategy_type="lean")
        premium = planner.generate(idea, market, strategy_type="premium")

        assert len(lean.mvp_scope) <= len(premium.mvp_scope)

    def test_budget_is_positive(self, planner, scanner, validator):
        idea = _make_idea("saas")
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        plan = planner.generate(idea, market)

        assert plan.budget_monthly >= 0
        assert len(plan.budget_breakdown) > 0
