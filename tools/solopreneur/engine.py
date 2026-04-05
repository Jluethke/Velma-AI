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
engine.py — The complete solopreneur launch pipeline.

Tell me your idea, get a running business back.

Usage::

    engine = SolopreneurEngine()
    result = engine.run(
        idea="AI-powered invoice processing for freelancers",
        target_audience="freelancers doing $50K-200K/year with 10+ clients",
        founder_skills=["python", "ML", "was a freelancer for 5 years"],
        budget="$500/month",
    )
    print(result.report)
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

from .config import SUPPORTED_BUSINESS_TYPES, SolopreneurConfig
from .market_scanner import MarketAnalysis, MarketScanner
from .ops_builder import OpsBuilder, OpsSystem
from .outreach_generator import OutreachGenerator, OutreachPack
from .plan_generator import BusinessPlan, PlanGenerator
from .reporter import LaunchReporter
from .strategy_tournament import StrategyTournament, TournamentResult
from .validator import IdeaInput, IdeaValidator, ValidationResult

logger = logging.getLogger(__name__)


@dataclass
class LaunchResult:
    """Complete result of a solopreneur launch pipeline run."""

    success: bool = False
    validation: ValidationResult | None = None
    market_analysis: MarketAnalysis | None = None
    strategy_tournament: TournamentResult | None = None
    business_plan: BusinessPlan | None = None
    outreach_pack: OutreachPack | None = None
    ops_system: OpsSystem | None = None
    report: str = ""
    full_report: str = ""
    total_duration_ms: float = 0.0
    error: str = ""


class SolopreneurEngine:
    """
    The complete solopreneur launch pipeline.

    Usage::

        engine = SolopreneurEngine()
        result = engine.run(
            idea="AI-powered invoice processing for freelancers",
            target_audience="freelancers doing $50K-200K/year with 10+ clients",
            founder_skills=["python", "ML", "was a freelancer for 5 years"],
            budget="$500/month",
        )
    """

    def __init__(self, config: SolopreneurConfig | None = None):
        self.config = config or SolopreneurConfig()
        self.validator = IdeaValidator()
        self.scanner = MarketScanner()
        self.tournament = StrategyTournament(self.config.tournament_weights)
        self.planner = PlanGenerator()
        self.outreach = OutreachGenerator()
        self.ops = OpsBuilder()
        self.reporter = LaunchReporter()

    def run(
        self,
        idea: str,
        target_audience: str,
        founder_skills: list[str] | None = None,
        budget: str | None = None,
        business_type: str | None = None,
        problem_statement: str | None = None,
    ) -> LaunchResult:
        """
        Full pipeline:

        1. VALIDATE  -- score the idea (go/no-go)
        2. SCAN      -- analyze the market
        3. STRATEGIZE -- generate 3 strategies, tournament select best
        4. PLAN      -- full business plan with the winning strategy
        5. OUTREACH  -- cold emails, LinkedIn, social, landing page
        6. OPS       -- daily/weekly rhythm, KPIs, tools, 90-day sprint
        7. REPORT    -- everything packaged in one deliverable
        """
        t0 = time.perf_counter()
        result = LaunchResult()

        try:
            # Build idea input
            idea_input = IdeaInput(
                idea_description=idea,
                target_audience=target_audience,
                problem_statement=problem_statement or idea,
                founder_skills=founder_skills or [],
                budget_range=budget or "",
                business_type=business_type or "",
            )

            # Auto-detect business type if not provided
            if business_type and business_type in SUPPORTED_BUSINESS_TYPES:
                idea_input.business_type = business_type

            # 1. VALIDATE
            logger.info("Stage 1/7: Validating idea...")
            result.validation = self.validator.validate(idea_input)

            # 2. SCAN
            logger.info("Stage 2/7: Scanning market...")
            result.market_analysis = self.scanner.scan(idea_input, result.validation)

            # 3. STRATEGIZE
            logger.info("Stage 3/7: Running strategy tournament...")
            result.strategy_tournament = self.tournament.run(idea_input, result.market_analysis)

            # 4. PLAN
            logger.info("Stage 4/7: Generating business plan...")
            winning_strategy = result.strategy_tournament.winner.name.lower()
            result.business_plan = self.planner.generate(
                idea_input, result.market_analysis, strategy_type=winning_strategy
            )

            # 5. OUTREACH
            logger.info("Stage 5/7: Generating outreach content...")
            result.outreach_pack = self.outreach.generate(
                result.business_plan, result.market_analysis
            )

            # 6. OPS
            logger.info("Stage 6/7: Building operations system...")
            result.ops_system = self.ops.build(result.business_plan)

            # 7. REPORT
            logger.info("Stage 7/7: Generating report...")
            result.total_duration_ms = (time.perf_counter() - t0) * 1000
            result.report = self.reporter.report(result)
            result.full_report = self.reporter.full_report(result)
            result.success = True

        except Exception as exc:
            logger.exception("Solopreneur pipeline failed")
            result.error = str(exc)
            result.total_duration_ms = (time.perf_counter() - t0) * 1000

        return result

    def validate_only(
        self,
        idea: str,
        target_audience: str,
        problem_statement: str | None = None,
        founder_skills: list[str] | None = None,
    ) -> ValidationResult:
        """Quick validation without full plan."""
        idea_input = IdeaInput(
            idea_description=idea,
            target_audience=target_audience,
            problem_statement=problem_statement or idea,
            founder_skills=founder_skills or [],
        )
        return self.validator.validate(idea_input)

    def outreach_only(
        self,
        idea: str,
        target_audience: str,
        business_type: str | None = None,
        budget: str | None = None,
    ) -> OutreachPack:
        """Just generate outreach content."""
        idea_input = IdeaInput(
            idea_description=idea,
            target_audience=target_audience,
            business_type=business_type or "",
            budget_range=budget or "",
        )
        validation = self.validator.validate(idea_input)
        market = self.scanner.scan(idea_input, validation)
        plan = self.planner.generate(idea_input, market)
        return self.outreach.generate(plan, market)
