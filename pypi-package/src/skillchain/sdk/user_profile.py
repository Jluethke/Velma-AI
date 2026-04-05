"""
user_profile.py
===============

Persistent user profile that skills read to personalize output.
Stored at ~/.skillchain/profile.json. Built during onboarding,
evolves as the user interacts with skills.

The profile is NOT sent on-chain. It stays local. Skills read it
to adapt their execution -- same skill, different output per user.
"""

from __future__ import annotations

import json
import logging
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Valid options (used for validation + prompts)
# ---------------------------------------------------------------------------

VALID_ROLES = ("founder", "developer", "marketer", "designer", "analyst", "student", "creator")
VALID_INDUSTRIES = ("saas", "ecommerce", "fintech", "healthcare", "education", "agency", "crypto", "other")
VALID_STAGES = ("idea", "pre-seed", "seed", "series-a", "growth", "enterprise", "solo")
VALID_TEAM_SIZES = ("solo", "2-5", "6-20", "21-100", "100+")
VALID_EXPERIENCE = ("beginner", "intermediate", "senior", "expert")
VALID_OUTPUT_STYLES = ("concise", "detailed", "executive", "technical")
VALID_TONES = ("casual", "professional", "academic", "startup")
VALID_GOALS = ("grow revenue", "ship product", "learn skills", "automate ops", "create content")

# ---------------------------------------------------------------------------
# Role-based skill maps
# ---------------------------------------------------------------------------

ROLE_SKILL_MAP: Dict[str, Dict[str, List[str]]] = {
    "founder": {
        "essential": ["business-in-a-box", "runway-calculator", "market-entry-analyzer", "pricing-strategy"],
        "recommended": ["competitor-teardown", "cold-outreach-optimizer", "growth-content-system", "company-operator"],
        "useful": ["b2b-lead-finder", "deal-risk-analyzer", "life-os", "daily-planner"],
    },
    "developer": {
        "essential": ["codebase-mapper", "debugging-strategies", "code-review", "security-hardening"],
        "recommended": ["refactor-planner", "test-coverage-generator", "api-integration-planner", "ci-cd-pipelines"],
        "useful": ["prompt-engineering", "agent-workflow-designer", "project-scaffolding", "database-patterns"],
    },
    "marketer": {
        "essential": ["growth-content-system", "seo-cluster-builder", "prompt-engineering"],
        "recommended": ["cold-outreach-optimizer", "review-sentiment-analyzer", "product-listing-optimizer"],
        "useful": ["competitor-teardown", "decision-analyzer", "daily-planner"],
    },
    "designer": {
        "essential": ["mission-control-design", "technical-writing", "prompt-engineering"],
        "recommended": ["project-scaffolding", "code-review", "api-design"],
        "useful": ["daily-planner", "skill-acquisition-engine"],
    },
    "analyst": {
        "essential": ["kpi-anomaly-detector", "dashboard-explainer", "research-synthesizer", "data-pipeline"],
        "recommended": ["signal-noise-filter", "decision-analyzer", "database-patterns"],
        "useful": ["pricing-model-simulator", "market-entry-analyzer", "runway-calculator"],
    },
    "student": {
        "essential": ["skill-acquisition-engine", "problem-decomposer", "debugging-strategies", "prompt-engineering"],
        "recommended": ["project-scaffolding", "technical-writing", "code-review"],
        "useful": ["daily-planner", "habit-builder", "life-os"],
    },
    "creator": {
        "essential": ["growth-content-system", "seo-cluster-builder", "prompt-engineering", "velma-voice"],
        "recommended": ["social-automation", "content-engine", "product-listing-optimizer"],
        "useful": ["daily-planner", "skill-acquisition-engine", "life-os"],
    },
}

GOAL_SKILL_MAP: Dict[str, List[str]] = {
    "grow revenue": ["b2b-lead-finder", "cold-outreach-optimizer", "pricing-strategy", "growth-content-system"],
    "ship product": ["project-scaffolding", "codebase-mapper", "ci-cd-pipelines", "test-coverage-generator"],
    "learn skills": ["skill-acquisition-engine", "prompt-engineering", "problem-decomposer"],
    "automate ops": ["company-operator", "daily-planner", "multi-skill-orchestrator", "data-pipeline"],
    "create content": ["growth-content-system", "seo-cluster-builder", "content-engine", "velma-voice"],
}

ROLE_CHAIN_MAP: Dict[str, List[Dict[str, Any]]] = {
    "founder": [
        {
            "name": "startup-validation",
            "description": "Validate a business idea: decompose -> research -> competitors -> decision -> business plan",
            "skills": ["problem-decomposer", "research-synthesizer", "competitor-teardown", "decision-analyzer", "business-in-a-box"],
        },
        {
            "name": "fundraise-prep",
            "description": "Prepare for fundraising: runway -> market -> competitors -> pricing -> business case",
            "skills": ["runway-calculator", "market-entry-analyzer", "competitor-teardown", "pricing-model-simulator", "business-in-a-box"],
        },
        {
            "name": "weekly-founder-ops",
            "description": "Weekly founder ops: company health -> KPI anomalies -> deal risks -> weekly plan",
            "skills": ["company-operator", "kpi-anomaly-detector", "deal-risk-analyzer", "daily-planner"],
        },
        {
            "name": "first-customers",
            "description": "Get first 10 customers: find leads -> optimize outreach -> assess deals -> analyze sentiment",
            "skills": ["b2b-lead-finder", "cold-outreach-optimizer", "deal-risk-analyzer", "review-sentiment-analyzer"],
        },
        {
            "name": "market-launch",
            "description": "Full market launch: research -> competitors -> strategy -> content",
            "skills": ["research-synthesizer", "competitor-teardown", "market-entry-analyzer", "growth-content-system"],
        },
        {
            "name": "solopreneur-daily",
            "description": "Daily solo founder routine: plan -> ops -> content -> deals",
            "skills": ["daily-planner", "company-operator", "growth-content-system", "deal-risk-analyzer"],
        },
    ],
    "developer": [
        {
            "name": "new-project-kickoff",
            "description": "Start a project right: scaffold -> API -> database -> CI/CD -> security",
            "skills": ["project-scaffolding", "api-design", "database-patterns", "ci-cd-pipelines", "security-hardening"],
        },
        {
            "name": "legacy-rescue",
            "description": "Take over legacy code: map -> find bugs -> plan refactors -> generate tests -> harden security",
            "skills": ["codebase-mapper", "bug-root-cause", "refactor-planner", "test-coverage-generator", "security-hardening"],
        },
        {
            "name": "api-build",
            "description": "Build an API end to end: design -> database -> integrations -> tests -> CI/CD",
            "skills": ["api-design", "database-patterns", "api-integration-planner", "test-coverage-generator", "ci-cd-pipelines"],
        },
        {
            "name": "debug-and-fix",
            "description": "Systematic bug investigation: debug -> root cause -> tests -> code review",
            "skills": ["debugging-strategies", "bug-root-cause", "test-coverage-generator", "code-review"],
        },
        {
            "name": "ai-agent-builder",
            "description": "Build a multi-agent AI system: workflow -> prompts -> skill converter -> orchestrator",
            "skills": ["agent-workflow-designer", "prompt-engineering", "prompt-to-skill-converter", "multi-skill-orchestrator"],
        },
        {
            "name": "code-quality",
            "description": "Full code quality pipeline: map -> security -> refactor -> tests",
            "skills": ["codebase-mapper", "security-hardening", "refactor-planner", "test-coverage-generator"],
        },
    ],
    "marketer": [
        {
            "name": "content-machine",
            "description": "Content pipeline: research -> SEO -> create -> distribute",
            "skills": ["research-synthesizer", "seo-cluster-builder", "growth-content-system", "social-automation"],
        },
        {
            "name": "product-launch-marketing",
            "description": "Launch marketing: competitors -> market entry -> SEO -> content -> outreach",
            "skills": ["competitor-teardown", "market-entry-analyzer", "seo-cluster-builder", "growth-content-system", "cold-outreach-optimizer"],
        },
        {
            "name": "ecommerce-optimize",
            "description": "Optimize e-commerce: sentiment -> listings -> pricing -> SEO",
            "skills": ["review-sentiment-analyzer", "product-listing-optimizer", "pricing-strategy", "seo-cluster-builder"],
        },
    ],
    "designer": [
        {
            "name": "design-to-code",
            "description": "Design pipeline: design -> technical writing -> scaffold -> review",
            "skills": ["mission-control-design", "technical-writing", "project-scaffolding", "code-review"],
        },
        {
            "name": "team-onboarding",
            "description": "Onboard a new team member: map codebase -> write docs -> scaffold project -> review code",
            "skills": ["codebase-mapper", "technical-writing", "project-scaffolding", "code-review"],
        },
        {
            "name": "full-audit",
            "description": "Complete project audit: map -> security -> tests -> refactor -> docs",
            "skills": ["codebase-mapper", "security-hardening", "test-coverage-generator", "refactor-planner", "technical-writing"],
        },
    ],
    "analyst": [
        {
            "name": "data-investigation",
            "description": "Investigate data end to end: decompose -> research -> pipeline -> anomalies -> dashboard",
            "skills": ["problem-decomposer", "research-synthesizer", "data-pipeline", "kpi-anomaly-detector", "dashboard-explainer"],
        },
        {
            "name": "competitive-intel",
            "description": "Full competitive intelligence: research -> competitors -> signals -> market -> SWOT",
            "skills": ["research-synthesizer", "competitor-teardown", "signal-noise-filter", "market-entry-analyzer", "swot-action-planner"],
        },
        {
            "name": "decision-deep-dive",
            "description": "Major decision analysis: research -> contradictions -> signals -> decision -> SWOT",
            "skills": ["research-synthesizer", "contradiction-finder", "signal-noise-filter", "decision-analyzer", "swot-action-planner"],
        },
    ],
    "student": [
        {
            "name": "learning-sprint",
            "description": "Learning sprint: acquire skill -> decompose -> debug -> write up",
            "skills": ["skill-acquisition-engine", "problem-decomposer", "debugging-strategies", "technical-writing"],
        },
        {
            "name": "skill-factory",
            "description": "Create a new skill: convert prompt -> generate tests -> score quality -> optimize",
            "skills": ["prompt-to-skill-converter", "skill-test-generator", "skill-quality-scorer", "skill-performance-optimizer"],
        },
        {
            "name": "monthly-life-review",
            "description": "Monthly life assessment: life review -> habits -> skill acquisition -> daily plan",
            "skills": ["life-os", "habit-builder", "skill-acquisition-engine", "daily-planner"],
        },
    ],
    "creator": [
        {
            "name": "content-machine",
            "description": "Content pipeline: research -> SEO -> create -> distribute",
            "skills": ["research-synthesizer", "seo-cluster-builder", "growth-content-system", "social-automation"],
        },
        {
            "name": "product-launch-marketing",
            "description": "Launch marketing: competitors -> market entry -> SEO -> content -> outreach",
            "skills": ["competitor-teardown", "market-entry-analyzer", "seo-cluster-builder", "growth-content-system", "cold-outreach-optimizer"],
        },
        {
            "name": "ecommerce-optimize",
            "description": "Optimize e-commerce: sentiment -> listings -> pricing -> SEO",
            "skills": ["review-sentiment-analyzer", "product-listing-optimizer", "pricing-strategy", "seo-cluster-builder"],
        },
    ],
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class UserProfile:
    """Persistent user profile for skill personalization."""

    # Identity
    name: str = ""
    role: str = ""  # "founder", "developer", "marketer", "designer", "analyst", "student", "creator"

    # Context
    industry: str = ""  # "saas", "ecommerce", "fintech", "healthcare", "education", "agency", "crypto", "other"
    company_stage: str = ""  # "idea", "pre-seed", "seed", "series-a", "growth", "enterprise", "solo"
    company_name: str = ""
    team_size: str = ""  # "solo", "2-5", "6-20", "21-100", "100+"

    # Technical
    tech_stack: List[str] = field(default_factory=list)
    ai_platform: str = "claude"
    experience_level: str = "intermediate"  # "beginner", "intermediate", "senior", "expert"

    # Goals
    primary_goal: str = ""  # "grow revenue", "ship product", "learn skills", "automate ops", "create content"
    secondary_goals: List[str] = field(default_factory=list)

    # Preferences
    output_style: str = "detailed"  # "concise", "detailed", "executive", "technical"
    communication_tone: str = "professional"  # "casual", "professional", "academic", "startup"

    # History (auto-populated)
    skills_used: List[str] = field(default_factory=list)
    chains_run: List[str] = field(default_factory=list)
    favorite_domains: List[str] = field(default_factory=list)
    member_since: str = ""
    total_runs: int = 0


@dataclass
class SkillRecommendation:
    """A single skill recommendation for the user."""

    skill_name: str
    reason: str  # "Essential for founders", "Based on your goal: grow revenue"
    priority: str  # "essential", "recommended", "useful"
    installed: bool  # whether already in their skills dir


@dataclass
class ChainRecommendation:
    """A skill chain recommendation for the user."""

    chain_name: str
    description: str
    skills: List[str]
    match_reason: str  # "Matches your role: founder"


# ---------------------------------------------------------------------------
# Domain extraction from skill names
# ---------------------------------------------------------------------------

_SKILL_DOMAIN_MAP = {
    "business": ["business-in-a-box", "runway-calculator", "pricing-strategy", "company-operator", "deal-risk-analyzer"],
    "marketing": ["growth-content-system", "seo-cluster-builder", "cold-outreach-optimizer", "product-listing-optimizer", "b2b-lead-finder"],
    "engineering": ["codebase-mapper", "debugging-strategies", "code-review", "security-hardening", "refactor-planner", "ci-cd-pipelines", "test-coverage-generator", "api-integration-planner", "api-design", "database-patterns", "project-scaffolding"],
    "data": ["kpi-anomaly-detector", "dashboard-explainer", "data-pipeline", "signal-noise-filter", "research-synthesizer"],
    "ai": ["prompt-engineering", "agent-workflow-designer", "multi-skill-orchestrator"],
    "productivity": ["daily-planner", "life-os", "habit-builder", "decision-analyzer", "problem-decomposer"],
    "content": ["content-engine", "velma-voice", "social-automation", "technical-writing"],
    "learning": ["skill-acquisition-engine"],
}


def _domains_for_skill(skill_name: str) -> List[str]:
    """Return domain tags for a given skill name."""
    domains = []
    for domain, skills in _SKILL_DOMAIN_MAP.items():
        if skill_name in skills:
            domains.append(domain)
    return domains or ["general"]


# ---------------------------------------------------------------------------
# ProfileManager
# ---------------------------------------------------------------------------


class ProfileManager:
    """Manages the persistent user profile at ~/.skillchain/profile.json."""

    def __init__(self, config_dir: Optional[Path] = None) -> None:
        base = config_dir or (Path.home() / ".skillchain")
        self._path = base / "profile.json"

    @property
    def path(self) -> Path:
        """Path to the profile JSON file."""
        return self._path

    def exists(self) -> bool:
        """Return True if a profile file exists on disk."""
        return self._path.exists()

    def load(self) -> UserProfile:
        """Load the profile from disk, returning defaults if absent."""
        if not self._path.exists():
            return UserProfile()
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
            return self._dict_to_profile(raw)
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            logger.warning("Corrupt profile at %s: %s — returning defaults", self._path, exc)
            return UserProfile()

    def save(self, profile: UserProfile) -> None:
        """Persist the profile to disk."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        data = asdict(profile)
        self._path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    # -- Interactive onboarding ------------------------------------------------

    def onboard(self) -> UserProfile:
        """Interactive onboarding — asks the user about themselves.

        Uses click.prompt for each field. Returns a completed profile.
        """
        import click

        click.echo("\n--- SkillChain Profile Setup ---\n")

        profile = UserProfile()
        profile.name = click.prompt("What's your name?", default="")
        profile.role = click.prompt(
            "What's your role?",
            type=click.Choice(list(VALID_ROLES), case_sensitive=False),
            default="developer",
        )
        profile.industry = click.prompt(
            "What industry?",
            type=click.Choice(list(VALID_INDUSTRIES), case_sensitive=False),
            default="other",
        )
        profile.company_stage = click.prompt(
            "Company stage?",
            type=click.Choice(list(VALID_STAGES), case_sensitive=False),
            default="solo",
        )
        profile.company_name = click.prompt("Company name? (optional)", default="")
        profile.team_size = click.prompt(
            "Team size?",
            type=click.Choice(list(VALID_TEAM_SIZES), case_sensitive=False),
            default="solo",
        )

        tech_raw = click.prompt("Tech stack? (comma separated)", default="")
        profile.tech_stack = [t.strip() for t in tech_raw.split(",") if t.strip()]

        profile.experience_level = click.prompt(
            "Experience level?",
            type=click.Choice(list(VALID_EXPERIENCE), case_sensitive=False),
            default="intermediate",
        )
        profile.primary_goal = click.prompt(
            "Primary goal?",
            type=click.Choice(list(VALID_GOALS), case_sensitive=False),
            default="ship product",
        )
        profile.output_style = click.prompt(
            "Output style?",
            type=click.Choice(list(VALID_OUTPUT_STYLES), case_sensitive=False),
            default="detailed",
        )
        profile.communication_tone = click.prompt(
            "Communication tone?",
            type=click.Choice(list(VALID_TONES), case_sensitive=False),
            default="professional",
        )

        profile.member_since = datetime.now(timezone.utc).isoformat()

        self.save(profile)
        click.echo("\nProfile saved!\n")
        return profile

    # -- Usage tracking --------------------------------------------------------

    def update_usage(self, skill_name: str) -> None:
        """Auto-called after every skill run. Updates history."""
        profile = self.load()
        profile.skills_used.append(skill_name)
        profile.total_runs += 1

        # Recompute favorite domains from usage frequency
        domain_counts: Counter[str] = Counter()
        for s in profile.skills_used:
            for d in _domains_for_skill(s):
                domain_counts[d] += 1
        # Top 5 domains (excluding "general")
        ranked = [
            d for d, _ in domain_counts.most_common(10) if d != "general"
        ]
        profile.favorite_domains = ranked[:5]

        self.save(profile)

    def update_chain_usage(self, chain_name: str) -> None:
        """Track chain execution."""
        profile = self.load()
        profile.chains_run.append(chain_name)
        self.save(profile)

    # -- Context for skills ----------------------------------------------------

    def get_context_for_skill(self, skill_name: str) -> Dict[str, Any]:
        """Returns profile data formatted for injection into a skill's context.

        Returns a flat dict that skills can read to personalize output.
        """
        profile = self.load()
        return {
            "user_name": profile.name,
            "user_role": profile.role,
            "user_industry": profile.industry,
            "user_company_stage": profile.company_stage,
            "user_company_name": profile.company_name,
            "user_team_size": profile.team_size,
            "user_tech_stack": profile.tech_stack,
            "user_ai_platform": profile.ai_platform,
            "user_experience_level": profile.experience_level,
            "user_primary_goal": profile.primary_goal,
            "user_secondary_goals": profile.secondary_goals,
            "user_output_style": profile.output_style,
            "user_communication_tone": profile.communication_tone,
            "user_total_runs": profile.total_runs,
            "user_favorite_domains": profile.favorite_domains,
            "skill_name": skill_name,
        }

    # -- Recommendations -------------------------------------------------------

    def suggest_skills(self, installed_skills: Optional[List[str]] = None) -> List[SkillRecommendation]:
        """Recommend skills based on profile + usage history.

        Args:
            installed_skills: List of skill names the user already has installed.
                              If None, all recommendations show installed=False.

        Returns:
            Ordered list of SkillRecommendation (essential first, then recommended, then useful).
        """
        profile = self.load()
        installed = set(installed_skills or [])
        recommendations: List[SkillRecommendation] = []
        seen: set[str] = set()

        # Role-based recommendations
        role_skills = ROLE_SKILL_MAP.get(profile.role, {})
        for priority in ("essential", "recommended", "useful"):
            for skill in role_skills.get(priority, []):
                if skill not in seen:
                    seen.add(skill)
                    recommendations.append(SkillRecommendation(
                        skill_name=skill,
                        reason=f"{'Essential' if priority == 'essential' else priority.capitalize()} for {profile.role}s",
                        priority=priority,
                        installed=skill in installed,
                    ))

        # Goal-based recommendations (added as "recommended" if not already listed)
        goal_skills = GOAL_SKILL_MAP.get(profile.primary_goal, [])
        for skill in goal_skills:
            if skill not in seen:
                seen.add(skill)
                recommendations.append(SkillRecommendation(
                    skill_name=skill,
                    reason=f"Based on your goal: {profile.primary_goal}",
                    priority="recommended",
                    installed=skill in installed,
                ))

        # Secondary goals
        for goal in profile.secondary_goals:
            for skill in GOAL_SKILL_MAP.get(goal, []):
                if skill not in seen:
                    seen.add(skill)
                    recommendations.append(SkillRecommendation(
                        skill_name=skill,
                        reason=f"Based on your goal: {goal}",
                        priority="useful",
                        installed=skill in installed,
                    ))

        return recommendations

    def suggest_chains(self) -> List[ChainRecommendation]:
        """Recommend skill chains based on profile role."""
        profile = self.load()
        chains = ROLE_CHAIN_MAP.get(profile.role, [])
        return [
            ChainRecommendation(
                chain_name=c["name"],
                description=c["description"],
                skills=c["skills"],
                match_reason=f"Matches your role: {profile.role}",
            )
            for c in chains
        ]

    # -- Helpers ---------------------------------------------------------------

    @staticmethod
    def _dict_to_profile(data: Dict[str, Any]) -> UserProfile:
        """Safely build a UserProfile from a dict, tolerating missing keys."""
        p = UserProfile()
        for key in (
            "name", "role", "industry", "company_stage", "company_name",
            "team_size", "ai_platform", "experience_level", "primary_goal",
            "output_style", "communication_tone", "member_since",
        ):
            if key in data:
                setattr(p, key, data[key])
        for key in ("tech_stack", "secondary_goals", "skills_used", "chains_run", "favorite_domains"):
            if key in data and isinstance(data[key], list):
                setattr(p, key, data[key])
        if "total_runs" in data and isinstance(data["total_runs"], int):
            p.total_runs = data["total_runs"]
        return p
