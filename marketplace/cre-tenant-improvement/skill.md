# CRE Tenant Improvement

**One-line description:** Landlord and tenant each submit their real TI budgets and space requirements before design begins — AI closes the allowance gap, defines who pays for what, and produces a construction framework that prevents disputes mid-build.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both landlord and tenant must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_address` (string, required): Property address.
- `shared_space_description` (string, required): Space being built out — square footage, floor, current condition.

### Landlord Submits Privately
- `landlord_ti_allowance` (object, required): Total TI allowance per square foot and in dollars. What it covers and what it does not.
- `landlord_base_building_specifications` (object, required): What base building systems are in place — HVAC, electrical, plumbing — and what is considered landlord's responsibility.
- `landlord_construction_requirements` (array, required): Approved contractors, design standards, insurance requirements, scheduling restrictions.
- `landlord_what_they_will_not_fund` (array, required): What is explicitly excluded from the TI allowance?
- `landlord_concerns_about_scope_creep` (array, required): What has gone wrong in prior TI projects that you want to avoid?

### Tenant Submits Privately
- `tenant_space_requirements` (object, required): How many workstations, conference rooms, private offices, special-use areas? What density?
- `tenant_design_vision` (object, required): What does the space need to feel like? Any special finishes, technology, or operational requirements?
- `tenant_ti_needs_vs_allowance` (object, required): What is your actual build-out cost estimate? How does it compare to the TI allowance?
- `tenant_timeline_requirements` (string, required): When do you need to be in occupancy? What is the consequence of a delay?
- `tenant_concerns_about_landlord_restrictions` (array, required): What landlord requirements worry you — approved contractors, scheduling, standards?

## Outputs
- `ti_gap_analysis` (object): The gap between TI allowance and actual build-out cost estimate.
- `scope_alignment` (object): What is covered by the TI allowance vs. what the tenant must fund.
- `cost_responsibility_breakdown` (object): Line-by-line who pays for what — landlord work, landlord-funded TI, tenant-funded above-standard.
- `design_approval_process` (object): How design documents get reviewed and approved to avoid surprises.
- `construction_timeline` (object): Realistic construction timeline against occupancy requirement.
- `change_order_protocol` (object): How changes to scope are handled — approval process, cost responsibility, schedule impact.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm TI allowance and tenant's build-out cost estimate present.
**Output:** Readiness confirmation.
**Quality Gate:** TI allowance and tenant cost estimate both present.

---

### Phase 1: Quantify the TI Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Calculate the gap between the TI allowance and the tenant's build-out cost estimate. 2. Identify what is included in landlord's base building vs. what the TI allowance must cover. 3. Check the tenant's design vision against what the TI allowance will actually fund. 4. Identify items the tenant is expecting the landlord to fund that are on the landlord's exclusion list.
**Output:** TI gap in total dollars and per-square-foot, base building vs. TI coverage, exclusion conflicts.
**Quality Gate:** Gap is specific — "$X PSF gap between allowance and tenant's estimate, representing Y total dollars."

---

### Phase 2: Build the Cost Responsibility Framework
**Entry Criteria:** Gap quantified.
**Actions:** 1. Build a line-by-line cost responsibility breakdown — landlord work, landlord-funded TI, above-standard tenant-funded. 2. Identify where landlord's construction requirements (approved contractors, scheduling) will increase tenant's costs. 3. Assess whether the construction timeline is achievable given the occupancy requirement. 4. Identify high-change-order-risk items in the design.
**Output:** Cost responsibility breakdown, contractor/schedule cost impact, timeline feasibility, change order risk items.
**Quality Gate:** Every major scope item has a funding responsibility. Construction requirement cost impacts are estimated.

---

### Phase 3: Build the Construction Framework
**Entry Criteria:** Cost framework built.
**Actions:** 1. Draft the design approval process — design submission milestones, landlord review periods, approval standards. 2. Build the construction timeline with buffer for permitting, landlord review, and contractor lead times. 3. Draft the change order protocol — what requires landlord approval, what timeline and cost transparency is required, who authorizes tenant-funded overages. 4. Draft the punch list and occupancy process.
**Output:** Design approval process, construction timeline, change order protocol, occupancy process.
**Quality Gate:** Design approval process has specific review periods, not "landlord will review within a reasonable time."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Framework built.
**Actions:** 1. Present TI gap analysis. 2. Present cost responsibility breakdown. 3. Deliver construction timeline. 4. Deliver design approval process and change order protocol. 5. State occupancy milestone.
**Output:** Full synthesis — TI gap, cost breakdown, timeline, approval process, change order protocol.
**Quality Gate:** Both sides know exactly who pays for what and what the process is before a contractor is hired.

---

## Exit Criteria
Done when: (1) TI gap stated in specific dollars and PSF, (2) cost responsibility assigned to every major scope item, (3) construction timeline against occupancy requirement, (4) design approval process with specific timelines, (5) change order protocol defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
