# Audit Engagement

**One-line description:** The audit partner and the CFO each submit their real concerns, risk areas, and expectations before the audit begins — Claude aligns on audit scope, timeline, and what both parties need to make this an efficient process that actually finds what matters, not just checks the boxes.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both audit partner and CFO must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_and_firm` (string, required): Company and audit firm names.
- `shared_audit_period` (string, required): Fiscal year or period being audited.

### Audit Partner Submits Privately
- `auditor_risk_assessment` (object, required): Where you see the highest audit risk — revenue recognition, related party transactions, complex estimates, internal control weaknesses.
- `auditor_planned_procedures` (object, required): What testing you plan — substantive procedures, controls testing, areas of emphasis.
- `auditor_resource_and_timeline_plan` (object, required): Staffing, interim vs. year-end work, when you need information from the client.
- `auditor_prior_year_issues` (array, required): What was found last year, what was corrected, what is still a concern.
- `auditor_concerns_about_management` (array, required): Areas where management estimates or judgments create audit risk.

### CFO Submits Privately
- `cfo_significant_changes_this_year` (object, required): M&A, new accounting policies, system changes, major transactions — what is different from last year.
- `cfo_areas_of_accounting_judgment` (array, required): Where management has made significant estimates or judgments — goodwill impairment, reserves, fair value.
- `cfo_internal_control_concerns` (array, required): Known control weaknesses or deficiencies, process changes that may have introduced risk.
- `cfo_timeline_constraints` (string, required): Board and audit committee dates, regulatory filing deadlines, what drives the close timeline.
- `cfo_concerns_about_the_audit_process` (array, required): What slowed things down last year, what requests were unreasonable, what you need from the auditor to close on time.

## Outputs
- `audit_risk_alignment` (object): Where auditor and CFO agree on risk areas and where there are gaps in perspective.
- `audit_scope_and_emphasis` (object): Agreed areas of focus, sampling approach, what gets more vs. less attention.
- `information_request_schedule` (object): What the auditor needs, when, in what format — no more surprise year-end requests.
- `timeline_and_milestone_plan` (object): Interim and year-end audit milestones with dates both sides commit to.
- `judgment_and_estimate_alignment` (object): How management's significant estimates will be audited and what documentation is needed.
- `prior_year_issue_resolution` (object): Status of prior year findings and what the remediation was.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm auditor's risk assessment and CFO's significant changes present.
**Output:** Readiness confirmation.
**Quality Gate:** Auditor's planned procedures and CFO's significant changes both present.

---

### Phase 1: Align on Risk and Scope
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare auditor's risk areas against CFO's significant changes — are the highest-risk areas aligned? 2. Assess prior year findings against what was remediated. 3. Evaluate management's judgment areas against auditor's assessment — where will there be scrutiny? 4. Identify internal control changes that require updated testing.
**Output:** Risk alignment, remediation status, judgment area assessment, control change map.
**Quality Gate:** Every high-risk area identified by either party is included in scope — not negotiated out.

---

### Phase 2: Build the Audit Plan
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define the audit procedures for each risk area — what testing, what sample size. 2. Build the information request schedule — by phase, by date, specific documents. 3. Define the judgment documentation requirements — what management provides and when. 4. Define the timeline milestones — fieldwork start, interim completion, year-end fieldwork, draft report.
**Output:** Procedures plan, information request schedule, judgment documentation, timeline.
**Quality Gate:** Information requests are specific documents with named owners. Timeline has dates that both parties have agreed to.

---

### Phase 3: Define Communication and Resolution
**Entry Criteria:** Plan built.
**Actions:** 1. Define the communication plan — who talks to whom, how issues are raised, what goes to the audit committee. 2. Build the issue resolution process — how disagreements about accounting judgments are escalated. 3. Define what triggers an expanded scope — what the auditor will communicate before expanding work. 4. Set expectations for management representation letters and responses to findings.
**Output:** Communication plan, issue resolution process, scope expansion triggers, representation letter expectations.
**Quality Gate:** Issue escalation path is named — specific people at specific thresholds.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — risk alignment, audit scope, information schedule, timeline, judgment documentation, communication plan.
**Quality Gate:** CFO knows what to prepare and when. Auditor knows what to expect and when.

---

## Exit Criteria
Done when: (1) risk areas are aligned, (2) information requests are specific with dates, (3) timeline milestones are agreed, (4) judgment documentation is defined, (5) communication process is established.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
