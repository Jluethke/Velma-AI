# Expense Optimizer

Systematically categorize company expenses, benchmark spend ratios against industry standards, identify redundancies and cost overruns, produce a prioritized savings plan ranked by impact and effort, and track savings realization over time.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CATEGORIZE --> Ingest expenses, auto-categorize (SaaS, personnel, infra, marketing)
PHASE 2: BENCHMARK  --> Compare spend ratios against industry benchmarks
PHASE 3: IDENTIFY   --> Find redundancies, unused subscriptions, cost overruns
PHASE 4: RECOMMEND  --> Prioritize savings opportunities by impact x effort
PHASE 5: TRACK      --> Monitor savings realization over time
```

## Inputs

- `expense_data`: object -- Line-item expense data with amounts, categories, vendors, dates, and descriptions. Monthly or quarterly granularity minimum
- `revenue_data`: object -- Revenue figures for the same period(s), to compute spend ratios
- `industry_benchmarks`: object -- (Optional) Custom benchmarks. If not provided, skill uses built-in benchmarks by company stage and industry
- `contract_details`: object -- (Optional) SaaS contracts, renewal dates, terms, and license counts for subscription optimization

## Outputs

- `categorized_expenses`: object -- Expenses organized by category hierarchy with totals and percentages of revenue
- `benchmark_comparison`: object -- Per-category comparison to industry benchmarks with status (above/below/on-target)
- `savings_opportunities`: array -- Identified savings ranked by annual value, effort, and confidence
- `optimization_plan`: object -- Prioritized action plan with owners, timelines, and expected impact
- `savings_tracker`: object -- Monthly tracking template comparing actual savings to targets

---

## Execution

### Phase 1: CATEGORIZE

**Entry criteria:** Expense data with at least 3 months of history is provided. Revenue data for the same period is available.

**Actions:**

1. **Parse and normalize expenses:**
   - Extract vendor, amount, date, and description from each line item
   - Convert all amounts to monthly equivalents for comparability
   - Handle annual payments: divide by 12, flag as committed spend

2. **Auto-categorize into standard taxonomy:**
   ```
   Personnel:     Salaries, benefits, payroll taxes, contractors, recruiting
   SaaS & Tools:  Software subscriptions, licenses, API costs
   Infrastructure: Cloud computing, hosting, CDN, data storage, monitoring
   Marketing:     Advertising, events, content, agencies, sponsorships
   Sales:         Travel, entertainment, commissions, sales tools
   Office:        Rent, utilities, supplies, equipment, furniture
   Professional:  Legal, accounting, consulting, advisory
   Insurance:     D&O, E&O, general liability, cyber
   Other:         Uncategorized, one-time, misc
   ```

3. **Compute spend ratios:**
   - Each category as percentage of total revenue
   - Each category as percentage of total expenses
   - Per-employee cost for personnel categories
   - Per-seat cost for SaaS tools

4. **Build expense baseline:**
   - 3-month rolling average per category (smooths one-time spikes)
   - Month-over-month trend per category
   - Flag categories with >10% MoM growth

**Output:** Categorized expense breakdown with totals, percentages, per-unit costs, and trend flags.

**Quality gate:** At least 90% of expense line items are categorized (not "Other"). Revenue ratio totals are internally consistent. All amounts are positive and plausible.

---

### Phase 2: BENCHMARK

**Entry criteria:** Categorized expense breakdown is complete.

**Actions:**

1. **Select appropriate benchmark set:**
   - By company stage: Seed, Series A, Series B, Series C+, Growth, Public
   - By industry: SaaS, E-commerce, Marketplace, FinTech, HealthTech, Hardware
   - By headcount band: <20, 20-50, 50-150, 150-500, 500+

2. **Compare each category to benchmark ranges:**
   ```
   Status:
     SIGNIFICANTLY ABOVE: > 1.5x benchmark upper bound
     ABOVE:               > benchmark upper bound
     ON TARGET:           within benchmark range
     BELOW:               < benchmark lower bound
     SIGNIFICANTLY BELOW: < 0.5x benchmark lower bound
   ```

3. **Compute benchmark gaps:**
   - For each ABOVE category: calculate dollar amount to bring to benchmark median
   - For each BELOW category: note if this represents underinvestment risk

4. **Contextual adjustment:**
   - High-growth companies should spend more on sales & marketing (40-60% of revenue)
   - Capital-efficient companies should spend less on G&A (<12% of revenue)
   - Remote-first companies should have lower office but may have higher tools spend
   - AI/ML companies will have higher infrastructure costs

**Output:** Benchmark comparison table with status per category, dollar gap to median, and contextual notes.

**Quality gate:** Every category has a benchmark comparison. Benchmark source is identified. Contextual adjustments are noted where applicable.

---

### Phase 3: IDENTIFY

**Entry criteria:** Benchmark comparison is complete, showing which categories are above benchmark.

**Actions:**

1. **SaaS redundancy scan:**
   - Group tools by function (project management, communication, CRM, etc.)
   - Flag categories with 2+ tools serving same function
   - Check license utilization: purchased seats vs active users (>30% unused = flag)
   - Identify tools with <5 active users (candidates for elimination)
   - Check for free-tier alternatives for low-usage tools

2. **Infrastructure optimization scan:**
   - Right-sizing: flag instances/resources with <30% average utilization
   - Reserved vs on-demand: flag predictable workloads running on-demand pricing
   - Storage optimization: flag data stores without lifecycle policies
   - Idle resources: flag resources with zero traffic for >30 days
   - Multi-cloud redundancy: flag overlapping services across providers

3. **Personnel efficiency scan:**
   - Revenue per employee vs benchmark
   - Manager-to-IC ratio (benchmark: 1:6 to 1:8)
   - Contractor premium: flag contractors costing >1.5x equivalent FTE
   - Role overlap: flag similar job titles across departments

4. **Contract and procurement scan:**
   - Month-to-month vs annual pricing (annual typically 15-20% cheaper)
   - Upcoming renewals in next 90 days (negotiation opportunities)
   - Auto-renewal clauses approaching deadline
   - Volume discount eligibility (combine seats across tools from same vendor)

5. **Cost drift detection:**
   - Categories growing faster than revenue for 3+ months
   - One-time expenses that became recurring
   - Vendor price increases absorbed without review

**Output:** List of savings opportunities, each with: description, current cost, estimated savings, confidence level (high/medium/low), effort to implement (low/medium/high).

**Quality gate:** At least 3 savings opportunities identified. Each opportunity has a specific dollar estimate (not "some savings"). Confidence level is justified.

---

### Phase 4: RECOMMEND

**Entry criteria:** Savings opportunities list is complete.

**Actions:**

1. **Score each opportunity using Impact x Effort matrix:**
   ```
   Score = (Annual Savings / $10K) * Confidence * (1 / Effort_Factor)
   
   Effort_Factor:
     Low effort (< 1 week, no dependencies):    1.0
     Medium effort (1-4 weeks, some deps):       2.0
     High effort (> 4 weeks, many deps):         4.0
   
   Confidence:
     High (verified data, clear path):           1.0
     Medium (estimated, some uncertainty):        0.7
     Low (rough estimate, significant risk):      0.4
   ```

2. **Prioritize into tiers:**
   - **DO NOW** (Score > 5): High impact, low effort. Execute this week
   - **QUICK WINS** (Score 2-5): Medium impact, low-medium effort. Execute this month
   - **PLAN** (Score 1-2): High impact but high effort. Plan for next quarter
   - **DEFER** (Score < 1): Low impact or high effort. Review in 6 months

3. **Build implementation plan per opportunity:**
   - Owner: who is responsible
   - Timeline: specific start and end dates
   - Dependencies: what needs to happen first
   - Risk: what could go wrong (vendor lock-in, team impact, service disruption)
   - Verification: how to confirm savings were realized

4. **Calculate cumulative impact:**
   - Total annual savings by tier
   - Impact on burn rate and runway extension
   - Monthly savings ramp (when each opportunity starts delivering)

**Output:** Prioritized optimization plan with implementation details, cumulative savings timeline, and runway impact.

**Quality gate:** Opportunities are ranked by score, not just gut feel. Each has an owner and timeline. Cumulative savings are calculated. Runway impact is quantified.

---

### Phase 5: TRACK

**Entry criteria:** Optimization plan is approved and implementation has begun.

**Actions:**

1. **Establish tracking framework:**
   - Monthly baseline per category (pre-optimization spend)
   - Expected savings per month per opportunity (ramp schedule)
   - Actual savings: baseline minus current spend, per category

2. **Monthly review template:**
   ```
   Category         Baseline    Current    Savings    Target    Variance
   SaaS & Tools      $45K       $38K       $7K        $8K       -$1K
   Infrastructure    $55K       $47K       $8K       $10K       -$2K
   ...
   TOTAL            $667K      $641K      $26K       $28K       -$2K
   ```

3. **Cost drift monitoring:**
   - Flag any category that increases >5% MoM without approved budget change
   - Flag new vendors or subscriptions added since last review
   - Alert on auto-renewals triggering in next 30 days

4. **Quarterly re-benchmark:**
   - Re-run benchmark comparison with updated spend data
   - Identify new optimization opportunities as company scales
   - Adjust benchmarks if company stage changed (e.g., raised new round)

5. **Savings realization report:**
   - Cumulative savings vs target
   - Savings rate (% of identified savings actually captured)
   - Opportunities still pending implementation
   - New opportunities identified since initial analysis

**Output:** Monthly savings tracker, cost drift alerts, quarterly benchmark update, cumulative realization report.

**Quality gate:** Actual savings are measured against baseline (not estimated). Cost drift is detected within 1 month. Savings realization rate is computed and reported.

## Exit Criteria

The skill is DONE when:
- All expenses are categorized with <10% in "Other"
- Benchmark comparison is complete for all categories
- At least 3 savings opportunities are identified with specific dollar estimates
- Optimization plan is prioritized with owners, timelines, and expected impact
- Tracking framework is established with baseline and monthly review template

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CATEGORIZE | Expense data is incomplete (<3 months) | **Adjust** -- use available data, note reduced baseline reliability |
| CATEGORIZE | Line items lack descriptions for categorization | **Adjust** -- categorize by vendor name, flag ambiguous items for manual review |
| BENCHMARK | Company doesn't fit standard benchmark categories | **Adjust** -- use closest benchmark, note deviation and adjust ranges by 20% |
| BENCHMARK | Revenue data unavailable | **Adjust** -- use headcount-based benchmarks (cost per employee) instead of revenue ratios |
| IDENTIFY | No SaaS contract details available | **Adjust** -- skip license utilization analysis, focus on category-level benchmarking |
| IDENTIFY | Cannot assess resource utilization (no metrics) | **Escalate** -- recommend implementing monitoring as a prerequisite |
| RECOMMEND | All opportunities are high-effort | **Adjust** -- break into smaller increments, identify partial implementations |
| TRACK | Baseline spend changes due to business growth | **Adjust** -- normalize savings to per-employee or per-revenue-dollar basis |
| TRACK | User rejects final output | **Targeted revision** -- ask which expense category, savings opportunity, or benchmark comparison fell short and rerun only that section. Do not re-analyze the full expense profile. |

## State Persistence

Between runs, this skill saves:
- **Expense baseline**: monthly spend per category at the time of initial analysis
- **Savings pipeline**: identified opportunities with status (pending, in-progress, realized, abandoned)
- **Realized savings**: cumulative actual savings measured against baseline
- **Cost drift alerts**: categories flagged for growth, with timestamps
- **Benchmark history**: previous benchmark comparisons for trend analysis

---

## Reference

### Industry Benchmark Ranges (SaaS)

```
Category          Seed      Series A   Series B    Series C+    Public
--------------------------------------------------------------------------
Personnel/Rev     80-95%    70-85%     65-75%      55-70%       45-60%
  R&D/Rev         40-60%    35-50%     30-40%      25-35%       15-25%
  Sales/Rev       15-30%    18-30%     20-28%      22-30%       20-28%
  Marketing/Rev    5-15%     8-18%     10-20%      12-20%       10-18%
  G&A/Rev         10-20%     8-15%      8-12%       6-10%        5-9%
  
SaaS Tools/Rev     5-12%     5-10%      4-8%        3-6%        2-5%
Infra/Rev          5-15%     5-12%      4-8%        3-7%        2-5%
Office/Rev         2-8%      2-6%       2-4%        1-3%        1-3%
Travel/Rev         1-5%      1-4%       1-3%        1-3%        1-2%
Professional/Rev   2-5%      1-4%       1-3%        1-2%        0.5-1.5%

Note: High-growth companies (>100% YoY) typically run 20-30% above
these ranges as they invest ahead of revenue.
```

### SaaS Tool Overlap Matrix

```
Function              Common Redundancies
-----------------------------------------------
Project Mgmt          Jira + Asana + Linear + Monday + Trello
Communication         Slack + Teams + Discord
Docs/Wiki             Notion + Confluence + Google Docs + Coda
Design                Figma + Sketch + Adobe XD
CRM                   Salesforce + HubSpot + Pipedrive
Email Marketing       Mailchimp + SendGrid + Customer.io + Intercom
Analytics             Amplitude + Mixpanel + Heap + GA4
Monitoring            Datadog + New Relic + Grafana + PagerDuty
CI/CD                 GitHub Actions + CircleCI + Jenkins
Error Tracking        Sentry + Bugsnag + Rollbar

Rule: 1 tool per function. Max 2 if there's a genuine segment
difference (e.g., engineering uses Linear, product uses Jira).
```

### Cost Optimization Formulas

```
Burn Multiple = Net Burn / Net New ARR
  < 1x: excellent efficiency
  1-2x: good
  2-3x: needs attention
  > 3x: burning too fast

Revenue per Employee = ARR / Headcount
  Benchmark: $150K-$300K for SaaS (varies by stage)
  Top quartile: > $300K

CAC Payback = CAC / (ARPU * Gross Margin)
  Benchmark: < 18 months for SaaS
  
Magic Number = Net New ARR / Prior Quarter S&M Spend
  > 1.0: efficient, increase S&M spend
  0.5-1.0: normal
  < 0.5: inefficient S&M, optimize before scaling

Infrastructure Cost Ratio = Cloud Spend / Revenue
  < 5%: efficient
  5-10%: normal for early stage
  > 15%: optimization needed

SaaS Spend per Employee = Total SaaS / Headcount
  Benchmark: $2,500 - $5,000/year per employee
  > $6,000: redundancy likely
```

### Negotiation Playbook

```
1. Annual vs Monthly: Ask for 15-25% discount for annual commitment
2. Multi-year: 25-40% discount for 2-3 year deals (only if sure you'll use it)
3. Volume bundling: Combine seats across tools from same vendor family
4. Competitive leverage: "We're evaluating [competitor]" -- works best at renewal
5. Prepayment: Some vendors offer 5-10% for upfront annual payment
6. Right-size timing: Reduce seats 30 days before renewal, not during
7. Startup programs: AWS Activate, GCP for Startups, Azure for Startups -- free credits
8. Usage-based: Switch to usage pricing if you're paying for capacity you don't use
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
