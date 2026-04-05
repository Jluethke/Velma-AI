# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the IdeaValidator."""

import pytest

from skillchain.solopreneur.validator import IdeaInput, IdeaValidator, ValidationResult


@pytest.fixture
def validator():
    return IdeaValidator()


def _strong_idea() -> IdeaInput:
    """A well-defined idea that should score high."""
    return IdeaInput(
        idea_description=(
            "AI-powered invoice processing tool that automatically extracts "
            "line items from PDF invoices and reconciles them with purchase orders"
        ),
        target_audience=(
            "Shopify store owners doing $10K-50K/month revenue "
            "with 3+ product categories who currently spend 4 hours/week "
            "on manual invoice processing"
        ),
        problem_statement=(
            "Shopify store owners spend 4-6 hours per week manually importing "
            "CSV orders and matching invoices. They currently pay $200/month "
            "for tools that only solve half the problem."
        ),
        founder_skills=[
            "python", "ML", "10 years in ecommerce",
            "built and sold a Shopify app", "managed invoicing for 200+ clients",
        ],
        budget_range="$500/month",
    )


def _weak_idea() -> IdeaInput:
    """A vague idea that should score low."""
    return IdeaInput(
        idea_description="help people be more productive",
        target_audience="everyone",
        problem_statement="people waste time",
        founder_skills=[],
        budget_range="",
    )


class TestIdeaValidator:
    def test_strong_idea_scores_high(self, validator: IdeaValidator):
        result = validator.validate(_strong_idea())
        assert result.overall_score >= 30
        assert result.recommendation in ("strong go", "go with caveats")
        assert result.passed is True

    def test_weak_idea_scores_low(self, validator: IdeaValidator):
        result = validator.validate(_weak_idea())
        assert result.overall_score < 30
        assert result.recommendation in ("pivot", "no go")
        assert result.passed is False

    def test_scores_are_within_range(self, validator: IdeaValidator):
        result = validator.validate(_strong_idea())
        for dim, score in result.scores.items():
            assert 1 <= score <= 10, f"{dim} score {score} out of range"
        assert 0 <= result.overall_score <= 50

    def test_all_five_dimensions_scored(self, validator: IdeaValidator):
        result = validator.validate(_strong_idea())
        expected = {
            "problem_clarity", "audience_definition",
            "willingness_to_pay", "competition_level", "founder_fit",
        }
        assert set(result.scores.keys()) == expected

    def test_concerns_populated_for_weak_idea(self, validator: IdeaValidator):
        result = validator.validate(_weak_idea())
        assert len(result.concerns) > 0

    def test_strengths_populated_for_strong_idea(self, validator: IdeaValidator):
        result = validator.validate(_strong_idea())
        assert len(result.strengths) > 0

    def test_problem_clarity_rewards_specificity(self, validator: IdeaValidator):
        specific = IdeaInput(
            idea_description="tool",
            target_audience="people",
            problem_statement=(
                "I spend 4 hours per week manually importing CSV files "
                "and the errors cost us $500/month in incorrect orders"
            ),
        )
        vague = IdeaInput(
            idea_description="tool",
            target_audience="people",
            problem_statement="improve productivity and enhance workflow",
        )
        specific_result = validator.validate(specific)
        vague_result = validator.validate(vague)
        assert specific_result.scores["problem_clarity"] > vague_result.scores["problem_clarity"]

    def test_audience_rewards_narrow_definition(self, validator: IdeaValidator):
        narrow = IdeaInput(
            idea_description="tool",
            target_audience=(
                "Shopify store owners doing $10K-50K/month revenue "
                "with 3+ product categories"
            ),
        )
        broad = IdeaInput(
            idea_description="tool",
            target_audience="small businesses and startups",
        )
        narrow_result = validator.validate(narrow)
        broad_result = validator.validate(broad)
        assert narrow_result.scores["audience_definition"] > broad_result.scores["audience_definition"]

    def test_recommendation_mapping(self, validator: IdeaValidator):
        # Verify recommendation is one of the valid options
        for idea in [_strong_idea(), _weak_idea()]:
            result = validator.validate(idea)
            assert result.recommendation in (
                "strong go", "go with caveats", "pivot", "no go"
            )

    def test_empty_problem_defaults_to_idea(self, validator: IdeaValidator):
        idea = IdeaInput(
            idea_description="AI invoice processing that saves 4 hours/week per customer",
            target_audience="freelancers",
            problem_statement="",
        )
        result = validator.validate(idea)
        # Should still work — problem defaults to idea_description
        assert result.overall_score > 0
