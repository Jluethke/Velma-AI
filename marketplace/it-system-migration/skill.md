# IT System Migration

**One-line description:** IT and the business unit each submit their real migration plan and operational constraints — Claude surfaces the conflict between technical timeline and business readiness and produces a go-live plan that does not bring down operations on launch day.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both IT/engineering and the business unit must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_system_being_migrated` (string, required): System being migrated or replaced.

### IT / Engineering Lead Submits Privately
- `it_migration_plan` (object, required): Technical migration approach — what is being migrated, to what, in what sequence.
- `it_timeline` (object, required): Technical timeline — phases, milestones, and go-live date.
- `it_cutover_approach` (object, required): How the cutover will happen — big-bang, phased, parallel run, or staged rollout.
- `it_rollback_plan` (object, required): What is the rollback plan if go-live fails? How long does rollback take?
- `it_concerns_about_business_readiness` (array, required): What concerns do you have about whether the business will be ready — training, process changes, data readiness?

### Business Unit Lead Submits Privately
- `bu_operational_dependencies` (array, required): What business processes depend on this system and how critical are they?
- `bu_blackout_periods` (array, required): When can the system NOT be taken down or migrated? Fiscal close, peak season, customer commitments, regulatory deadlines.
- `bu_cutover_concerns` (array, required): What concerns do you have about the cutover approach? What has gone wrong in past migrations?
- `bu_what_cannot_be_disrupted` (array, required): Specific processes, transactions, or customer commitments that cannot be disrupted under any circumstances.
- `bu_training_and_readiness_status` (string, required): Where is the business unit on training and change readiness? What is still needed?

## Outputs
- `operational_risk_assessment` (object): What business processes are at risk during the migration and how severe is the risk.
- `cutover_timing_recommendation` (object): The recommended cutover window based on operational constraints.
- `business_readiness_checklist` (array): What the business unit must complete before go-live — training, process documentation, data validation.
- `contingency_and_rollback_plan` (object): The plan if go-live encounters critical issues — decision criteria, rollback steps, communication.
- `communication_plan` (object): How stakeholders are informed before, during, and after the migration.
- `go_live_criteria` (array): Specific, testable criteria that must be met before the go-live decision is confirmed.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm migration plan and business operational dependencies present.
**Output:** Readiness confirmation.
**Quality Gate:** Migration plan and business blackout periods both present.

---

### Phase 1: Map the Operational Risk
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map each critical business process against the migration timeline — which processes are affected, when, and how severely? 2. Check the IT cutover window against the business blackout periods — are there conflicts? 3. Identify IT's concerns about business readiness against the BU's stated training status — is there a gap? 4. Assess the rollback plan against the BU's "cannot be disrupted" list — if rollback is required, is anything irrecoverably affected?
**Output:** Business process risk map, cutover-blackout conflict check, readiness gap, rollback impact assessment.
**Quality Gate:** Every critical process has a risk status during the migration. Cutover conflicts are specific date conflicts, not general concerns.

---

### Phase 2: Define the Cutover Window and Readiness Requirements
**Entry Criteria:** Risk mapped.
**Actions:** 1. Recommend the cutover window that minimizes operational risk given blackout constraints. 2. Build the business readiness checklist — every action the BU must complete before go-live, with owner and deadline. 3. Identify which training and readiness gaps are blocking vs. non-blocking. 4. Define the go-live criteria — specific, testable conditions that must be met.
**Output:** Recommended cutover window, business readiness checklist with owners, blocking vs. non-blocking gaps, go-live criteria.
**Quality Gate:** Readiness checklist items have specific owners and deadlines. Go-live criteria are binary — pass or fail, not "acceptable."

---

### Phase 3: Build the Contingency and Communication Plan
**Entry Criteria:** Window defined.
**Actions:** 1. Build the contingency plan — what specific conditions trigger a rollback decision, who makes the call, and how quickly can rollback be executed. 2. Define the communication plan — who is notified before, during, and after, with the communication templates. 3. Build the hypercare plan for the first week post-go-live — heightened support staffing and monitoring. 4. Define escalation protocol.
**Output:** Contingency plan with rollback criteria and decision-maker, communication plan, hypercare plan, escalation protocol.
**Quality Gate:** Rollback decision criteria are specific — "if X failure is observed by time Y, rollback is initiated." Decision-maker is named.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plans built.
**Actions:** 1. Present operational risk assessment. 2. Present cutover timing recommendation. 3. Deliver business readiness checklist. 4. Deliver contingency and rollback plan. 5. Deliver communication plan and go-live criteria.
**Output:** Full synthesis — operational risk, cutover timing, readiness checklist, contingency, communication, go-live criteria.
**Quality Gate:** IT and the business unit can execute the migration knowing what each side must do and what the plan is if it goes wrong.

---

## Exit Criteria
Done when: (1) every critical process has a risk status, (2) cutover conflicts resolved with specific window, (3) readiness checklist with owners and deadlines, (4) go-live criteria are specific and binary, (5) rollback decision criteria and decision-maker defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
