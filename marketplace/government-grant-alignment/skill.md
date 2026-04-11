# Government Grant Alignment

**One-line description:** A government program officer and a grant applicant each submit their real program requirements, compliance expectations, and project design before the award — Claude aligns on a funded project that delivers against the program's objectives without the compliance failures that end government grants early.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both program officer and grantee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_agency_and_grantee` (string, required): Government agency/program name and grantee organization name.
- `shared_program_area` (string, required): Federal, state, or local program area — infrastructure, workforce, research, public health, environment, etc.

### Program Officer Submits Privately
- `program_objectives_and_priorities` (object, required): What this grant program is designed to achieve — statutory requirements, agency priorities, what success looks like to the program.
- `compliance_and_reporting_requirements` (object, required): Financial reporting, programmatic reporting, audit requirements, allowable costs, procurement standards.
- `program_concerns_about_this_applicant` (object, required): Organizational capacity, prior grant performance, financial management, match requirement ability.
- `program_what_will_cause_problems` (array, required): Common failure modes — cost overruns, scope creep, procurement violations, reporting failures — what to watch for with this grantee.
- `program_award_parameters` (object, required): Award amount range, period of performance, match requirements, carryover policy.

### Grantee Submits Privately
- `project_design_and_approach` (object, required): What you will do, how, with what resources — the actual project plan, not the grant narrative version.
- `organizational_capacity` (object, required): Staff, systems, financial management infrastructure — your real capacity to administer a federal/government grant.
- `budget_and_match_reality` (object, required): Detailed budget, match sources and whether they are committed, where cost uncertainty exists.
- `compliance_concerns` (object, required): Areas where your organization is less certain — procurement, cost allocation, subrecipient monitoring, documentation.
- `project_risks` (array, required): What could go wrong — staffing, partner reliability, regulatory approvals, timeline, match commitments.

## Outputs
- `project_and_program_alignment` (object): Whether the project design achieves the program objectives.
- `compliance_readiness_assessment` (object): Where the grantee is ready and where there are gaps to address before award.
- `budget_and_match_review` (object): Budget allowability, match adequacy, cost realism.
- `reporting_and_monitoring_plan` (object): What reports, when, in what format — and what the program officer will monitor.
- `risk_mitigation_framework` (object): Project and compliance risks with mitigation strategies.
- `grant_agreement_framework` (object): Key award conditions and special terms for the grant agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm program officer's objectives and grantee's project design and budget both present.
**Output:** Readiness confirmation.
**Quality Gate:** Program requirements and grantee's project design and capacity both present.

---

### Phase 1: Assess Alignment and Capacity
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate project design against program objectives — does this project deliver what the program funds? 2. Assess organizational capacity against grant administration requirements. 3. Evaluate budget against allowability standards and match commitment. 4. Identify compliance risk areas.
**Output:** Project alignment assessment, capacity gap, budget allowability, compliance risk map.
**Quality Gate:** Every compliance risk is specific — named requirement vs. named organizational gap.

---

### Phase 2: Build the Award Framework
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the project scope and deliverables — what is funded and what is not. 2. Build the reporting plan — required reports with dates and formats. 3. Identify award conditions that address capacity or compliance gaps. 4. Define the budget framework — approved categories, restrictions, match documentation.
**Output:** Project scope, reporting plan, award conditions, budget framework.
**Quality Gate:** Every award condition is specific — what the grantee must do, by when, to remain in compliance.

---

### Phase 3: Define Monitoring and Close-Out
**Entry Criteria:** Framework built.
**Actions:** 1. Build the monitoring plan — site visits, desk reviews, what triggers escalation. 2. Define close-out requirements — final report, final financial reconciliation, equipment disposition. 3. Define what happens if the project fails — corrective action, grant termination, repayment. 4. Assemble the grant agreement framework.
**Output:** Monitoring plan, close-out requirements, corrective action process, agreement framework.
**Quality Gate:** Monitoring plan has specific review dates and named escalation triggers.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — project alignment, compliance readiness, budget framework, reporting plan, monitoring, grant agreement terms.
**Quality Gate:** Grantee knows what compliance requires and where their gaps are. Program officer knows the project and the risks to monitor.

---

## Exit Criteria
Done when: (1) project-program alignment is confirmed, (2) compliance gaps are named with remediation, (3) budget is reviewed for allowability, (4) reporting obligations are specific, (5) monitoring and close-out requirements are defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
