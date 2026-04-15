# Audit Prep

**One-line description:** Finance and operations each submit their real readiness gaps before an audit — AI produces a remediation plan with owners, a documentation checklist, and an audit response strategy.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both finance and operations must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_audit_type` (string, required): Type of audit. e.g., "External financial audit," "SOC 2 Type II," "IRS examination," "regulatory examination."
- `shared_audit_date` (string, required): Fieldwork start date or submission deadline.

### Finance / Controller Submits Privately
- `finance_auditor_focus_areas` (array, required): What do you expect auditors to focus on given prior findings, industry trends, or known risk areas?
- `finance_known_documentation_gaps` (array, required): What documentation is missing, incomplete, or needs to be reconstructed?
- `finance_open_items_from_prior_audit` (array, required): What items from the prior audit have not been fully addressed?
- `finance_what_needs_remediation_before_fieldwork` (array, required): What must be fixed or documented before auditors arrive?

### Operations / Business Lead Submits Privately
- `ops_operational_gaps` (array, required): What operational processes or controls have gaps that auditors might flag?
- `ops_compliance_issues` (array, required): Are there known compliance failures or near-misses that have not been disclosed?
- `ops_what_can_be_remediated_in_time` (object, required): What can realistically be fixed or documented before the audit?
- `ops_what_requires_finance_decision` (array, required): What gaps require a finance or leadership decision before they can be addressed?
- `ops_concerns_about_audit_scope` (array, required): What aspects of the audit scope worry you most?

## Outputs
- `audit_readiness_assessment` (object): Honest assessment of readiness by area — ready, needs remediation, high risk.
- `gap_remediation_plan` (object): What needs to be fixed, by whom, by when.
- `documentation_checklist` (array): Complete list of documents needed organized by audit area with owner assignments.
- `owner_assignments` (object): Who is responsible for each preparation area.
- `audit_response_strategy` (object): How to interact with auditors — what to say, how to handle findings, escalation protocol.
- `risk_areas_to_brief_leadership` (array): Issues significant enough that leadership should be aware before fieldwork begins.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm auditor focus areas and operational gaps present.
**Output:** Readiness confirmation.
**Quality Gate:** Known documentation gaps and operational concerns both present.

---

### Phase 1: Assess Readiness by Area
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map readiness by audit area — combine finance's documentation gaps with ops' operational gaps. 2. Identify open items from prior audits and check their current status. 3. Flag areas where ops has compliance issues not yet disclosed to finance. 4. Assess time available vs. remediation needed for each gap.
**Output:** Readiness map by area, prior audit item status, undisclosed compliance issues.
**Quality Gate:** Every flagged area has a status: "ready," "remediable before audit," or "high risk — requires decision."

---

### Phase 2: Build the Remediation Plan
**Entry Criteria:** Readiness assessed.
**Actions:** 1. Prioritize gaps by auditor focus likelihood and severity. 2. Assign each remediable gap to an owner with a specific deadline before fieldwork. 3. Identify which gaps require a leadership or finance decision to address — escalate these. 4. Build the complete documentation checklist by audit area.
**Output:** Prioritized remediation plan with owners and deadlines, escalation list, documentation checklist.
**Quality Gate:** Every remediable gap has a named owner and a date before fieldwork begins. Decisions that require escalation are explicitly flagged.

---

### Phase 3: Build the Audit Response Strategy
**Entry Criteria:** Remediation planned.
**Actions:** 1. Draft how the company will interface with auditors — who is the primary contact, what is the document request process, how are questions escalated. 2. Define how to handle unexpected findings during fieldwork — who gets notified, how quickly. 3. Identify which remaining high-risk areas to brief leadership on before fieldwork. 4. Draft holding language for known issues — how to acknowledge without over-disclosing.
**Output:** Audit response strategy, escalation protocol, leadership briefing list, holding language for known issues.
**Quality Gate:** Response strategy gives auditors what they need without creating new exposure. Known issues have prepared language.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Strategy built.
**Actions:** 1. Present audit readiness assessment by area. 2. Deliver gap remediation plan with owners and timeline. 3. Deliver documentation checklist. 4. Deliver audit response strategy. 5. State issues to brief leadership on.
**Output:** Full synthesis — readiness assessment, remediation plan, documentation checklist, response strategy, leadership briefings.
**Quality Gate:** Finance and operations walk into the audit with no surprises they could have prevented.

---

## Exit Criteria
Done when: (1) readiness status for every audit area, (2) remediation plan with owners and pre-fieldwork deadlines, (3) complete documentation checklist by area, (4) escalation list for decisions requiring leadership, (5) audit response strategy drafted.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
