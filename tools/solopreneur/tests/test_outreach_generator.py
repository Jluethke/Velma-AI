# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
# Proprietary and Confidential.

"""Tests for the OutreachGenerator."""

import pytest

from skillchain.tools.solopreneur.market_scanner import MarketScanner
from skillchain.tools.solopreneur.outreach_generator import OutreachGenerator, OutreachPack
from skillchain.tools.solopreneur.plan_generator import PlanGenerator
from skillchain.tools.solopreneur.validator import IdeaInput, IdeaValidator


@pytest.fixture
def outreach_gen():
    return OutreachGenerator()


@pytest.fixture
def plan_and_market():
    idea = IdeaInput(
        idea_description="AI-powered invoice processing SaaS",
        target_audience="freelancers doing $50K-200K/year with 10+ clients",
        business_type="saas",
        budget_range="$500/month",
    )
    validator = IdeaValidator()
    scanner = MarketScanner()
    planner = PlanGenerator()

    validation = validator.validate(idea)
    market = scanner.scan(idea, validation)
    plan = planner.generate(idea, market)
    return plan, market


class TestOutreachGenerator:
    def test_generates_outreach_pack(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        assert isinstance(pack, OutreachPack)

    def test_five_email_variants(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        assert len(pack.cold_emails) == 5

    def test_email_variants_are_unique(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        subjects = [e.subject for e in pack.cold_emails]
        assert len(set(subjects)) == len(subjects), "Email subjects should be unique"

        frameworks = [e.framework for e in pack.cold_emails]
        assert len(set(frameworks)) == len(frameworks), "Each email uses a different framework"

    def test_emails_have_subject_and_body(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        for email in pack.cold_emails:
            assert email.subject, "Email must have a subject"
            assert email.body, "Email must have a body"
            assert len(email.subject) < 80, "Subject should be under 80 chars"

    def test_five_linkedin_sequences(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        assert len(pack.linkedin_sequences) == 5

    def test_linkedin_has_three_messages(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        for seq in pack.linkedin_sequences:
            assert seq.connection_request
            assert seq.follow_up_day_2
            assert seq.follow_up_day_5

    def test_ten_social_posts(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        assert len(pack.social_posts) == 10

    def test_social_post_type_distribution(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        types = [p.post_type for p in pack.social_posts]
        assert types.count("value") == 7
        assert types.count("story") == 2
        assert types.count("promo") == 1

    def test_landing_page_has_all_sections(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        lp = pack.landing_page
        assert lp.headline
        assert lp.subheadline
        assert len(lp.value_props) == 3
        assert len(lp.how_it_works) == 3
        assert lp.social_proof
        assert lp.cta_text
        assert lp.cta_button
        assert len(lp.faq) >= 4
        assert lp.full_page_copy

    def test_elevator_pitch_exists(self, outreach_gen, plan_and_market):
        plan, market = plan_and_market
        pack = outreach_gen.generate(plan, market)

        assert pack.elevator_pitch
        assert len(pack.elevator_pitch) > 50
