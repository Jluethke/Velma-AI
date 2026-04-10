# Pricing Model Simulator

Generate and simulate pricing models for products and services by analyzing cost structures, customer segments, and competitive positioning. Project revenue under each model across volume scenarios, compare tradeoffs side-by-side, and recommend optimal pricing with a concrete implementation and migration plan.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INPUTS     --> Product/service details, cost structure, customer segments, competitors
PHASE 2: MODELS     --> Generate pricing models (per-seat, usage, tiered, freemium, enterprise)
PHASE 3: SIMULATE   --> Revenue projection per model x segment x volume scenario
PHASE 4: COMPARE    --> Side-by-side model comparison with tradeoff analysis
PHASE 5: RECOMMEND  --> Optimal pricing with implementation plan and migration strategy
```

## Inputs

- `product_details`: object -- Product features, usage patterns, value delivered per customer segment, current pricing (if any)
- `cost_structure`: object -- Fixed costs (platform, team), variable costs per unit (infrastructure, support, COGS), margin targets
- `customer_segments`: array -- Segments with size, usage profile, willingness-to-pay range, churn sensitivity, competitive alternatives
- `competitor_pricing`: array -- Competitor name, pricing model, price points, positioning, feature comparison
- `volume_assumptions`: object -- Current customer count, growth rate, usage growth, expansion/contraction patterns

## Outputs

- `pricing_models`: array -- 3-5 candidate pricing models with structure, price points, and rationale
- `revenue_projections`: object -- Per-model revenue forecast across segments and volume scenarios
- `model_comparison`: object -- Weighted comparison matrix with tradeoff analysis
- `optimal_recommendation`: object -- Recommended model with justification
- `implementation_plan`: object -- Rollout timeline, migration strategy, communication plan, success metrics

---

## Execution

### Phase 1: INPUTS -- Analyze Product and Market

**Entry criteria:** Product description and at least one customer segment are defined. Cost structure is provided or estimable.

**Actions:**

1. **Identify the value metric:**
   - What unit of value does the customer receive? (seats, data processed, transactions, projects, storage, API calls)
   - Correlation test: which metric best predicts customer satisfaction and retention?
   ```
   Good value metrics:
   - Grow with usage (customer pays more as they get more value)
   - Easy to understand (customer can predict their bill)
   - Hard to game (customer can't artificially reduce usage)
   - Aligned with cost (higher usage = higher cost to serve)
   ```

2. **Map customer segments:**
   ```
   Per segment:
   - Size and count
   - Usage profile (volume of value metric)
   - Current spend (if existing pricing)
   - Willingness to pay (WTP) range
   - Price sensitivity (elastic vs inelastic)
   - Competitive alternatives
   - Cost to serve
   - Strategic importance
   ```

3. **Analyze cost structure:**
   ```
   Fixed costs: platform, engineering, G&A (spread across all customers)
   Variable costs: per customer (support, onboarding)
   Marginal costs: per unit of value metric (compute, storage, bandwidth)
   
   Target gross margin: typically 70-85% for SaaS
   Floor price = variable cost + marginal cost (below this you lose money)
   Ceiling price = value delivered * customer WTP % (above this you lose deals)
   ```

4. **Map competitive landscape:**
   - Position each competitor on a price vs value matrix
   - Identify pricing model patterns in the market (most use per-seat? usage? tiered?)
   - Find white space: price points or models competitors don't offer

**Output:** Value metric recommendation, segment profiles with WTP ranges, cost floors per segment, competitive positioning map.

**Quality gate:** Value metric is identified and justified. At least 2 customer segments are profiled. Cost floor is computed (below which deals are unprofitable).

---

### Phase 2: MODELS -- Generate Pricing Structures

**Entry criteria:** Value metric, segments, and cost structure are analyzed.

**Actions:**

Generate 3-5 pricing models from the standard playbook, customized to the product:

1. **Per-Seat/Per-User Model:**
   ```
   Structure: $X per user per month
   Tiers: Optional volume discounts (1-10, 11-50, 51-200, 200+)
   
   Pros: Simple, predictable revenue, easy to understand
   Cons: Penalizes adoption (customers resist adding seats),
         weak expansion revenue, not correlated with value
   
   Best for: Collaboration tools, CRMs, productivity software
   Avoid for: Data/analytics, infrastructure, API products
   ```

2. **Usage-Based Model:**
   ```
   Structure: $X per unit of value metric (GB, API call, transaction)
   Include: Platform fee (minimum monthly) + usage charges
   
   Pros: Aligns with value, natural expansion, low entry barrier
   Cons: Revenue unpredictable, customer bill anxiety, complex billing
   
   Best for: API products, data platforms, infrastructure, communications
   Avoid for: Products with seasonal usage, low-frequency tools
   ```

3. **Tiered Model:**
   ```
   Structure: 3-4 tiers with increasing features/limits
   Design: Each tier targets a specific segment
   Good/Better/Best or Starter/Pro/Enterprise
   
   Pros: Clear packaging, natural upgrade path, anchoring effect
   Cons: Between-tier gap frustration, feature allocation decisions
   
   Tier design rules:
   - 3-4 tiers (not more). Fewer choices = faster decisions
   - Clear naming that implies progression
   - 10x value jump between tiers, 2-3x price jump
   - Most popular tier should be the middle one (anchoring)
   ```

4. **Freemium Model:**
   ```
   Structure: Free tier (limited) + paid tiers
   Free tier limits: usage cap, feature gate, seat limit, or time limit
   
   Pros: Massive top-of-funnel, product-led growth, low CAC
   Cons: Free users cost money to serve, conversion <5% typical,
         free tier cannibalization risk
   
   Free tier design:
   - Enough value to hook users
   - Clear limitation that paying removes
   - Must NOT let free users do everything they need
   - Track: free-to-paid conversion, time-to-convert, free user cost
   ```

5. **Enterprise/Custom Model:**
   ```
   Structure: Custom pricing per deal, typically annual contracts
   Floor: highest published tier price
   Ceiling: ROI-based (value delivered * capture rate)
   
   Include: volume discounts, SLA, dedicated support, custom features
   Exclude: one-off discounts without justification
   
   Pricing methodology:
   - Value-based: price = customer's ROI * 10-20% capture rate
   - Cost-plus: price = cost to serve * target margin
   - Competitive: price = competitor +/- positioning adjustment
   ```

6. **Hybrid Model (optional):**
   ```
   Structure: Fixed platform fee + variable usage
   Example: $99/month base + $0.05/GB processed
   
   Pros: Revenue floor (predictable) + expansion (usage growth)
   Cons: Complexity in communication and billing
   ```

For each model, define:
- Exact price points
- What's included at each level
- Upgrade triggers (what causes a customer to move to the next level)
- Revenue formula: MRR = f(customers, seats, usage, tier)

**Output:** 3-5 fully specified pricing models with price points, inclusions, and revenue formulas.

**Quality gate:** Each model has specific price points (not just structure). Price points are above cost floor for each segment. At least one model uses the identified value metric.

---

### Phase 3: SIMULATE -- Project Revenue

**Entry criteria:** Pricing models are fully specified.

**Actions:**

1. **Map current customers to each model:**
   ```
   For each customer:
     Current spend = known
     Model X spend = apply pricing formula to customer's usage/seats/segment
     Delta = Model X spend - current spend
   
   Aggregate per segment: total MRR, average ARPU, min/max spread
   ```

2. **Apply price elasticity adjustment:**
   ```
   Price increase > 20%: expect 5-15% churn (segment-dependent)
   Price increase 10-20%: expect 2-5% churn
   Price increase < 10%: expect <2% churn
   Price decrease: expect 0% churn reduction (downward sticky)
   
   Net MRR impact = New MRR - (churn probability * churned customer MRR)
   ```

3. **Project expansion revenue (12 months):**
   ```
   Per model, estimate natural expansion:
   - Seat-based: expansion = user growth rate * seat price
   - Usage-based: expansion = usage growth rate * per-unit price
   - Tiered: expansion = P(tier upgrade) * tier price delta
   
   Net revenue retention = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
   Target: >110% for SMB, >120% for enterprise
   ```

4. **Model new customer acquisition impact:**
   ```
   Entry price affects conversion rate:
   - Lower entry price -> higher conversion, lower ARPU
   - Higher entry price -> lower conversion, higher ARPU
   - Freemium: highest conversion but <5% to paid
   
   Estimate: new customer MRR per model over 12 months
   ```

5. **Run volume scenarios:**
   ```
   Base: current growth continues
   Upside: 2x customer acquisition (pricing unlocks new segment)
   Downside: 50% customer acquisition (pricing deters prospects)
   ```

**Output:** Per-model revenue projections across segments and scenarios, including churn adjustment, expansion revenue, and new customer impact.

**Quality gate:** Every model has revenue projections for at least 2 scenarios. Churn impact is estimated and applied. Expansion revenue is modeled based on the pricing structure's natural expansion mechanics.

---

### Phase 4: COMPARE -- Tradeoff Analysis

**Entry criteria:** Revenue projections are complete for all models.

**Actions:**

1. **Build comparison matrix:**
   ```
   Score each model (1-10) on:
   - Revenue uplift (30% weight): immediate MRR impact vs current
   - Expansion potential (25%): natural expansion mechanics
   - Churn risk (20%): likelihood of customer loss from price change
   - Simplicity (15%): ease of understanding for customers and sales
   - Competitive fit (10%): alignment with market expectations
   
   Weighted score = sum(score * weight)
   ```

2. **Tradeoff narrative per model:**
   ```
   For each model, describe:
   - Best-case scenario: what happens if it works perfectly
   - Worst-case scenario: what happens if it fails
   - Who wins: which segments benefit most
   - Who loses: which segments pay more or leave
   - Sales impact: easier or harder to sell?
   - Operations impact: billing complexity, support load
   ```

3. **Risk assessment:**
   ```
   Migration risk: how disruptive is the change from current pricing
   Competitive risk: does this pricing create an opening for competitors
   Revenue risk: what's the worst-case MRR impact in first 3 months
   Complexity risk: can your billing system handle this model
   ```

4. **Hybrid recommendation opportunities:**
   - Can elements of the top 2 models be combined?
   - Example: Tiered pricing + usage-based add-ons
   - Example: Per-seat base + usage overage charges

**Output:** Weighted comparison matrix, tradeoff narratives, risk assessment, and hybrid possibilities.

**Quality gate:** All models are scored on the same criteria. Tradeoffs are specific to each model (not generic). Risk assessment identifies the single biggest risk per model.

---

### Phase 5: RECOMMEND -- Implementation Plan

**Entry criteria:** Comparison and tradeoff analysis are complete.

**Actions:**

1. **Select optimal model with justification:**
   - Highest weighted score, adjusted for risk tolerance
   - Clear statement: "We recommend [Model X] because [1-2 sentence justification]"
   - Note what was traded off and why it's acceptable

2. **Build implementation timeline:**
   ```
   Phase 1 (Week 1-2): Internal alignment
   - Finalize exact price points, get leadership sign-off
   - Update billing system and invoicing
   - Train sales team on new pricing, positioning, objection handling
   
   Phase 2 (Week 3-4): New customer launch
   - Update website pricing page
   - Update sales decks and proposals
   - New customers on new pricing immediately
   
   Phase 3 (Month 2-3): Existing customer migration
   - Announce change with 60-90 day notice
   - Grandfather existing customers at current rate for 3-6 months
   - Assign CSMs to handle migration conversations for top accounts
   
   Phase 4 (Month 4-6): Full migration
   - Migrate all customers to new pricing
   - Monitor churn weekly during transition
   - Adjust if churn exceeds projected rates
   ```

3. **Design migration strategy for existing customers:**
   ```
   For price increases:
   - Grandfather for 3-6 months (loyalty reward)
   - Offer annual contract lock-in at old price (cash flow benefit)
   - Phase increase: 50% of increase now, 50% in 6 months
   
   For model changes (e.g., seat -> tiered):
   - Map each customer to their "natural" tier
   - Ensure no customer's bill increases >25% at migration
   - Offer 1:1 migration support for enterprise accounts
   ```

4. **Define success metrics and review cadence:**
   ```
   Metrics to track weekly during migration:
   - MRR (total and per segment)
   - Churn rate (vs projected)
   - New customer conversion rate
   - ARPU by segment
   - Expansion revenue rate
   - Customer complaints / support tickets about pricing
   
   Review: weekly for first 3 months, monthly thereafter
   Kill criteria: if MRR drops >10% below projection for 2 consecutive months
   ```

5. **Prepare contingency plan:**
   - If churn exceeds 2x projected: extend grandfather period
   - If new customer conversion drops >30%: adjust entry-level pricing
   - If enterprise pushback: offer custom bridge pricing

**Output:** Recommended pricing model, implementation timeline, migration strategy, success metrics, and contingency plan.

**Quality gate:** Recommendation is justified with specific data. Implementation has a specific timeline with owners. Migration strategy addresses existing customer impact. Success metrics are defined with review cadence and kill criteria.

## Exit Criteria

The skill is DONE when:
- Value metric is identified and justified
- At least 3 pricing models are fully specified with price points
- Revenue projections cover all models across at least 2 scenarios
- Side-by-side comparison is complete with weighted scoring
- Optimal model is recommended with implementation plan, migration strategy, and success metrics

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INPUTS | No current pricing exists (new product) | **Adjust** -- skip migration analysis, focus on initial pricing from cost floor + competitive positioning |
| INPUTS | Customer segment data is incomplete | **Adjust** -- use 2 segments (SMB + Enterprise), estimate WTP from competitive pricing |
| INPUTS | Cost structure unknown | **Adjust** -- estimate from industry averages, flag uncertainty in margin calculations |
| MODELS | Value metric is unclear | **Adjust** -- generate models using both seat-based and usage-based metrics, let simulation reveal which performs better |
| SIMULATE | No usage data for usage-based projections | **Adjust** -- estimate usage distribution from customer size, flag as assumption |
| SIMULATE | Price elasticity unknown | **Adjust** -- use conservative estimates (10% churn for >20% price increase), recommend A/B testing |
| COMPARE | Two models score within 5% of each other | **Adjust** -- recommend the simpler model, note that either could work, suggest A/B testing |
| RECOMMEND | Billing system can't support recommended model | **Escalate** -- recommend billing system upgrade as prerequisite, offer simpler interim pricing |
| RECOMMEND | User rejects final output | **Targeted revision** -- ask which pricing model, scenario, or recommendation fell short and rerun only that simulation. Do not re-run all pricing models. |

## State Persistence

Between runs, this skill saves:
- **Pricing experiments**: A/B test results, pricing changes and their measured impact
- **Customer WTP data**: willingness-to-pay signals from sales conversations, churn reasons, expansion patterns
- **Competitive pricing history**: competitor price changes over time
- **Model performance**: how previous pricing recommendations performed vs projections
- **Segment evolution**: how customer segments and usage patterns change over time

---

## Reference

### Pricing Model Selection Framework

```
Product Type              Recommended Models
----------------------------------------------
Collaboration (Slack)     Per-seat, Freemium + per-seat
CRM (Salesforce)          Per-seat tiered, Enterprise custom
Analytics (Amplitude)     Tiered (event volume), Usage hybrid
Infrastructure (AWS)      Usage-based, Reserved capacity
API (Twilio)              Usage-based (per call/message)
Content/Media (Netflix)   Flat tiered (features/quality)
Marketplace (Shopify)     Platform fee + transaction %
Security (CrowdStrike)    Per-endpoint tiered
DevTools (GitHub)         Freemium + per-seat + usage
Vertical SaaS             Tiered + transaction %
```

### The 10x-3x Rule for Tiers

```
Between tiers:
  Value delivered:  ~10x increase
  Price charged:    ~2-3x increase
  
Example:
  Starter: 100 events/mo, $49/mo
  Pro:     1,000 events/mo (10x), $149/mo (3x)
  Business: 10,000 events/mo (10x), $449/mo (3x)
  
This creates increasing margin at higher tiers (customer perception
of good deal) while capturing more total revenue.
```

### Price Anchoring Psychology

```
1. The Decoy Effect:
   Starter: $29  |  Pro: $79  |  Business: $99
   Business looks like a great deal compared to Pro (only $20 more).
   Most customers choose Business. Pro exists to make Business look good.

2. Charm Pricing:
   $99 feels significantly cheaper than $100 (left-digit effect).
   $9.99 works for consumer. $99 or $499 for B2B.
   Enterprise: use round numbers ($5,000 not $4,999 -- signals premium).

3. Annual Discount Framing:
   "Save 20% with annual billing" vs "$X/mo billed annually"
   Show monthly price (even for annual) -- smaller number feels cheaper.
   
4. Feature Anchoring:
   List the most expensive plan first (on pricing page).
   Customer anchors to high price, middle tier feels reasonable.
```

### Willingness-to-Pay Research Methods

```
1. Van Westendorp Price Sensitivity Meter:
   Ask 4 questions:
   - At what price is this too expensive? (ceiling)
   - At what price is this expensive but still worth it? (high)
   - At what price is this a good deal? (low)
   - At what price is this too cheap to trust? (floor)
   Plot curves -- intersections define optimal price range.

2. Conjoint Analysis:
   Present bundles of features at different prices.
   Statistical analysis reveals feature value and price sensitivity.
   Best for: which features matter for pricing decisions.

3. Customer Interviews:
   "What are you paying for [competitor/alternative] today?"
   "What would you have to stop using if you canceled us?"
   "If we doubled the price, would you still use us?"
   
4. Behavioral Data:
   Trial-to-paid conversion by price point
   Upgrade rates between tiers
   Churn reasons mentioning price
   Competitive losses mentioning price
```

### Revenue Model Formulas

```
Per-seat MRR = Customers * Avg_seats * Price_per_seat
Usage MRR = Customers * Avg_usage * Price_per_unit + Platform_fees
Tiered MRR = sum(Customers_in_tier * Tier_price) for each tier
Freemium MRR = Free_users * Conversion_rate * Avg_paid_ARPU

Net Revenue Retention (NRR):
  NRR = (Start_MRR + Expansion - Contraction - Churn) / Start_MRR
  World class: >130% (Snowflake, Twilio)
  Good: 110-130%
  Okay: 100-110%
  Bad: <100% (losing revenue from existing customers)

Annual Contract Value (ACV):
  ACV = Annual price per customer (or per deal for enterprise)
  <$5K ACV: self-serve, product-led
  $5K-$25K ACV: inside sales
  $25K-$100K ACV: field sales
  >$100K ACV: enterprise sales + solutions engineering
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
