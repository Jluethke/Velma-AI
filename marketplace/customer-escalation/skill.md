# Customer Escalation

**One-line description:** Customer success and product each submit the real situation and technical constraints — Claude aligns on what is and is not possible, and produces a response plan that prevents CS from over-committing to what engineering cannot deliver.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both customer success and product/engineering must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_customer_name` (string, required): Customer name.

### Customer Success Submits Privately
- `cs_customer_complaint` (string, required): What is the customer actually experiencing? What did they say, specifically?
- `cs_relationship_risk` (string, required): What is the real retention risk here? Is the customer threatening to leave?
- `cs_what_customer_needs_to_stay` (array, required): What has the customer asked for or implied they need to resolve this?
- `cs_timeline_pressure` (string, required): How long do you have before this escalates further or becomes a churn event?
- `cs_what_they_have_already_committed` (array, required): What have you already promised or implied to the customer?

### Product / Engineering Lead Submits Privately
- `product_root_cause` (string, required): What is actually causing the customer's problem?
- `product_what_is_fixable_and_when` (object, required): What can be fixed, and what is the realistic timeline?
- `product_workarounds_available` (array, required): What workarounds exist right now while a fix is in progress?
- `product_what_is_not_possible` (array, required): What is the customer asking for that engineering cannot deliver in any reasonable timeframe?
- `product_concerns_about_cs_commitments` (array, required): What has CS committed to or implied that engineering cannot honor?

## Outputs
- `root_cause_summary` (string): Plain-language explanation of what is causing the problem.
- `retention_risk_assessment` (object): How serious is the churn risk and what is the cost of losing this customer.
- `escalation_response_plan` (object): Step-by-step plan for what to do and who does what.
- `customer_communication_draft` (string): Draft response to the customer — what to say, what to offer, what to commit to.
- `fix_timeline` (object): What gets fixed when, with realistic dates.
- `commitment_alignment` (object): Reconciliation of what CS has promised vs. what engineering can actually deliver.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm customer complaint and root cause present.
**Output:** Readiness confirmation.
**Quality Gate:** Customer complaint and technical root cause both present.

---

### Phase 1: Align on What Is and Is Not Possible
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map what the customer needs against what engineering has said is possible. 2. Identify commitment gaps — where has CS implied something engineering cannot deliver? 3. Assess whether the root cause explanation matches what the customer is experiencing. 4. Identify what can be offered as immediate relief vs. what requires development work.
**Output:** Feasibility map, commitment gap analysis, immediate relief options.
**Quality Gate:** Every customer ask has one of three labels: "deliverable on X date," "deliverable via workaround now," or "not possible — here is why."

---

### Phase 2: Assess Retention Risk
**Entry Criteria:** Feasibility mapped.
**Actions:** 1. Assess the real churn probability given what can and cannot be delivered. 2. Calculate the cost of losing this customer — ARR, expansion potential, reference value. 3. Identify whether there is a gap between what engineering can deliver and what the customer needs to stay. 4. If there is a gap, identify what it would take to close it — scope, resources, prioritization trade-off.
**Output:** Churn probability, revenue risk, gap assessment, options to close the gap.
**Quality Gate:** Churn probability is based on the customer's actual statement and relationship history, not speculation.

---

### Phase 3: Build the Response Plan
**Entry Criteria:** Risk assessed.
**Actions:** 1. Draft the customer communication — lead with acknowledgment, explain root cause in plain language, state what is being done and by when, offer what immediate relief is available. 2. Build the internal escalation response plan: who does what, in what order, by when. 3. Reconcile CS commitments with engineering reality — identify what needs to be walked back vs. honored. 4. Draft the fix timeline.
**Output:** Customer communication draft, internal response plan, commitment reconciliation, fix timeline.
**Quality Gate:** Customer communication contains no promises that are not confirmed as deliverable. Commitments that cannot be honored are addressed with a plan for how to walk them back.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present feasibility map and commitment gaps. 2. Present retention risk and revenue exposure. 3. Deliver customer communication draft. 4. Deliver internal response plan. 5. Deliver fix timeline.
**Output:** Full synthesis — feasibility map, retention risk, customer communication, response plan, fix timeline.
**Quality Gate:** CS can go to the customer with a response that is honest and does not create new commitment problems. Engineering has a clear fix priority.

---

## Exit Criteria
Done when: (1) every customer ask has feasibility status, (2) commitment gaps reconciled, (3) customer communication draft ready, (4) fix timeline with specific dates, (5) internal response plan with owners.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
