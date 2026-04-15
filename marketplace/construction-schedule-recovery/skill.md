# Construction Schedule Recovery

**One-line description:** GC and owner each submit their real account of the delay and recovery options — AI assesses root cause, models recovery scenarios, and produces a revised schedule with the decisions each side needs to make.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both GC and owner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name.
- `shared_delay_amount` (string, required): How far behind schedule is the project and as of what date?

### General Contractor Submits Privately
- `gc_why_schedule_slipped` (string, required): What caused the delay? Be specific — weather, material delivery, subcontractor performance, design changes, owner-caused delays.
- `gc_recovery_plan` (object, required): How do you propose to recover the schedule? What specific actions — overtime, additional crews, sequencing changes, procurement acceleration?
- `gc_cost_to_accelerate` (object, required): What is the cost of each recovery measure? Labor premium, equipment rental, logistics.
- `gc_what_owner_must_decide` (array, required): What decisions, approvals, or funding does the owner need to provide for the recovery plan to work?
- `gc_what_is_not_recoverable` (string, required): What portion of the delay, if any, cannot be recovered regardless of effort or cost?

### Owner / Owner's Rep Submits Privately
- `owner_timeline_requirements` (object, required): What is the hard deadline? What are the consequences of missing it — contractual penalties, tenant commitments, financing milestones?
- `owner_budget_for_recovery` (object, required): What budget is available for acceleration? Is there contingency remaining?
- `owner_risk_tolerance` (string, required): How much schedule risk is acceptable? Is partial recovery acceptable or must the full delay be recovered?
- `owner_what_they_need_from_gc` (array, required): What commitments, reporting, or milestone guarantees do you need from the GC?
- `owner_concerns_about_gc_recovery_plan` (array, required): What about the GC's proposed recovery do you question — feasibility, cost, risk of further delay?

## Outputs
- `delay_cause_analysis` (object): Assessment of the delay cause — contractor-caused, owner-caused, excusable, or shared responsibility.
- `recovery_plan_feasibility` (object): Whether the GC's recovery plan is technically feasible and what the risks are.
- `cost_to_complete_scenarios` (object): Cost scenarios — baseline plan, partial recovery, and full recovery — with the additional cost of each.
- `owner_decision_requirements` (array): Specific decisions the owner must make with a deadline for each.
- `revised_schedule` (object): Revised schedule reflecting what is achievable given the recovery plan and owner decisions.
- `risk_and_contingency_plan` (object): Residual schedule risk and what triggers a further recovery conversation.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm delay description and recovery plan present from GC, owner's timeline requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** Delay cause and owner's hard deadline both present.

---

### Phase 1: Assess Delay Cause and Responsibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Analyze the GC's delay cause against contract provisions — is this an excusable delay (weather, force majeure, owner-caused), compensable delay (owner-caused), or contractor-caused? 2. Assess whether the cause stated is consistent with project records — daily reports, RFIs, submittals. 3. Identify if there are shared responsibility factors. 4. Assess the owner's consequences of delay against the actual delay amount.
**Output:** Delay cause assessment with responsibility classification, record consistency check, owner consequence severity.
**Quality Gate:** Responsibility is classified — "contractor-caused," "excusable," "compensable," or "shared" — with the contractual basis cited.

---

### Phase 2: Assess Recovery Plan Feasibility
**Entry Criteria:** Cause assessed.
**Actions:** 1. Assess whether the GC's recovery measures are technically feasible — can you add crews to these activities? Is the sequencing achievable? 2. Check the cost estimates against market rates — are the acceleration costs reasonable? 3. Identify which recovery measures require owner decisions and what happens if those decisions are delayed. 4. Model three recovery scenarios: full recovery, partial recovery, and no acceleration.
**Output:** Feasibility assessment by recovery measure, cost reasonableness check, owner-decision dependencies, three recovery scenarios.
**Quality Gate:** Feasibility assessment identifies specific reasons a measure may not work — not general skepticism. Each scenario has a specific end date and cost.

---

### Phase 3: Build the Revised Schedule
**Entry Criteria:** Recovery assessed.
**Actions:** 1. Build the revised schedule based on the most feasible recovery scenario given the owner's budget and decision timeline. 2. Identify the owner decisions required with deadlines — delaying each decision extends the schedule by X days. 3. Build the contingency plan — what triggers a further recovery conversation and what the response would be. 4. Define the milestone reporting structure.
**Output:** Revised schedule, owner decision requirements with deadline impact, contingency triggers, reporting structure.
**Quality Gate:** Revised schedule has specific milestone dates. Owner decision deadlines show the schedule impact of missing them.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Schedule built.
**Actions:** 1. Present delay cause analysis with responsibility. 2. Present recovery plan feasibility. 3. Deliver cost scenarios. 4. Deliver revised schedule. 5. State owner decision requirements and contingency plan.
**Output:** Full synthesis — delay analysis, feasibility, cost scenarios, revised schedule, owner decisions, contingency.
**Quality Gate:** Owner knows what they are paying for and what they are deciding. GC has a schedule both sides can execute against.

---

## Exit Criteria
Done when: (1) delay responsibility classified with contractual basis, (2) every recovery measure assessed for feasibility, (3) three cost scenarios with specific end dates, (4) revised schedule with milestone dates, (5) owner decisions with deadline-impact stated.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
