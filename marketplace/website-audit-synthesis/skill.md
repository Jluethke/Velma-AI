# Website Audit Synthesis

**One-line description:** Synthesizes findings from all department audits (engineering, security, performance, UX, accessibility, SEO, content, analytics) into a single prioritized improvement roadmap with ownership assignments and effort estimates.

**Execution Pattern:** Phase Pipeline

**Domain:** developer

---

## Inputs

- `website_url` (string, required): The website that was audited.
- `business_goal` (string, required): The primary business objective the website must serve (e.g., "generate 50 enterprise demo requests per month").
- `engineering_findings` (string, required): Output from the codebase/engineering audit.
- `security_findings` (string, required): Output from the security audit.
- `performance_findings` (string, required): Output from the performance audit.
- `ux_findings` (string, required): Output from the UX audit.
- `accessibility_findings` (string, required): Output from the accessibility audit.
- `seo_findings` (string, required): Output from the SEO audit.
- `content_findings` (string, required): Output from the content/copy audit.
- `analytics_findings` (string, required): Output from the analytics/CRO audit.
- `team_size` (string, optional): Engineering team size and composition if known.
- `timeline` (string, optional): When does the next release or sprint happen?
- `budget_context` (string, optional): Any constraints on what can be invested.

---

## Phases

### Phase 1 — Cross-Audit Pattern Recognition
Read all audit findings and identify themes that appear across multiple disciplines:
- Issues flagged by 3+ audits are systemic — they indicate a deeper root cause
- Issues flagged by only one audit but with critical severity still get full weight
- Issues that conflict across audits (e.g., UX wants more copy, Content wants less) — note the tension and resolve it

Deliverable: Pattern summary — "The same root cause (X) is showing up as Y in UX, Z in performance, and W in engineering."

### Phase 2 — Impact × Effort Matrix
Score every finding across all audits on two axes:
- **Business impact** (1–5): How directly does fixing this advance the primary business goal?
- **Implementation effort** (1–5): How much engineering/design/content time does this require?

Plot into four quadrants:
- **Q1 (High Impact, Low Effort) — Do immediately:** Quick wins. Highest ROI.
- **Q2 (High Impact, High Effort) — Plan and execute:** Major initiatives, require sprint planning.
- **Q3 (Low Impact, Low Effort) — Batch and ship:** Polish items. Do in downtime.
- **Q4 (Low Impact, High Effort) — Deprioritize:** Defer unless requirements change.

### Phase 3 — Department Roadmap
For each professional role, produce a focused improvement list they can own:

**Engineering Lead:**
Top 5 codebase improvements with ticket-ready descriptions.

**Security Engineer:**
Top 5 vulnerabilities ranked by risk, with remediation steps.

**Performance Engineer:**
Top 5 performance fixes ranked by expected CWV impact.

**UX/Product Designer:**
Top 5 UX improvements with wire-level description of the fix.

**Accessibility Specialist:**
Top 5 WCAG violations with code-level remediation.

**SEO Specialist:**
Top 5 SEO improvements with expected ranking impact.

**Content Strategist / Copywriter:**
Top 5 copy improvements with rewritten versions where applicable.

**Analytics / Growth:**
Top 3 CRO experiments with full test briefs.

### Phase 4 — 30 / 60 / 90 Day Roadmap
Organize the full improvement backlog into a realistic timeline:

**30 Days — Foundation (no regressions, quick wins live):**
List of specific items, owner, and estimated hours each.

**60 Days — Impact (major UX, content, and performance improvements):**
List of specific items, owner, and estimated hours each.

**90 Days — Growth (CRO experiments, content strategy, SEO gains):**
List of specific items, owner, and estimated hours each.

### Phase 5 — Executive Summary
A 1-page summary suitable for stakeholders:

- **Current state:** One paragraph honest assessment of where the site is today.
- **The 3 things hurting you most right now:** The highest-priority issues across all audits.
- **Expected outcome:** What improving these 3 things should do to conversion rate, traffic, or user retention.
- **Investment required:** Rough time estimate to implement the 30-day roadmap.
- **What's already working:** 3–5 genuine strengths not to disrupt.

### Phase 6 — Audit Score Card
A department-by-department score (1–10) with one-line commentary:

| Department | Score | One-line verdict |
|---|---|---|
| Engineering / Codebase | X/10 | ... |
| Security | X/10 | ... |
| Performance | X/10 | ... |
| UX / Design | X/10 | ... |
| Accessibility | X/10 | ... |
| SEO | X/10 | ... |
| Content / Copy | X/10 | ... |
| Analytics / CRO | X/10 | ... |
| **Overall** | **X/10** | ... |
