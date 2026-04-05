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
outreach_generator.py — Ready-to-send outreach and marketing content.

Generates cold emails, LinkedIn messages, social posts, and landing page copy
using proven frameworks (AIDA, PAS, BAB).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from .market_scanner import MarketAnalysis
from .plan_generator import BusinessPlan

logger = logging.getLogger(__name__)


# -- Data classes --------------------------------------------------------------

@dataclass
class EmailVariant:
    """A single cold email variant."""

    subject: str
    body: str
    framework: str = "AIDA"  # AIDA / PAS / BAB / DIRECT / STORY
    notes: str = ""


@dataclass
class LinkedInSequence:
    """A 3-message LinkedIn outreach sequence."""

    connection_request: str
    follow_up_day_2: str
    follow_up_day_5: str
    framework: str = ""


@dataclass
class SocialPost:
    """A single social media post."""

    content: str
    post_type: str = "value"  # value / story / promo
    platform: str = "twitter"  # twitter / linkedin / both
    hashtags: list[str] = field(default_factory=list)


@dataclass
class LandingPage:
    """Complete landing page copy."""

    headline: str = ""
    subheadline: str = ""
    value_props: list[str] = field(default_factory=list)
    how_it_works: list[str] = field(default_factory=list)
    social_proof: str = ""
    cta_text: str = ""
    cta_button: str = ""
    faq: list[tuple[str, str]] = field(default_factory=list)
    full_page_copy: str = ""


@dataclass
class OutreachPack:
    """Complete outreach and marketing package."""

    cold_emails: list[EmailVariant] = field(default_factory=list)
    linkedin_sequences: list[LinkedInSequence] = field(default_factory=list)
    social_posts: list[SocialPost] = field(default_factory=list)
    landing_page: LandingPage = field(default_factory=LandingPage)
    elevator_pitch: str = ""


# -- Outreach Generator --------------------------------------------------------

class OutreachGenerator:
    """Generates ready-to-send outreach and content."""

    def generate(self, plan: BusinessPlan, market: MarketAnalysis) -> OutreachPack:
        """
        Generate a complete outreach pack:
        - 5 cold email variants (different frameworks)
        - 5 LinkedIn sequences
        - 10 social posts (70% value, 20% story, 10% promo)
        - Landing page copy
        - 30-second elevator pitch
        """
        pack = OutreachPack()

        pack.cold_emails = self._cold_emails(plan, market)
        pack.linkedin_sequences = self._linkedin_sequences(plan, market)
        pack.social_posts = self._social_posts(plan, market)
        pack.landing_page = self._landing_page(plan, market)
        pack.elevator_pitch = self._elevator_pitch(plan)

        return pack

    # -- Cold emails -----------------------------------------------------------

    def _cold_emails(self, plan: BusinessPlan, market: MarketAnalysis) -> list[EmailVariant]:
        """Generate 5 cold email variants using different frameworks."""
        one_liner = plan.one_liner
        value = plan.value_prop
        biz_type = plan.business_type

        pricing_hint = ""
        if plan.pricing:
            pricing_hint = plan.pricing[0].price

        return [
            # 1. AIDA (Attention -> Interest -> Desire -> Action)
            EmailVariant(
                subject="Quick question about [their specific pain]",
                body=(
                    "Hi [Name],\n\n"
                    "I noticed [something specific about them/their company]. "
                    "Impressive work on [specific detail].\n\n"
                    f"I've been working on {one_liner} — "
                    f"and I think it could help with [specific problem they have].\n\n"
                    "Early users are seeing [specific benefit, e.g., 'saving 4+ hours/week']. "
                    f"Starting at {pricing_hint}.\n\n"
                    "Would a 15-minute call this week make sense? "
                    "I can show you exactly how it works.\n\n"
                    "Best,\n[Your name]"
                ),
                framework="AIDA",
                notes="Personalize the first 2 lines for each recipient. Never send generic.",
            ),

            # 2. PAS (Problem -> Agitate -> Solve)
            EmailVariant(
                subject="[Their pain point] is costing you more than you think",
                body=(
                    "Hi [Name],\n\n"
                    "Most [target role/company type] spend way too much time on [problem]. "
                    "It's one of those things that seems small until you add up the hours — "
                    "and the mistakes that slip through.\n\n"
                    "The worst part? It gets worse as you grow. More [volume/clients/orders] "
                    "means more manual work, more errors, more frustration.\n\n"
                    f"That's why I built {one_liner}. "
                    "It handles [core function] automatically so you can focus on "
                    "[what they actually want to do].\n\n"
                    "Happy to show you in 15 minutes. Free to chat [day]?\n\n"
                    "[Your name]"
                ),
                framework="PAS",
                notes="Works best when you deeply understand the pain point. Be specific.",
            ),

            # 3. BAB (Before -> After -> Bridge)
            EmailVariant(
                subject="How [similar company] went from [before] to [after]",
                body=(
                    "Hi [Name],\n\n"
                    "Before: [Their company type] was spending [X hours/week] on [problem], "
                    "dealing with [specific frustrations], and missing [opportunities].\n\n"
                    "After: They automated [core function], reduced errors by [metric], "
                    "and freed up [hours/week] for [high-value work].\n\n"
                    f"Bridge: {one_liner}.\n\n"
                    "Would it be worth 15 minutes to see if this could work for "
                    "[their company]?\n\n"
                    "[Your name]"
                ),
                framework="BAB",
                notes="Fill in with real case study data as soon as you have your first customer.",
            ),

            # 4. DIRECT (Straight to the point)
            EmailVariant(
                subject=f"[One-line value prop] for [their company]",
                body=(
                    "Hi [Name],\n\n"
                    f"I help [target audience] with {one_liner}.\n\n"
                    f"Pricing starts at {pricing_hint}. "
                    "No long contracts. Cancel anytime.\n\n"
                    "Interested in a quick demo?\n\n"
                    "[Your name]"
                ),
                framework="DIRECT",
                notes="Best for busy executives. Respect their time — say it in 4 lines.",
            ),

            # 5. STORY (Personal connection)
            EmailVariant(
                subject="I used to have the same problem at [context]",
                body=(
                    "Hi [Name],\n\n"
                    "When I was [your role/situation], I struggled with [the same problem "
                    "they have]. I tried [alternatives] but nothing worked because "
                    "[specific gap in alternatives].\n\n"
                    f"So I built {one_liner}.\n\n"
                    "It's helped [X] people/companies [specific result]. "
                    "I'd love to see if it could help [their company] too.\n\n"
                    "15 minutes this week?\n\n"
                    "[Your name]"
                ),
                framework="STORY",
                notes="Only works if you genuinely have the founder story. Authenticity is everything.",
            ),
        ]

    # -- LinkedIn sequences ----------------------------------------------------

    def _linkedin_sequences(
        self, plan: BusinessPlan, market: MarketAnalysis
    ) -> list[LinkedInSequence]:
        """Generate 5 LinkedIn outreach sequences (connection + 2 follow-ups)."""
        one_liner = plan.one_liner

        return [
            LinkedInSequence(
                connection_request=(
                    "Hi [Name], I saw your work on [specific thing]. "
                    "I'm building in the same space — would love to connect."
                ),
                follow_up_day_2=(
                    "Thanks for connecting! I noticed [their company] does [thing]. "
                    "I recently wrote about [related topic] — thought you might find "
                    "it useful: [link to your content]"
                ),
                follow_up_day_5=(
                    f"Quick question — do you ever deal with [pain point]? "
                    f"I built {one_liner} to solve exactly that. "
                    "Happy to show you in 10 min if useful, no pressure either way."
                ),
                framework="Connect -> Value -> Ask",
            ),
            LinkedInSequence(
                connection_request=(
                    "Hi [Name], fellow [industry] person here. "
                    "Your post about [topic] resonated — connecting to follow your work."
                ),
                follow_up_day_2=(
                    "Enjoyed your recent post on [topic]. It reminded me of [insight]. "
                    "Have you found a good solution for [related pain point]?"
                ),
                follow_up_day_5=(
                    "Following up on the [pain point] question — I've been helping "
                    f"[audience] with exactly this through {one_liner}. "
                    "Would a quick chat be worth it?"
                ),
                framework="Engage -> Relate -> Offer",
            ),
            LinkedInSequence(
                connection_request=(
                    "Hi [Name], I see you're [their role] at [company]. "
                    "I work with [similar companies] — would love to connect."
                ),
                follow_up_day_2=(
                    "Thanks for the connection! Curious — what's the biggest "
                    "challenge you face with [problem area] right now?"
                ),
                follow_up_day_5=(
                    "I ask because I've been working with [audience] on [problem], "
                    f"and built {one_liner}. "
                    "Early users are seeing [result]. Worth a 10-min demo?"
                ),
                framework="Connect -> Diagnose -> Prescribe",
            ),
            LinkedInSequence(
                connection_request=(
                    "Hi [Name], I noticed we share connections in [industry]. "
                    "Always looking to connect with sharp people in the space."
                ),
                follow_up_day_2=(
                    "Quick question — I'm researching how [audience] handle [problem]. "
                    "Any insights from your experience?"
                ),
                follow_up_day_5=(
                    "Appreciate the perspective! Based on what I'm hearing, "
                    f"I put together {one_liner}. "
                    "Happy to share — might be relevant to what you're working on."
                ),
                framework="Connect -> Research -> Share",
            ),
            LinkedInSequence(
                connection_request=(
                    "Hi [Name], I built something for [audience] and I'd love your "
                    "honest feedback. No pitch, just trying to learn."
                ),
                follow_up_day_2=(
                    f"Here's what I've been building: {one_liner}. "
                    "Would love your honest take — what resonates? What doesn't?"
                ),
                follow_up_day_5=(
                    "Thanks for the feedback! Based on what you said, I've "
                    "[made changes]. Would you be open to trying it out? "
                    "Free for the first month as a thank-you."
                ),
                framework="Ask -> Learn -> Convert",
            ),
        ]

    # -- Social posts ----------------------------------------------------------

    def _social_posts(self, plan: BusinessPlan, market: MarketAnalysis) -> list[SocialPost]:
        """Generate 10 social posts: 7 value, 2 story, 1 promo."""
        one_liner = plan.one_liner
        biz_type = plan.business_type

        posts = [
            # VALUE posts (7)
            SocialPost(
                f"Most {biz_type} founders make this mistake:\n\n"
                "They build for 6 months before talking to a single customer.\n\n"
                "Instead: sell first, build second.\n\n"
                "Your first 10 customers don't care about your tech stack.\n"
                "They care about whether you solve their problem.",
                post_type="value", platform="both",
            ),
            SocialPost(
                "The unsexy truth about starting a business:\n\n"
                "Week 1: Exciting idea!\n"
                "Week 2: Landing page up!\n"
                "Week 3: No one cares.\n"
                "Week 4-12: Cold outreach, rejection, iteration.\n"
                "Week 13: First real customer.\n\n"
                "The gap between week 3 and 13 is where everyone quits.",
                post_type="value", platform="both",
            ),
            SocialPost(
                "5 things I wish I knew before going solo:\n\n"
                "1. Price higher than you think (you can always discount)\n"
                "2. Your first version will embarrass you (ship it anyway)\n"
                "3. Cold outreach works if you personalize it\n"
                "4. Track 3 metrics, not 30\n"
                "5. Revenue solves 90% of startup problems",
                post_type="value", platform="both",
            ),
            SocialPost(
                f"How to validate a {biz_type} idea in 48 hours:\n\n"
                "1. Write a one-sentence pitch\n"
                "2. Post it in 3 communities where your audience hangs out\n"
                "3. DM 10 people who engage\n"
                "4. Ask: 'Would you pay $X for this?'\n"
                "5. If 3+ say yes, you have something. If 0, pivot.\n\n"
                "Don't build. Validate.",
                post_type="value", platform="both",
            ),
            SocialPost(
                "The cold email formula that actually works:\n\n"
                "Subject: [Something about THEM, not you]\n"
                "Line 1: Genuine compliment or observation\n"
                "Line 2: The problem you solve\n"
                "Line 3: One proof point\n"
                "Line 4: Simple CTA (15 min call?)\n\n"
                "Total: 4-5 lines. No fluff. No attachments.",
                post_type="value", platform="both",
            ),
            SocialPost(
                "Solopreneur daily schedule that actually works:\n\n"
                "AM: Deep work (build/deliver) — 4 hours\n"
                "Lunch: Content creation — 30 min\n"
                "PM: Sales & outreach — 2 hours\n"
                "EOD: Admin & planning — 1 hour\n\n"
                "The key: sales EVERY day, not 'when I feel like it'.",
                post_type="value", platform="both",
            ),
            SocialPost(
                "Your pricing is probably wrong.\n\n"
                "Signs you're too cheap:\n"
                "- Clients never push back on price\n"
                "- You're always busy but never profitable\n"
                "- You attract high-maintenance, low-value clients\n\n"
                "Raise your prices 50%. Lose some clients. "
                "The ones who stay are the ones you want.",
                post_type="value", platform="both",
            ),

            # STORY posts (2)
            SocialPost(
                f"I'm building {one_liner}.\n\n"
                "Here's why:\n\n"
                "I spent [time] doing [the problem] manually. "
                "Every tool I tried was either too expensive, too complex, "
                "or built for enterprises, not [target audience].\n\n"
                "So I'm building the thing I wish existed.\n\n"
                "Week 1 update coming soon. Follow along.",
                post_type="story", platform="both",
            ),
            SocialPost(
                "Day 30 of building a business solo.\n\n"
                "What's working:\n"
                "- Cold outreach (X replies from Y emails)\n"
                "- Building in public (engagement is growing)\n\n"
                "What's not:\n"
                "- Trying to be on every platform\n"
                "- Perfectionism on the product\n\n"
                "Lesson: do less, but do it consistently.",
                post_type="story", platform="both",
            ),

            # PROMO post (1)
            SocialPost(
                f"Launching soon: {one_liner}\n\n"
                "If you [experience the pain point], this is for you.\n\n"
                "Early access: [link]\n"
                "First 10 sign-ups get [incentive].\n\n"
                "Built by a solo founder who had the same problem.",
                post_type="promo", platform="both",
            ),
        ]

        return posts

    # -- Landing page ----------------------------------------------------------

    def _landing_page(self, plan: BusinessPlan, market: MarketAnalysis) -> LandingPage:
        """Generate complete landing page copy."""
        one_liner = plan.one_liner
        value = plan.value_prop

        pricing_section = ""
        if plan.pricing:
            tiers = []
            for t in plan.pricing:
                features = ", ".join(t.features) if t.features else ""
                tiers.append(f"  {t.name}: {t.price} — {features}")
            pricing_section = "\n".join(tiers)

        how_steps = [
            "1. Sign up in 30 seconds (no credit card required)",
            "2. Tell us about your [situation/needs]",
            "3. Get [result] in [timeframe]",
        ]

        faq = [
            ("How is this different from [competitor]?",
             "We're built exclusively for [your audience]. That means [key differentiator]."),
            ("What if it doesn't work for me?",
             "Full refund within 30 days, no questions asked."),
            ("How long does it take to see results?",
             "Most users see [initial result] within [timeframe]. Full value in [longer timeframe]."),
            ("Do I need technical skills?",
             "No. If you can use email, you can use this."),
            ("What kind of support do you offer?",
             "Email support with <24hr response time. Founder-direct — you talk to me, not a bot."),
        ]

        full_copy = (
            f"# {one_liner}\n\n"
            f"## {value}\n\n"
            "---\n\n"
            "### How It Works\n"
            + "\n".join(how_steps) + "\n\n"
            "---\n\n"
            "### What You Get\n"
            f"- [Value prop 1: Save time on X]\n"
            f"- [Value prop 2: Eliminate Y]\n"
            f"- [Value prop 3: Grow Z]\n\n"
            "---\n\n"
            "### Pricing\n"
            + pricing_section + "\n\n"
            "---\n\n"
            "### FAQ\n"
            + "\n".join(f"**Q: {q}**\nA: {a}\n" for q, a in faq)
            + "\n---\n\n"
            "[CTA Button: Get Started Free]\n"
        )

        return LandingPage(
            headline=one_liner,
            subheadline=value,
            value_props=[
                "Save [X hours/week] on [task]",
                "Eliminate [pain point] completely",
                "Grow [metric] by [amount] in [timeframe]",
            ],
            how_it_works=how_steps,
            social_proof=(
                '"[Testimonial from first customer]" — [Name], [Role] at [Company]\n'
                "(Collect real testimonials ASAP. Nothing sells like proof.)"
            ),
            cta_text="Ready to [solve the problem]?",
            cta_button="Get Started Free",
            faq=faq,
            full_page_copy=full_copy,
        )

    # -- Elevator pitch --------------------------------------------------------

    def _elevator_pitch(self, plan: BusinessPlan) -> str:
        """Generate a 30-second verbal pitch."""
        return (
            f"You know how [target audience] struggle with [problem]? "
            f"I built {plan.one_liner}. "
            f"It's a {plan.business_type} that [core benefit] "
            f"in a way that's [key differentiator] compared to alternatives. "
            f"We're already helping [X] customers, starting at {plan.pricing[0].price if plan.pricing else '[price]'}. "
            f"I'm looking for [specific ask — beta users, partners, customers]."
        )
