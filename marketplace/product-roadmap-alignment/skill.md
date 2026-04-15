# Product Roadmap Alignment

**One-line description:** PM and engineering lead each submit their real business commitments and technical constraints — AI maps the conflicts between what must ship and what can realistically be built, and produces a negotiated roadmap both sides can defend.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both PM and engineering lead must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_product_name` (string, required): Product or feature area name.
- `shared_planning_period` (string, required): e.g., "Q3 2026."

### PM Submits Privately
- `pm_strategic_priorities` (array, required): What does the business need this product to do this period?
- `pm_customer_commitments` (array, required): What have you promised customers or put on the roadmap externally?
- `pm_stakeholder_pressures` (object, required): What are leadership, sales, and customers pushing for?
- `pm_what_must_ship` (array, required): What is absolutely non-negotiable this period?

### Engineering Lead Submits Privately
- `eng_capacity` (object, required): What is the team's real available capacity this period? Account for support, tech debt, and ramp time.
- `eng_technical_debt_reality` (object, required): What debt will affect velocity this period? What will break if not addressed?
- `eng_feasibility_concerns` (array, required): What on the PM's roadmap isn't achievable in the stated timeline? Why?
- `eng_what_will_break_if_rushed` (array, required): What specifically goes wrong if these are rushed to ship?
- `eng_what_they_need_to_build_well` (array, required): What conditions, decisions, or resources does the team need?

## Outputs
- `roadmap_conflicts` (array): Specific conflicts between PM's must-ships and engineering's capacity or feasibility constraints.
- `capacity_alignment` (object): What can realistically be built this period at current capacity.
- `technical_risk_map` (array): What breaks, degrades, or creates future problems if the PM's roadmap ships as-is.
- `negotiated_roadmap` (array): A phased roadmap both sides can commit to, with clear tradeoff rationale.
- `tradeoff_decisions` (array): Explicit decisions that need to be made, with options and implications.
- `stakeholder_communication_draft` (string): How to communicate the roadmap and tradeoffs to stakeholders.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm `pm_what_must_ship`, `eng_capacity`, and `eng_feasibility_concerns` present.
**Output:** Readiness confirmation.
**Quality Gate:** Must-ships and capacity both present.

---

### Phase 1: Map Conflicts
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check each must-ship item against engineering's feasibility concerns. 2. Identify items the engineer says are not achievable in the stated timeline. 3. Identify items that risk quality or technical stability if shipped as-is. 4. Quantify the capacity gap.
**Output:** Conflict map with specific must-ships flagged as risky or infeasible.
**Quality Gate:** Every must-ship has a feasibility assessment.

---

### Phase 2: Model the Tradeoffs
**Entry Criteria:** Conflicts mapped.
**Actions:** 1. For each conflict, model the tradeoffs: ship on time with risk vs. delay vs. descope. 2. Assess technical debt implications of rushing vs. slowing. 3. Identify which commitments can be renegotiated and which cannot.
**Output:** Tradeoff models for each conflict, renegotiability assessment.
**Quality Gate:** Technical risk is stated specifically — not "code quality issues" but "payment service will not handle load above 1K concurrent users."

---

### Phase 3: Draft the Negotiated Roadmap
**Entry Criteria:** Tradeoffs modeled.
**Actions:** 1. Build a phased roadmap: committed (high confidence), targeted (medium confidence), aspirational. 2. Sequence based on dependencies, risk, and business value. 3. Draft tradeoff decisions for stakeholder alignment. 4. Draft stakeholder communication for the adjusted roadmap.
**Output:** Phased roadmap, tradeoff decisions, stakeholder communication draft.
**Quality Gate:** Committed items are achievable given stated capacity. Every deferral has a rationale.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Roadmap drafted.
**Actions:** 1. Present roadmap conflicts. 2. Present capacity reality check. 3. Present technical risk map. 4. Deliver negotiated roadmap. 5. Deliver tradeoff decisions. 6. Deliver stakeholder communication draft.
**Output:** Full synthesis — conflicts, capacity, technical risks, roadmap, tradeoffs, stakeholder comms.
**Quality Gate:** PM and engineering lead can both defend this roadmap in a leadership review.

---

## Exit Criteria
Done when: (1) every must-ship has a feasibility assessment, (2) technical risks stated specifically, (3) tradeoffs modeled with options, (4) negotiated roadmap has three confidence tiers, (5) stakeholder communication draft ready.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
