# Deal Risk Analyzer

Analyzes sales pipeline deals for risk signals, scores each deal's probability of closing, recommends save actions for at-risk deals, and adjusts forecast projections based on observed risk factors and historical velocity data.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read deal/pipeline data, load historical benchmarks, gather stakeholder and activity info
REASON  --> Score risk factors per deal: velocity, engagement, champion strength, competition, budget
PLAN    --> Flag at-risk deals, rank by urgency, recommend specific save actions per deal
ACT     --> Output risk report with adjusted forecast, save action plan, and pipeline health metrics
         \                                                                                       /
          +--- If new deals enter pipeline or deal status changes, loop back to OBSERVE ---------+
```

## Inputs

- **deal_data**: array of objects -- Each deal containing:
  - `deal_name`: string
  - `account`: string -- Company name
  - `acv`: number -- Annual contract value
  - `stage`: string -- Current pipeline stage
  - `days_in_stage`: number -- How long the deal has been in current stage
  - `total_deal_age`: number -- Days since deal was created
  - `last_contact_date`: string (ISO date)
  - `next_steps`: string -- Agreed next action
  - `close_date`: string (ISO date) -- Projected close
  - `probability`: number (0-1) -- Current forecast probability
- **pipeline_history**: object (optional) -- Historical benchmarks:
  - `avg_days_per_stage`: object -- Median days in each stage for won deals
  - `win_rate_by_stage`: object -- Historical win rate from each stage
  - `avg_deal_cycle`: number -- Average days from creation to close
  - `lost_deal_patterns`: array -- Common characteristics of lost deals
- **stakeholder_map**: array of objects (per deal, optional):
  - `name`: string
  - `title`: string
  - `role`: string ("champion" | "economic_buyer" | "technical_evaluator" | "blocker" | "coach")
  - `engagement_level`: string ("active" | "passive" | "disengaged" | "unknown")
  - `last_interaction`: string (ISO date)
- **competitive_intel**: object (per deal, optional):
  - `competitors_identified`: string[]
  - `competitor_strengths`: string[]
  - `competitive_position`: string ("leading" | "even" | "trailing" | "unknown")

## Outputs

- **risk_report**: object -- Pipeline-level analysis:
  - `pipeline_health_score`: number (0-100)
  - `total_pipeline_value`: number
  - `risk_adjusted_value`: number
  - `forecast_adjustment_pct`: number (how much the forecast shifts after risk analysis)
  - `deals_by_risk_tier`: object -- Count per tier (critical, elevated, moderate, low)
- **deal_scores**: array of objects -- Per-deal risk breakdown:
  - `deal_name`: string
  - `risk_score`: number (0-100, higher = more risk)
  - `risk_tier`: string ("critical" | "elevated" | "moderate" | "low")
  - `risk_factors`: array of {factor: string, severity: string, detail: string}
  - `adjusted_probability`: number (0-1)
  - `adjusted_value`: number (acv * adjusted_probability)
  - `recommended_actions`: string[]
  - `timeline_warning`: string (if close date is at risk)
- **save_actions**: array of objects -- Prioritized action list:
  - `deal_name`: string
  - `action`: string
  - `urgency`: string ("immediate" | "this_week" | "this_month")
  - `expected_impact`: string
  - `owner`: string (suggested)
- **forecast_adjustment**: object -- Revised forecast:
  - `original_weighted`: number
  - `risk_adjusted_weighted`: number
  - `commit`: number (deals with risk score < 25)
  - `best_case`: number (commit + deals with risk score < 50)
  - `upside`: number (all deals risk-adjusted)

## Execution

### OBSERVE: Gather Deal Data and Context

**Entry criteria:** At least one deal provided with deal_name, stage, and acv.

**Actions:**
1. Parse all deal data and normalize stages to a standard pipeline (Discovery -> Demo/Evaluation -> Proposal -> Negotiation -> Closed Won/Lost).
2. Load historical benchmarks from state persistence. If no history available, use industry defaults:
   - Discovery: 14 days median, 25% win rate from stage
   - Demo: 10 days median, 40% win rate
   - Proposal: 18 days median, 55% win rate
   - Negotiation: 15 days median, 72% win rate
3. Calculate days since last contact for each deal.
4. Map stakeholders per deal -- identify presence or absence of key roles (champion, economic buyer, technical evaluator).
5. Flag any deals with incomplete data -- missing stakeholder info, no next steps defined, no competitive intel.

**Output:** Normalized deal matrix with computed fields (days since contact, stage velocity ratio, data completeness score).

**Quality gate:** Every deal has at minimum: stage, days_in_stage, acv, last_contact_date. Deals with fewer than these 4 fields are flagged as "insufficient data" and receive a default elevated risk score.

### REASON: Score Risk Factors

**Entry criteria:** Normalized deal matrix with all computed fields available.

**Actions:**
1. Score each deal across 6 risk dimensions (each 0-100, weighted to composite):

   **Velocity Risk (25% weight):**
   - Days in stage / median days for stage = velocity ratio
   - Ratio < 1.0 = 0 risk (ahead of pace)
   - Ratio 1.0-1.5 = 25 risk (slightly behind)
   - Ratio 1.5-2.0 = 60 risk (significantly behind)
   - Ratio > 2.0 = 90 risk (stalled)

   **Engagement Risk (20% weight):**
   - Days since last contact:
   - < 7 days = 0 risk
   - 7-14 days = 30 risk
   - 14-21 days = 60 risk
   - > 21 days = 90 risk ("gone dark")

   **Champion Risk (20% weight):**
   - Strong champion identified and active = 0 risk
   - Champion identified but passive = 40 risk
   - Weak or low-level champion = 60 risk
   - No champion identified = 90 risk

   **Competitive Risk (15% weight):**
   - No competitor identified (verified) = 0 risk
   - Competitor identified, we're leading = 20 risk
   - Competitor identified, position even = 50 risk
   - Competitor identified, we're trailing = 80 risk
   - Strong incumbent or internal build = 85 risk
   - No competitive intel at all = 50 risk (absence of data is not safety)

   **Budget Risk (10% weight):**
   - Budget confirmed and allocated = 0 risk
   - Budget discussed but not confirmed = 30 risk
   - Budget unknown = 60 risk
   - Budget concerns raised = 80 risk

   **Process Risk (10% weight):**
   - Clear next steps defined with dates = 0 risk
   - Next steps defined but vague = 30 risk
   - No next steps defined = 70 risk
   - Deal has regressed to earlier stage = 90 risk

2. Calculate weighted composite risk score per deal.
3. Assign risk tier: 0-24 = low, 25-49 = moderate, 50-74 = elevated, 75-100 = critical.
4. Calculate adjusted probability: `original_probability * (1 - risk_score/100)`.
5. Detect compounding risk: if 3+ dimensions score above 50, escalate the risk tier by one level (multiple simultaneous risks are worse than the sum suggests).
6. Compare current deal state against lost_deal_patterns from historical data -- flag matches.

**Output:** Scored deal array with per-dimension breakdowns, composite scores, tiers, and adjusted probabilities.

**Quality gate:** Every deal has a composite score and risk tier. No dimensions left unscored (use defaults for missing data). All adjusted probabilities are between 0 and 1.

### PLAN: Recommend Save Actions

**Entry criteria:** All deals scored with risk tiers and adjusted probabilities.

**Actions:**
1. For each deal with risk score >= 25 (moderate or above), generate specific save actions based on the highest-scoring risk dimensions:

   | Risk Dimension | Save Action Template |
   |---|---|
   | Velocity | Schedule a "deal acceleration" call with champion. Create mutual action plan with committed dates. If no response, this deal is dying. |
   | Engagement | Execute a "re-engagement" play: call the champion directly (not email). If champion is unreachable, attempt a different stakeholder. After 48 hours of silence, executive outreach. |
   | Champion | Identify and cultivate a new champion. Map the org chart for allies. Multi-thread to 2-3 contacts. If no champion after 2 weeks, deprioritize. |
   | Competitive | Prepare competitive battle card. Schedule trap-setting call to reframe evaluation criteria around your strengths. Request a head-to-head POC if possible. |
   | Budget | Propose a phased implementation or pilot to reduce initial commitment. Build ROI model with conservative assumptions. Introduce financing options if available. |
   | Process | Define concrete next steps with dates in writing. Get mutual agreement on decision timeline. If prospect resists committing to next steps, the deal is not real. |

2. Prioritize actions by: risk score (descending) * deal value (descending) = urgency rank.
3. Assign urgency: critical risk = immediate, elevated = this week, moderate = this month.
4. Generate timeline warnings for deals whose adjusted close date exceeds their projected close date.
5. Identify "zombie deals" -- deals that have been in the same stage for 3x+ the median with no champion and no recent activity. Recommend moving to Lost.

**Output:** Prioritized save action list with urgency, expected impact, and timeline warnings.

**Quality gate:** Every deal with risk score >= 25 has at least one recommended action. Actions are specific to the deal's highest risk dimension (not generic). Timeline warnings are generated for any deal where adjusted velocity suggests the close date will be missed.

### ACT: Deliver Risk Report

**Entry criteria:** All deals scored, save actions generated, forecast adjusted.

**Actions:**
1. Compile risk report with pipeline-level metrics:
   - Pipeline health score: weighted average of (100 - risk_score) across all deals, weighted by ACV
   - Total pipeline vs. risk-adjusted pipeline value
   - Forecast categories: Commit (low risk), Best Case (low + moderate), Upside (all risk-adjusted)
2. Format deal-level scorecards with all risk dimensions, scores, and recommended actions.
3. Compile save action list ordered by urgency and expected impact.
4. Update state persistence:
   - Store current deal snapshots for velocity tracking over time
   - Update historical benchmarks if outcome data is provided
   - Log risk patterns for trend analysis
5. Generate executive summary: top 3 risks to the number, top 3 actions that will most impact the forecast.

**Output:** Complete risk report package with pipeline health, deal scores, save actions, and adjusted forecast.

**Quality gate:** Forecast adjustment is clearly explained (what changed and why). Every critical-risk deal has a specific save action with an owner and deadline. Pipeline health score is calculated and contextualized (improving, stable, or declining vs. prior analysis).

## Exit Criteria

The skill is DONE when:
1. Every deal in the pipeline has a risk score, risk tier, and adjusted probability.
2. Save actions are generated for all deals with risk score >= 25.
3. Forecast adjustment shows original vs. risk-adjusted values with explanation.
4. Pipeline health score is calculated.
5. Executive summary identifies the top 3 risks and top 3 actions.
6. State has been updated with current deal snapshots for trend tracking.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Deal data is incomplete (missing stage or ACV) | **Adjust** -- assign "Unknown" stage and flag for data hygiene, use median ACV from pipeline if available |
| OBSERVE | No historical benchmarks available | **Adjust** -- use industry default benchmarks, note that scoring will improve as historical data accumulates |
| REASON | All deals score as critical risk | **Escalate** -- pipeline may be fundamentally unhealthy. Recommend pipeline generation sprint rather than deal-by-deal saving |
| REASON | Stakeholder data missing for most deals | **Adjust** -- score champion risk at 50 (unknown) for all missing deals, flag as a CRM hygiene issue |
| PLAN | No clear save action for a specific risk pattern | **Escalate** -- flag for sales leadership review, may require strategic intervention beyond standard playbook |
| ACT | State persistence fails | **Skip** -- deliver report without trend data, warn that velocity tracking will restart |

## State Persistence

This skill maintains persistent state across executions:
- **deal_snapshots**: Array of timestamped deal states -- enables velocity tracking and trend detection across multiple analyses
- **historical_benchmarks**: Rolling averages of days-per-stage and win-rate-per-stage from actual outcomes
- **lost_deal_patterns**: Characteristics common to deals that were lost -- used for pattern matching on current deals
- **risk_trends**: Per-deal risk score history -- detects whether deals are improving or deteriorating over time

## Reference

### Risk Score Interpretation Guide

| Score | Tier | Meaning | Action Required |
|---|---|---|---|
| 0-24 | Low | Deal is progressing normally. No intervention needed. | Monitor at normal cadence |
| 25-49 | Moderate | One or two yellow flags. Deal is viable but needs attention. | Review at weekly pipeline meeting |
| 50-74 | Elevated | Multiple yellow or one red flag. Deal is in danger. | Active intervention this week |
| 75-100 | Critical | Multiple red flags or fundamental issues. Deal is likely lost unless immediate action is taken. | Same-day intervention or move to Lost |

### The MEDDPICC Risk Mapping

This skill's risk dimensions map to the MEDDPICC sales qualification framework:

| MEDDPICC Element | Risk Dimension | Signal |
|---|---|---|
| **M**etrics | Budget Risk | Is there a quantified business case? |
| **E**conomic Buyer | Champion Risk | Is the person with budget authority identified and engaged? |
| **D**ecision Criteria | Competitive Risk | Do the evaluation criteria favor us? |
| **D**ecision Process | Process Risk | Is there a defined buying process with a timeline? |
| **P**aper Process | Process Risk | Are legal, procurement, and security reviews planned? |
| **I**dentified Pain | Engagement Risk | Is the pain urgent enough to drive action? |
| **C**hampion | Champion Risk | Is there an internal advocate selling on our behalf? |
| **C**ompetition | Competitive Risk | Who else is in the deal, and what's our position? |

### Velocity Benchmarks by Deal Size

| Deal Size | Avg Cycle (days) | Discovery | Demo | Proposal | Negotiation |
|---|---|---|---|---|---|
| < $25K | 30-45 | 7 | 5 | 10 | 7 |
| $25K-$100K | 60-90 | 14 | 10 | 18 | 15 |
| $100K-$500K | 90-180 | 21 | 21 | 30 | 28 |
| $500K+ | 180-365 | 30 | 30 | 45 | 45 |

Deals exceeding 2x the benchmark for their size category in any stage are at elevated risk.

### Zombie Deal Criteria

A deal is a "zombie" (dead but still in the pipeline) if it meets 3 or more of:
- Days in current stage > 3x median for that stage
- No contact in 21+ days
- No champion identified
- No defined next steps
- No competitive intel gathered
- Close date has been pushed 2+ times

Zombie deals should be removed from the forecast and either reclassified as nurture or moved to Lost. They distort pipeline metrics and waste sales resources.

### Forecast Category Definitions

- **Commit:** Deals you would bet your paycheck on closing this period. Low risk, late stage, strong champion, clear timeline.
- **Best Case:** Commit deals + deals that could close with everything going right. Moderate risk, decent progress.
- **Upside:** All deals risk-adjusted. The mathematical ceiling if every deal progresses according to its adjusted probability.
- **Gap:** The difference between your target and your Commit number. This is how much pipeline generation or deal acceleration you need.

### Compounding Risk Formula

When multiple risk dimensions are elevated simultaneously, the actual risk is higher than the weighted average suggests:

```
If 3+ dimensions score above 50:
  escalation_factor = 1 + (0.1 * (count_of_dimensions_above_50 - 2))
  adjusted_composite = min(100, composite_score * escalation_factor)
```

This reflects the reality that a deal with velocity, engagement, AND champion problems simultaneously is much more dangerous than three deals each with one of those problems.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
