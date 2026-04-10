# Dashboard Explainer

Read dashboard data -- metrics, charts, comparisons, and deltas -- and generate a plain-English narrative that explains what changed, why it matters, and what actions to take. Prioritizes insights by business impact and produces executive-ready summaries.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read dashboard data (metrics, charts, comparisons, deltas)
REASON  --> Identify what changed, why it matters, what's unusual
PLAN    --> Prioritize insights by business impact
ACT     --> Generate plain-English narrative: "Revenue is up 12% because..."
     \                                                              /
      +--- New context or follow-up questions --- loop to OBSERVE --+
```

## Inputs

- `dashboard_data`: object -- Metrics with current values, prior period values, deltas (absolute and percentage), and targets. May include chart data (trend lines, distributions)
- `metric_definitions`: object -- What each metric measures, how it's calculated, why it matters, and upstream/downstream relationships
- `comparison_period`: string -- The comparison basis: WoW, MoM, QoQ, YoY, or custom date range
- `audience`: string -- Who will read this: "executive" (high-level, action-oriented), "analyst" (detailed, data-rich), "board" (strategic, quarterly context)

## Outputs

- `narrative_report`: string -- Plain-English narrative with headline, body paragraphs, and recommended actions. Structured for scanning (bold key numbers, clear hierarchy)
- `key_insights`: array -- Top 3-5 insights ranked by business impact, each with: what changed, why it matters, what to do
- `recommended_actions`: array -- Specific, time-bound actions derived from the insights

---

## Execution

### OBSERVE: Read Dashboard Data

**Entry criteria:** Dashboard data with at least 3 metrics and comparison values is provided.

**Actions:**
1. Parse all metrics: extract current value, prior value, delta (absolute and %), target, and status (above/below/at target)
2. Categorize each metric movement:
   - **Big movers:** >10% change (or >3 percentage points for rate metrics)
   - **Notable movers:** 5-10% change
   - **Stable:** <5% change
   - **Direction reversals:** metrics that changed direction from prior trend
3. Identify metric relationships:
   - Leading indicators (signups -> activation -> revenue)
   - Correlated pairs (support tickets <-> NPS)
   - Conflicting signals (growth up but quality down)
4. Load historical context if available:
   - Is this week's change part of a longer trend?
   - How does this compare to the same period last year?
   - What's the trajectory toward target?
5. Note any missing or stale metrics (data gaps)

**Output:** Structured summary of all metric movements, categorized by magnitude, with relationships mapped and historical context noted.

**Quality gate:** Every metric has been categorized. Relationships between at least 2 metric pairs are identified. Missing data is flagged.

---

### REASON: Extract Insights

**Entry criteria:** Metric movement summary is complete.

**Actions:**

1. **Identify causal chains:**
   - If multiple metrics moved in the same direction, are they connected?
   - Example: signups up + activation down + ARPU down = quality dilution
   - Example: churn up + NPS down + support tickets up = satisfaction crisis

2. **Apply the "So What?" test to each movement:**
   - Revenue up 2%: so what? -> Is it accelerating or decelerating vs trend? Is it above or below plan?
   - Signups up 20%: so what? -> Are they converting? From what channel? Sustainable or one-time?
   - Churn flat at 5%: so what? -> Is flat good (stable) or bad (stuck above target)?

3. **Assess business impact per insight:**
   - **Revenue impact:** Does this affect top-line growth?
   - **Cost impact:** Does this increase burn or reduce margin?
   - **Risk:** Does this create operational, competitive, or customer risk?
   - **Opportunity:** Does this reveal an underexploited advantage?

4. **Detect narrative-worthy patterns:**
   - Divergence: two normally-correlated metrics moving apart
   - Acceleration/deceleration: rate of change is changing
   - Threshold crossing: metric crossed above/below target or benchmark
   - Plateau: metric has been flat for 3+ periods after growth
   - Record: metric hit all-time high/low

5. **Assess what's NOT in the data:**
   - Missing context that would explain a change
   - Metrics that should have moved but didn't
   - External factors (market, competition, seasonality) not captured in the dashboard

**Output:** Ranked list of insights, each with: observation, explanation (why), business impact (so what), and confidence level.

**Quality gate:** At least 2 insights have a causal explanation (not just "X went up"). Every insight passes the "so what?" test. Insights are ranked by business impact, not just magnitude of change.

---

### PLAN: Structure the Narrative

**Entry criteria:** Ranked insights are available.

**Actions:**

1. **Select the headline insight:**
   - The single most important thing the audience needs to know
   - Format: "[Metric] is [direction] because [cause], which means [impact]"
   - Example: "Growth is accelerating but quality is declining -- new users aren't activating"

2. **Structure the narrative:**
   - **Headline:** 1 sentence, the "if you read nothing else" takeaway
   - **Good news paragraph:** What's working, what beat targets
   - **Concern paragraph:** What's declining, what missed targets, why
   - **Connection paragraph:** How the good and bad connect (the story)
   - **Actions:** 2-4 specific, time-bound recommendations

3. **Adapt tone and depth to audience:**
   - **Executive:** Lead with actions, explain in business terms, no jargon, 200-400 words
   - **Analyst:** Include methodology, reference specific data points, include caveats, 400-800 words
   - **Board:** Strategic context, quarter-over-quarter, competitive framing, 300-500 words

4. **Add comparison context:**
   - "Revenue grew 2.8% WoW, which is [above/below] our average weekly growth of [X%]"
   - "At this trajectory, we'll hit $500K MRR in [N] weeks"
   - "This is the [highest/lowest] activation rate since [date]"

5. **Draft recommended actions:**
   - Each action: what to do, who should do it, by when, expected impact
   - Actions must connect to insights (no generic advice)

**Output:** Structured narrative draft with headline, body, and actions, tailored to the specified audience.

**Quality gate:** Headline captures the most important insight. Every paragraph connects to a specific data point. Actions are specific and time-bound. Word count is within audience target range.

---

### ACT: Deliver the Narrative

**Entry criteria:** Narrative draft is complete.

**Actions:**

1. **Polish the narrative:**
   - Replace jargon with plain language ("user acquisition cost" -> "how much we spend to get each new user")
   - Bold key numbers for scannability
   - Ensure every claim is backed by a specific data point
   - Remove hedging language ("it seems like" -> "the data shows")

2. **Format for the delivery context:**
   - If Slack/email: short paragraphs, bullet points, emoji sparingly
   - If presentation: slide-ready bullets with speaker notes
   - If document: full prose with section headers

3. **Add forward-looking context:**
   - "If [trend] continues, we expect [outcome] by [date]"
   - "Watch for [metric] next week -- if it [condition], then [implication]"

4. **Update metric context state:**
   - Record this period's values as historical context for next run
   - Note any new patterns detected (for future "this has been happening for N weeks" context)
   - Flag metrics that need deeper investigation beyond this summary

**Output:** Final narrative report, key insights list, and recommended actions.

**Quality gate:** A non-technical executive can understand the entire narrative without asking clarifying questions. Every number in the narrative matches the source data. Actions are actionable (not "improve metrics").

---

**Loop condition:** After ACT, if the audience asks follow-up questions ("why did activation drop?", "what channel drove signups?"), loop back to OBSERVE to drill into the specific metric with additional data.

## Exit Criteria

The skill is DONE when:
- Every metric in the dashboard has been addressed (even if just to note stability)
- At least 2 insights with causal explanations are included
- The narrative has a clear headline, supporting paragraphs, and specific actions
- The tone and depth match the specified audience
- Forward-looking context is included (what to watch next)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Dashboard has only 1-2 metrics | **Adjust** -- produce a focused brief instead of a full narrative |
| OBSERVE | No comparison period data available | **Adjust** -- describe current state without trend context, note the gap |
| OBSERVE | Metric definitions are missing | **Adjust** -- infer meaning from metric names, flag uncertainty |
| REASON | Cannot identify causal relationships | **Adjust** -- report correlations with "likely connected" language instead of causal claims |
| REASON | All metrics are flat (nothing changed) | **Adjust** -- narrative focuses on trajectory, target gaps, and "what to watch for" |
| PLAN | Too many insights (>8) to fit narrative | **Adjust** -- select top 5 by impact, note remaining in an appendix |
| ACT | Audience type not specified | **Adjust** -- default to "executive" style |
| ACT | User rejects final output | **Targeted revision** -- ask which metric narrative, insight, or audience calibration fell short and rerun only that section. Do not regenerate the full dashboard explanation. |

## State Persistence

Between runs, this skill saves:
- **Metric history**: values per period for trend context ("this is the 3rd consecutive week of decline")
- **Narrative patterns**: which insights were highlighted previously (avoid repetition)
- **Audience preferences**: preferred format, level of detail, specific metrics they always ask about
- **Causal models**: relationships between metrics learned over time (e.g., "in this business, activation always lags signups by 1 week")

---

## Reference

### The Insight Hierarchy

```
Level 1: WHAT changed
  "Revenue is up 12%"
  -- This is just reading the number. Not an insight.

Level 2: WHY it changed
  "Revenue is up 12% because enterprise deal closings accelerated in Q4"
  -- This is an explanation. Better.

Level 3: SO WHAT -- what it means
  "Revenue is up 12% driven by enterprise, which means our
   sales-led motion is working but self-serve is flat"
  -- This is an insight. It connects data to business meaning.

Level 4: NOW WHAT -- what to do
  "Revenue is up 12% driven by enterprise. Self-serve is flat.
   Recommendation: double down on enterprise sales hiring,
   investigate self-serve conversion funnel."
  -- This is actionable intelligence. This is the goal.

Always aim for Level 3-4. Never deliver Level 1.
```

### Narrative Templates

#### The Divergence Story
```
"While [Metric A] improved [X%], [Metric B] declined [Y%]. These
 usually move together, which suggests [root cause]. If this gap
 persists, expect [consequence]. Recommended: [action]."
```

#### The Acceleration Story
```
"[Metric] has grown [X%] this [period], up from [Y%] growth last
 [period]. At this rate, we'll hit [target/milestone] by [date].
 The acceleration is driven by [cause]."
```

#### The Threshold Story
```
"[Metric] crossed [below/above] [threshold] for the first time
 since [date]. This matters because [impact]. Immediate action:
 [recommendation]."
```

#### The Plateau Story
```
"[Metric] has been flat at [value] for [N] [periods], after
 growing [X%] per [period] previously. This plateau suggests
 [cause: market saturation / channel exhaustion / product gap].
 To restart growth: [recommendation]."
```

#### The Good News / Bad News Story
```
"The good news: [positive metrics and what they mean].
 The concern: [negative metrics and what they mean].
 The connection: [how they relate].
 Net assessment: [overall health judgment].
 Priority action: [single most important thing to do]."
```

### Metric Relationship Frameworks

```
AARRR Funnel (Pirate Metrics):
  Acquisition -> Activation -> Retention -> Revenue -> Referral
  
  Rule: Problems upstream cascade downstream.
  If acquisition is up but activation is down, the problem is
  quality, not quantity.

SaaS Metric Chains:
  Signups -> Activation -> Trial-to-Paid -> Expansion -> Churn
  
  CAC * Volume = Marketing Spend
  LTV = ARPU / Churn Rate
  LTV:CAC ratio should be > 3:1

Leading vs Lagging:
  Leading: signups, activation, NPS, feature adoption
  Lagging: revenue, churn, LTV
  
  Changes in leading indicators predict changes in lagging
  indicators 1-3 months later.
```

### "So What?" Amplification Table

```
| Raw Change              | So What?                                    |
|-------------------------|---------------------------------------------|
| Revenue +5%             | Above/below plan? Accelerating/decelerating? |
| Churn +0.5%             | At scale: 0.5% * $10M ARR = $50K/mo lost   |
| NPS -3 points           | Below 40 = detractor territory, churn risk  |
| CAC +20%                | Payback period extends from 8 to 10 months  |
| Support tickets +15%    | Team at capacity? Hiring needed? Auto-fix?  |
| Activation -5 pts       | X fewer users reaching value = Y less revenue|
| DAU/MAU ratio -3 pts    | Engagement weakening, retention will follow  |
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
