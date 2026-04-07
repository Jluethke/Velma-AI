# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.
"""
tiers.py
========

Subscription tier system for SkillChain.

Free tier: consumers play for free. 120+ skills, 66+ chains, gamification.
Pro/Team/Enterprise: businesses pay in USD for API access, volume, analytics.

TRUST token economy runs parallel — consumers earn/spend TRUST.
USD revenue comes from businesses who want SLAs and enterprise features.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any


class Tier(str, Enum):
    FREE = "free"
    PRO = "pro"
    TEAM = "team"
    ENTERPRISE = "enterprise"


@dataclass
class TierLimits:
    """Rate limits and feature flags per tier."""
    chain_runs_per_day: int
    skill_runs_per_day: int
    mining_trust_per_day: float
    mining_discoveries_per_day: int
    max_chain_length: int
    custom_skills: bool
    api_access: bool
    team_dashboard: bool
    white_label: bool
    priority_execution: bool
    analytics: bool
    sla: bool


TIER_CONFIG: dict[Tier, TierLimits] = {
    Tier.FREE: TierLimits(
        chain_runs_per_day=10,
        skill_runs_per_day=50,
        mining_trust_per_day=50.0,
        mining_discoveries_per_day=5,
        max_chain_length=8,
        custom_skills=False,
        api_access=False,
        team_dashboard=False,
        white_label=False,
        priority_execution=False,
        analytics=False,
        sla=False,
    ),
    Tier.PRO: TierLimits(
        chain_runs_per_day=100,
        skill_runs_per_day=500,
        mining_trust_per_day=200.0,
        mining_discoveries_per_day=20,
        max_chain_length=12,
        custom_skills=True,
        api_access=True,
        team_dashboard=False,
        white_label=False,
        priority_execution=True,
        analytics=True,
        sla=False,
    ),
    Tier.TEAM: TierLimits(
        chain_runs_per_day=500,
        skill_runs_per_day=2000,
        mining_trust_per_day=500.0,
        mining_discoveries_per_day=50,
        max_chain_length=16,
        custom_skills=True,
        api_access=True,
        team_dashboard=True,
        white_label=False,
        priority_execution=True,
        analytics=True,
        sla=False,
    ),
    Tier.ENTERPRISE: TierLimits(
        chain_runs_per_day=-1,  # unlimited
        skill_runs_per_day=-1,
        mining_trust_per_day=1000.0,
        mining_discoveries_per_day=100,
        max_chain_length=20,
        custom_skills=True,
        api_access=True,
        team_dashboard=True,
        white_label=True,
        priority_execution=True,
        analytics=True,
        sla=True,
    ),
}

TIER_PRICING: dict[Tier, dict[str, Any]] = {
    Tier.FREE: {
        "price_monthly": 0,
        "price_annual": 0,
        "label": "Free",
        "tagline": "Everything a person needs",
        "features": [
            "120+ AI skills",
            "66+ skill chains",
            "Plain-English discovery",
            "Pokemon Go gamification",
            "Chain mining (50 TRUST/day)",
            "10 chain runs/day",
            "Community support",
        ],
    },
    Tier.PRO: {
        "price_monthly": 29,
        "price_annual": 290,
        "label": "Pro",
        "tagline": "For power users and solopreneurs",
        "features": [
            "Everything in Free",
            "100 chain runs/day",
            "Custom private skills",
            "API access",
            "Priority LLM execution",
            "Usage analytics",
            "200 TRUST/day mining cap",
            "Email support",
        ],
    },
    Tier.TEAM: {
        "price_monthly": 99,
        "price_annual": 990,
        "per_seat": True,
        "label": "Team",
        "tagline": "For teams building with AI",
        "features": [
            "Everything in Pro",
            "500 chain runs/day per seat",
            "Team dashboard",
            "Shared skills library",
            "Team usage analytics",
            "500 TRUST/day mining cap",
            "Priority support",
        ],
    },
    Tier.ENTERPRISE: {
        "price_monthly": None,  # custom
        "price_annual": None,
        "label": "Enterprise",
        "tagline": "For organizations at scale",
        "features": [
            "Everything in Team",
            "Unlimited chain runs",
            "White-label embedding",
            "SLA guarantee",
            "Custom chain development",
            "On-prem deployment option",
            "Dedicated support",
            "SSO / SAML",
        ],
    },
}


def get_tier_limits(tier: Tier | str) -> TierLimits:
    """Get rate limits for a tier."""
    if isinstance(tier, str):
        tier = Tier(tier)
    return TIER_CONFIG[tier]


def check_rate_limit(tier: Tier | str, counter: str, current_count: int) -> bool:
    """Check if an action is within rate limits.

    Returns True if allowed, False if rate-limited.
    """
    limits = get_tier_limits(tier)
    limit_map = {
        "chain_runs": limits.chain_runs_per_day,
        "skill_runs": limits.skill_runs_per_day,
        "mining_discoveries": limits.mining_discoveries_per_day,
    }
    limit = limit_map.get(counter, -1)
    if limit == -1:  # unlimited
        return True
    return current_count < limit
