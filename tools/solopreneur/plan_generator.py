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
plan_generator.py — Actionable business plan generation.

Generates a lean, one-page business plan with pricing, timeline,
MVP scope, and a first-10-customers strategy. Not a 50-page document.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from .config import MVP_TIMELINE_WEEKS, REVENUE_MODELS
from .market_scanner import MarketAnalysis, _detect_type
from .validator import IdeaInput

logger = logging.getLogger(__name__)


# -- Data classes --------------------------------------------------------------

@dataclass
class PricingTier:
    """A single pricing tier."""

    name: str
    price: str
    features: list[str] = field(default_factory=list)
    target: str = ""


@dataclass
class Milestone:
    """A key milestone with success metric."""

    name: str
    week: int
    metric: str
    description: str = ""


@dataclass
class Risk:
    """A risk with mitigation strategy."""

    risk: str
    likelihood: str = "medium"  # low / medium / high
    impact: str = "medium"
    mitigation: str = ""


@dataclass
class WeekPlan:
    """A single week in the 90-day sprint."""

    week: int
    theme: str
    tasks: list[str] = field(default_factory=list)


@dataclass
class BusinessPlan:
    """Complete actionable business plan."""

    # Core
    one_liner: str = ""
    value_prop: str = ""
    business_type: str = ""
    strategy_type: str = "lean"  # lean / premium / growth

    # MVP
    mvp_scope: list[str] = field(default_factory=list)
    cut_list: list[str] = field(default_factory=list)
    mvp_timeline_weeks: int = 4

    # Revenue
    pricing: list[PricingTier] = field(default_factory=list)
    revenue_model: str = ""

    # Execution
    timeline: list[WeekPlan] = field(default_factory=list)
    budget_monthly: float = 0.0
    budget_breakdown: dict[str, float] = field(default_factory=dict)

    # Milestones & Risks
    milestones: list[Milestone] = field(default_factory=list)
    risks: list[Risk] = field(default_factory=list)

    # Go-to-market
    first_10_customers: list[str] = field(default_factory=list)


# -- Plan Generator ------------------------------------------------------------

class PlanGenerator:
    """Generates actionable business plans, not 50-page documents."""

    def generate(
        self,
        idea: IdeaInput,
        market: MarketAnalysis,
        strategy_type: str = "lean",
    ) -> BusinessPlan:
        """
        Generate a complete business plan.

        strategy_type: 'lean' (MVP fast), 'premium' (quality first), 'growth' (scale fast)
        """
        biz_type = _detect_type(idea)
        mvp_weeks = MVP_TIMELINE_WEEKS.get(biz_type, 4)

        # Adjust timeline by strategy
        if strategy_type == "lean":
            mvp_weeks = max(1, mvp_weeks // 2)
        elif strategy_type == "growth":
            mvp_weeks = max(1, int(mvp_weeks * 0.75))
        # premium keeps the full timeline

        plan = BusinessPlan(
            business_type=biz_type,
            strategy_type=strategy_type,
            mvp_timeline_weeks=mvp_weeks,
        )

        plan.one_liner = self._one_liner(idea, biz_type)
        plan.value_prop = self._value_prop(idea, biz_type)
        plan.mvp_scope, plan.cut_list = self._mvp_scope(idea, biz_type, strategy_type)
        plan.pricing = self._pricing(biz_type, strategy_type, market)
        plan.revenue_model = REVENUE_MODELS.get(biz_type, REVENUE_MODELS["service"])
        plan.timeline = self._timeline(biz_type, strategy_type, mvp_weeks)
        plan.budget_monthly, plan.budget_breakdown = self._budget(idea, biz_type, strategy_type)
        plan.milestones = self._milestones(biz_type, strategy_type, mvp_weeks)
        plan.risks = self._risks(biz_type, strategy_type)
        plan.first_10_customers = self._first_10(idea, biz_type, market)

        return plan

    # -- One-liner & Value prop ------------------------------------------------

    def _one_liner(self, idea: IdeaInput, biz_type: str) -> str:
        """Generate a max-15-word elevator pitch."""
        audience = idea.target_audience.split(",")[0].strip() if idea.target_audience else "professionals"
        desc = idea.idea_description
        # Trim to core phrase
        words = desc.split()
        if len(words) > 10:
            desc = " ".join(words[:10]) + "..."
        return f"{desc} for {audience}"

    def _value_prop(self, idea: IdeaInput, biz_type: str) -> str:
        """Generate a value proposition statement."""
        audience = idea.target_audience or "your target customer"
        problem = idea.problem_statement or idea.idea_description
        return (
            f"We help {audience} solve '{problem}' "
            f"through a {biz_type} approach that's simpler, faster, "
            f"and more focused than alternatives."
        )

    # -- MVP scope -------------------------------------------------------------

    def _mvp_scope(
        self, idea: IdeaInput, biz_type: str, strategy: str
    ) -> tuple[list[str], list[str]]:
        """Return (must-have features, cut-for-later features)."""

        scope_templates: dict[str, tuple[list[str], list[str]]] = {
            "saas": (
                [
                    "Core workflow: the one thing that solves the problem",
                    "User authentication (email + password)",
                    "Simple dashboard showing key data",
                    "Stripe integration for payments",
                    "Basic email notifications",
                ],
                [
                    "Team/collaboration features",
                    "Advanced analytics and reporting",
                    "API / integrations",
                    "Mobile app",
                    "White-labeling",
                    "Custom workflows",
                ],
            ),
            "service": (
                [
                    "Service definition: exactly what you deliver",
                    "Intake questionnaire / discovery call script",
                    "Delivery process: step-by-step checklist",
                    "Pricing page or proposal template",
                    "Client onboarding email sequence",
                ],
                [
                    "Productized service tiers",
                    "Self-serve portal",
                    "Automated reporting",
                    "Subcontractor management",
                    "Case study library",
                ],
            ),
            "ecommerce": (
                [
                    "Product listings with photos and descriptions",
                    "Checkout flow (Shopify or Gumroad)",
                    "Payment processing",
                    "Shipping / delivery logistics",
                    "Order confirmation emails",
                ],
                [
                    "Subscription/recurring orders",
                    "Loyalty program",
                    "Advanced product filtering",
                    "Reviews and ratings",
                    "Wholesale / B2B portal",
                ],
            ),
            "marketplace": (
                [
                    "Supply-side listing creation",
                    "Demand-side search and discovery",
                    "Matching / connection mechanism",
                    "Payment escrow or facilitation",
                    "Basic reviews / trust signals",
                ],
                [
                    "Advanced search filters",
                    "Messaging system",
                    "Dispute resolution",
                    "Analytics for sellers",
                    "Featured listings / ads",
                ],
            ),
            "content": (
                [
                    "Content format defined (newsletter, course, etc.)",
                    "Publishing platform (Substack, Teachable, etc.)",
                    "Payment / subscription setup",
                    "Email capture landing page",
                    "First 5 pieces of content created",
                ],
                [
                    "Community forum / chat",
                    "Premium tiers",
                    "Mobile app",
                    "Live events / webinars",
                    "Affiliate program",
                ],
            ),
            "agency": (
                [
                    "Service packages defined (3 tiers)",
                    "Portfolio / case studies (even hypothetical)",
                    "Proposal template",
                    "Client onboarding process",
                    "Project management workflow",
                ],
                [
                    "White-label capabilities",
                    "Client portal",
                    "Automated reporting",
                    "Hiring / team scaling",
                    "Partner program",
                ],
            ),
            "consulting": (
                [
                    "Consulting offer defined (scope, deliverables)",
                    "Discovery call script and booking system",
                    "Proposal / SOW template",
                    "Delivery framework / methodology",
                    "Follow-up and referral system",
                ],
                [
                    "Group programs / workshops",
                    "Online course version",
                    "Certification program",
                    "Speaking / events",
                    "Book / thought leadership content",
                ],
            ),
        }

        scope, cut = scope_templates.get(biz_type, scope_templates["service"])

        # Strategy adjustments
        if strategy == "lean":
            # Keep only top 3 must-haves
            scope = scope[:3]
        elif strategy == "premium":
            # Add one item from cut list to scope
            if cut:
                scope.append(f"[Premium] {cut[0]}")
        # growth keeps the default

        return scope, cut

    # -- Pricing ---------------------------------------------------------------

    def _pricing(
        self, biz_type: str, strategy: str, market: MarketAnalysis
    ) -> list[PricingTier]:
        """Generate pricing tiers."""

        base_pricing: dict[str, list[PricingTier]] = {
            "saas": [
                PricingTier("Starter", "$19/month", ["Core features", "1 user", "Email support"], "Individuals"),
                PricingTier("Pro", "$49/month", ["All features", "5 users", "Priority support"], "Small teams"),
                PricingTier("Business", "$99/month", ["Everything", "Unlimited users", "Dedicated support"], "Growing teams"),
            ],
            "service": [
                PricingTier("Quick Win", "$500", ["One-time deliverable", "1-week turnaround"], "Budget-conscious"),
                PricingTier("Standard", "$2,000/month", ["Ongoing service", "Weekly deliverables", "Slack access"], "Core clients"),
                PricingTier("Premium", "$5,000/month", ["Priority everything", "Daily standups", "Strategy calls"], "High-value clients"),
            ],
            "ecommerce": [
                PricingTier("Single", "$29-49", ["One product", "Free shipping over $50"], "Try-before-you-buy"),
                PricingTier("Bundle", "$79-129", ["3-5 products", "Free shipping", "10% discount"], "Best value"),
                PricingTier("Subscribe", "$39/month", ["Monthly delivery", "15% discount", "Cancel anytime"], "Recurring revenue"),
            ],
            "marketplace": [
                PricingTier("Free", "Free", ["Basic listing", "Standard support"], "New sellers"),
                PricingTier("Pro Seller", "$29/month", ["Featured listings", "Analytics", "Priority support"], "Active sellers"),
                PricingTier("Transaction Fee", "10-15% per sale", ["Payment processing", "Dispute mediation"], "All transactions"),
            ],
            "content": [
                PricingTier("Free", "Free", ["Weekly newsletter", "Public content"], "Audience building"),
                PricingTier("Member", "$9/month", ["Premium content", "Community access", "Monthly AMA"], "Core readers"),
                PricingTier("VIP", "$29/month", ["Everything", "Private Slack", "1-on-1 monthly call"], "Superfans"),
            ],
            "agency": [
                PricingTier("Starter", "$3,000/month", ["Core deliverables", "Bi-weekly check-ins"], "Small businesses"),
                PricingTier("Growth", "$7,500/month", ["Full service", "Weekly strategy calls", "Priority"], "Mid-market"),
                PricingTier("Enterprise", "$15,000+/month", ["White-glove service", "Dedicated team", "Custom reporting"], "Large accounts"),
            ],
            "consulting": [
                PricingTier("Advisory", "$2,000/month", ["2 calls/month", "Async access", "Resource library"], "Ongoing guidance"),
                PricingTier("Project", "$15,000", ["Full engagement", "Deliverable-based", "60-day timeline"], "Specific outcomes"),
                PricingTier("VIP Day", "$5,000/day", ["Full day intensive", "Action plan", "30-day follow-up"], "Fast results"),
            ],
        }

        tiers = base_pricing.get(biz_type, base_pricing["service"])

        # Strategy adjustments
        if strategy == "premium":
            # Bump prices up ~50%
            for t in tiers:
                t.name = f"{t.name} (Premium)"
        elif strategy == "lean":
            # Trim to 2 tiers
            tiers = tiers[:2]

        return tiers

    # -- Timeline (90-day sprint) ----------------------------------------------

    def _timeline(self, biz_type: str, strategy: str, mvp_weeks: int) -> list[WeekPlan]:
        """Generate a 13-week (90-day) sprint plan."""
        weeks: list[WeekPlan] = []

        # Phase 1: Build (weeks 1 to mvp_weeks)
        build_end = min(mvp_weeks, 4)
        weeks.append(WeekPlan(1, "Foundation", [
            "Set up legal basics (LLC/sole prop, EIN, business bank account)",
            "Register domain, set up email",
            "Create landing page with waitlist",
            "Set up analytics tracking",
        ]))

        if build_end >= 2:
            weeks.append(WeekPlan(2, "Build MVP", [
                "Build core feature / service offering",
                "Create pricing page",
                "Set up payment processing (Stripe)",
                "Write onboarding email sequence",
            ]))

        for w in range(3, build_end + 1):
            weeks.append(WeekPlan(w, f"Build MVP (continued)", [
                "Continue building core product/service",
                "Test with 2-3 beta users",
                "Iterate based on feedback",
                "Prepare launch content",
            ]))

        # Phase 2: Launch (weeks mvp_weeks+1 to mvp_weeks+3)
        launch_start = build_end + 1
        weeks.append(WeekPlan(launch_start, "Soft Launch", [
            "Launch to waitlist / warm network",
            "Collect feedback from first users",
            "Fix critical issues",
            "Start outreach to first 10 target customers",
        ]))

        weeks.append(WeekPlan(launch_start + 1, "Outreach Blitz", [
            "Send 50 cold emails / LinkedIn messages",
            "Publish 3 social posts",
            "Follow up with all warm leads",
            "Get first 3 paying customers (or die trying)",
        ]))

        weeks.append(WeekPlan(launch_start + 2, "Iterate & Close", [
            "Analyse early customer feedback",
            "Adjust pricing if needed",
            "Double down on working channels",
            "Target: 5 paying customers",
        ]))

        # Phase 3: Grow (remaining weeks up to 13)
        grow_start = launch_start + 3
        for w in range(grow_start, 14):
            if w <= 10:
                weeks.append(WeekPlan(w, "Growth Sprint", [
                    "Scale outreach (100+ contacts/week)",
                    "Publish 2-3 content pieces",
                    "Follow up and close deals",
                    "Systematize delivery",
                ]))
            else:
                weeks.append(WeekPlan(w, "Optimise & Scale", [
                    "Review KPIs and double down on what works",
                    "Cut what doesn't work",
                    "Start automating repetitive tasks",
                    "Plan month 4-6 based on data",
                ]))

        return weeks

    # -- Budget ----------------------------------------------------------------

    def _budget(
        self, idea: IdeaInput, biz_type: str, strategy: str
    ) -> tuple[float, dict[str, float]]:
        """Estimate monthly budget and breakdown."""
        from .market_scanner import _parse_budget

        user_budget = _parse_budget(idea.budget_range)

        base_budgets: dict[str, dict[str, float]] = {
            "saas": {
                "Hosting (Vercel/Railway)": 20,
                "Domain + Email": 10,
                "Analytics tools": 0,
                "Stripe fees (estimated)": 30,
                "Marketing spend": 100,
            },
            "service": {
                "Domain + Email": 10,
                "CRM (free tier)": 0,
                "Marketing spend": 50,
                "Tools / software": 30,
            },
            "ecommerce": {
                "Shopify / platform": 39,
                "Domain + Email": 10,
                "Marketing / ads": 200,
                "Shipping supplies": 50,
                "Stripe fees": 50,
            },
            "marketplace": {
                "Hosting": 50,
                "Domain + Email": 10,
                "Marketing": 150,
                "Stripe fees": 30,
            },
            "content": {
                "Substack/Ghost (free tier)": 0,
                "Domain + Email": 10,
                "Design tools (Canva)": 0,
                "Promotion": 20,
            },
            "agency": {
                "Domain + Email": 10,
                "CRM": 0,
                "Project management": 0,
                "Marketing": 100,
                "Software tools": 50,
            },
            "consulting": {
                "Domain + Email": 10,
                "Scheduling tool": 0,
                "Marketing / networking": 50,
                "Professional development": 50,
            },
        }

        breakdown = base_budgets.get(biz_type, base_budgets["service"])

        if strategy == "premium":
            # Add premium-tier tools
            breakdown["Premium tools / subscriptions"] = 100
        elif strategy == "growth":
            # Increase marketing spend
            breakdown["Marketing spend"] = breakdown.get("Marketing spend", 50) * 3

        total = sum(breakdown.values())
        return total, breakdown

    # -- Milestones ------------------------------------------------------------

    def _milestones(self, biz_type: str, strategy: str, mvp_weeks: int) -> list[Milestone]:
        """5 key milestones for the first 90 days."""
        return [
            Milestone(
                "Landing page live",
                week=1,
                metric="Page live with analytics tracking",
                description="Get your presence on the internet. Doesn't need to be perfect.",
            ),
            Milestone(
                "MVP / offer ready",
                week=mvp_weeks,
                metric="Core product/service deliverable and functional",
                description="The minimum thing you can charge money for.",
            ),
            Milestone(
                "First paying customer",
                week=mvp_weeks + 2,
                metric="$1 in revenue from a real customer (not friends/family)",
                description="The hardest milestone. Everything before this is theory.",
            ),
            Milestone(
                "10 paying customers",
                week=min(mvp_weeks + 6, 10),
                metric="10 customers who paid real money",
                description="Proves repeatable demand, not just one lucky sale.",
            ),
            Milestone(
                "Repeatable growth channel",
                week=13,
                metric="One channel consistently producing 2+ new customers/week",
                description="You've found what works. Now double down.",
            ),
        ]

    # -- Risks -----------------------------------------------------------------

    def _risks(self, biz_type: str, strategy: str) -> list[Risk]:
        """Top 5 risks with mitigations."""
        common = [
            Risk(
                "No one wants to pay",
                likelihood="medium", impact="high",
                mitigation="Pre-sell before building. Get 3 LOIs or waitlist sign-ups before writing code.",
            ),
            Risk(
                "Building too much before selling",
                likelihood="high", impact="medium",
                mitigation="Ship the smallest possible thing. Manual processes are fine for the first 10 customers.",
            ),
            Risk(
                "Running out of motivation / runway",
                likelihood="medium", impact="high",
                mitigation="Set a 90-day deadline. If no paying customers by then, pivot or stop.",
            ),
            Risk(
                "Pricing too low",
                likelihood="high", impact="medium",
                mitigation="Start higher than you think. You can always discount, but raising prices is painful.",
            ),
            Risk(
                "Spending on tools instead of talking to customers",
                likelihood="medium", impact="medium",
                mitigation="First 2 weeks = 80% customer conversations, 20% building. Use free tools only.",
            ),
        ]

        # Strategy-specific
        if strategy == "growth":
            common.append(Risk(
                "Scaling before product-market fit",
                likelihood="high", impact="high",
                mitigation="Don't spend on ads until you have 10 organic customers and 80%+ retention.",
            ))
        elif strategy == "premium":
            common.append(Risk(
                "Quality expectations too high to deliver solo",
                likelihood="medium", impact="high",
                mitigation="Start with 2-3 clients max. Over-deliver for them, then raise prices.",
            ))

        return common[:5]

    # -- First 10 customers ----------------------------------------------------

    def _first_10(
        self, idea: IdeaInput, biz_type: str, market: MarketAnalysis
    ) -> list[str]:
        """Specific strategy to get the first 10 paying customers."""
        audience = idea.target_audience or "your target customer"
        strategies: dict[str, list[str]] = {
            "saas": [
                f"1. Find 50 {audience} on LinkedIn. Connect with personalized notes.",
                "2. Offer free beta access to first 10 who respond. Get them using it.",
                "3. After 2 weeks of usage, ask for honest feedback + paid conversion.",
                "4. Post your journey on Twitter/X and Indie Hackers (building in public).",
                "5. Ask every happy beta user for 2 referrals.",
            ],
            "service": [
                f"1. Message 20 {audience} in your existing network. Offer a discounted first project.",
                "2. Post on 3 relevant communities (Reddit, Slack groups, Facebook groups).",
                "3. Create one detailed case study (even from a free/discounted project).",
                "4. Cold email 30 prospects with a personalized angle.",
                "5. Ask every client for a testimonial and 2 referrals.",
            ],
            "ecommerce": [
                "1. Start with friends/family for first 3 orders (get process working).",
                f"2. Find 5 online communities where {audience} hangs out. Share value, not ads.",
                "3. Send product to 3 micro-influencers for honest reviews.",
                "4. Run a small ($50) Instagram/Facebook ad to test messaging.",
                "5. Launch on Product Hunt or a relevant community platform.",
            ],
            "marketplace": [
                "1. Manually recruit first 20 supply-side users (cold email/LinkedIn).",
                "2. Offer first 3 months free for early supply-side adopters.",
                "3. Manually match first 10 demand-side users with supply.",
                "4. Get 5 successful transactions completed (even if you facilitate manually).",
                "5. Use testimonials from both sides to recruit the next wave.",
            ],
            "content": [
                "1. Publish 10 free pieces of content on your topic.",
                "2. Cross-post on Twitter, LinkedIn, and one community (Reddit, HN, etc.).",
                "3. Guest-post or appear on 2-3 podcasts/newsletters in adjacent spaces.",
                "4. Offer a free resource (template, guide) as email list lead magnet.",
                "5. Launch paid tier to your email list (aim for 5% conversion).",
            ],
            "agency": [
                f"1. Reach out to 10 {audience} in your network. Offer a reduced-rate first project.",
                "2. Deliver exceptional results on first 2-3 clients.",
                "3. Create detailed case studies with before/after metrics.",
                "4. Ask for referrals and LinkedIn recommendations.",
                "5. Cold outreach to 30 prospects using case study as proof.",
            ],
            "consulting": [
                "1. Offer 3 free strategy sessions to build your methodology.",
                "2. Convert 1-2 free sessions into paid engagements.",
                "3. Publish weekly insights on LinkedIn to build authority.",
                "4. Speak at 1-2 industry events or webinars.",
                "5. Ask every client for referrals to peers with similar challenges.",
            ],
        }

        return strategies.get(biz_type, strategies["service"])
