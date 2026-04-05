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
ops_builder.py — Operating rhythm for a solopreneur.

Generates daily/weekly schedules, KPI dashboards, automation opportunities,
tool recommendations, and a 90-day sprint plan.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from .config import KPIS_BY_TYPE, TOOL_STACK, WEEKLY_RHYTHM
from .plan_generator import BusinessPlan

logger = logging.getLogger(__name__)


# -- Data classes --------------------------------------------------------------

@dataclass
class TimeBlock:
    """A single time block in the daily schedule."""

    start: str
    end: str
    activity: str
    category: str = ""  # build / sell / market / admin / learn


@dataclass
class AutomationOpportunity:
    """Something that can be automated."""

    task: str
    tool: str
    setup_time: str = "30 min"
    time_saved: str = "2 hr/week"


@dataclass
class ToolRecommendation:
    """A recommended tool for the stack."""

    category: str
    name: str
    price: str
    reason: str = ""


@dataclass
class ReviewItem:
    """Something to review on a cadence."""

    item: str
    cadence: str  # daily / weekly / monthly
    metric_or_question: str = ""


@dataclass
class SprintWeek:
    """One week in the 90-day sprint."""

    week: int
    focus: str
    actions: list[str] = field(default_factory=list)
    success_metric: str = ""


@dataclass
class OpsSystem:
    """Complete operating system for a solopreneur."""

    daily_routine: list[TimeBlock] = field(default_factory=list)
    weekly_rhythm: dict[str, str] = field(default_factory=dict)
    kpi_dashboard: list[str] = field(default_factory=list)
    automation_opportunities: list[AutomationOpportunity] = field(default_factory=list)
    tool_stack: list[ToolRecommendation] = field(default_factory=list)
    sprint_90_day: list[SprintWeek] = field(default_factory=list)
    review_cadence: list[ReviewItem] = field(default_factory=list)


# -- Ops Builder ---------------------------------------------------------------

class OpsBuilder:
    """Generates the operating rhythm for a solopreneur."""

    def build(self, plan: BusinessPlan) -> OpsSystem:
        """
        Generate a complete operating system:
        - Time-blocked daily schedule
        - Weekly rhythm
        - KPI dashboard
        - Automation opportunities
        - Tool stack recommendations
        - 90-day sprint
        - Review cadence
        """
        biz_type = plan.business_type
        strategy = plan.strategy_type

        return OpsSystem(
            daily_routine=self._daily_routine(biz_type, strategy),
            weekly_rhythm=dict(WEEKLY_RHYTHM),
            kpi_dashboard=self._kpi_dashboard(biz_type),
            automation_opportunities=self._automations(biz_type),
            tool_stack=self._tool_stack(biz_type),
            sprint_90_day=self._sprint_plan(plan),
            review_cadence=self._review_cadence(biz_type),
        )

    # -- Daily routine ---------------------------------------------------------

    def _daily_routine(self, biz_type: str, strategy: str) -> list[TimeBlock]:
        """Time-blocked daily schedule optimized for solopreneurs."""
        routine = [
            TimeBlock("7:00", "7:30", "Morning review: check metrics, plan the day", "admin"),
            TimeBlock("7:30", "8:00", "Respond to urgent messages / customer support", "sell"),
            TimeBlock("8:00", "12:00", "Deep work: build product or deliver service", "build"),
            TimeBlock("12:00", "12:30", "Lunch + content creation (one post)", "market"),
            TimeBlock("12:30", "14:30", "Sales: outreach, follow-ups, demos", "sell"),
            TimeBlock("14:30", "16:00", "Marketing: content, SEO, community engagement", "market"),
            TimeBlock("16:00", "16:30", "Admin: invoices, bookkeeping, email", "admin"),
            TimeBlock("16:30", "17:00", "Plan tomorrow, update task board", "admin"),
        ]

        # Strategy adjustments
        if strategy == "growth":
            # More time on sales, less on building
            routine[2] = TimeBlock("8:00", "11:00", "Deep work: build/deliver (3 hrs)", "build")
            routine.insert(3, TimeBlock("11:00", "12:00", "Extra sales hour: cold outreach", "sell"))
        elif strategy == "premium":
            # More time on building quality, less on outreach
            routine[4] = TimeBlock("12:30", "13:30", "Sales: warm leads and referrals only", "sell")
            routine[5] = TimeBlock("13:30", "16:00", "Build: polish, quality, documentation", "build")

        return routine

    # -- KPIs ------------------------------------------------------------------

    def _kpi_dashboard(self, biz_type: str) -> list[str]:
        """Return the KPI dashboard for this business type."""
        kpis = list(KPIS_BY_TYPE.get(biz_type, KPIS_BY_TYPE["service"]))

        # Universal solopreneur KPIs
        universal = [
            "Weekly revenue",
            "Outreach sent vs replies received",
            "Hours worked (track for sustainability)",
        ]

        # Merge without duplicates
        for k in universal:
            if k not in kpis:
                kpis.append(k)

        return kpis

    # -- Automations -----------------------------------------------------------

    def _automations(self, biz_type: str) -> list[AutomationOpportunity]:
        """Identify automation opportunities."""
        common = [
            AutomationOpportunity(
                "Email follow-ups",
                "Mailchimp / Loops.so sequences",
                setup_time="1 hour",
                time_saved="3 hr/week",
            ),
            AutomationOpportunity(
                "Social media scheduling",
                "Buffer / Typefully",
                setup_time="30 min",
                time_saved="2 hr/week",
            ),
            AutomationOpportunity(
                "Invoice generation",
                "Stripe automatic invoicing",
                setup_time="15 min",
                time_saved="1 hr/week",
            ),
            AutomationOpportunity(
                "Meeting scheduling",
                "Calendly / Cal.com",
                setup_time="15 min",
                time_saved="1 hr/week",
            ),
            AutomationOpportunity(
                "Lead tracking",
                "Notion CRM template or HubSpot free",
                setup_time="1 hour",
                time_saved="2 hr/week",
            ),
        ]

        type_specific: dict[str, list[AutomationOpportunity]] = {
            "saas": [
                AutomationOpportunity(
                    "User onboarding emails",
                    "Loops.so / Customer.io",
                    setup_time="2 hours",
                    time_saved="5 hr/week",
                ),
                AutomationOpportunity(
                    "Error monitoring",
                    "Sentry (free tier)",
                    setup_time="30 min",
                    time_saved="3 hr/week",
                ),
            ],
            "ecommerce": [
                AutomationOpportunity(
                    "Order fulfillment notifications",
                    "Shopify automations",
                    setup_time="30 min",
                    time_saved="3 hr/week",
                ),
                AutomationOpportunity(
                    "Abandoned cart recovery",
                    "Shopify / Klaviyo",
                    setup_time="1 hour",
                    time_saved="Revenue recovery",
                ),
            ],
        }

        result = common + type_specific.get(biz_type, [])
        return result

    # -- Tool stack ------------------------------------------------------------

    def _tool_stack(self, biz_type: str) -> list[ToolRecommendation]:
        """Recommend tools for each function."""
        recommendations = []

        for category, options in TOOL_STACK.items():
            if options:
                name, price = options[0]  # Recommend cheapest/free first
                recommendations.append(ToolRecommendation(
                    category=category,
                    name=name,
                    price=price,
                    reason=f"Best free/cheap option for {category}",
                ))

        # Type-specific additions
        type_tools: dict[str, list[ToolRecommendation]] = {
            "saas": [
                ToolRecommendation("hosting", "Vercel / Railway", "Free tier", "Deploy frontend + API"),
                ToolRecommendation("database", "Supabase", "Free tier", "Postgres + auth + storage"),
                ToolRecommendation("monitoring", "Sentry", "Free tier", "Error tracking"),
            ],
            "ecommerce": [
                ToolRecommendation("storefront", "Shopify", "$39/month", "All-in-one ecommerce"),
                ToolRecommendation("email_marketing", "Klaviyo", "Free up to 250 contacts", "Ecommerce email"),
            ],
            "content": [
                ToolRecommendation("publishing", "Substack", "Free (10% on paid)", "Newsletter + payments"),
                ToolRecommendation("course", "Teachable", "$39/month", "Course hosting"),
            ],
            "marketplace": [
                ToolRecommendation("hosting", "Vercel", "Free tier", "Frontend hosting"),
                ToolRecommendation("database", "Supabase", "Free tier", "Backend + auth"),
                ToolRecommendation("payments", "Stripe Connect", "2.9% + 0.25%", "Split payments"),
            ],
        }

        recommendations.extend(type_tools.get(biz_type, []))
        return recommendations

    # -- 90-day sprint ---------------------------------------------------------

    def _sprint_plan(self, plan: BusinessPlan) -> list[SprintWeek]:
        """Generate a 13-week sprint plan."""
        mvp_weeks = plan.mvp_timeline_weeks
        weeks: list[SprintWeek] = []

        # Phase 1: Validate & Build (weeks 1-4 or until MVP done)
        weeks.append(SprintWeek(
            week=1,
            focus="Validate demand",
            actions=[
                "Talk to 10 potential customers (phone/video, not surveys)",
                "Ask: What do you currently do? How much time/money does it cost?",
                "Set up landing page with email capture",
                "Post in 3 communities where your audience hangs out",
            ],
            success_metric="10 conversations completed, 20+ email sign-ups",
        ))

        weeks.append(SprintWeek(
            week=2,
            focus="Build MVP",
            actions=[
                "Build the smallest possible version of your solution",
                "Focus on the ONE core workflow",
                "Set up payment processing",
                "Write onboarding instructions",
            ],
            success_metric="MVP functional and ready for first users",
        ))

        for w in range(3, min(mvp_weeks + 1, 5)):
            weeks.append(SprintWeek(
                week=w,
                focus="Polish & test",
                actions=[
                    "Get 3-5 beta users using the product",
                    "Watch them use it (screen share or session recording)",
                    "Fix the top 3 friction points",
                    "Prepare launch messaging",
                ],
                success_metric=f"Beta users completing core workflow without help",
            ))

        # Phase 2: Launch & sell (weeks 5-8)
        launch_week = min(mvp_weeks + 1, 5)
        weeks.append(SprintWeek(
            week=launch_week,
            focus="Launch & first revenue",
            actions=[
                "Email your waitlist with launch announcement",
                "Post launch story on Twitter/LinkedIn",
                "Send 30 personalized cold emails",
                "Offer a launch discount (limited time)",
            ],
            success_metric="First paying customer",
        ))

        weeks.append(SprintWeek(
            week=launch_week + 1,
            focus="Outreach blitz",
            actions=[
                "Send 50+ cold emails / LinkedIn messages",
                "Follow up with every warm lead",
                "Ask every user for feedback and referrals",
                "Post 3-5 pieces of content",
            ],
            success_metric="5 paying customers",
        ))

        weeks.append(SprintWeek(
            week=launch_week + 2,
            focus="Double down on what works",
            actions=[
                "Analyze which channels produced customers",
                "2x effort on the best channel, cut the rest",
                "Collect testimonials from happy users",
                "Create a case study",
            ],
            success_metric="Clear winner channel identified, 7+ customers",
        ))

        weeks.append(SprintWeek(
            week=launch_week + 3,
            focus="Systematize sales",
            actions=[
                "Create a repeatable outreach sequence",
                "Set up CRM to track pipeline",
                "Develop sales objection handling",
                "Start tracking conversion rates",
            ],
            success_metric="10 paying customers, repeatable sales process",
        ))

        # Phase 3: Grow & optimize (weeks 9-13)
        grow_start = launch_week + 4
        for w in range(grow_start, 14):
            if w <= 11:
                weeks.append(SprintWeek(
                    week=w,
                    focus="Scale outreach",
                    actions=[
                        "100+ outreach touches per week",
                        "Publish 2-3 content pieces",
                        "Start testing paid acquisition ($50-100)",
                        "Optimize based on KPI data",
                    ],
                    success_metric=f"Week-over-week growth in revenue and customers",
                ))
            else:
                weeks.append(SprintWeek(
                    week=w,
                    focus="Review & plan next quarter",
                    actions=[
                        "Full KPI review — what's working, what's not",
                        "Customer interviews with best customers",
                        "Plan next 90-day sprint",
                        "Decide: scale, pivot, or shut down based on data",
                    ],
                    success_metric="Clear data-driven plan for months 4-6",
                ))

        return weeks

    # -- Review cadence --------------------------------------------------------

    def _review_cadence(self, biz_type: str) -> list[ReviewItem]:
        """Define what to review and when."""
        return [
            # Daily
            ReviewItem(
                "Revenue dashboard",
                "daily",
                "New revenue today? Any refunds or churns?",
            ),
            ReviewItem(
                "Customer messages",
                "daily",
                "Any support requests? Response time < 4 hours?",
            ),
            ReviewItem(
                "Outreach pipeline",
                "daily",
                "How many outreach messages sent? Replies received?",
            ),

            # Weekly
            ReviewItem(
                "KPI scorecard",
                "weekly",
                "Are all KPIs trending in the right direction?",
            ),
            ReviewItem(
                "Content performance",
                "weekly",
                "Which posts got engagement? What topics resonate?",
            ),
            ReviewItem(
                "Customer feedback",
                "weekly",
                "Common themes in feedback? Feature requests?",
            ),
            ReviewItem(
                "Time allocation",
                "weekly",
                "Spending enough time on sales vs building?",
            ),

            # Monthly
            ReviewItem(
                "P&L review",
                "monthly",
                "Revenue vs expenses. Are you on track to profitability?",
            ),
            ReviewItem(
                "Strategy check",
                "monthly",
                "Is the overall strategy working? Need to pivot?",
            ),
            ReviewItem(
                "Pricing review",
                "monthly",
                "Should you raise prices? Add/remove tiers?",
            ),
        ]
