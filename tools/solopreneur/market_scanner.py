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
market_scanner.py — Market analysis for a business idea.

Computes TAM/SAM/SOM, identifies positioning angles, and maps distribution channels.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

from .config import REVENUE_MODELS, SUPPORTED_BUSINESS_TYPES
from .validator import IdeaInput, ValidationResult

logger = logging.getLogger(__name__)


# -- Data classes --------------------------------------------------------------

@dataclass
class Competitor:
    """A competitor in the market."""

    name: str
    description: str = ""
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)
    pricing: str = ""
    market_share: str = "unknown"


@dataclass
class MarketSizing:
    """TAM / SAM / SOM estimates."""

    tam: float = 0.0           # Total addressable market ($)
    tam_label: str = ""
    sam: float = 0.0           # Serviceable addressable market ($)
    sam_label: str = ""
    som: float = 0.0           # Serviceable obtainable market ($)
    som_label: str = ""
    method: str = "bottom-up"  # "top-down" | "bottom-up" | "value-based"
    assumptions: list[str] = field(default_factory=list)


@dataclass
class PositioningAngle:
    """One possible market positioning strategy."""

    name: str
    tagline: str
    differentiation: str
    target_segment: str
    risk: str = ""


@dataclass
class MarketAnalysis:
    """Complete market analysis result."""

    sizing: MarketSizing = field(default_factory=MarketSizing)
    competitors: list[Competitor] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    positioning_options: list[PositioningAngle] = field(default_factory=list)
    pricing_benchmarks: list[str] = field(default_factory=list)
    distribution_channels: list[str] = field(default_factory=list)
    revenue_model_template: str = ""


# -- Helpers -------------------------------------------------------------------

def _parse_budget(budget_str: str) -> float:
    """Extract a dollar amount from a string like '$500/month' or '2000'."""
    if not budget_str:
        return 0.0
    nums = re.findall(r'[\d,]+(?:\.\d+)?', budget_str.replace(",", ""))
    if nums:
        return float(nums[0])
    return 0.0


def _detect_type(idea: IdeaInput) -> str:
    """Heuristic business type detection from the idea description."""
    if idea.business_type and idea.business_type in SUPPORTED_BUSINESS_TYPES:
        return idea.business_type

    text = f"{idea.idea_description} {idea.problem_statement}".lower()
    type_signals: dict[str, list[str]] = {
        "saas": ["saas", "software", "app", "platform", "subscription", "tool", "dashboard"],
        "service": ["service", "freelance", "done for you", "done-for-you", "manage"],
        "ecommerce": ["ecommerce", "e-commerce", "store", "shop", "product", "sell"],
        "marketplace": ["marketplace", "two-sided", "connect", "platform for"],
        "content": ["content", "newsletter", "course", "ebook", "membership", "community"],
        "agency": ["agency", "white label", "client work", "retainer"],
        "consulting": ["consulting", "advisory", "strategy", "coach", "mentor"],
    }
    best, best_score = "service", 0
    for btype, signals in type_signals.items():
        score = sum(1 for s in signals if s in text)
        if score > best_score:
            best, best_score = btype, score
    return best


# -- Market Scanner ------------------------------------------------------------

class MarketScanner:
    """Analyzes the market for a business idea."""

    def scan(self, idea: IdeaInput, validation: ValidationResult) -> MarketAnalysis:
        """
        Produce a market analysis including:
        - TAM/SAM/SOM estimates
        - Competitor map
        - Market gaps
        - Positioning options
        - Pricing benchmarks
        - Distribution channels
        """
        biz_type = _detect_type(idea)

        sizing = self._estimate_sizing(idea, biz_type)
        competitors = self._map_competitors(idea, biz_type)
        gaps = self._identify_gaps(idea, biz_type, validation)
        positioning = self._build_positioning(idea, biz_type)
        pricing = self._benchmark_pricing(biz_type)
        channels = self._find_channels(idea, biz_type)
        revenue_template = REVENUE_MODELS.get(biz_type, REVENUE_MODELS["service"])

        return MarketAnalysis(
            sizing=sizing,
            competitors=competitors,
            gaps=gaps,
            positioning_options=positioning,
            pricing_benchmarks=pricing,
            distribution_channels=channels,
            revenue_model_template=revenue_template,
        )

    # -- Sizing ----------------------------------------------------------------

    def _estimate_sizing(self, idea: IdeaInput, biz_type: str) -> MarketSizing:
        """
        Bottom-up market sizing based on the idea and audience.

        This is a template-based estimate. The founder should refine these numbers
        with real research. We produce reasonable defaults based on business type.
        """
        budget = _parse_budget(idea.budget_range)

        # Default customer/revenue assumptions per type
        defaults: dict[str, dict] = {
            "saas": {"customers": 50000, "arpu_monthly": 49, "segment_pct": 0.10, "capture_pct": 0.02},
            "service": {"customers": 10000, "arpu_monthly": 500, "segment_pct": 0.15, "capture_pct": 0.03},
            "ecommerce": {"customers": 100000, "arpu_monthly": 35, "segment_pct": 0.08, "capture_pct": 0.01},
            "marketplace": {"customers": 200000, "arpu_monthly": 25, "segment_pct": 0.05, "capture_pct": 0.01},
            "content": {"customers": 50000, "arpu_monthly": 15, "segment_pct": 0.12, "capture_pct": 0.03},
            "agency": {"customers": 5000, "arpu_monthly": 3000, "segment_pct": 0.10, "capture_pct": 0.02},
            "consulting": {"customers": 5000, "arpu_monthly": 5000, "segment_pct": 0.08, "capture_pct": 0.02},
        }

        d = defaults.get(biz_type, defaults["service"])
        tam = d["customers"] * d["arpu_monthly"] * 12
        sam = tam * d["segment_pct"]
        som = sam * d["capture_pct"]

        return MarketSizing(
            tam=tam,
            tam_label=f"${tam:,.0f}/yr — total potential market for {biz_type}",
            sam=sam,
            sam_label=f"${sam:,.0f}/yr — your reachable segment",
            som=som,
            som_label=f"${som:,.0f}/yr — realistic year-1 capture",
            method="bottom-up",
            assumptions=[
                f"Estimated {d['customers']:,} potential customers in the broad market",
                f"Average revenue per customer: ${d['arpu_monthly']}/month",
                f"Your addressable segment: {d['segment_pct']*100:.0f}% of total market",
                f"Year-1 capture rate: {d['capture_pct']*100:.0f}% of addressable segment",
                "Refine these with real research — talk to 20 potential customers.",
            ],
        )

    # -- Competitors -----------------------------------------------------------

    def _map_competitors(self, idea: IdeaInput, biz_type: str) -> list[Competitor]:
        """
        Generate a competitor analysis template.

        In production, this would integrate with web search. For now, we generate
        a structured template the founder should fill with real competitors.
        """
        templates: dict[str, list[Competitor]] = {
            "saas": [
                Competitor(
                    name="[Direct Competitor #1]",
                    description="The established SaaS tool in this space",
                    strengths=["Brand recognition", "Feature-rich", "Integrations"],
                    weaknesses=["Expensive", "Complex UI", "Slow support"],
                    pricing="$29-199/month",
                ),
                Competitor(
                    name="[Direct Competitor #2]",
                    description="The scrappy startup alternative",
                    strengths=["Modern UX", "Lower price", "Fast iteration"],
                    weaknesses=["Limited features", "Small team", "Less integrations"],
                    pricing="$19-79/month",
                ),
                Competitor(
                    name="[DIY / Manual Process]",
                    description="What people do without a tool (spreadsheets, manual work)",
                    strengths=["Free", "Flexible", "No learning curve"],
                    weaknesses=["Time consuming", "Error prone", "Doesn't scale"],
                    pricing="Free (but costs time)",
                ),
            ],
        }

        # Fall back to generic template for other types
        default = [
            Competitor(
                name="[Market Leader]",
                description=f"The dominant player in the {biz_type} space",
                strengths=["Brand", "Market share", "Resources"],
                weaknesses=["Slow to innovate", "Generic offering", "Poor niche focus"],
                pricing="Research needed",
            ),
            Competitor(
                name="[Niche Player]",
                description="Focused alternative serving a similar audience",
                strengths=["Niche expertise", "Personal service"],
                weaknesses=["Small scale", "Limited reach"],
                pricing="Research needed",
            ),
            Competitor(
                name="[Status Quo]",
                description="Doing nothing / manual workarounds",
                strengths=["Zero cost", "No switching pain"],
                weaknesses=["Inefficient", "Limits growth"],
                pricing="Free (hidden time cost)",
            ),
        ]

        return templates.get(biz_type, default)

    # -- Gaps ------------------------------------------------------------------

    def _identify_gaps(
        self, idea: IdeaInput, biz_type: str, validation: ValidationResult
    ) -> list[str]:
        """Identify potential market gaps based on the idea and validation."""
        gaps = []

        if validation.scores.get("competition_level", 5) >= 7:
            gaps.append(
                "Low competition suggests an underserved market — validate that demand exists."
            )
        if validation.scores.get("problem_clarity", 5) >= 7:
            gaps.append(
                "Highly specific problem — competitors may be solving it too broadly."
            )
        if validation.scores.get("audience_definition", 5) >= 7:
            gaps.append(
                "Well-defined niche audience — larger players may be ignoring this segment."
            )

        # Type-specific gaps
        type_gaps = {
            "saas": [
                "Automation gap — competitors require too much manual setup.",
                "Integration gap — no solution connects the tools your audience already uses.",
                "Price gap — existing solutions are overpriced for solo/small users.",
            ],
            "service": [
                "Productization gap — competitors sell hours, you can sell outcomes.",
                "Specialization gap — generalists serve this audience, specialists don't.",
            ],
            "ecommerce": [
                "Curation gap — existing options are overwhelming, a curated selection wins.",
                "Experience gap — competitors sell products, you can sell the experience.",
            ],
            "marketplace": [
                "Trust gap — no marketplace provides adequate vetting/quality assurance.",
                "Vertical gap — horizontal marketplaces serve this niche poorly.",
            ],
            "content": [
                "Depth gap — existing content is surface-level, practitioners want depth.",
                "Format gap — content exists in articles but not in actionable templates.",
            ],
            "agency": [
                "Transparency gap — agencies are opaque, a transparent model wins.",
                "Specialization gap — generalist agencies serve this niche poorly.",
            ],
            "consulting": [
                "Accessibility gap — top consultants are unaffordable, mid-tier is generic.",
                "Implementation gap — consultants advise but don't help execute.",
            ],
        }

        gaps.extend(type_gaps.get(biz_type, type_gaps["service"]))
        return gaps

    # -- Positioning -----------------------------------------------------------

    def _build_positioning(self, idea: IdeaInput, biz_type: str) -> list[PositioningAngle]:
        """Generate 3 positioning angles."""
        audience = idea.target_audience or "your target customer"

        return [
            PositioningAngle(
                name="The Specialist",
                tagline=f"The only {biz_type} built exclusively for {audience}",
                differentiation="Deep niche focus — everything is designed for this exact audience.",
                target_segment=audience,
                risk="Limits market size; must dominate the niche to be viable.",
            ),
            PositioningAngle(
                name="The Simplifier",
                tagline=f"The simplest way for {audience} to solve this problem",
                differentiation="Radically simple — 10x easier than alternatives.",
                target_segment=f"{audience} who are frustrated by complexity",
                risk="May be seen as 'too simple' by power users.",
            ),
            PositioningAngle(
                name="The Premium Alternative",
                tagline=f"Premium {biz_type} for {audience} who want the best",
                differentiation="Higher quality, better service, premium experience.",
                target_segment=f"Top-tier {audience} willing to pay more for quality",
                risk="Smaller market; must deliver truly exceptional quality.",
            ),
        ]

    # -- Pricing ---------------------------------------------------------------

    def _benchmark_pricing(self, biz_type: str) -> list[str]:
        """Return pricing benchmark guidelines by type."""
        benchmarks: dict[str, list[str]] = {
            "saas": [
                "Starter: $19-39/month (individuals, limited features)",
                "Pro: $49-99/month (teams, full features)",
                "Enterprise: $199-499/month (custom, priority support)",
                "Rule of thumb: price at 10% of the value you create.",
            ],
            "service": [
                "Project-based: $500-5,000 per project (scope dependent)",
                "Retainer: $1,000-5,000/month for ongoing work",
                "Hourly: $75-250/hour depending on specialization",
                "Rule of thumb: charge 3x what you'd pay an employee to do this.",
            ],
            "ecommerce": [
                "Target 40-60% gross margin after COGS",
                "Average order value: optimize for $35+ (below that, CAC kills you)",
                "Subscription boxes: $25-75/month, aim for 6+ month retention",
            ],
            "marketplace": [
                "Take rate: 10-20% of transaction value",
                "Subscription alternative: $29-99/month for sellers",
                "Freemium: free to list, paid for promotion/analytics",
            ],
            "content": [
                "Newsletter: $5-15/month ($50-150/year)",
                "Course: $97-497 one-time (or $29-49/month membership)",
                "Community: $19-99/month depending on access level",
            ],
            "agency": [
                "Retainer: $3,000-15,000/month per client",
                "Project: $5,000-50,000 per project",
                "Performance: base + % of results (risky but aligns incentives)",
            ],
            "consulting": [
                "Day rate: $1,500-5,000/day",
                "Project: $10,000-100,000+ per engagement",
                "Advisory retainer: $2,000-10,000/month for ongoing access",
            ],
        }
        return benchmarks.get(biz_type, benchmarks["service"])

    # -- Distribution ----------------------------------------------------------

    def _find_channels(self, idea: IdeaInput, biz_type: str) -> list[str]:
        """Identify distribution channels by type."""
        channels: dict[str, list[str]] = {
            "saas": [
                "Product Hunt launch (day-1 traffic spike)",
                "SEO content (problem-aware search queries)",
                "LinkedIn thought leadership (B2B)",
                "Twitter/X building in public",
                "Indie Hackers / Hacker News community",
                "Integrations marketplace (Zapier, Slack app store)",
                "Cold email to target companies",
            ],
            "service": [
                "LinkedIn outreach (direct to decision makers)",
                "Referral partnerships (complementary service providers)",
                "Content marketing (case studies, before/after)",
                "Upwork/Fiverr for initial portfolio building",
                "Local networking / industry events",
                "Cold email with personalized loom videos",
            ],
            "ecommerce": [
                "Instagram / TikTok (visual content)",
                "Google Shopping ads",
                "Amazon marketplace (if applicable)",
                "Influencer partnerships",
                "Email marketing (nurture sequences)",
                "SEO for product-category keywords",
            ],
            "marketplace": [
                "Supply-side outreach (cold email/LinkedIn to providers)",
                "Demand-side SEO (problem-aware searches)",
                "Community building (Slack/Discord group)",
                "Partnerships with industry associations",
                "Content marketing (industry insights)",
            ],
            "content": [
                "Twitter/X audience building",
                "SEO (long-form evergreen content)",
                "Guest appearances (podcasts, newsletters)",
                "Cross-promotions with adjacent creators",
                "Free lead magnets → email list → paid conversion",
            ],
            "agency": [
                "LinkedIn outreach + thought leadership",
                "Case study content marketing",
                "Referral partnerships",
                "Conference speaking",
                "Cold email to target company decision makers",
            ],
            "consulting": [
                "LinkedIn thought leadership (publish insights weekly)",
                "Speaking at industry events",
                "Referrals from past clients",
                "Book/guide as lead magnet",
                "Subcontracting from larger firms",
            ],
        }
        return channels.get(biz_type, channels["service"])
