# Venue Event Promoter Agreement

**One-line description:** A venue and a promoter each submit their real financial requirements, risk tolerance, and operational expectations before signing — AI aligns on a deal structure that fills the room, protects the venue, and gives the promoter enough upside to make it worth the risk.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both venue and promoter must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_event_and_venue` (string, required): Event name, date, venue name, and capacity.
- `shared_event_type` (string, required): Concert, comedy show, conference, festival, private event, residency, or other.

### Venue Submits Privately
- `venue_financial_requirements` (object, required): Rental fee, minimum guarantee, door deal structure, bar/F&B requirements, production cost responsibilities.
- `venue_operational_requirements` (object, required): Load-in/out schedule, staffing requirements, production standards, vendor restrictions.
- `venue_risk_and_liability_position` (object, required): Insurance requirements, security standards, what happens if attendance falls short.
- `venue_concerns_about_this_promoter` (array, required): Promotion track record, financial stability, past show problems, ticket sales reliability.
- `venue_what_they_will_not_allow` (array, required): Production restrictions, competing venues, exclusivity terms, content restrictions.

### Promoter Submits Privately
- `promoter_financial_model` (object, required): Expected ticket revenue, production budget, marketing spend, what makes this show profitable at various attendance levels.
- `promoter_deal_structure_requirements` (object, required): What deal structure you need — flat rental vs. percentage vs. co-promotion, guarantee vs. versus deal.
- `promoter_production_plan` (object, required): Production requirements, talent rider, stage setup, technical needs.
- `promoter_concerns_about_this_venue` (array, required): Capacity risk, production limitations, bar revenue split, staffing quality, competing events.
- `promoter_what_they_will_not_accept` (array, required): Deal terms, production restrictions, or venue requirements that make the show unworkable.

## Outputs
- `deal_structure` (object): Financial terms — rental, versus deal, guarantee, bar split, production cost allocation.
- `break_even_analysis` (object): What attendance level the promoter needs to cover costs and generate profit.
- `production_and_operational_plan` (object): Load-in schedule, technical requirements, staffing, vendor coordination.
- `risk_allocation` (object): Who bears what risk — weather, low attendance, production failures, cancellation.
- `marketing_and_promotion_obligations` (object): Who does what marketing, timeline, ticket platform, box office requirements.
- `venue_agreement_framework` (object): Key terms for the venue rental agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm venue's financial requirements and promoter's financial model both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' financial terms and operational requirements present.

---

### Phase 1: Assess Economic and Operational Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare venue's financial requirements against the promoter's financial model — does this show work economically? 2. Assess production requirements against venue's capabilities. 3. Evaluate risk distribution — who bears what exposure? 4. Identify hard conflicts in operational requirements.
**Output:** Economic viability assessment, production fit, risk map, operational conflicts.
**Quality Gate:** Break-even attendance is a specific number at specific ticket prices — not a range.

---

### Phase 2: Structure the Deal
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the deal structure — rental fee, versus deal structure, guarantee, bar split. 2. Build the production cost allocation — what the venue provides, what the promoter brings. 3. Define the marketing and promotion plan — who does what and when. 4. Establish the risk allocation — cancellation, low attendance, production failure.
**Output:** Deal structure, production cost allocation, marketing plan, risk allocation.
**Quality Gate:** Every financial term is a specific dollar amount or percentage. Bar split is defined by revenue tier.

---

### Phase 3: Define Operations and Contingencies
**Entry Criteria:** Deal structured.
**Actions:** 1. Build the day-of-show operational plan — load-in, soundcheck, doors, show, load-out. 2. Define contingency provisions — weather, artist cancellation, force majeure. 3. Define ticket settlement procedures — when, how, who is present. 4. Assemble the venue agreement framework.
**Output:** Operational plan, contingency provisions, settlement procedures, agreement framework.
**Quality Gate:** Contingency provisions address cancellation economics specifically — who owes what if the show cancels and why.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — deal structure, break-even analysis, production plan, risk allocation, marketing obligations, operational plan.
**Quality Gate:** Promoter knows their economics at multiple attendance scenarios. Venue knows their guaranteed income and exposure.

---

## Exit Criteria
Done when: (1) deal structure is fully defined, (2) break-even analysis is complete, (3) production obligations are assigned, (4) risk allocation is specific, (5) operational plan is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
