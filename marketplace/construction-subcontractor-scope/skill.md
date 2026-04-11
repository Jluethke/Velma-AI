# Construction Subcontractor Scope

**One-line description:** GC and subcontractor each submit their real scope understanding and exclusions before contract — Claude closes the scope gap and produces a subcontract scope that prevents disputes about who had what covered.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both GC and subcontractor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name.
- `shared_trade_scope` (string, required): Trade being subcontracted. e.g., "Mechanical," "Electrical," "Concrete," "Drywall."

### General Contractor Submits Privately
- `gc_scope_description` (object, required): The scope the GC believes is being assigned to the subcontractor — work included, work excluded, interfaces with other trades.
- `gc_schedule_requirements` (object, required): Start date, milestone dates, completion date, and any phasing requirements.
- `gc_specification_standards` (object, required): Quality standards, materials specifications, and inspection requirements.
- `gc_concerns_about_sub_capacity` (array, required): What concerns do you have about this subcontractor's capacity, experience, or financial stability?
- `gc_what_is_non_negotiable` (array, required): What aspects of the scope, schedule, or quality requirements cannot be modified?

### Subcontractor Submits Privately
- `sub_scope_understanding` (object, required): What do you understand you are being asked to do? Where does your scope start and end?
- `sub_exclusions_required` (array, required): What are you explicitly excluding from your bid? What did you not price?
- `sub_schedule_concerns` (object, required): What concerns do you have about the schedule — start date, duration, sequencing, access to work areas?
- `sub_pricing_assumptions` (object, required): What key assumptions are embedded in your pricing — material costs, labor productivity, access conditions, design completeness?
- `sub_what_was_not_in_their_bid` (array, required): What items are in the GC's scope description that were not included in your bid?

## Outputs
- `scope_gap_analysis` (object): Items in the GC's scope that the subcontractor did not price and items the subcontractor excluded that the GC expects to be included.
- `exclusions_alignment` (object): Which subcontractor exclusions are acceptable vs. which create a gap that must be addressed.
- `schedule_feasibility_assessment` (object): Whether the schedule requirements are achievable given the subcontractor's capacity and the project conditions.
- `pricing_basis_confirmation` (object): The assumptions the subcontractor's pricing is based on, with any assumptions that could change the price identified.
- `subcontract_scope_draft` (string): The agreed scope of work — what is included, what is excluded, and how interface items with other trades are handled.
- `dispute_prevention_checklist` (array): Items that, if left ambiguous, are most likely to become disputes during construction.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm GC's scope description and subcontractor's scope understanding present.
**Output:** Readiness confirmation.
**Quality Gate:** GC scope description and sub's scope understanding both present.

---

### Phase 1: Map the Scope Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare the GC's scope description against the subcontractor's understanding — identify every item where the two descriptions differ. 2. Compare the subcontractor's exclusions against what the GC expects — which exclusions create a gap that neither party would have covered? 3. Identify items the GC considers in-scope that the subcontractor has explicitly excluded from their bid. 4. Identify interface items — work that spans two trades — where ownership is unclear.
**Output:** Scope gap items, exclusion conflicts, GC in-scope vs. sub excluded list, interface ownership gaps.
**Quality Gate:** Every gap is a specific work item — "structural steel connections" not "some interface items."

---

### Phase 2: Assess Schedule and Pricing Risk
**Entry Criteria:** Gaps mapped.
**Actions:** 1. Assess whether the schedule concerns the subcontractor raised are valid given the project conditions and their stated capacity. 2. Identify pricing assumptions that, if wrong, would materially change the subcontract value. 3. Check the GC's concerns about subcontractor capacity against the sub's representation of their resources. 4. Identify which gaps would create change order exposure later if not resolved now.
**Output:** Schedule risk assessment, pricing assumption risk, capacity concern validity, future change order risks.
**Quality Gate:** Every pricing assumption that could change the price has an exposure estimate — "if access is delayed, labor productivity assumption adds $X."

---

### Phase 3: Draft the Subcontract Scope
**Entry Criteria:** Risks assessed.
**Actions:** 1. Draft the scope of work — what is included, what is specifically excluded, and how interfaces are handled. 2. Confirm the schedule milestones the subcontractor is agreeing to. 3. State the pricing basis and any conditions that would trigger a price change. 4. Build the dispute prevention checklist for items most likely to become issues.
**Output:** Subcontract scope draft, schedule confirmation, pricing basis statement, dispute prevention checklist.
**Quality Gate:** Scope draft has no ambiguous language — every item is clearly in, clearly out, or clearly assigned to a specific trade.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Scope drafted.
**Actions:** 1. Present scope gap analysis. 2. Present exclusion alignment. 3. Deliver schedule feasibility assessment. 4. Deliver subcontract scope draft. 5. Present dispute prevention checklist.
**Output:** Full synthesis — scope gaps, exclusion alignment, schedule assessment, scope draft, dispute checklist.
**Quality Gate:** Both parties sign the scope knowing exactly what they are responsible for.

---

## Exit Criteria
Done when: (1) every scope gap identified with specific work items, (2) exclusion conflicts resolved, (3) interface items have ownership, (4) pricing assumptions documented, (5) subcontract scope draft is unambiguous.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
