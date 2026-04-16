# Website Analytics & Conversion Auditor

**One-line description:** A CRO specialist and analytics engineer audits a website's conversion funnel, tracking setup, and measurement gaps — then identifies where visitors drop off and what to test to recover them.

**Execution Pattern:** Phase Pipeline

**Domain:** developer

---

## Inputs

- `website_url` (string, required): The URL to audit.
- `primary_conversion_goal` (string, required): What counts as a conversion? (e.g., "form submit", "checkout complete", "demo booked")
- `analytics_platform` (string, optional): GA4, Mixpanel, Amplitude, Plausible, etc. Defaults to assuming GA4.
- `known_metrics` (object, optional): Any metrics you already have `{bounce_rate, avg_session_duration, conversion_rate, top_exit_pages}`.
- `traffic_sources` (array of strings, optional): Primary traffic channels (organic, paid, email, social, direct).
- `tech_stack` (string, optional): Frontend framework, tag manager if known.
- `current_a_b_tests` (string, optional): Any tests currently running.

---

## Phases

### Phase 1 — Tracking Audit
Assess whether the measurement foundation is reliable:
- Is the analytics tag firing on every page? Are there pages without tracking?
- Are conversion events correctly tagged and firing once (not double-counting)?
- Is there a tag manager in use? Is it configured cleanly or accumulating junk?
- Are UTM parameters being used consistently across all traffic sources?
- Is there cross-domain tracking if needed?
- Are there any PII violations (email addresses in URLs, form values in events)?

Deliverable: Tracking gaps list with implementation instructions.

### Phase 2 — Funnel Mapping
Map the full conversion funnel from first visit to conversion:
- Stage 1: Landing (which pages do visitors enter on?)
- Stage 2: Engagement (which pages do they visit next?)
- Stage 3: Intent (which pages signal purchase/conversion intent?)
- Stage 4: Action (conversion page)
- Stage 5: Post-conversion (confirmation, onboarding, retention)

For each stage: What % of visitors make it to the next stage? What are the primary exit points?

Deliverable: Funnel diagram with estimated drop-off rates at each stage.

### Phase 3 — Exit Page Analysis
For the top 5 exit pages:
- Why are users leaving here? (content dead end, no CTA, technical issue, answer found)
- What did they come to find?
- What would make them stay or convert?

Deliverable: Per-page hypothesis and recommended fix.

### Phase 4 — CRO Opportunity Identification
Identify the highest-leverage conversion opportunities:
- Which page, if improved by 20%, would have the biggest impact on total conversions?
- Are there pages with high traffic and low conversion rate that should be prioritized?
- Are there pages with high conversion rate that get too little traffic?
- What are the primary friction points before conversion? (too many form fields, unclear pricing, missing trust signals)

Deliverable: Ranked CRO opportunity list with expected lift and test hypothesis.

### Phase 5 — A/B Test Roadmap
For the top 3 CRO opportunities:
- **Hypothesis:** If we change X, we expect Y because Z.
- **Variant:** Specific change to test (headline, CTA, layout, form, social proof).
- **Primary metric:** What we measure to determine a winner.
- **Sample size needed:** Estimated traffic required for statistical significance.
- **Test duration:** Estimated days to significance at current traffic levels.

### Phase 6 — Measurement Improvement Plan

**Fix immediately (broken tracking blocking decisions):**
Specific implementation steps.

**Set up this week (missing measurement):**
New events, goals, or segments to create.

**Test this quarter (CRO experiments):**
Full test briefs for each experiment.

**Reporting setup:**
Recommended dashboard structure and weekly/monthly KPIs to track.
