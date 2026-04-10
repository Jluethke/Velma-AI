# Company Operator

Continuous operations loop for running a company. Scans all business functions -- revenue, pipeline, cash, team, product, and customers -- identifies what needs attention this week, generates executive briefings with KPI dashboards and risk flags, produces prioritized action items, and delegates deep analysis to specialized business skills.

## Execution Pattern: ORPA Loop

## Inputs
- company_metrics: object -- Core KPIs: MRR/ARR, growth rate, churn rate, CAC, LTV, gross margin, NRR (net revenue retention)
- pipeline_data: object -- Sales pipeline: deals by stage, pipeline value, conversion rates per stage, average deal cycle time
- team_status: object -- Headcount, open roles, capacity utilization, morale indicators, recent hires/departures
- product_metrics: object -- Feature adoption, bug count, uptime, release velocity, user engagement metrics
- customer_feedback: array -- NPS/CSAT scores, support ticket trends, churn reasons, feature requests, win/loss analysis
- financial_data: object -- Cash balance, monthly burn rate, runway (months), revenue vs budget variance, unit economics

## Outputs
- executive_briefing: object -- One-page summary of company state with RAG (red/amber/green) status per function
- action_items: array -- Top 3-5 prioritized actions for this week with owners, deadlines, and expected impact
- kpi_dashboard: object -- All tracked KPIs with current value, trend (up/down/flat), target, and variance
- risk_flags: array -- Early warning indicators with severity, potential impact, and recommended response
- delegation_plan: object -- Which issues should be routed to specialized skills for deeper analysis

## Execution

### OBSERVE: Scan Company State
**Entry criteria:** At least financial_data and one other input category provided.
**Actions:**
1. Collect and normalize all available data into a unified company snapshot:
   - **Revenue health:** MRR, MRR growth rate (month-over-month), ARR run rate, revenue vs plan variance
   - **Customer health:** Churn rate (logo and revenue), NRR, NPS trend, support ticket volume and resolution time
   - **Pipeline health:** Total pipeline value, pipeline coverage ratio (pipeline / revenue target), conversion rates by stage, deal velocity
   - **Cash health:** Cash balance, monthly burn, runway (months), path to profitability date
   - **Team health:** Headcount vs plan, attrition rate, open roles x time-to-fill, team satisfaction/morale signals
   - **Product health:** Uptime, bug backlog size/severity, feature ship rate, user engagement (DAU/MAU ratio)
2. For each function, assign RAG status:
   - **GREEN:** Metrics on or above target. No action needed.
   - **AMBER:** Metrics trending in wrong direction or slightly below target. Watch closely, may need intervention.
   - **RED:** Metrics significantly below target or in acute crisis. Requires immediate attention.
3. Calculate derived metrics:
   - **Burn multiple:** Net burn / net new ARR. Measures efficiency of growth spend. Target: <2x. Red: >3x.
   - **Quick ratio:** (New MRR + expansion MRR) / (churned MRR + contraction MRR). Target: >4. Red: <2.
   - **Magic number:** Net new ARR / sales & marketing spend. Measures go-to-market efficiency. Target: >0.75. Red: <0.5.
   - **Rule of 40:** Revenue growth rate (%) + profit margin (%). Target: >40%. Benchmark for SaaS health.
   - **Months to default alive:** At current trajectory, when does revenue exceed burn? (Infinite if never.)
4. Compare to last period: what changed? Which metrics improved, declined, or stayed flat?

**Output:** Company snapshot with all metrics, RAG status per function, derived metrics, period-over-period comparison.
**Quality gate:** Every function has a RAG status with supporting data. At least one derived metric is calculated. Period-over-period comparison identifies changes. No function is assessed without data (mark as "DATA UNAVAILABLE" rather than guessing).

### REASON: Identify What Needs Attention
**Entry criteria:** Company snapshot complete.
**Actions:**
1. Triage RED items by impact:
   - **Revenue-threatening:** Issues that directly reduce revenue (churn spike, pipeline collapse, pricing complaints)
   - **Existential:** Issues that threaten company survival (runway < 6 months, key person dependency, regulatory violation)
   - **Growth-limiting:** Issues that cap future growth (product quality, hiring pipeline, market positioning)
2. Classify AMBER items by trajectory:
   - **Trending to RED:** Getting worse. Needs intervention now before it becomes critical.
   - **Stable AMBER:** Below target but not getting worse. Monitor but don't panic.
   - **Recovering:** Was worse, now improving. Stay the course.
3. Apply the "one thing" test for each RED/AMBER issue:
   - What is the single most likely root cause?
   - What is the single most impactful action to address it?
   - Who is the right person to own it?
   - What does "fixed" look like (measurable outcome)?
4. Detect inter-function dependencies:
   - Churn spiking + NPS dropping -> customer satisfaction issue. Check: product quality? Support response time? Pricing?
   - Pipeline up but revenue flat -> conversion problem. Check: sales execution? Pricing? Product-market fit for new segments?
   - Engineering velocity down + bug count up -> tech debt or team issue. Check: attrition? Morale? Technical complexity?
5. Determine which issues need deep analysis from specialized skills:
   - Revenue/churn issues -> route to kpi-anomaly-detector or deal-risk-analyzer
   - Cash/runway concerns -> route to runway-calculator
   - Competitive pressure -> route to competitor-teardown
   - Team capacity issues -> internal assessment (no skill needed, management judgment)

**Output:** Prioritized issue list with root cause hypotheses, one-action recommendations, owner assignments, skill delegation map.
**Quality gate:** Issues are ranked by impact (revenue-threatening > existential > growth-limiting). Each issue has a root cause hypothesis (not just "churn is high" but "churn is high because [hypothesis]"). At least one issue has a delegation to a specialized skill.

### PLAN: Generate Action Plan
**Entry criteria:** Issues prioritized with root cause hypotheses.
**Actions:**
1. Select the Top 3 issues to address this week:
   - Maximum 3 priorities. More than 3 means nothing is truly prioritized.
   - Each must have: description, root cause, specific action, owner, deadline, success metric.
   - The "so what" test: if we fix this, what measurable business outcome changes?
2. Build the executive briefing:
   - **Section 1: Headline** -- One sentence: "Company is [growing/stable/at risk]. Key issue: [primary concern]."
   - **Section 2: Scorecard** -- RAG status for each function (Revenue, Customers, Pipeline, Cash, Team, Product) with one-line rationale.
   - **Section 3: Top 3 Priorities** -- What, why, who, by when.
   - **Section 4: KPI Dashboard** -- All tracked metrics with current, target, trend.
   - **Section 5: Risk Flags** -- Early warnings that haven't become problems yet but need monitoring.
   - **Section 6: Wins** -- What went well this period. Don't skip this -- it matters for morale and perspective.
3. Build the KPI dashboard:
   - For each KPI: name, current value, previous value, target, variance (%), trend arrow, RAG status
   - Group by function (Revenue, Customer, Pipeline, Financial, Team, Product)
   - Highlight any KPI that moved >20% period-over-period (positive or negative)
4. Identify risk flags (leading indicators of future problems):
   - Pipeline coverage dropping but revenue still fine -> future revenue at risk
   - Employee engagement declining but no attrition yet -> future attrition wave
   - Feature adoption flat for new releases -> product-market fit drift
   - Support ticket volume increasing -> product quality or onboarding problem
   - Biggest customer reducing usage -> potential high-value churn

**Output:** Top 3 action items with owners and deadlines, executive briefing, KPI dashboard, risk flags.
**Quality gate:** Exactly 3-5 action items (not 10). Each action has an owner, deadline, and measurable success metric. Executive briefing fits on one page. KPI dashboard includes trend data. At least 2 risk flags identified.

### ACT: Deliver and Delegate
**Entry criteria:** Briefing and action plan complete.
**Actions:**
1. Deliver the executive briefing package:
   - Executive briefing (for the operator/CEO)
   - Action items with delegation (for the team)
   - KPI dashboard (for board/investors if applicable)
   - Risk flags with recommended monitoring cadence
2. Delegate to specialized skills:
   - Issue requires deep financial analysis -> invoke runway-calculator with current financial data
   - Issue requires churn analysis -> invoke kpi-anomaly-detector with customer metrics
   - Issue requires competitive response -> invoke competitor-teardown with competitor data
   - Issue requires deal analysis -> invoke deal-risk-analyzer with pipeline data
3. On re-entry (weekly ORPA cycle):
   - Check: were last week's action items completed?
   - Check: did the actions produce the expected results?
   - Update: refresh all metrics with new data
   - Adjust: if actions didn't work, diagnose why and revise approach
   - Track velocity: is the company getting better at execution over time?
4. Record the company's operational rhythm:
   - What issues keep recurring? (Symptom of structural problem, not tactical issue.)
   - What actions consistently work? (Build these into processes.)
   - What surprises occurred? (Improve leading indicators to catch these earlier.)

**Output:** Complete briefing package, delegation instructions, follow-up tracking from previous cycle.
**Quality gate:** Briefing is delivered in a format ready for distribution. Delegations include specific inputs for each skill. Follow-up on previous actions is explicit (not "we'll check later" but "Action X from last week: [status]").

## Exit Criteria
Company Operator is a continuous loop running weekly (or bi-weekly for smaller companies). Each cycle completes when the executive briefing, action items, KPI dashboard, and risk flags are delivered. The loop exits only when the company is sold, shut down, or the operator chooses to stop.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Critical data missing (no revenue numbers) | Abort for that function -- deliver partial briefing with "REVENUE: DATA UNAVAILABLE" flag. Prioritize getting data collection in place |
| OBSERVE | Data is stale (last updated 3+ weeks ago) | Adjust -- use available data but flag staleness. Action item: update data collection |
| REASON | Everything is RED (company in crisis) | Adjust -- focus exclusively on the one issue that, if unsolved, kills the company fastest. Usually: cash/runway. Everything else is secondary |
| REASON | Everything is GREEN (company running smoothly) | Adjust -- shift focus from firefighting to strategic planning. What opportunities should we pursue? What experiments should we run? |
| PLAN | Too many issues to address (>10 RED/AMBER items) | Adjust -- force-rank by revenue impact. Top 3 only. The rest wait. Trying to fix everything fixes nothing |
| ACT | Previous action items were not completed | Escalate -- understand why. Ownership unclear? Actions too big? Team overwhelmed? This is a management signal, not just a tracking issue |
| ACT | Operator rejects the briefing or disputes specific KPI interpretations or action items | **Adjust** -- incorporate specific feedback (e.g., a RAG status is wrong due to missing context, an action item owner is incorrect, a risk flag is a known false positive), update the affected section, and regenerate the briefing; do not restart the full ORPA cycle unless the underlying metric data has changed |

## Reference

### SaaS Metrics Framework
The essential metrics for a SaaS company, grouped by function:

**Revenue:**
| Metric | Definition | Good | Watch | Danger |
|---|---|---|---|---|
| MRR | Monthly recurring revenue | Growing >10% MoM | 5-10% MoM | <5% or declining |
| ARR | Annual recurring revenue (MRR x 12) | >$1M for Series A readiness | | <$100K |
| Net Revenue Retention | (Starting MRR + expansion - churn - contraction) / Starting MRR | >110% | 90-110% | <90% |
| Gross Margin | (Revenue - COGS) / Revenue | >75% | 60-75% | <60% |

**Customers:**
| Metric | Definition | Good | Watch | Danger |
|---|---|---|---|---|
| Logo Churn | % of customers lost per month | <2% | 2-5% | >5% |
| Revenue Churn | % of MRR lost per month | <1% | 1-3% | >3% |
| NPS | Net Promoter Score (-100 to 100) | >50 | 20-50 | <20 |
| Support ticket volume | Tickets per 100 customers per month | <10 | 10-25 | >25 |

**Pipeline:**
| Metric | Definition | Good | Watch | Danger |
|---|---|---|---|---|
| Pipeline coverage | Pipeline value / revenue target | >3x | 2-3x | <2x |
| Win rate | Deals won / deals created | >25% | 15-25% | <15% |
| Average deal cycle | Days from opportunity to close | <45 days | 45-90 | >90 |

**Financial:**
| Metric | Definition | Good | Watch | Danger |
|---|---|---|---|---|
| Runway | Cash / monthly burn (months) | >18 | 12-18 | <12 |
| Burn multiple | Net burn / net new ARR | <1.5x | 1.5-2.5x | >2.5x |
| CAC payback | Months to recover acquisition cost | <12 | 12-18 | >18 |
| Rule of 40 | Growth rate % + profit margin % | >40 | 20-40 | <20 |

### Triage Framework for Multiple Crises
When everything is on fire, use this priority order:
1. **Cash:** If runway < 6 months, nothing else matters. Fix cash first.
2. **Revenue:** If revenue is declining, stop the decline before pursuing growth.
3. **Churn:** Keeping customers is cheaper than acquiring new ones. Fix retention before acquisition.
4. **Pipeline:** If pipeline is empty, future revenue is at risk even if current revenue is fine.
5. **Team:** If the team is burning out or leaving, all other fixes are temporary.
6. **Product:** If the product is broken, no amount of sales/marketing will help.
7. **Growth:** Only optimize growth when 1-6 are stable.

### Leading vs. Lagging Indicators
- **Lagging indicators** tell you what already happened: revenue, churn, profit. By the time they're bad, it's late.
- **Leading indicators** predict what will happen: pipeline, NPS, engagement, support tickets, employee satisfaction.
- Company Operator should spend 60% of attention on leading indicators and 40% on lagging. Most operators do the opposite.

### The Weekly Operating Cadence
Recommended weekly rhythm for the operator:
- **Monday:** Review metrics, generate executive briefing, set top 3 priorities
- **Tuesday-Thursday:** Execute on priorities, hold 1:1s with direct reports
- **Friday:** Review progress on action items, update risk flags, prepare for next week
- **Monthly:** Deep review of all metrics, board update, strategic planning
- **Quarterly:** Strategy refresh, goal setting, organizational assessment

### Sub-Skill Delegation Map
```
Company Operator (master)
  |
  +-- kpi-anomaly-detector: Deep analysis when a KPI moves unexpectedly
  |     Trigger: any KPI changes >20% period-over-period
  |
  +-- runway-calculator: Detailed cash flow modeling
  |     Trigger: runway drops below 18 months or cash position changes significantly
  |
  +-- competitor-teardown: When competitive pressure is identified
  |     Trigger: lost deals cite competitor, or competitor launches overlapping feature
  |
  +-- deal-risk-analyzer: Pipeline quality assessment
        Trigger: pipeline coverage drops below 3x or win rate declines
```

### State Persistence
Company Operator maintains a company knowledge base tracking:
- All KPIs over time (weekly snapshots) for trend analysis
- Action item history: what was prioritized, who owned it, was it completed, did it have the expected impact
- Risk flag history: which flags became real problems, which were false alarms (calibrates future alerting)
- Operational velocity: is the company getting faster or slower at addressing issues
- Recurring themes: issues that keep coming back (signals structural problems vs tactical ones)
- Board/investor update history: what was reported, what actually happened (accountability)
