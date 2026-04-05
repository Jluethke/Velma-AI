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
reporter.py — Formatted launch report generation.

Produces a comprehensive, well-formatted report from a LaunchResult.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .engine import LaunchResult

logger = logging.getLogger(__name__)


class LaunchReporter:
    """Generates the final launch report."""

    def report(self, result: "LaunchResult") -> str:
        """
        Generate a formatted launch report covering all pipeline stages.
        """
        lines: list[str] = []
        w = 60  # box width

        # -- Header ------------------------------------------------------------
        lines.append(self._box_top(w))
        lines.append(self._box_row("SOLOPRENEUR LAUNCH REPORT", w))

        if result.business_plan:
            lines.append(self._box_row(f"Idea: {result.business_plan.one_liner[:50]}", w))
        lines.append(self._box_sep(w))

        # -- Validation summary ------------------------------------------------
        if result.validation:
            v = result.validation
            lines.append(self._box_row(
                f"Validation Score:  {v.overall_score}/50 ({v.recommendation.upper()})", w
            ))

            for dim, score in v.scores.items():
                bar = self._score_bar(score, 10)
                label = dim.replace("_", " ").title()
                lines.append(self._box_row(f"  {label:22s} {bar} {score}/10", w))

            if v.strengths:
                lines.append(self._box_row("", w))
                lines.append(self._box_row("Strengths:", w))
                for s in v.strengths[:3]:
                    lines.append(self._box_row(f"  + {s[:50]}", w))

            if v.concerns:
                lines.append(self._box_row("Concerns:", w))
                for c in v.concerns[:3]:
                    lines.append(self._box_row(f"  ! {c[:50]}", w))

        lines.append(self._box_sep(w))

        # -- Strategy tournament -----------------------------------------------
        if result.strategy_tournament:
            t = result.strategy_tournament
            lines.append(self._box_row(
                f"Strategy Winner:   {t.winner.name} (Score: {t.winner.weighted_score:.2f})", w
            ))
            lines.append(self._box_row(
                f"Time to Revenue:   ~{t.winner.time_to_revenue_weeks} weeks", w
            ))
            lines.append(self._box_row(
                f"Capital Required:  ${t.winner.capital_required_monthly:.0f}/month", w
            ))
            lines.append(self._box_row(
                f"Risk Level:        {t.winner.risk_level}", w
            ))

            lines.append(self._box_row("", w))
            lines.append(self._box_row("All candidates:", w))
            for c in t.candidates:
                marker = " << WINNER" if c.rank == 1 else ""
                lines.append(self._box_row(
                    f"  #{c.rank} {c.name:10s} {c.weighted_score:.2f}{marker}", w
                ))

        lines.append(self._box_sep(w))

        # -- Business plan summary ---------------------------------------------
        if result.business_plan:
            p = result.business_plan
            lines.append(self._box_row("BUSINESS PLAN", w))
            lines.append(self._box_row(f"  Type:      {p.business_type}", w))
            lines.append(self._box_row(f"  Strategy:  {p.strategy_type}", w))
            lines.append(self._box_row(f"  MVP Time:  {p.mvp_timeline_weeks} weeks", w))
            lines.append(self._box_row(f"  Budget:    ${p.budget_monthly:.0f}/month", w))

            if p.pricing:
                lines.append(self._box_row("  Pricing:", w))
                for tier in p.pricing:
                    lines.append(self._box_row(f"    {tier.name}: {tier.price}", w))

            if p.milestones:
                lines.append(self._box_row("", w))
                lines.append(self._box_row("  Key Milestones:", w))
                for m in p.milestones:
                    lines.append(self._box_row(
                        f"    Week {m.week:2d}: {m.name}", w
                    ))

        lines.append(self._box_sep(w))

        # -- Market analysis summary -------------------------------------------
        if result.market_analysis:
            m = result.market_analysis
            lines.append(self._box_row("MARKET ANALYSIS", w))
            lines.append(self._box_row(f"  TAM: ${m.sizing.tam:,.0f}/yr", w))
            lines.append(self._box_row(f"  SAM: ${m.sizing.sam:,.0f}/yr", w))
            lines.append(self._box_row(f"  SOM: ${m.sizing.som:,.0f}/yr (year 1)", w))

            if m.gaps:
                lines.append(self._box_row("  Top gaps:", w))
                for g in m.gaps[:2]:
                    lines.append(self._box_row(f"    - {g[:48]}", w))

        lines.append(self._box_sep(w))

        # -- Deliverables checklist --------------------------------------------
        lines.append(self._box_row("DELIVERABLES", w))

        deliverables = []
        if result.outreach_pack:
            o = result.outreach_pack
            deliverables.append(f"  [x] {len(o.cold_emails)} cold email variants")
            deliverables.append(f"  [x] {len(o.linkedin_sequences)} LinkedIn sequences")
            deliverables.append(f"  [x] {len(o.social_posts)} social posts")
            deliverables.append(f"  [x] Landing page copy")
            deliverables.append(f"  [x] Elevator pitch")

        if result.ops_system:
            op = result.ops_system
            deliverables.append(f"  [x] Daily routine ({len(op.daily_routine)} time blocks)")
            deliverables.append(f"  [x] Weekly rhythm (7 days)")
            deliverables.append(f"  [x] KPI dashboard ({len(op.kpi_dashboard)} metrics)")
            deliverables.append(f"  [x] {len(op.automation_opportunities)} automation opportunities")
            deliverables.append(f"  [x] Tool stack ({len(op.tool_stack)} tools)")
            deliverables.append(f"  [x] 90-day sprint ({len(op.sprint_90_day)} weeks)")

        if result.business_plan:
            p = result.business_plan
            deliverables.append(f"  [x] First-10-customers playbook ({len(p.first_10_customers)} steps)")
            deliverables.append(f"  [x] Risk analysis ({len(p.risks)} risks with mitigations)")

        for d in deliverables:
            lines.append(self._box_row(d, w))

        lines.append(self._box_sep(w))

        # -- Duration ----------------------------------------------------------
        if result.total_duration_ms > 0:
            duration_s = result.total_duration_ms / 1000
            lines.append(self._box_row(f"Generated in {duration_s:.1f}s", w))

        lines.append(self._box_row("", w))
        lines.append(self._box_row("Next step: Read the full plan, then do the", w))
        lines.append(self._box_row("FIRST MOVE from your winning strategy TODAY.", w))
        lines.append(self._box_bottom(w))

        return "\n".join(lines)

    # -- Detailed sections (for file output) -----------------------------------

    def full_report(self, result: "LaunchResult") -> str:
        """Generate the full detailed report with all content."""
        sections: list[str] = [self.report(result)]

        # Outreach details
        if result.outreach_pack:
            sections.append("\n\n" + "=" * 60)
            sections.append("COLD EMAIL VARIANTS")
            sections.append("=" * 60)
            for i, e in enumerate(result.outreach_pack.cold_emails, 1):
                sections.append(f"\n--- Email #{i} ({e.framework}) ---")
                sections.append(f"Subject: {e.subject}")
                sections.append(f"\n{e.body}")
                if e.notes:
                    sections.append(f"\nNotes: {e.notes}")

            sections.append("\n\n" + "=" * 60)
            sections.append("LINKEDIN SEQUENCES")
            sections.append("=" * 60)
            for i, seq in enumerate(result.outreach_pack.linkedin_sequences, 1):
                sections.append(f"\n--- Sequence #{i} ({seq.framework}) ---")
                sections.append(f"Connection: {seq.connection_request}")
                sections.append(f"Follow-up (Day 2): {seq.follow_up_day_2}")
                sections.append(f"Value offer (Day 5): {seq.follow_up_day_5}")

            sections.append("\n\n" + "=" * 60)
            sections.append("SOCIAL POSTS")
            sections.append("=" * 60)
            for i, post in enumerate(result.outreach_pack.social_posts, 1):
                sections.append(f"\n--- Post #{i} ({post.post_type}) ---")
                sections.append(post.content)

            sections.append("\n\n" + "=" * 60)
            sections.append("LANDING PAGE COPY")
            sections.append("=" * 60)
            sections.append(result.outreach_pack.landing_page.full_page_copy)

            sections.append("\n\n" + "=" * 60)
            sections.append("ELEVATOR PITCH")
            sections.append("=" * 60)
            sections.append(result.outreach_pack.elevator_pitch)

        # Ops details
        if result.ops_system:
            sections.append("\n\n" + "=" * 60)
            sections.append("OPERATING SYSTEM")
            sections.append("=" * 60)

            sections.append("\nDAILY ROUTINE:")
            for tb in result.ops_system.daily_routine:
                sections.append(f"  {tb.start}-{tb.end}  [{tb.category:6s}] {tb.activity}")

            sections.append("\nWEEKLY RHYTHM:")
            for day, focus in result.ops_system.weekly_rhythm.items():
                sections.append(f"  {day:12s} {focus}")

            sections.append("\nKPI DASHBOARD:")
            for kpi in result.ops_system.kpi_dashboard:
                sections.append(f"  - {kpi}")

            sections.append("\nTOOL STACK:")
            for tool in result.ops_system.tool_stack:
                sections.append(f"  {tool.category:16s} {tool.name} ({tool.price})")

            sections.append("\n90-DAY SPRINT:")
            for week in result.ops_system.sprint_90_day:
                sections.append(f"\n  Week {week.week}: {week.focus}")
                for action in week.actions:
                    sections.append(f"    - {action}")
                if week.success_metric:
                    sections.append(f"    >> Metric: {week.success_metric}")

        return "\n".join(sections)

    # -- Box drawing helpers ---------------------------------------------------

    @staticmethod
    def _box_top(w: int) -> str:
        return "+" + "-" * (w - 2) + "+"

    @staticmethod
    def _box_bottom(w: int) -> str:
        return "+" + "-" * (w - 2) + "+"

    @staticmethod
    def _box_sep(w: int) -> str:
        return "|" + "-" * (w - 2) + "|"

    @staticmethod
    def _box_row(text: str, w: int) -> str:
        inner = w - 4  # 2 for borders, 2 for padding
        return f"| {text:<{inner}} |"

    @staticmethod
    def _score_bar(score: int, max_score: int, width: int = 10) -> str:
        """Generate a visual score bar like [=======   ]."""
        filled = int((score / max_score) * width)
        return "[" + "=" * filled + " " * (width - filled) + "]"
