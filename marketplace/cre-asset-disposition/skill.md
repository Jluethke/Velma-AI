# CRE Asset Disposition

**One-line description:** Owner and broker each submit their real pricing expectations and market evidence before going to market — Claude closes the expectation gap, builds the pricing strategy, and produces a disposition plan designed to actually close.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and broker must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_address` (string, required): Property address.
- `shared_asset_type` (string, required): Asset type and brief description.

### Owner / Seller Submits Privately
- `owner_price_expectation` (object, required): What price are you expecting? What is your basis and required return?
- `owner_timeline_requirements` (string, required): When do you need to close? Are there tax, loan, or partnership considerations driving timing?
- `owner_disposition_objectives` (string, required): What does a successful disposition look like — maximum price, certainty of close, speed, specific buyer type?
- `owner_concerns_about_process` (array, required): What worries you about going to market?
- `owner_what_they_will_not_do` (array, required): Terms, conditions, or process steps you are not willing to accept.

### Listing Broker Submits Privately
- `broker_market_reality` (object, required): Honest market assessment — what is the current buyer demand, cap rate environment, and financing conditions for this asset type?
- `broker_comp_evidence` (object, required): Recent closed transactions used to support the pricing recommendation.
- `broker_buyer_pool_assessment` (string, required): Who are the realistic buyers? How deep is the pool?
- `broker_what_maximizes_value` (string, required): What marketing strategy, timing, and deal structure maximizes proceeds?
- `broker_realistic_timeline` (string, required): How long from launch to close given the current market?

## Outputs
- `price_expectation_vs_market_gap` (object): The difference between owner's expectation and broker's market read, with comp evidence.
- `value_maximization_strategy` (object): What approach — pricing, timing, deal structure — produces the best outcome.
- `marketing_plan` (object): Target buyers, marketing channels, offering memorandum requirements, and process structure.
- `buyer_targeting_approach` (object): Specific buyer types, outreach strategy, and how to create competitive tension.
- `pricing_strategy` (object): Launch price, acceptable range, and strategy for managing offers.
- `disposition_timeline` (object): Realistic timeline from launch to close with key milestones.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm owner's price expectation and broker's comp evidence present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's pricing and broker's market comps both present.

---

### Phase 1: Close the Expectation Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare owner's pricing expectation against broker's comp evidence — calculate the gap in price and implied cap rate. 2. Assess whether the gap is bridgeable with the right marketing and buyer pool, or whether the owner's expectation exceeds what the market will support. 3. Identify what drove the owner's pricing expectation — basis recovery, appraised value, comparable seller stories — and assess each against current market conditions. 4. Check timeline requirements against realistic disposition timeline.
**Output:** Pricing gap analysis with comp evidence, expectation driver assessment, timeline feasibility.
**Quality Gate:** Gap is in specific numbers. Owner's expectation driver is named and assessed against market reality.

---

### Phase 2: Build the Value Maximization Strategy
**Entry Criteria:** Gap assessed.
**Actions:** 1. Assess whether timing the launch affects price — are market conditions improving or deteriorating? 2. Identify whether deal structure (assumable debt, seller financing, phased closing) can close the pricing gap. 3. Build the buyer pool — who are the highest bidders for this asset type and how do you reach them? 4. Assess whether a structured process (broad marketing vs. targeted outreach) maximizes competitive tension.
**Output:** Timing assessment, deal structure options, buyer pool definition, process structure recommendation.
**Quality Gate:** Value maximization strategy is specific — "targeting value-add buyers in the $50-100M range through a 4-week accelerated process" not "broad marketing."

---

### Phase 3: Build the Disposition Plan
**Entry Criteria:** Strategy built.
**Actions:** 1. Draft the marketing plan — OM requirements, distribution list, process timeline. 2. Build the pricing strategy: launch price, acceptable range, how to handle low offers. 3. Draft the disposition timeline with milestones. 4. Identify deal risks — title, environmental, lease, or operational issues that could affect execution.
**Output:** Marketing plan, pricing strategy, disposition timeline, deal risk summary.
**Quality Gate:** Launch price is specific and justified by strategy. Timeline has specific milestones.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present pricing gap with comp evidence. 2. Present value maximization strategy. 3. Deliver marketing plan and buyer targeting approach. 4. Deliver pricing strategy. 5. Deliver disposition timeline.
**Output:** Full synthesis — pricing gap, value strategy, marketing plan, pricing strategy, timeline.
**Quality Gate:** Owner understands where their expectation stands relative to market and has a specific plan to test or achieve it.

---

## Exit Criteria
Done when: (1) pricing gap stated in specific dollars and cap rate against comps, (2) expectation driver assessed against market reality, (3) buyer pool specifically defined, (4) launch price and pricing strategy stated, (5) timeline with key milestones.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
