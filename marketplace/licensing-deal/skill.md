# Licensing Deal

**One-line description:** IP owner and licensee each submit their real expectations on royalties, usage, and exclusivity — AI assesses feasibility, produces structure options, and drafts opening license agreement language.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both licensor and licensee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_ip_description` (string, required): What IP is being licensed?
- `shared_intended_use` (string, required): What will the licensee use it for?

### Licensor Submits Privately
- `licensor_valuation` (object, required): What do you think the IP is worth? What royalty rate or fee are you expecting?
- `licensor_usage_restrictions` (array, required): What uses are you NOT willing to permit?
- `licensor_royalty_expectations` (object, required): Flat fee, percentage of revenue, minimum guarantees? Timeline and payment cadence?
- `licensor_concerns_about_licensee` (array, required): What are you worried about with this specific licensee?
- `licensor_non_negotiables` (array, required): What terms are off the table?

### Licensee Submits Privately
- `licensee_use_case` (string, required): Specifically how will you use this IP?
- `licensee_revenue_projections` (object, required): What revenue do you expect to generate using this IP?
- `licensee_royalty_capacity` (object, required): What royalty structure are you able to support given your projections?
- `licensee_exclusivity_needs` (string, required): Do you need exclusivity? In what territory or category?
- `licensee_concerns_about_deal` (array, required): What concerns you about this arrangement?

## Outputs
- `deal_feasibility` (string): Whether this deal is structurally viable given both sides' expectations.
- `royalty_structure_options` (array): 2-3 specific royalty structures that could work for both sides with tradeoffs.
- `usage_alignment` (object): Whether the licensee's use case is within the licensor's permitted uses.
- `exclusivity_assessment` (object): Whether exclusivity is warranted and what it would cost.
- `license_agreement_draft` (object): Opening license agreement language covering grant, term, royalties, restrictions, and termination.
- `negotiation_agenda` (array): The 3 items to resolve before signing.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm royalty expectations (licensor) and royalty capacity (licensee) both present.
**Output:** Readiness confirmation.
**Quality Gate:** Royalty fields present from both sides.

---

### Phase 1: Assess Deal Feasibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare licensor's royalty expectation to licensee's stated capacity given their revenue projections. 2. Check whether the licensee's use case is within the licensor's permitted uses. 3. Assess non-negotiable conflicts. 4. Assess exclusivity — does the licensor object? Is the licensee willing to pay for it?
**Output:** Feasibility assessment, usage alignment, royalty gap, exclusivity position.
**Quality Gate:** Feasibility stated directly — viable / viable with adjustments / structurally challenging.

---

### Phase 2: Build Royalty Structure Options
**Entry Criteria:** Feasibility assessed.
**Actions:** 1. Design 2-3 royalty structures that bridge both sides' positions: flat fee / percentage / hybrid with minimum guarantee. 2. Model each structure against the licensee's revenue projections. 3. Assess which structure best protects the licensor's interests while being viable for the licensee. 4. Propose exclusivity pricing if applicable.
**Output:** 3 royalty structure options with modeled outcomes.
**Quality Gate:** Each structure has specific numbers and is modeled against projections.

---

### Phase 3: Draft the Agreement
**Entry Criteria:** Structures built.
**Actions:** 1. Draft the IP grant clause — what's licensed, in what territory, for what purpose. 2. Draft term and renewal. 3. Draft the royalty clause using the recommended structure. 4. Draft usage restrictions explicitly. 5. Draft termination triggers. 6. Note items requiring legal review.
**Output:** License agreement draft covering grant, term, royalties, restrictions, termination.
**Quality Gate:** Usage restrictions are specific enough to enforce.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement drafted.
**Actions:** 1. Present deal feasibility. 2. Present royalty structure options with recommendation. 3. Present usage alignment. 4. Deliver license agreement draft. 5. List negotiation priorities.
**Output:** Full synthesis — feasibility, royalty options, usage map, agreement draft, priorities.
**Quality Gate:** Both sides have a specific starting point for negotiation.

---

## Exit Criteria
Done when: (1) feasibility stated, (2) 3 royalty structures with numbers, (3) usage alignment confirmed or flagged, (4) agreement covers grant, term, royalties, restrictions, termination.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
