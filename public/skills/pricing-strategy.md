# Pricing Strategy

Analyzes cost structures, competitive landscapes, and customer segments to recommend optimal pricing models with margin analysis, sensitivity modeling, and implementation roadmaps that maximize revenue while maintaining competitive positioning.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Gather cost data, competitor prices, customer segments, market positioning
REASON  --> Evaluate pricing models (cost-plus, value-based, competitive, tiered, freemium)
PLAN    --> Design pricing structure with margin analysis, sensitivity scenarios, migration path
ACT     --> Output pricing table, sensitivity analysis, and phased implementation plan
         \                                                                                 /
          +--- If price change data becomes available, loop back to measure impact --------+
```

## Inputs

- **cost_structure**: object -- Cost breakdown:
  - `variable_cost_per_unit`: number -- Direct cost per unit/user/seat
  - `fixed_costs_monthly`: number -- Overhead, salaries, infrastructure
  - `customer_acquisition_cost`: number -- Blended CAC
  - `gross_margin_target`: number (0-1) -- Desired gross margin
- **competitor_prices**: array of objects -- Competitive landscape:
  - `competitor_name`: string
  - `plans`: array of {name: string, price: number, billing: string, features: string[]}
  - `positioning`: string ("budget" | "mid-market" | "premium" | "enterprise")
- **customer_segments**: array of objects -- Who buys and why:
  - `segment_name`: string
  - `size_pct`: number -- Percentage of customer base
  - `current_price`: number (if applicable)
  - `usage_level`: string ("light" | "moderate" | "heavy")
  - `willingness_to_pay`: string ("low" | "medium" | "high")
  - `churn_rate`: number (0-1)
  - `key_value_driver`: string -- What they value most
- **market_position**: object -- Where you sit:
  - `positioning`: string ("budget" | "mid-market" | "premium" | "enterprise")
  - `differentiation`: string[] -- What makes you different
  - `current_pricing`: object (if exists)
  - `revenue_target`: number (optional)

## Outputs

- **pricing_table**: object -- Recommended pricing structure:
  - `model`: string -- Pricing model name
  - `plans`: array of {name, price, billing, features, target_segment, margin}
  - `rationale`: string -- Why this structure
- **sensitivity_analysis**: object -- What-if scenarios:
  - `scenarios`: array of {name, assumptions, projected_revenue, projected_margin, projected_churn}
  - `breakeven_point`: object
  - `elasticity_estimate`: number
- **implementation_plan**: object -- How to roll it out:
  - `phases`: array of {name, timeline, actions, risks, metrics}
  - `migration_strategy`: string -- How to handle existing customers
  - `communication_plan`: string
- **margin_report**: object -- Financial analysis:
  - `per_plan_margins`: array of {plan, revenue, cogs, gross_margin_pct}
  - `blended_margin`: number
  - `ltv_by_plan`: array of {plan, ltv, ltv_cac_ratio}

## Execution

### OBSERVE: Gather Pricing Intelligence

**Entry criteria:** At minimum, cost_structure with variable_cost_per_unit OR competitor_prices with at least 2 competitors.

**Actions:**
1. Parse cost structure and calculate unit economics:
   - Gross margin at current price (if exists): `(price - variable_cost) / price`
   - CAC payback period: `CAC / ((price - variable_cost) * monthly_retention_rate)`
   - LTV: `(price - variable_cost) / churn_rate`
   - LTV:CAC ratio: target >= 3:1 for healthy SaaS, >= 2:1 for consumer
2. Map competitive landscape:
   - Plot competitors on a price-feature matrix
   - Identify pricing gaps (price points no competitor occupies)
   - Identify the market's "price anchor" (the price point most buyers expect)
3. Segment customer base by value extraction:
   - Which segments extract the most value vs. what they pay?
   - Which segments have the highest willingness-to-pay?
   - Which segments churn the most and why? (price sensitivity vs. value gap)
4. Assess market position:
   - Where does the product sit on the price-value spectrum?
   - Is there a mismatch between positioning and pricing?
   - What is the pricing power? (differentiation strength, switching costs, network effects)

**Output:** Unit economics snapshot, competitive price map, segment value matrix, pricing power assessment.

**Quality gate:** Unit economics calculated with at least gross margin and CAC payback. Competitive landscape mapped with at least 2 data points. At least 2 customer segments identified. If data is insufficient for any dimension, flag gaps and proceed with available data.

### REASON: Evaluate Pricing Models

**Entry criteria:** Unit economics, competitive landscape, and segment data available.

**Actions:**
1. Evaluate each pricing model against the business context:

   **Cost-Plus Pricing:**
   - Formula: `variable_cost * (1 + markup_pct)`
   - Best when: commodity product, thin differentiation, cost transparency expected
   - Risk: ignores willingness to pay, leaves money on table for high-value segments

   **Value-Based Pricing:**
   - Formula: price anchored to customer's perceived value / ROI delivered
   - Best when: clear differentiation, measurable customer outcomes, high switching costs
   - Risk: requires understanding of customer economics, hard to communicate

   **Competitive Pricing:**
   - Formula: position relative to competitors (below, at, or above market)
   - Best when: commoditized market, strong competitor awareness, market share play
   - Risk: race to bottom, margin erosion, no differentiation signal

   **Tiered Pricing:**
   - Formula: 3-4 plans targeting distinct segments with feature/usage gating
   - Best when: diverse customer base, clear usage patterns, upsell opportunity
   - Risk: complexity, feature arbitrage, decision paralysis (too many tiers)

   **Freemium:**
   - Formula: free tier with conversion to paid
   - Best when: viral product, low marginal cost, large TAM, product-led growth motion
   - Risk: free users cost money, low conversion (2-5%), free tier cannibalization

   **Usage-Based:**
   - Formula: pay-per-use (API calls, transactions, data volume)
   - Best when: usage scales with customer value, predictable cost curve
   - Risk: revenue unpredictability, customer anxiety about bills, hard to forecast

2. Score each model on: segment fit, margin protection, competitive positioning, implementation complexity, growth alignment.
3. Recommend primary model with justification.
4. Identify the "pricing psychology levers" available:
   - Price anchoring: set a high-priced plan to make the middle plan look reasonable
   - Decoy effect: add a plan that's intentionally less attractive to steer toward the target plan
   - Annual discount: 15-25% off for annual billing (reduces churn, improves cash flow)
   - .99 pricing vs. round numbers (consumer = .99, B2B = round numbers)

**Output:** Model evaluation matrix with scores, recommended model, pricing psychology recommendations.

**Quality gate:** At least 3 models evaluated with pros/cons specific to the business context. Recommended model has a clear rationale tied to segment data and competitive positioning.

### PLAN: Design Pricing Structure

**Entry criteria:** Pricing model selected with justification.

**Actions:**
1. Design the specific pricing table:
   - Define plan names (avoid "Basic" -- it sounds cheap; use "Starter", "Professional", "Business", "Enterprise")
   - Set price points using the competitive gap analysis and willingness-to-pay data
   - Assign features per plan using the value driver mapping from OBSERVE
   - Apply the "10x rule" for plan spacing: each tier should deliver roughly 10x the value perception for roughly 2-3x the price
   - Set the "recommended" plan (where you want most customers) at the 2nd tier

2. Run margin analysis per plan:
   - Revenue per plan at projected mix
   - COGS per plan (variable cost may differ by usage tier)
   - Gross margin per plan
   - Blended gross margin at projected plan mix
   - LTV per plan: `(plan_price - plan_cogs) / plan_churn_rate`
   - LTV:CAC ratio per plan

3. Build sensitivity analysis:
   - **Conservative scenario:** 20% of current customers downgrade, 5% churn on price change
   - **Expected scenario:** 10% downgrade, 15% upgrade, 3% churn
   - **Optimistic scenario:** 5% downgrade, 25% upgrade, 1% churn
   - For each scenario: projected MRR, gross margin, LTV:CAC
   - Price elasticity estimate: `% change in quantity / % change in price`
   - Break-even calculation: at what conversion mix does the new pricing match current revenue?

4. Design migration strategy for existing customers:
   - Grandfather period: 3-6 months at current price
   - Communication approach: frame as "more options" not "price increase"
   - Win-back plan for customers who churn on price change
   - Annual lock-in incentive to accelerate migration

**Output:** Complete pricing table with margins, 3-scenario sensitivity analysis, migration strategy.

**Quality gate:** Pricing table has 2-4 tiers with distinct target segments. Every tier has positive gross margin. Sensitivity analysis includes conservative scenario that doesn't destroy the business. Migration strategy accounts for existing customer retention.

### ACT: Deliver Recommendations

**Entry criteria:** Pricing table, sensitivity analysis, and migration strategy complete.

**Actions:**
1. Compile the pricing recommendation package:
   - Pricing table with plan details, features, and margin analysis
   - Visual pricing page mockup (text description of how to display pricing)
   - Sensitivity analysis with 3 scenarios
   - Implementation roadmap with phases, timelines, and success metrics
2. Generate the implementation plan:
   - Phase 1: Internal alignment (1-2 weeks) -- sales team training, FAQ prep, objection handling
   - Phase 2: Soft launch (2-4 weeks) -- new customers only, measure conversion and plan mix
   - Phase 3: Migration (4-12 weeks) -- grandfather period, communicate changes, monitor churn
   - Phase 4: Optimization (ongoing) -- adjust based on actual plan mix and churn data
3. Define success metrics and monitoring cadence:
   - Week 1: New customer plan distribution (target: <40% on cheapest plan)
   - Month 1: Blended ARPU vs. baseline
   - Month 3: Churn rate per plan vs. pre-change baseline
   - Month 6: LTV:CAC ratio improvement
4. Update state persistence with pricing snapshot for future comparison.

**Output:** Complete pricing recommendation package with implementation plan and success metrics.

**Quality gate:** Implementation plan has concrete phases with timelines. Success metrics are specific and measurable. Communication plan addresses existing customer concerns. At least one risk mitigation per implementation phase.

## Exit Criteria

The skill is DONE when:
1. Pricing table is complete with 2-4 tiers, each with features, price, and margin analysis.
2. Sensitivity analysis covers at least 3 scenarios (conservative, expected, optimistic).
3. Implementation plan has phased rollout with timelines and success metrics.
4. Migration strategy for existing customers is defined.
5. Every recommended price point has margin justification (no plan operates below break-even).

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No cost data available | **Adjust** -- use competitor pricing as anchor, estimate costs from industry benchmarks (SaaS: 20-30% COGS, e-commerce: 40-60% COGS) |
| OBSERVE | No competitor data available | **Adjust** -- use value-based pricing only, note that competitive validation is missing |
| OBSERVE | Customer segments unclear | **Adjust** -- propose hypothetical segments based on typical usage patterns, flag for validation with actual data |
| REASON | All pricing models score similarly | **Adjust** -- default to tiered pricing (most flexible), recommend A/B testing 2 models |
| PLAN | Sensitivity analysis shows all scenarios negative | **Escalate** -- current pricing may be at maximum willingness-to-pay. Recommend value addition before price increase. |
| ACT | Implementation plan conflicts with business constraints | **Adjust** -- offer alternative rollout timeline, flag constraints for business owner decision |

## State Persistence

This skill maintains persistent state across executions:
- **pricing_snapshots**: Historical pricing configurations with dates -- tracks how pricing has evolved
- **competitive_price_history**: Point-in-time competitor price captures -- detects competitive price movements
- **price_change_impacts**: Before/after metrics when price changes are implemented -- builds elasticity model
- **segment_evolution**: How customer segment distribution changes over time -- informs future pricing decisions

## Reference

### Van Westendorp Price Sensitivity Meter

A framework for determining acceptable price ranges by asking four questions:
1. At what price would this be so cheap you'd question its quality? (Too Cheap)
2. At what price is this a bargain? (Cheap / Good Value)
3. At what price is this getting expensive but you'd still consider it? (Expensive / High)
4. At what price is this too expensive to consider? (Too Expensive)

The intersections of these curves define:
- **Point of Marginal Cheapness:** Below this, you lose credibility
- **Point of Marginal Expensiveness:** Above this, you lose customers
- **Optimal Price Point:** Intersection of "too cheap" and "too expensive"
- **Indifference Price Point:** Intersection of "cheap" and "expensive"

### The 10-5-20 Rule for SaaS Pricing

- **10x value:** Your price should be less than 10% of the value you deliver. If your product saves a customer $10K/month, you can charge up to $1K/month.
- **5x gap:** Each pricing tier should deliver at least 5x the value perception gap to justify the price difference. If Starter is $49 and Pro is $149, Pro must feel like 5x more value.
- **20% annual discount:** Offering 20% off for annual billing is the sweet spot -- enough to incentivize commitment without devaluing the product.

### Pricing Psychology Principles

| Principle | Mechanism | Application |
|---|---|---|
| Anchoring | First price seen becomes the reference point | Show the most expensive plan first (or highlight the middle plan with "Most Popular") |
| Decoy Effect | An asymmetrically dominated option makes the target look better | Add a plan that's only slightly cheaper than the recommended plan but has significantly fewer features |
| Loss Aversion | Losing something feels 2x worse than gaining it | Frame downgrades as losing features, not saving money |
| Round Numbers | B2B buyers expect round numbers; B2C responds to .99 | SaaS: $49, $149, $349. Consumer: $9.99, $19.99 |
| Center Stage | People tend to pick the middle option | Design 3 plans and make the middle one the target |

### LTV:CAC Ratio Benchmarks

| Ratio | Interpretation | Action |
|---|---|---|
| < 1:1 | Losing money on every customer | Urgent: reduce CAC or increase price |
| 1:1 - 2:1 | Breaking even to barely profitable | Increase price, reduce churn, or optimize CAC |
| 3:1 | Healthy benchmark for SaaS | Maintain; invest in growth |
| 5:1+ | Potentially under-investing in growth | Consider increasing spend or raising prices |
| > 8:1 | Likely under-pricing or under-investing | Raise prices or invest heavily in acquisition |

### Price Increase Communication Template

When raising prices on existing customers:

```
Subject: Changes to your [Product] plan

Hi [Name],

Over the past [time period], we've added [specific improvements]:
- [Feature/improvement 1]
- [Feature/improvement 2]
- [Feature/improvement 3]

Starting [date], your [Plan Name] plan will be [new price]/month
(currently [old price]/month).

As a valued customer, you can lock in your current rate for
[6/12] months by switching to annual billing before [deadline].

[If applicable: Your current plan and all its features remain
unchanged. This isn't a downgrade -- you keep everything.]

Questions? Reply to this email and I'll personally respond.

[Founder/CEO name]
```

Key principles: lead with value delivered, be specific about what changed, offer a lock-in option, make it personal (from a human, not "the team").

Copyright 2024-present The Wayfinder Trust. All rights reserved.
