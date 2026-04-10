# Runway Calculator

Calculate cash runway under multiple scenarios by establishing financial baselines, projecting burn rate and revenue forward, running sensitivity analysis on key variables, flagging danger zones, and recommending actions to extend runway and optimize fundraising timing.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BASELINE    --> Current cash, monthly burn, revenue, growth rate
PHASE 2: MODEL       --> Project runway under scenarios (base, optimistic, pessimistic)
PHASE 3: SENSITIVITY --> What-if analysis (hire 3 people, lose biggest client, raise prices 20%)
PHASE 4: ALERTS      --> Flag danger zones (runway < 6 months, burn acceleration)
PHASE 5: RECOMMEND   --> Actions to extend runway, fundraising timing, cut priorities
```

## Inputs

- `financial_data`: object -- Cash balance, monthly revenue (MRR/ARR), monthly expenses by category, gross margin, customer count, ARPU, churn rate
- `growth_assumptions`: object -- Revenue growth rate (MoM/QoQ), expense growth rate, hiring plan, expected customer growth
- `scenario_parameters`: object -- Variables to model: optimistic/pessimistic growth rates, specific events (new hire batches, client loss, price changes)
- `fundraising_context`: object -- (Optional) Current round stage, target raise, expected timeline, investor pipeline status

## Outputs

- `runway_projection`: object -- Month-by-month cash forecast under each scenario with cash-zero date and break-even date
- `scenario_analysis`: object -- Side-by-side comparison of base/optimistic/pessimistic scenarios with key differences highlighted
- `sensitivity_table`: object -- Impact of each variable change on runway (single and multi-variable)
- `alert_flags`: array -- Danger zone alerts with severity, threshold crossed, and recommended response
- `action_plan`: array -- Prioritized recommendations for runway extension, fundraising timing, and contingency plans

---

## Execution

### Phase 1: BASELINE

**Entry criteria:** Cash balance, monthly revenue, and monthly expenses are provided with at least 3 months of history.

**Actions:**

1. **Compute current burn metrics:**
   ```
   Gross burn = Total monthly expenses
   Net burn = Gross burn - Monthly revenue
   Simple runway = Cash balance / Net burn (months)
   Gross margin = (Revenue - COGS) / Revenue
   ```

2. **Compute unit economics:**
   ```
   ARPU = MRR / Customer count
   CAC = (Sales + Marketing spend) / New customers acquired
   LTV = ARPU * Gross margin / Monthly churn rate
   LTV:CAC ratio = LTV / CAC (target: > 3:1)
   CAC payback = CAC / (ARPU * Gross margin) (months)
   ```

3. **Compute efficiency metrics:**
   ```
   Burn multiple = Net burn / Net new ARR
     < 1x: best-in-class
     1-2x: efficient
     2-4x: acceptable for early stage
     > 4x: inefficient, needs attention
   
   Revenue per employee = ARR / Headcount
   Net revenue retention = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
   ```

4. **Establish trends:**
   - Revenue growth rate (MoM and trailing 3-month average)
   - Expense growth rate (MoM and trailing 3-month average)
   - Burn rate trend (accelerating, stable, decelerating)
   - Churn trend (improving, stable, worsening)

5. **Validate data consistency:**
   - Cash balance change should roughly equal net burn over period
   - Revenue should equal customer count * ARPU (within 5%)
   - Expenses should be complete (personnel + infra + tools + other ~ total)

**Output:** Baseline financial snapshot with all metrics computed, trends identified, and data validated.

**Quality gate:** Cash balance, revenue, and expenses are internally consistent (within 5% tolerance). At least 3 months of trend data is available. Unit economics are computable.

---

### Phase 2: MODEL

**Entry criteria:** Baseline metrics are computed and validated.

**Actions:**

1. **Build base case projection (month-by-month for 24 months):**
   ```
   For each month t:
     Revenue_t = Revenue_{t-1} * (1 + revenue_growth_rate)
     Expenses_t = Expenses_{t-1} * (1 + expense_growth_rate) + step_costs
     Net_burn_t = Expenses_t - Revenue_t
     Cash_t = Cash_{t-1} - Net_burn_t
   
   Step costs: planned hires, known contract changes, one-time expenses
   ```

2. **Build optimistic scenario:**
   - Revenue growth rate: base rate * 1.33 (or user-specified)
   - Expense growth: base rate * 1.15 (growth requires some investment)
   - Lower churn: base churn * 0.7
   - Higher expansion revenue: base expansion * 1.5

3. **Build pessimistic scenario:**
   - Revenue growth rate: base rate * 0.5 (or 0%)
   - Expense growth: base rate (expenses are sticky)
   - Higher churn: base churn * 1.5
   - Loss of top customer(s)

4. **Calculate key milestones per scenario:**
   ```
   Cash-zero date: first month where Cash_t <= 0
   Break-even date: first month where Revenue_t >= Expenses_t
   Default alive/dead: if revenue trend reaches expenses before cash hits zero
   Fundraising start: cash-zero date minus 9 months (minimum time to raise)
   ```

5. **Compute probability-weighted expected runway:**
   ```
   Expected runway = P(base) * base_runway + P(optimistic) * opt_runway + P(pessimistic) * pess_runway
   Default weights: P(base)=0.50, P(optimistic)=0.25, P(pessimistic)=0.25
   ```

**Output:** Month-by-month projections for all scenarios, key milestone dates, and probability-weighted expected runway.

**Quality gate:** All three scenarios produce complete 24-month projections. Cash-zero dates are identified for each scenario. Break-even feasibility is assessed.

---

### Phase 3: SENSITIVITY

**Entry criteria:** Scenario projections are complete.

**Actions:**

1. **Single-variable sensitivity analysis:**
   For each key variable, compute runway impact of a meaningful change:
   ```
   Variables to test:
   - Revenue growth rate: -5%, -2%, base, +2%, +5% MoM
   - New hires: 0, 3, 5, 10 engineers (at average cost)
   - Customer loss: lose top 1, top 3, top 5 customers
   - Price change: -20%, -10%, base, +10%, +20%
   - Churn rate: 0.5x, base, 1.5x, 2x
   - Infrastructure costs: -30%, base, +30%
   - Gross margin: -10pts, -5pts, base, +5pts
   ```

2. **Two-variable sensitivity table:**
   Cross the two highest-impact variables (typically revenue growth x hiring pace):
   ```
   Runway matrix showing months remaining for each combination
   Highlight cells where runway < 12 months (danger zone)
   ```

3. **Break-even sensitivity:**
   ```
   What revenue growth rate is needed to reach break-even before cash-zero?
   What expense level needs to be maintained to reach break-even at current growth?
   What's the minimum viable revenue to sustain the business indefinitely?
   ```

4. **Monte Carlo simulation (if requested):**
   ```
   Run 1000 iterations with:
   - Revenue growth: normal distribution around base rate, std = 2%
   - Churn: uniform distribution between 0.5x and 1.5x base
   - Expenses: normal distribution around base, std = 5%
   
   Output: P(runway > 12mo), P(runway > 18mo), P(break-even before cash-zero)
   Confidence intervals: 5th percentile, median, 95th percentile runway
   ```

**Output:** Sensitivity tables (single and multi-variable), break-even requirements, and optionally Monte Carlo probability distributions.

**Quality gate:** At least 5 variables are tested. The two highest-impact variables are identified. Danger zone combinations (runway < 12 months) are highlighted.

---

### Phase 4: ALERTS

**Entry criteria:** Sensitivity analysis is complete.

**Actions:**

1. **Evaluate against alert thresholds:**
   ```
   CRITICAL (red):
   - Runway < 6 months in base case
   - Burn rate accelerating for 3+ consecutive months
   - Cash dropped >20% in a single month
   - Pessimistic scenario: runway < 3 months
   
   WARNING (yellow):
   - Runway < 12 months in base case
   - Burn multiple > 5x
   - LTV:CAC < 1.5:1
   - Revenue growth decelerating for 3+ months
   - Actual cash tracking >10% below base case projection
   
   CAUTION (amber):
   - Runway < 18 months in base case
   - Burn multiple > 3x
   - Pessimistic scenario never reaches break-even
   - CAC payback > 18 months
   
   INFO (blue):
   - Fundraising window approaching (9-12 months before cash-zero)
   - Break-even date is within projection period
   - Key metric crossed a positive threshold
   ```

2. **Generate alert messages:**
   Each alert includes: severity, what threshold was crossed, current value vs threshold, implication, and recommended immediate action.

3. **Trend alerts:**
   - Is burn rate accelerating or decelerating vs 3 months ago?
   - Is revenue growth accelerating or decelerating?
   - Is the gap between actuals and projections widening?

**Output:** Prioritized alert list with severity, descriptions, and recommended immediate responses.

**Quality gate:** Every alert references a specific metric and threshold. At least one forward-looking alert (fundraising timing or trajectory warning) is included.

---

### Phase 5: RECOMMEND

**Entry criteria:** Alerts and full analysis are complete.

**Actions:**

1. **Runway extension strategies (prioritized):**
   ```
   Revenue-side:
   - Increase prices (fastest impact, test with new customers first)
   - Accelerate expansion revenue (upsell existing customers)
   - Shorten sales cycle (reduce time-to-close by improving qualification)
   - Reduce churn (often higher ROI than new customer acquisition)
   
   Cost-side:
   - Hiring freeze (non-critical roles)
   - Renegotiate vendor contracts (see expense-optimizer skill)
   - Infrastructure right-sizing
   - Cut discretionary spend (events, travel, perks)
   - Last resort: layoffs (plan in advance, execute once, cut deep enough)
   ```

2. **Fundraising timing recommendation:**
   ```
   Start fundraising when runway = MAX(9 months, time_to_close_round + 3 months buffer)
   
   Typical fundraising timeline:
   - Preparation: 1-2 months (deck, data room, model)
   - Meetings: 2-3 months (first meeting to term sheet)
   - Closing: 1-2 months (due diligence, legal, wire)
   - Total: 4-7 months
   - Buffer: add 3 months for delays
   
   Recommendation: start at (cash-zero date - 9 months) minimum
   ```

3. **Contingency plan (Plan B):**
   - If growth drops to pessimistic: what costs to cut, in what order
   - Identify $X in "cuttable spend" that could extend runway by Y months
   - Bridge round terms: SAFE, convertible note, or inside round from existing investors
   - Default alive threshold: what monthly revenue makes the company self-sustaining

4. **Actuals tracking cadence:**
   - Monthly: compare actual cash, revenue, expenses to base case projection
   - If actual cash < projection by >5% for 2 consecutive months: trigger review
   - If actual revenue growth < projected growth by >3 points for 2 months: trigger Plan B review
   - Quarterly: re-run full runway model with updated actuals

**Output:** Prioritized action plan with specific recommendations, fundraising timeline, contingency plan, and tracking cadence.

**Quality gate:** Recommendations are specific to the company's situation (not generic advice). Fundraising start date is computed. Plan B exists with specific cost-cut targets. Tracking cadence is defined.

## Exit Criteria

The skill is DONE when:
- Baseline metrics (burn rate, unit economics, efficiency) are computed
- Three scenario projections are complete with cash-zero and break-even dates
- Sensitivity analysis covers at least 5 variables with impact quantified
- Danger zone alerts are generated for all threshold breaches
- Action plan includes runway extension strategies, fundraising timing, and contingency plan

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| BASELINE | Missing unit economics data (no customer count or churn) | **Adjust** -- compute runway without unit economics, flag gap |
| BASELINE | <3 months history | **Adjust** -- use available data, widen confidence intervals, note unreliable trends |
| BASELINE | Revenue is zero (pre-revenue) | **Adjust** -- use gross burn only, model revenue start date as a variable |
| MODEL | Expense growth rate unknown | **Adjust** -- model three expense growth rates (0%, 3%, 5%) as sub-scenarios |
| MODEL | Step costs not specified (future hires unclear) | **Adjust** -- model with and without a standard hiring plan |
| SENSITIVITY | Too many variables requested | **Adjust** -- prioritize top 5 by expected impact, note others in appendix |
| ALERTS | Actuals tracking data unavailable | **Adjust** -- skip actuals-vs-projection alerts, recommend establishing tracking |
| RECOMMEND | Company is already in danger zone (<6 months) | **Escalate** -- prioritize immediate cost cuts and emergency fundraising over optimization |
| RECOMMEND | User rejects final output | **Targeted revision** -- ask which scenario, expense projection, or runway recommendation fell short and rerun only that section. Do not rebuild the full financial model. |

## State Persistence

Between runs, this skill saves:
- **Projections history**: previous runway projections with timestamps (to track accuracy)
- **Actuals vs projected**: monthly comparison of actual cash/revenue/expenses to each scenario
- **Alert history**: previous alerts and outcomes (resolved, escalated, still active)
- **Fundraising milestones**: timeline markers for when to start preparation, meetings, etc.
- **Baseline snapshots**: financial baselines at each run for trend comparison

---

## Reference

### Core Formulas

```
BURN RATE:
  Gross burn = Total monthly operating expenses
  Net burn = Gross burn - Monthly revenue
  Gross runway = Cash / Gross burn (worst case: revenue goes to zero)
  Net runway = Cash / Net burn (assumes revenue continues)

UNIT ECONOMICS:
  ARPU (Average Revenue Per User) = MRR / Customer count
  CAC (Customer Acquisition Cost) = (Sales + Marketing spend) / New customers
  LTV (Lifetime Value) = ARPU * Gross margin / Monthly churn rate
  LTV:CAC ratio: >3:1 healthy, >5:1 excellent, <1:1 unsustainable
  CAC Payback = CAC / (ARPU * Gross margin) in months. Target: <18 months

EFFICIENCY:
  Burn multiple = Net burn / Net new ARR. <2x = efficient
  Rule of 40: Revenue growth % + Profit margin % > 40 = healthy
  Magic number = Net new ARR (quarterly) / Prior quarter S&M spend. >0.75 = efficient
  Hype ratio = Enterprise value / ARR. Context-dependent but >40x = frothy
```

### Default Alive vs Default Dead

```
Paul Graham's framework:
  If revenue growth rate stays constant and expenses stay constant,
  does revenue eventually exceed expenses before cash runs out?
  
  YES = Default alive (business reaches profitability organically)
  NO  = Default dead (needs fundraising or cost cuts to survive)
  
Calculation:
  Project: Revenue_t = Revenue_0 * (1 + g)^t
  Find t where Revenue_t = Expenses (break-even month)
  If Cash_0 - sum(Net_burn_1..t) > 0: DEFAULT ALIVE
  Else: DEFAULT DEAD

Most startups post-seed are default dead.
This is not necessarily bad -- it means the plan depends on raising capital.
What matters is whether you KNOW this and plan accordingly.
```

### Fundraising Timeline Benchmarks

```
Stage        Typical Raise    Time to Close    Start At
-----------------------------------------------------------
Pre-seed     $500K-$2M        2-4 months       12+ months runway
Seed         $2M-$5M          3-6 months       12+ months runway
Series A     $5M-$15M         4-7 months       9-12 months runway
Series B     $15M-$40M        3-6 months       9-12 months runway
Series C+    $40M+            3-6 months       9-12 months runway
Bridge/Note  $500K-$3M        2-4 weeks        emergency (6 mo)

Warning: these are MEDIAN timelines. Plan for the 75th percentile.
In tight markets (2022-2023 style), add 50% to these timelines.
```

### Scenario Modeling Best Practices

```
1. Base case = your operating plan. This is what you actually expect.
2. Optimistic = everything goes right. Not fantasy -- plausible upside.
3. Pessimistic = specific bad events. Not doomsday -- plausible downside.

Common pessimistic events to model:
- Revenue growth drops to 50% of base case
- Top 3 customers churn simultaneously
- Key hire doesn't work out (delay + severance + re-hire)
- Market downturn: sales cycle doubles
- Product delay: 3-month slip on key feature
- Regulatory change: compliance cost

The pessimistic scenario should answer:
"If things go wrong, can we survive long enough to fix it?"
If the answer is no, you need either more cash or a Plan B.
```

### Runway Extension Playbook

```
IMMEDIATE IMPACT (this month):
- Freeze discretionary hiring
- Cancel unused SaaS subscriptions
- Pause conference/travel budget
- Impact: typically saves 5-10% of burn

SHORT-TERM (1-3 months):
- Renegotiate vendor contracts
- Right-size cloud infrastructure
- Convert contractors to FTEs (or eliminate)
- Adjust marketing spend to highest-ROI channels only
- Impact: typically saves 10-20% of burn

MEDIUM-TERM (3-6 months):
- Reduce headcount (if necessary, do it ONCE and cut deep enough)
- Restructure compensation (salary + equity mix)
- Sublease excess office space
- Eliminate non-core product lines
- Impact: can save 20-40% of burn

REVENUE-SIDE (1-6 months):
- Price increase (10-20%, grandfather existing for 3-6 months)
- Annual prepayment discounts (improves cash flow timing)
- Upsell/expansion campaigns to existing customers
- Shorten sales cycle (better qualification, faster POC)
- Impact: highly variable, but often overlooked
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
