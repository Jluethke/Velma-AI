# Architect Contractor Handoff

**One-line description:** An architect and a general contractor each submit their real concerns about the construction documents, scope interpretation, and schedule before the project breaks ground — AI aligns on a shared understanding of the drawings that prevents the RFIs, change orders, and disputes that inflate every project budget.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both architect and contractor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_and_team` (string, required): Project name and both firm names.
- `shared_project_scope` (string, required): Project type, size, delivery method, and construction start date.

### Architect Submits Privately
- `architect_design_intent` (object, required): What the drawings are trying to achieve — design intent behind key decisions, what is essential vs. what can be value-engineered.
- `architect_known_drawing_issues` (object, required): Coordination issues, incomplete areas, details still being developed — what the contractor will find and what to expect.
- `architect_scope_interpretation_concerns` (object, required): Areas of the drawings where scope is ambiguous or where the contractor may interpret differently than intended.
- `architect_concerns_about_this_contractor` (array, required): Value engineering that compromises design intent, RFI gaming, schedule pressure driving poor decisions, communication gaps.
- `architect_what_they_will_not_approve` (array, required): Material substitutions, scope reductions, or construction methods that are unacceptable.

### Contractor Submits Privately
- `contractor_constructability_assessment` (object, required): Issues with the drawings — conflicts, missing information, details that cannot be built as drawn.
- `contractor_scope_clarifications_needed` (object, required): Areas requiring clarification before bidding or building — undefined scope, specification gaps, coordination issues.
- `contractor_schedule_and_sequencing_concerns` (object, required): Lead time issues, sequencing constraints, what needs to be decided by when.
- `contractor_concerns_about_this_design_team` (array, required): Slow RFI response, scope creep, design changes after construction starts, constructability issues.
- `contractor_what_they_will_flag_as_change_orders` (array, required): Scope they believe is outside the contract — what they will price as extra work.

## Outputs
- `drawing_interpretation_alignment` (object): Areas of the drawings where interpretation is aligned and where clarification letters or addenda are needed.
- `constructability_resolution_plan` (object): Issues identified, how each is resolved, who is responsible, by when.
- `scope_boundary_definition` (object): What is in and out of contract — areas that were at risk of becoming change orders, now resolved.
- `afi_and_rfi_process` (object): How questions get answered, turnaround commitments, what triggers a design change.
- `schedule_and_submittal_plan` (object): Submittal schedule, long-lead items, decision points, what the architect must respond to and when.
- `coordination_framework` (object): Roles, responsibilities, communication, and escalation during construction.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm architect's design intent and known issues and contractor's constructability assessment both present.
**Output:** Readiness confirmation.
**Quality Gate:** Design intent and contractor's constructability concerns and scope questions both present.

---

### Phase 1: Assess Drawing Gaps and Interpretations
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare contractor's constructability issues against architect's known gaps — which are known, which are new? 2. Assess scope interpretation differences — where do the parties read the contract differently? 3. Evaluate schedule constraints against design development status. 4. Identify change order risk items.
**Output:** Drawing gap inventory, interpretation conflicts, schedule risk, change order risk map.
**Quality Gate:** Every drawing gap is assigned — who resolves it, in what form (addendum, RFI response, clarification letter), by what date.

---

### Phase 2: Resolve Scope and Process
**Entry Criteria:** Assessment complete.
**Actions:** 1. Resolve interpretation conflicts — agreed scope language for ambiguous areas. 2. Define the RFI and design change process — turnaround standards, who can authorize. 3. Build the submittal and long-lead schedule. 4. Document scope boundaries to prevent future change order disputes.
**Output:** Resolved scope, RFI process, submittal schedule, scope boundary documentation.
**Quality Gate:** Every resolved scope item has agreed language — not "to be discussed" but documented resolution.

---

### Phase 3: Define Coordination During Construction
**Entry Criteria:** Scope resolved.
**Actions:** 1. Define the weekly coordination meeting structure — who attends, what is covered, how decisions are documented. 2. Build the issue escalation process. 3. Define quality control and observation procedures. 4. Assemble the construction coordination framework.
**Output:** Meeting structure, escalation process, QC procedures, coordination framework.
**Quality Gate:** Escalation process names specific people and specific response time commitments.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — drawing alignment, constructability resolutions, scope boundaries, RFI process, submittal schedule, coordination framework.
**Quality Gate:** Contractor can build to the drawings without ambiguity on the resolved items. Architect knows what the contractor is planning to build.

---

## Exit Criteria
Done when: (1) drawing gaps are assigned, (2) scope interpretations are resolved, (3) change order risks are documented, (4) RFI process has turnaround commitments, (5) submittal schedule is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
