# Incident Postmortem

**One-line description:** Engineering and product each submit their real account of an incident — technical cause and business impact — Claude produces a blameless root cause analysis, assigns action items, and drafts the customer communication so the postmortem actually changes something.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both engineering and product must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_incident_summary` (string, required): What happened? One paragraph of factual description.
- `shared_incident_date` (string, required): Date and duration of the incident.

### Engineering Lead Submits Privately
- `eng_technical_root_cause` (string, required): What technically caused the incident? Be specific — the system, the failure mode, and the chain of events.
- `eng_timeline_of_events` (array, required): Chronological timeline — when the issue started, when it was detected, when it was escalated, when it was resolved.
- `eng_what_broke_and_why` (object, required): What component or system failed, why it failed, and whether there were contributing factors — deployment, configuration change, traffic spike, dependency failure.
- `eng_proposed_remediations` (array, required): What do you propose to fix — to prevent recurrence, to improve detection, to improve response time?
- `eng_what_they_are_not_responsible_for` (array, required): What aspects of this incident were outside engineering's control?

### Product / Business Lead Submits Privately
- `product_customer_impact` (object, required): Which customers were affected, how, and for how long? What functionality was unavailable?
- `product_business_impact` (object, required): Revenue impact, SLA breaches, customer commitments affected, reputational risk.
- `product_what_they_need_to_prevent_recurrence` (array, required): From the product and customer perspective, what must change to prevent this from happening again?
- `product_concerns_about_eng_root_cause` (array, required): Where does the technical root cause not fully explain the customer experience or the business impact?
- `product_what_customers_are_asking_for` (array, required): What are customers and account teams asking for in response to this incident?

## Outputs
- `root_cause_summary` (string): Blameless, factual root cause analysis — what happened, why, and the contributing factors.
- `impact_assessment` (object): Technical and business impact — who was affected, for how long, and what the consequences were.
- `contributing_factors` (array): The conditions that made this incident possible — not the direct cause but the environment that allowed it.
- `action_items_with_owners` (array): Specific action items — preventive, detective, and responsive improvements — with owners and deadlines.
- `customer_communication_draft` (string): Draft customer communication — factual, honest, and focused on what was done and what is being done.
- `prevention_commitments` (array): Specific, measurable commitments the team is making to prevent recurrence.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm technical root cause and customer impact present.
**Output:** Readiness confirmation.
**Quality Gate:** Root cause and customer impact both present.

---

### Phase 1: Build the Factual Timeline and Root Cause
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build the combined timeline — merging engineering's technical events with product's customer experience timeline. 2. Validate the root cause: does the technical explanation account for the customer experience described by product? 3. Identify contributing factors — what conditions made this failure possible? 4. Check engineering's "not responsible for" list against the actual failure chain — is that claim supported?
**Output:** Combined timeline, root cause validation, contributing factors, responsibility assessment.
**Quality Gate:** Root cause explains the customer experience, not just the technical failure. Contributing factors are environmental conditions, not blame.

---

### Phase 2: Assess Impact
**Entry Criteria:** Root cause built.
**Actions:** 1. Quantify the impact — affected customers, duration, functionality unavailable, revenue impact, SLA breaches. 2. Check engineering's timeline against product's customer experience — were customers affected before engineering was aware? 3. Assess product's concerns about the root cause explanation — is there an explanatory gap? 4. Identify what customers are asking for and what is feasible to offer.
**Output:** Impact quantification, detection gap assessment, explanatory gap resolution, customer response options.
**Quality Gate:** Impact is in specific numbers. Detection gap — time between failure and detection — is measured.

---

### Phase 3: Build Action Items and Communication
**Entry Criteria:** Impact assessed.
**Actions:** 1. Build action items across three categories: preventive (prevent the failure mode), detective (catch it sooner), and responsive (resolve it faster). 2. Assign each action item an owner and a deadline. 3. Separate nice-to-have improvements from commitments — what the team is genuinely committing to vs. aspirational. 4. Draft the customer communication — acknowledge, explain, state impact, explain what was done, state prevention commitments.
**Output:** Action items by category with owners and deadlines, prevention commitments, customer communication draft.
**Quality Gate:** Action items have specific owners and dates. Prevention commitments are achievable — not "we will ensure this never happens again."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Action items and communication built.
**Actions:** 1. Present root cause summary and contributing factors. 2. Present impact assessment. 3. Deliver action items with owners and deadlines. 4. Deliver customer communication draft. 5. State prevention commitments.
**Output:** Full synthesis — root cause, impact, action items, customer communication, prevention commitments.
**Quality Gate:** The postmortem is honest, blameless, and actionable. Action items will actually be tracked to completion.

---

## Exit Criteria
Done when: (1) root cause explains the customer experience, (2) impact quantified in specific numbers, (3) detection gap measured, (4) action items have owners and deadlines, (5) prevention commitments are specific and achievable.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
