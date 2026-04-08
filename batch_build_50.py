"""
batch_build_50.py
=================

Runs the build-a-skill chain 50 times with diverse skill ideas.
Each run produces: skill draft, polished version, test cases, and chain designs.

Usage:
    cd "F:/The Wayfinder Trust/IP/projects/SkillChain"
    python batch_build_50.py
"""

from __future__ import annotations

import json
import logging
import sys
import time
from dataclasses import asdict
from pathlib import Path

# Add the pypi-package source to path
ROOT = Path(__file__).resolve().parent
SDK_SRC = ROOT / "pypi-package" / "src"
if str(SDK_SRC) not in sys.path:
    sys.path.insert(0, str(SDK_SRC))

from skillchain.sdk.skill_chain import SkillChain
from skillchain.sdk.llm_executor import LLMStepExecutor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 50 diverse skill ideas
# ---------------------------------------------------------------------------

SKILL_IDEAS: list[dict] = [
    # --- Productivity & Planning ---
    {"workflow_description": "A user describes their week ahead. The skill creates a time-blocked schedule that balances deep work, meetings, and recovery time, then outputs calendar-ready blocks.", "skill_name_hint": "weekly-time-blocker"},
    {"workflow_description": "Take a large ambiguous goal and break it into a concrete 90-day action plan with milestones, dependencies, and weekly checkpoints.", "skill_name_hint": "90-day-goal-planner"},
    {"workflow_description": "Analyze a user's daily routine description and identify energy leaks, suggest micro-habits, and output a redesigned morning/evening routine.", "skill_name_hint": "routine-optimizer"},
    {"workflow_description": "Convert meeting notes into structured action items with owners, deadlines, and follow-up reminders. Flag anything ambiguous.", "skill_name_hint": "meeting-to-actions"},
    {"workflow_description": "Take a project scope document and generate a risk register with probability, impact, mitigation strategies, and early warning indicators.", "skill_name_hint": "risk-register-builder"},

    # --- Developer Tools ---
    {"workflow_description": "Analyze a Python codebase and generate a dependency graph showing which modules import what, circular dependencies, and suggest decoupling strategies.", "skill_name_hint": "dependency-mapper"},
    {"workflow_description": "Take an API specification (OpenAPI/Swagger) and generate comprehensive integration test scenarios covering edge cases, error paths, and load patterns.", "skill_name_hint": "api-test-generator"},
    {"workflow_description": "Review a git diff and generate a structured code review with severity levels, specific improvement suggestions, and praise for good patterns.", "skill_name_hint": "code-review-assistant"},
    {"workflow_description": "Take a database schema and generate migration scripts, seed data, and a visual ERD description for documentation.", "skill_name_hint": "schema-migrator"},
    {"workflow_description": "Analyze error logs and stack traces to identify root cause patterns, suggest fixes ranked by likelihood, and generate monitoring alerts.", "skill_name_hint": "error-root-cause-analyzer"},

    # --- Business & Strategy ---
    {"workflow_description": "Take a business idea and run it through a structured validation: market size estimation, competitor analysis, unique value proposition, and go/no-go recommendation.", "skill_name_hint": "idea-validator"},
    {"workflow_description": "Analyze a pricing page and suggest A/B test variations based on pricing psychology principles, anchoring effects, and tier optimization.", "skill_name_hint": "pricing-optimizer"},
    {"workflow_description": "Take a product feature list and prioritize using RICE scoring, then output a roadmap with quarters, dependencies, and resource estimates.", "skill_name_hint": "feature-prioritizer"},
    {"workflow_description": "Generate a competitive intelligence brief from a company name: positioning, strengths, weaknesses, recent moves, and strategic recommendations.", "skill_name_hint": "competitive-intel-brief"},
    {"workflow_description": "Take revenue data and churn metrics, then build a cohort analysis with retention curves, LTV projections, and actionable churn reduction strategies.", "skill_name_hint": "cohort-analyzer"},

    # --- Writing & Content ---
    {"workflow_description": "Take a technical concept and produce explanations at 5 levels: child, teenager, college student, professional, and expert. Each level builds on the previous.", "skill_name_hint": "five-level-explainer"},
    {"workflow_description": "Analyze a blog post draft for SEO optimization: keyword density, meta descriptions, header structure, internal linking opportunities, and readability score.", "skill_name_hint": "seo-content-auditor"},
    {"workflow_description": "Take a product description and generate 10 variations optimized for different platforms: Twitter, LinkedIn, email subject, landing page hero, app store.", "skill_name_hint": "multi-platform-copywriter"},
    {"workflow_description": "Convert a technical whitepaper into a series of social media threads, each covering one key insight with hooks and calls to action.", "skill_name_hint": "whitepaper-to-threads"},
    {"workflow_description": "Take a user's writing sample and analyze their voice: tone, vocabulary level, sentence patterns, then create a style guide for consistent AI-assisted writing.", "skill_name_hint": "voice-analyzer"},

    # --- Data & Analytics ---
    {"workflow_description": "Take a CSV dataset description and generate a complete exploratory data analysis plan: distributions to check, correlations to test, outlier detection methods, and visualization recommendations.", "skill_name_hint": "eda-planner"},
    {"workflow_description": "Analyze a dashboard description and suggest improvements: remove vanity metrics, add actionable KPIs, improve data hierarchy, and suggest drill-down paths.", "skill_name_hint": "dashboard-optimizer"},
    {"workflow_description": "Take a business question and design the SQL queries, data pipeline, and visualization needed to answer it, including data quality checks.", "skill_name_hint": "data-question-solver"},
    {"workflow_description": "Generate a data dictionary from a database schema: column descriptions, data types, relationships, sample values, and business context for each field.", "skill_name_hint": "data-dictionary-builder"},
    {"workflow_description": "Take experiment results (A/B test) and perform statistical analysis: significance testing, confidence intervals, practical significance, and recommendation.", "skill_name_hint": "ab-test-analyzer"},

    # --- Learning & Education ---
    {"workflow_description": "Take any topic and generate a structured curriculum: prerequisites, learning path, resources, practice exercises, and assessment criteria for 4 skill levels.", "skill_name_hint": "curriculum-designer"},
    {"workflow_description": "Create spaced repetition flashcard sets from study material, optimizing for retention with interleaving, elaboration, and concrete examples.", "skill_name_hint": "flashcard-generator"},
    {"workflow_description": "Take a concept the user is struggling with and generate analogies from domains they already understand, building bridges to the new concept.", "skill_name_hint": "analogy-bridge-builder"},
    {"workflow_description": "Design a hands-on project that teaches a specific skill, with scaffolded steps, checkpoints, and extension challenges for advanced learners.", "skill_name_hint": "project-based-lesson"},
    {"workflow_description": "Analyze a student's mistakes on practice problems to identify misconception patterns and generate targeted remediation exercises.", "skill_name_hint": "misconception-diagnoser"},

    # --- Health & Wellness ---
    {"workflow_description": "Take dietary preferences, restrictions, and goals, then generate a 7-day meal plan with grocery list, prep schedule, and macro breakdown.", "skill_name_hint": "meal-plan-generator"},
    {"workflow_description": "Analyze a user's sleep habits description and generate a personalized sleep hygiene protocol with specific environmental and behavioral changes.", "skill_name_hint": "sleep-protocol-designer"},
    {"workflow_description": "Take fitness goals and current level, then design a progressive 12-week training program with periodization, deload weeks, and progress markers.", "skill_name_hint": "training-program-builder"},
    {"workflow_description": "Guide a user through a structured stress audit: identify stressors, categorize by controllability, and generate a stress management action plan.", "skill_name_hint": "stress-audit"},
    {"workflow_description": "Create a personalized mindfulness practice sequence based on user's experience level, available time, and specific mental health goals.", "skill_name_hint": "mindfulness-sequencer"},

    # --- Finance & Money ---
    {"workflow_description": "Take income, expenses, and financial goals to create a zero-based budget with emergency fund timeline, debt payoff strategy, and savings allocation.", "skill_name_hint": "zero-based-budgeter"},
    {"workflow_description": "Analyze a portfolio allocation and generate rebalancing recommendations based on risk tolerance, time horizon, and tax implications.", "skill_name_hint": "portfolio-rebalancer"},
    {"workflow_description": "Take a side hustle idea and build a financial model: startup costs, break-even analysis, monthly projections, and scenario planning (best/worst/likely).", "skill_name_hint": "side-hustle-modeler"},
    {"workflow_description": "Generate a negotiation preparation brief for salary discussions: market data points, BATNA analysis, anchoring strategy, and response scripts.", "skill_name_hint": "salary-negotiation-prep"},
    {"workflow_description": "Take tax situation details and identify optimization opportunities: deductions, credits, timing strategies, and estimated savings.", "skill_name_hint": "tax-optimizer"},

    # --- Communication & Relationships ---
    {"workflow_description": "Prepare for a difficult conversation: identify the core issue, anticipate reactions, script opening statements, plan de-escalation tactics, and define success criteria.", "skill_name_hint": "difficult-conversation-prep"},
    {"workflow_description": "Take a conflict description and apply the Thomas-Kilmann framework to suggest resolution strategies matched to the relationship and stakes.", "skill_name_hint": "conflict-resolver"},
    {"workflow_description": "Generate a stakeholder communication plan: identify audiences, tailor messages, choose channels, set cadence, and create templates for each stakeholder group.", "skill_name_hint": "stakeholder-comms-planner"},
    {"workflow_description": "Analyze an email thread and draft responses that match the appropriate tone, address all points, and move the conversation toward resolution.", "skill_name_hint": "email-thread-responder"},
    {"workflow_description": "Take a presentation topic and audience description, then generate a narrative arc, key messages, anticipated objections, and Q&A preparation.", "skill_name_hint": "presentation-architect"},

    # --- Home & Life ---
    {"workflow_description": "Take a home description and generate an emergency preparedness plan: supply lists, evacuation routes, communication protocols, and insurance review checklist.", "skill_name_hint": "emergency-prep-planner"},
    {"workflow_description": "Plan a home renovation project: scope definition, contractor evaluation criteria, budget breakdown, timeline with buffer, and decision documentation.", "skill_name_hint": "renovation-planner"},
    {"workflow_description": "Generate a relocation decision matrix: compare cities on cost of living, job market, quality of life, climate, and personal priorities with weighted scoring.", "skill_name_hint": "relocation-comparator"},
    {"workflow_description": "Create a household operations manual: recurring tasks, seasonal maintenance, vendor contacts, and shared responsibility assignments.", "skill_name_hint": "household-ops-manual"},
    {"workflow_description": "Plan an event end-to-end: guest management, venue selection criteria, timeline, vendor coordination, budget tracking, and day-of runsheet.", "skill_name_hint": "event-planner"},
]

# Output directory
OUTPUT_DIR = ROOT / "batch_output"

def run_batch():
    """Execute build-a-skill chain for all 50 ideas."""
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Load chain definition
    chain_path = ROOT / "marketplace" / "chains" / "build-a-skill.chain.json"
    chain_data = json.loads(chain_path.read_text(encoding="utf-8"))

    # Marketplace dir for skill resolver
    marketplace_dir = ROOT / "marketplace"

    def _resolve_skill(skill_name: str):
        """Resolve a skill.md from marketplace."""
        skill_file = marketplace_dir / skill_name / "skill.md"
        if skill_file.exists():
            return skill_file.read_text(encoding="utf-8")
        return None

    executor = LLMStepExecutor(skill_resolver=_resolve_skill)

    results_summary = []
    total = len(SKILL_IDEAS)

    for i, idea in enumerate(SKILL_IDEAS, 1):
        name_hint = idea.get("skill_name_hint", f"skill-{i}")
        logger.info("=" * 60)
        logger.info(f"[{i}/{total}] Building: {name_hint}")
        logger.info("=" * 60)

        chain_obj = SkillChain.from_dict(chain_data)
        chain_obj.set_executor(executor)

        t0 = time.time()
        try:
            result = chain_obj.execute(initial_context=idea, fail_fast=False)
            elapsed = time.time() - t0
            result_dict = asdict(result)

            # Save individual result
            out_file = OUTPUT_DIR / f"{i:02d}_{name_hint}.json"
            out_file.write_text(json.dumps(result_dict, indent=2, default=str), encoding="utf-8")

            status = "OK" if result.success else "PARTIAL"
            completed = sum(1 for s in result.steps if s.status == "completed")
            logger.info(f"  [{status}] {completed}/{len(result.steps)} steps, {elapsed:.1f}s")

            results_summary.append({
                "index": i,
                "skill": name_hint,
                "status": status,
                "steps_completed": completed,
                "steps_total": len(result.steps),
                "duration_s": round(elapsed, 1),
            })

        except Exception as exc:
            elapsed = time.time() - t0
            logger.error(f"  [FAIL] {name_hint}: {exc}")
            results_summary.append({
                "index": i,
                "skill": name_hint,
                "status": "FAIL",
                "error": str(exc),
                "duration_s": round(elapsed, 1),
            })

        # Brief pause to avoid rate limiting
        if i < total:
            time.sleep(1)

    # Write summary
    summary_file = OUTPUT_DIR / "batch_summary.json"
    summary_file.write_text(json.dumps(results_summary, indent=2), encoding="utf-8")

    # Print summary
    ok = sum(1 for r in results_summary if r["status"] == "OK")
    partial = sum(1 for r in results_summary if r["status"] == "PARTIAL")
    fail = sum(1 for r in results_summary if r["status"] == "FAIL")
    total_time = sum(r["duration_s"] for r in results_summary)

    logger.info("=" * 60)
    logger.info(f"BATCH COMPLETE: {ok} OK, {partial} partial, {fail} failed")
    logger.info(f"Total time: {total_time:.0f}s ({total_time/60:.1f}min)")
    logger.info(f"Results: {OUTPUT_DIR}")
    logger.info("=" * 60)


if __name__ == "__main__":
    run_batch()
