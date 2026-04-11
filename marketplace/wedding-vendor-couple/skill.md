# Wedding Vendor Couple Engagement

**One-line description:** A wedding vendor and a couple each submit their real vision, budget, and expectations before signing — Claude aligns on a services arrangement that delivers the wedding the couple actually wants within the budget they actually have, without the vendor overpromising and the couple underfunding.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both vendor and couple must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_couple_and_vendor` (string, required): Couple names and vendor name/type (planner, photographer, caterer, florist, venue, entertainment, etc.).
- `shared_event_details` (string, required): Wedding date, location, guest count, and style.

### Vendor Submits Privately
- `vendor_service_offering` (object, required): What you actually provide — specific services, inclusions, what is not included, your creative approach.
- `vendor_pricing_and_packages` (object, required): Full pricing — packages, à la carte, what is included in each, overtime, travel, add-ons.
- `vendor_availability_and_capacity` (object, required): Date availability, team size, what you are committing to on this date.
- `vendor_concerns_about_this_booking` (array, required): Budget vs. expectations, logistical challenges, client communication style, other vendor conflicts.
- `vendor_what_they_will_not_do` (array, required): Services outside your scope, timeline demands you cannot meet, requests you will not accommodate.

### Couple Submits Privately
- `couple_real_vision` (object, required): What you actually want — not the Pinterest board version, but what matters most for this day to feel right.
- `couple_true_budget` (object, required): The actual amount you have to spend on this vendor — not the number you give vendors before negotiating, but the real ceiling.
- `couple_priorities_and_tradeoffs` (object, required): What matters most and what you would cut if the budget required it — ranked honestly.
- `couple_concerns_about_vendors` (array, required): What has gone wrong at other weddings, what you are afraid of, where you feel vendors have disappointed couples you know.
- `couple_what_they_will_not_compromise` (array, required): Elements of your wedding that are non-negotiable regardless of cost.

## Outputs
- `service_scope_alignment` (object): What is included in this engagement and what is not.
- `budget_and_pricing_transparency` (object): Full cost breakdown — package, add-ons, overtime, travel, taxes, gratuity.
- `vision_and_execution_alignment` (object): How the vendor will deliver on what matters most to the couple.
- `timeline_and_logistics_plan` (object): What happens when on the wedding day and in the lead-up.
- `communication_and_revision_process` (object): How decisions are made, how changes are handled, what requires additional fees.
- `contract_framework` (object): Key terms — deposit, payment schedule, cancellation, force majeure, deliverables.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm vendor's pricing and couple's true budget and vision both present.
**Output:** Readiness confirmation.
**Quality Gate:** Vendor's pricing and couple's budget and vision both present.

---

### Phase 1: Assess Vision and Budget Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare couple's vision against what their budget actually buys. 2. Identify the gap between what the couple wants and what the vendor offers. 3. Assess the couple's priority ranking against what can and cannot be accommodated. 4. Identify potential surprise costs.
**Output:** Vision-budget fit, service gap, priority accommodation, surprise cost risk.
**Quality Gate:** Budget gap is specific — what the couple's vision costs vs. their stated budget, with named items and named prices.

---

### Phase 2: Build the Engagement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the service scope — exactly what is included and what is not. 2. Build the full cost breakdown including all potential add-ons. 3. Define the timeline and logistics plan. 4. Establish the communication and revision process.
**Output:** Service scope, full cost breakdown, timeline, communication process.
**Quality Gate:** Full cost breakdown includes every potential additional charge — overtime rates, travel fees, tax, gratuity.

---

### Phase 3: Define the Contract Terms
**Entry Criteria:** Engagement built.
**Actions:** 1. Define the payment schedule — deposit, milestone payments, final payment. 2. Build the cancellation and rescheduling policy. 3. Define the deliverables — for photographers, what files and when; for caterers, final headcount deadline; etc. 4. Assemble the contract framework.
**Output:** Payment schedule, cancellation policy, deliverables definition, contract framework.
**Quality Gate:** Deliverables are specific — for each vendor type, named files, dates, formats, or quantities.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — service scope, full cost, vision alignment, logistics, communication process, contract framework.
**Quality Gate:** Couple knows exactly what they are paying for and what might add cost. Vendor knows the vision, the budget, and what is expected.

---

## Exit Criteria
Done when: (1) service scope is specific, (2) full cost is transparent, (3) vision is aligned with execution, (4) timeline is defined, (5) contract terms are complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
