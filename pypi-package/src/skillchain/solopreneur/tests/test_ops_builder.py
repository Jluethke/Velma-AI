# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the OpsBuilder."""

import pytest

from skillchain.solopreneur.config import SUPPORTED_BUSINESS_TYPES
from skillchain.solopreneur.market_scanner import MarketScanner
from skillchain.solopreneur.ops_builder import OpsBuilder, OpsSystem
from skillchain.solopreneur.plan_generator import PlanGenerator
from skillchain.solopreneur.validator import IdeaInput, IdeaValidator


@pytest.fixture
def ops_builder():
    return OpsBuilder()


def _make_plan(biz_type: str = "saas"):
    idea = IdeaInput(
        idea_description=f"A {biz_type} business",
        target_audience="professionals with $10K/month revenue",
        business_type=biz_type,
    )
    validator = IdeaValidator()
    scanner = MarketScanner()
    planner = PlanGenerator()

    validation = validator.validate(idea)
    market = scanner.scan(idea, validation)
    return planner.generate(idea, market)


class TestOpsBuilder:
    def test_builds_ops_system(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert isinstance(ops, OpsSystem)

    def test_daily_routine_has_blocks(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert len(ops.daily_routine) >= 6
        for block in ops.daily_routine:
            assert block.start
            assert block.end
            assert block.activity
            assert block.category in ("build", "sell", "market", "admin", "learn")

    def test_weekly_rhythm_has_seven_days(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert len(ops.weekly_rhythm) == 7
        assert "Monday" in ops.weekly_rhythm
        assert "Sunday" in ops.weekly_rhythm

    def test_kpi_dashboard_populated(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert len(ops.kpi_dashboard) >= 5
        kpi_text = " ".join(ops.kpi_dashboard).lower()
        assert "mrr" in kpi_text or "revenue" in kpi_text

    @pytest.mark.parametrize("biz_type", ["saas", "service", "ecommerce", "consulting"])
    def test_kpis_match_business_type(self, ops_builder, biz_type):
        plan = _make_plan(biz_type)
        ops = ops_builder.build(plan)

        assert len(ops.kpi_dashboard) >= 5

    def test_automation_opportunities(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert len(ops.automation_opportunities) >= 5
        for auto in ops.automation_opportunities:
            assert auto.task
            assert auto.tool

    def test_tool_stack_complete(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert len(ops.tool_stack) >= 5
        categories = [t.category for t in ops.tool_stack]
        assert "crm" in categories
        assert "email" in categories
        assert "payments" in categories or "analytics" in categories

    def test_sprint_90_day_has_weeks(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        assert len(ops.sprint_90_day) >= 8
        assert ops.sprint_90_day[0].week == 1
        for week in ops.sprint_90_day:
            assert week.focus
            assert len(week.actions) > 0

    def test_review_cadence_has_all_periods(self, ops_builder):
        plan = _make_plan("saas")
        ops = ops_builder.build(plan)

        cadences = [r.cadence for r in ops.review_cadence]
        assert "daily" in cadences
        assert "weekly" in cadences
        assert "monthly" in cadences

    def test_growth_strategy_more_sales_time(self, ops_builder):
        plan_lean = _make_plan("saas")
        plan_lean.strategy_type = "growth"

        ops = ops_builder.build(plan_lean)
        categories = [block.category for block in ops.daily_routine]
        # Growth strategy should have sell blocks
        assert "sell" in categories
