# Nonprofit Grant Alignment

**One-line description:** A program director and a funder each submit their real priorities, funding criteria, and impact expectations before the grant is submitted — Claude aligns on a proposal that reflects what the funder actually funds and what the organization can actually deliver.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both program director and funder must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_organization_and_funder` (string, required): Nonprofit organization name and foundation/funder name.
- `shared_grant_program_area` (string, required): Program area, population served, geographic focus.

### Funder Submits Privately
- `funder_strategic_priorities` (object, required): What you are trying to achieve with this grant cycle — outcomes, populations, approaches that align with your theory of change.
- `funder_funding_criteria` (object, required): What you fund and what you do not — evidence standards, organizational capacity requirements, geographic restrictions.
- `funder_grant_economics` (object, required): Grant range, multi-year availability, indirect cost policy, reporting requirements, what success looks like to justify renewal.
- `funder_concerns_about_this_applicant` (object, required): Organizational capacity, financial health, leadership stability, prior grant performance.
- `funder_what_they_will_not_fund` (array, required): Approaches, activities, or cost categories that are outside your funding criteria.

### Program Director Submits Privately
- `program_design_and_theory_of_change` (object, required): What the program does, why it works, the evidence base, the population and outcomes targeted.
- `program_capacity_and_track_record` (object, required): Organizational capacity to deliver, staff, systems, prior outcomes data, financial health.
- `funding_need_and_use_of_funds` (object, required): What you need funding for, how you will use it, what it enables that cannot be funded otherwise.
- `program_risks_and_mitigation` (array, required): What could go wrong, what you are uncertain about, how you are managing risk.
- `concerns_about_funder_fit` (array, required): Where your program may not align with funder priorities, restrictions that affect program design, reporting burden concerns.

## Outputs
- `strategic_alignment_assessment` (object): Where program design aligns with funder priorities and where there are gaps.
- `fundability_assessment` (object): Whether this program meets the funder's criteria and what would strengthen the proposal.
- `proposal_design_recommendations` (object): How to frame the proposal to align with funder priorities while staying true to program design.
- `budget_and_economics_alignment` (object): Grant amount, indirect cost approach, multi-year structure, reporting obligations.
- `capacity_and_risk_assessment` (object): Organizational capacity to deliver and execute, risk mitigation.
- `grant_relationship_framework` (object): Reporting, communication, renewal expectations.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm funder's strategic priorities and program director's program design both present.
**Output:** Readiness confirmation.
**Quality Gate:** Funder's criteria and program's theory of change and outcomes both present.

---

### Phase 1: Assess Strategic and Criteria Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare program design against funder's strategic priorities — genuine fit or forced alignment? 2. Evaluate program against funding criteria — eligibility, evidence standards, capacity requirements. 3. Assess financial health and organizational capacity. 4. Identify what the funder will not fund that affects program design.
**Output:** Strategic alignment, criteria compliance, capacity assessment, non-fundable element identification.
**Quality Gate:** Alignment assessment is specific — "funder priorities include X, program addresses Y — the gap is Z."

---

### Phase 2: Build the Proposal Framework
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the framing — how to describe the program in funder language without distorting program design. 2. Build the budget structure — grant amount, indirect cost, multi-year ask. 3. Define the outcomes to measure and how to report them. 4. Identify organizational capacity evidence to include.
**Output:** Proposal framing, budget structure, outcomes framework, capacity evidence.
**Quality Gate:** Proposed outcomes are measurable and within the program's actual track record to deliver — not aspirational.

---

### Phase 3: Define the Grant Relationship
**Entry Criteria:** Framework built.
**Actions:** 1. Define reporting obligations — frequency, format, what triggers a check-in conversation. 2. Establish renewal expectations — what performance justifies renewal? 3. Define what happens if program design must change mid-grant. 4. Assemble the grant relationship framework.
**Output:** Reporting plan, renewal expectations, mid-grant change process, relationship framework.
**Quality Gate:** Reporting obligations are specific deliverables at specific dates — not "quarterly updates."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Relationship defined.
**Output:** Full synthesis — alignment assessment, proposal design, budget structure, outcomes framework, capacity evidence, grant relationship plan.
**Quality Gate:** Program director can write the proposal. Funder knows what they would be funding and how performance would be measured.

---

## Exit Criteria
Done when: (1) strategic alignment is assessed honestly, (2) fundability criteria are evaluated, (3) proposal framing is defined, (4) budget structure is complete, (5) reporting obligations are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
