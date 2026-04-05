# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""Configuration for the Solopreneur Engine."""

from __future__ import annotations

from dataclasses import dataclass, field


# -- Constants -----------------------------------------------------------------

STRATEGY_CANDIDATES = 3          # Generate 3 different strategies
OUTREACH_VARIANTS = 5            # 5 email/message variants per target
SOCIAL_POST_COUNT = 10           # 10 social media posts

SUPPORTED_BUSINESS_TYPES = [
    "saas", "service", "ecommerce", "marketplace",
    "content", "agency", "consulting",
]

MVP_TIMELINE_WEEKS: dict[str, int] = {
    "saas": 8,
    "service": 2,
    "ecommerce": 4,
    "marketplace": 12,
    "content": 1,
    "agency": 2,
    "consulting": 1,
}

STRATEGY_TYPES = ["lean", "premium", "growth"]

# Scoring weights for strategy tournament
TOURNAMENT_WEIGHTS: dict[str, float] = {
    "time_to_revenue": 0.30,
    "capital_required": 0.20,
    "risk_level": 0.20,
    "scalability": 0.15,
    "founder_fit": 0.15,
}

# Revenue model templates by business type
REVENUE_MODELS: dict[str, str] = {
    "saas": "MRR = customers x ARPU | LTV = ARPU / monthly_churn | CAC payback = CAC / ARPU",
    "service": "Revenue = billable_hours x hourly_rate x utilization | Target utilization: 70-80%",
    "ecommerce": "Revenue = traffic x conversion_rate x AOV | Target conversion: 2-4%",
    "marketplace": "Revenue = GMV x take_rate | Typical take rate: 10-20%",
    "content": "Revenue = subscribers x price OR pageviews x CPM | Target CPM: $5-25",
    "agency": "Revenue = retainer_clients x MRR + project_count x avg_project_fee",
    "consulting": "Revenue = billable_days x day_rate | Target utilization: 60-70%",
}

# KPI templates by business type
KPIS_BY_TYPE: dict[str, list[str]] = {
    "saas": ["MRR", "Churn rate", "Trial-to-paid conversion", "CAC", "LTV", "LTV:CAC ratio"],
    "service": ["Pipeline value", "Close rate", "Utilization %", "Avg project size", "NPS"],
    "ecommerce": ["Traffic", "Conversion rate", "AOV", "Return rate", "CAC", "Repeat purchase %"],
    "marketplace": ["GMV", "Take rate", "Liquidity (supply/demand ratio)", "Repeat usage", "CAC"],
    "content": ["Subscribers", "Growth rate", "Churn", "Engagement rate", "Revenue per subscriber"],
    "agency": ["Pipeline value", "Retainer MRR", "Project backlog", "Utilization %", "Client NPS"],
    "consulting": ["Pipeline value", "Day rate", "Utilization %", "Repeat client %", "Referral rate"],
}

# Recommended tool stacks (free/cheap tier)
TOOL_STACK: dict[str, list[tuple[str, str]]] = {
    "crm": [("Notion", "Free"), ("HubSpot CRM", "Free")],
    "email": [("Gmail", "Free"), ("Mailchimp", "Free up to 500 contacts")],
    "landing_page": [("Carrd", "$19/yr"), ("Framer", "Free tier")],
    "social": [("Buffer", "Free 3 channels"), ("Typefully", "Free tier")],
    "analytics": [("Google Analytics", "Free"), ("Plausible", "$9/mo")],
    "payments": [("Stripe", "2.9% + 30c per txn"), ("Gumroad", "10% per txn")],
    "automation": [("Zapier", "Free 5 zaps"), ("n8n", "Self-hosted free")],
    "scheduling": [("Calendly", "Free 1 event type"), ("Cal.com", "Free self-hosted")],
    "design": [("Canva", "Free"), ("Figma", "Free 3 projects")],
}

# Weekly rhythm template
WEEKLY_RHYTHM: dict[str, str] = {
    "Monday": "Planning + outreach (fill the pipeline)",
    "Tuesday": "Build / deliver (product or service work)",
    "Wednesday": "Build / deliver (deep work block)",
    "Thursday": "Marketing + content creation (growth)",
    "Friday": "Sales follow-up + admin (close deals + ops)",
    "Saturday": "Review metrics + strategic thinking",
    "Sunday": "Rest + learning (read, courses, inspiration)",
}


@dataclass
class SolopreneurConfig:
    """Tunables for the solopreneur engine."""

    strategy_candidates: int = STRATEGY_CANDIDATES
    outreach_variants: int = OUTREACH_VARIANTS
    social_post_count: int = SOCIAL_POST_COUNT
    supported_types: list[str] = field(default_factory=lambda: list(SUPPORTED_BUSINESS_TYPES))
    tournament_weights: dict[str, float] = field(default_factory=lambda: dict(TOURNAMENT_WEIGHTS))
