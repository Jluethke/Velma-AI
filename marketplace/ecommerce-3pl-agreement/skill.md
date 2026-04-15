# E-Commerce 3PL Agreement

**One-line description:** An e-commerce brand and a third-party logistics provider each submit their real volume projections, service requirements, and cost expectations before signing — AI aligns on a fulfillment partnership that ships orders on time without the hidden fees that destroy unit economics.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both brand and 3PL must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_brand_and_3pl` (string, required): E-commerce brand name and 3PL company name.
- `shared_product_category` (string, required): Product type, SKU count, weight/dimensions, special handling requirements.

### Brand Submits Privately
- `brand_volume_and_growth` (object, required): Current order volume, peak volume, growth trajectory, seasonal patterns — honest projection with uncertainty acknowledged.
- `brand_service_requirements` (object, required): Cut-off times, ship times, carrier requirements, kitting, returns processing, special services.
- `brand_cost_requirements` (object, required): Target fulfillment cost per order, what you currently pay, what you can afford at different margin levels.
- `brand_current_fulfillment_problems` (array, required): What is broken now — accuracy, speed, costs, communication, system integration.
- `brand_concerns_about_this_3pl` (array, required): Capacity for peak season, accuracy rates, damage rates, hidden fees, responsiveness.

### 3PL Submits Privately
- `3pl_capabilities_and_capacity` (object, required): Warehouse locations, capacity, equipment, special handling capabilities, technology stack.
- `3pl_pricing_structure` (object, required): Receiving, storage, pick-and-pack, shipping pass-through, returns, special services — full fee disclosure including minimums.
- `3pl_onboarding_and_integration` (object, required): Onboarding timeline, WMS integration requirements, EDI capabilities, client portal access.
- `3pl_concerns_about_this_brand` (object, required): Volume projections (too low for minimums, too volatile), SKU complexity, return rate, product risk.
- `3pl_what_they_will_not_do` (array, required): Services outside your capabilities, volume below minimums, product categories you do not handle.

## Outputs
- `fulfillment_service_agreement` (object): Services provided, service level standards, exclusions.
- `pricing_and_cost_model` (object): Full fee disclosure — receiving, storage, pick-pack, shipping, returns, minimum commitments.
- `unit_economics_analysis` (object): Fully-loaded fulfillment cost per order at various volume levels.
- `onboarding_and_integration_plan` (object): Onboarding milestones, WMS integration, go-live timeline.
- `performance_standards` (object): Order accuracy, ship time, damage rate — what the brand can hold the 3PL accountable for.
- `agreement_framework` (object): Key terms for the fulfillment services agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm brand's volume projections and 3PL's pricing structure both present.
**Output:** Readiness confirmation.
**Quality Gate:** Volume projections and full fee schedule both present.

---

### Phase 1: Assess Service and Economic Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate brand's service requirements against 3PL's capabilities — any gaps? 2. Build the fully-loaded cost model — all fees at projected volume. 3. Assess volume projections against minimums and capacity. 4. Identify current problem root causes.
**Output:** Service gap analysis, fully-loaded cost model, volume-minimum fit, problem root cause.
**Quality Gate:** Cost model is specific — every fee category with a specific rate and the volume assumption applied.

---

### Phase 2: Structure the Agreement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define services included and excluded. 2. Build the pricing structure with all fee categories. 3. Define service level standards — accuracy, speed, damage rates. 4. Establish the onboarding and integration plan.
**Output:** Service definition, pricing structure, SLA, onboarding plan.
**Quality Gate:** Every SLA metric has a specific target and a specific remedy for non-compliance.

---

### Phase 3: Define Operations and Exit
**Entry Criteria:** Structure built.
**Actions:** 1. Define the operational procedures — receiving, inventory management, returns. 2. Build the communication and escalation process. 3. Define transition assistance — what happens when the relationship ends. 4. Assemble the agreement framework.
**Output:** Operational procedures, escalation process, transition provisions, agreement framework.
**Quality Gate:** Transition provisions define exactly what the 3PL provides to enable the brand to move to another provider.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — service agreement, full pricing, unit economics, SLA, onboarding plan, transition provisions.
**Quality Gate:** Brand knows the true cost per order and what standards to hold the 3PL to. 3PL knows the volume, services required, and what will cause problems.

---

## Exit Criteria
Done when: (1) services are defined with exclusions, (2) full pricing is disclosed, (3) unit economics are modeled at multiple volumes, (4) SLA metrics are specific, (5) onboarding timeline is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
