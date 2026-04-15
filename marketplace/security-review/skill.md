# Security Review

**One-line description:** Security and engineering each submit their real findings and capacity constraints — AI prioritizes by actual risk, assesses alternative controls, and produces a remediation plan both sides can execute.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both security and engineering must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_review_scope` (string, required): What system or area was reviewed?

### CISO / Security Lead Submits Privately
- `security_findings` (array, required): List of findings with description and affected systems.
- `security_risk_ratings` (object, required): Risk severity for each finding — Critical, High, Medium, Low — with justification.
- `security_required_remediations` (array, required): What must be fixed and what constitutes acceptable remediation?
- `security_timeline_expectations` (object, required): What must be fixed in 30, 60, 90 days?
- `security_non_negotiables` (array, required): What findings cannot be deferred under any circumstances?

### Engineering Lead Submits Privately
- `eng_technical_complexity_of_fixes` (object, required): How complex is each fix? What system changes are required?
- `eng_capacity_available` (object, required): What engineering capacity exists for security remediation in the next 90 days?
- `eng_alternative_mitigations` (object, required): For findings where the full fix is not feasible, what compensating controls could reduce risk?
- `eng_timeline_reality` (object, required): Realistic timeline for each fix given capacity and complexity.
- `eng_concerns_about_security_requirements` (array, required): Where do security's requirements seem disproportionate to the actual risk?

## Outputs
- `risk_prioritization` (array): Findings re-prioritized by actual exploitability and business impact, not just theoretical severity.
- `remediation_plan` (object): Who fixes what, by when, with what resources.
- `accepted_risk_register` (array): Findings that will not be remediated in the planning window, with explicit business risk acceptance.
- `alternative_controls_assessment` (object): Where compensating controls can reduce risk while full fixes are planned.
- `timeline_commitment` (object): Agreed timeline for each critical and high finding.
- `escalation_criteria` (object): What triggers escalation to leadership or the board.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm findings list with risk ratings and capacity assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Findings with risk ratings and engineering capacity both present.

---

### Phase 1: Prioritize by Real Risk
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. For each finding, assess the actual exploitability — is this theoretical or actively exploitable in the current environment? 2. Check engineering's capacity concerns against security's non-negotiables. 3. Identify where engineering's proposed alternative controls genuinely reduce risk vs. where they are insufficient. 4. Surface where security's severity ratings may be theoretical rather than reflective of actual business context.
**Output:** Risk re-prioritization, non-negotiable conflict check, alternative controls assessment.
**Quality Gate:** Every Critical and High finding has an exploitability assessment — not just a CVSS score.

---

### Phase 2: Build the Remediation Plan
**Entry Criteria:** Risks prioritized.
**Actions:** 1. Assign each finding to a remediation bucket: fix now, fix in 30/60/90 days, mitigate with compensating control, accept risk. 2. For each bucket, assign owners, confirm capacity, confirm timeline. 3. For accepted risks, draft the formal risk acceptance statement with business owner sign-off requirement. 4. Build the timeline commitment.
**Output:** Remediation plan with owners and timeline, accepted risk register, timeline commitment.
**Quality Gate:** Every Critical finding either has a committed fix date or a formal risk acceptance. No "we will address soon."

---

### Phase 3: Build the Monitoring and Escalation Plan
**Entry Criteria:** Remediation planned.
**Actions:** 1. Define how remediation will be tracked — meetings, tickets, reporting cadence. 2. Draft escalation criteria — what triggers escalation to CISO, CEO, or board. 3. Identify what will be communicated to leadership and when. 4. Define what constitutes completion for each finding.
**Output:** Monitoring plan, escalation criteria, leadership communication plan, completion criteria.
**Quality Gate:** Escalation criteria are specific — "if a Critical finding is not remediated within 30 days of discovery" not "if things get bad."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present risk prioritization with exploitability assessment. 2. Deliver remediation plan with owners and timeline. 3. Present accepted risk register. 4. Present alternative controls assessment. 5. State escalation criteria.
**Output:** Full synthesis — risk prioritization, remediation plan, accepted risks, alternative controls, escalation criteria.
**Quality Gate:** Security has a plan they can enforce. Engineering has commitments they can actually meet.

---

## Exit Criteria
Done when: (1) every Critical and High finding has exploitability assessment, (2) every finding assigned to remediation bucket with owner, (3) accepted risk register with formal sign-off requirements, (4) timeline commitment with specific dates, (5) escalation criteria defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
