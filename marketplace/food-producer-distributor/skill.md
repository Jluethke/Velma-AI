# Food Producer Distributor Agreement

**One-line description:** A food producer and a distributor each submit their real product capabilities, market requirements, and margin expectations before signing — Claude aligns on a distribution arrangement that gets product to shelf without the margin compression and promotional demands that erode the producer's economics.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both producer and distributor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_producer_and_distributor` (string, required): Food producer/brand name and distribution company name.
- `shared_product_and_geography` (string, required): Product category, SKU count, target geography and channel.

### Producer Submits Privately
- `producer_product_economics` (object, required): Production cost, target selling price, distributor margin you can afford, what you need to make this business work.
- `producer_volume_and_capacity` (object, required): Current production capacity, minimum order quantities, lead times, seasonal production constraints.
- `producer_market_and_sales_requirements` (object, required): Target accounts and channels, what promotional support you can provide, slotting fee tolerance.
- `producer_concerns_about_this_distributor` (array, required): Shelf placement, sales force attention, competitive conflicts, payment terms, deduction history.
- `producer_what_they_will_not_accept` (array, required): Margin levels, promotional demands, or territory terms that make the arrangement unworkable.

### Distributor Submits Privately
- `distributor_market_access` (object, required): Accounts you serve, retail relationship quality, what shelf or menu placement you can actually achieve.
- `distributor_margin_requirements` (object, required): What margin you need to move this product, incentive structures, promotional funding requirements.
- `distributor_operational_requirements` (object, required): Minimum order sizes, delivery frequency, product specifications, shelf life requirements.
- `distributor_concerns_about_this_producer` (array, required): Production reliability, quality consistency, promotional support budget, pricing discipline, competitive conflicts.
- `distributor_what_they_will_not_do` (array, required): Accounts or channels you will not pursue, product modifications you will not accommodate, terms you will not accept.

## Outputs
- `channel_and_market_strategy` (object): Which accounts and channels to target, realistic placement expectations.
- `margin_and_pricing_structure` (object): Pricing to distributor, distributor to retail, full margin stack.
- `volume_and_logistics_terms` (object): Minimum orders, lead times, delivery frequency, shelf life requirements.
- `promotional_and_sales_support_plan` (object): What each party contributes to drive sell-through.
- `performance_and_growth_expectations` (object): Volume targets, growth milestones, what triggers territory or account expansion.
- `distribution_agreement_framework` (object): Key terms for the distribution agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm producer's economics and distributor's margin requirements and market access both present.
**Output:** Readiness confirmation.
**Quality Gate:** Producer's pricing structure and distributor's margin requirements and market access both present.

---

### Phase 1: Assess Economics and Market Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build the margin stack — does this work economically for both parties? 2. Evaluate distributor's market access against producer's target accounts. 3. Assess operational compatibility — lead times, minimums, shelf life. 4. Identify promotional funding gap.
**Output:** Margin stack analysis, market access assessment, operational fit, promotional gap.
**Quality Gate:** Margin stack is specific — producer cost, producer-to-distributor price, distributor-to-retail price, retail margin, consumer price.

---

### Phase 2: Structure the Distribution Arrangement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the territory and channel — what the distributor covers exclusively or non-exclusively. 2. Build the pricing and margin structure. 3. Define promotional and sales support obligations. 4. Establish volume expectations and milestones.
**Output:** Territory definition, pricing structure, promotional plan, volume milestones.
**Quality Gate:** Territory definition is specific — named accounts or geographic boundaries, not category descriptions.

---

### Phase 3: Define Operations and Performance
**Entry Criteria:** Structure built.
**Actions:** 1. Define operational terms — order minimums, lead times, delivery, returns. 2. Build the performance review process — what triggers territory review or termination for non-performance. 3. Define deduction and payment dispute resolution. 4. Assemble the agreement framework.
**Output:** Operational terms, performance review process, dispute resolution, agreement framework.
**Quality Gate:** Performance triggers are specific sales levels by timeframe — not "adequate performance."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — channel strategy, margin stack, operational terms, promotional plan, performance milestones, agreement framework.
**Quality Gate:** Producer knows what their product will cost at shelf and what the distributor commits to deliver. Distributor knows the margin and what support they receive.

---

## Exit Criteria
Done when: (1) territory is defined, (2) full margin stack is modeled, (3) promotional obligations are assigned, (4) operational terms are specific, (5) performance milestones are defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
