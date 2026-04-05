# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the StrategyTournament."""

import pytest

from skillchain.solopreneur.market_scanner import MarketScanner
from skillchain.solopreneur.strategy_tournament import (
    StrategyCandidate,
    StrategyTournament,
    TournamentResult,
)
from skillchain.solopreneur.validator import IdeaInput, IdeaValidator


@pytest.fixture
def tournament():
    return StrategyTournament()


@pytest.fixture
def scanner():
    return MarketScanner()


@pytest.fixture
def validator():
    return IdeaValidator()


def _test_idea() -> IdeaInput:
    return IdeaInput(
        idea_description="SaaS tool for automated invoice processing",
        target_audience="freelancers doing $50K-200K/year with 10+ clients",
        business_type="saas",
        budget_range="$500/month",
        founder_skills=["python", "ML", "freelancing"],
    )


class TestStrategyTournament:
    def test_generates_three_candidates(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        assert isinstance(result, TournamentResult)
        assert len(result.candidates) == 3

    def test_candidates_are_lean_premium_growth(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        names = {c.name for c in result.candidates}
        assert names == {"LEAN", "PREMIUM", "GROWTH"}

    def test_winner_has_highest_score(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        scores = [c.weighted_score for c in result.candidates]
        assert result.winner.weighted_score == max(scores)

    def test_candidates_ranked_correctly(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        for i, c in enumerate(result.candidates):
            assert c.rank == i + 1

        # Scores should be descending
        for i in range(len(result.candidates) - 1):
            assert result.candidates[i].weighted_score >= result.candidates[i + 1].weighted_score

    def test_scores_within_range(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        for c in result.candidates:
            for dim, score in c.scores.items():
                assert 0.0 <= score <= 1.0, f"{c.name}.{dim} = {score} out of range"
            assert 0.0 <= c.weighted_score <= 1.0

    def test_rationale_populated(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        assert result.rationale
        assert "WINNER" in result.rationale

    def test_weights_used_recorded(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        assert result.weights_used
        assert abs(sum(result.weights_used.values()) - 1.0) < 0.001

    def test_custom_weights_change_result(self, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)

        # Heavily favor scalability — should favor GROWTH
        growth_weights = {
            "time_to_revenue": 0.05,
            "capital_required": 0.05,
            "risk_level": 0.05,
            "scalability": 0.80,
            "founder_fit": 0.05,
        }
        t = StrategyTournament(weights=growth_weights)
        result = t.run(idea, market)

        assert result.winner.name == "GROWTH"

    def test_lean_fastest_to_revenue(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        lean = next(c for c in result.candidates if c.name == "LEAN")
        growth = next(c for c in result.candidates if c.name == "GROWTH")
        premium = next(c for c in result.candidates if c.name == "PREMIUM")

        assert lean.time_to_revenue_weeks <= growth.time_to_revenue_weeks
        assert lean.time_to_revenue_weeks <= premium.time_to_revenue_weeks

    def test_lean_lowest_capital(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        lean = next(c for c in result.candidates if c.name == "LEAN")
        growth = next(c for c in result.candidates if c.name == "GROWTH")

        assert lean.capital_required_monthly <= growth.capital_required_monthly

    def test_each_candidate_has_first_move(self, tournament, scanner, validator):
        idea = _test_idea()
        validation = validator.validate(idea)
        market = scanner.scan(idea, validation)
        result = tournament.run(idea, market)

        for c in result.candidates:
            assert c.first_move
            assert c.key_assumption
            assert c.description
