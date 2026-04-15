# Law Firm Client Engagement

**One-line description:** Client and attorney each submit their real situation, legal needs, and expectations before the engagement begins — AI aligns on scope, fees, and strategy so the client understands what they are buying and the attorney understands what they are committing to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both client and attorney must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_matter_description` (string, required): Brief description of the legal matter.
- `shared_firm_name` (string, required): Law firm name.

### Client Submits Privately
- `client_what_they_need` (string, required): What outcome do you want from this engagement? What does success look like?
- `client_full_situation` (object, required): The complete facts — what happened, who is involved, what documents exist, what has already been done.
- `client_budget_and_timeline_expectations` (object, required): What do you expect to pay and how long do you expect this to take?
- `client_what_they_have_not_told_the_attorney` (array, required): Facts you have not shared yet that might affect the representation — good or bad.
- `client_concerns_about_the_engagement` (array, required): What worries you — cost, outcome, process, confidentiality, conflict of interest?

### Attorney Submits Privately
- `attorney_assessment_of_the_matter` (object, required): What is the actual legal issue, how strong is the client's position, and what is the likely range of outcomes?
- `attorney_scope_of_engagement` (object, required): What is included in the engagement and what is explicitly out of scope?
- `attorney_fee_structure` (object, required): Hourly, flat fee, contingency — rates, retainer, billing practices, cost estimates by phase.
- `attorney_concerns_about_the_client_or_matter` (array, required): Anything that creates risk for the firm — facts that weaken the case, client behavior concerns, conflict issues.
- `attorney_what_they_need_from_the_client` (array, required): Documents, decisions, access, cooperation — what must the client provide for this to work?

## Outputs
- `matter_assessment` (object): Honest assessment of the legal situation — strength of position, likely outcomes, risks.
- `engagement_scope` (object): Exactly what is covered and what is not — with the line clearly drawn.
- `fee_estimate_and_structure` (object): Realistic cost estimate by phase with billing structure and payment terms.
- `client_responsibility_list` (array): What the client must do, provide, or decide — and by when.
- `engagement_strategy` (object): How the attorney recommends approaching the matter — and why.
- `expectation_alignment` (object): Where client expectations match the attorney's assessment and where they need to be recalibrated.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm client's situation and attorney's matter assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Client's full situation and attorney's assessment both present.

---

### Phase 1: Assess Matter and Expectations
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare client's desired outcome against attorney's realistic range of outcomes — where is there alignment and where is the client expecting too much or too little? 2. Identify facts the client has not yet shared and assess their potential impact. 3. Assess attorney's concerns — do they create a conflict, a risk, or a scope issue? 4. Check client's budget expectation against attorney's fee estimate — is there an affordability gap?
**Output:** Outcome alignment, undisclosed fact assessment, attorney concern analysis, budget gap.
**Quality Gate:** Outcome expectation gap is specific — "client expects full recovery; attorney assesses 40–60% likelihood of any recovery given..."

---

### Phase 2: Define Scope and Strategy
**Entry Criteria:** Expectations assessed.
**Actions:** 1. Define the engagement scope with precision — what phases, what services, what decisions are included. 2. Build the engagement strategy — how to approach the matter, in what sequence, with what goals at each stage. 3. Define what the client must provide — documents, access, decisions, timeline. 4. Flag what will increase cost or extend timeline beyond estimates.
**Output:** Scope definition, engagement strategy, client requirements, cost escalation flags.
**Quality Gate:** Scope is specific enough that both parties know when something is out of scope. Client requirements have deadlines.

---

### Phase 3: Build the Engagement Agreement
**Entry Criteria:** Scope and strategy defined.
**Actions:** 1. Define the fee structure — retainer, hourly rate, billing cadence, what is billed and what is not. 2. Build the realistic cost estimate by phase. 3. Define the communication plan — how often, what format, who from the firm is the primary contact. 4. Align on expectation recalibrations that need to happen before the engagement begins.
**Output:** Fee structure, phased cost estimate, communication plan, expectation recalibrations.
**Quality Gate:** Fee estimate has specific phases with ranges. Expectation gaps are named and addressed, not avoided.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present matter assessment. 2. Deliver engagement scope. 3. Deliver fee estimate and structure. 4. Deliver client responsibility list. 5. Present engagement strategy and expectation alignment.
**Output:** Full synthesis — assessment, scope, fees, client responsibilities, strategy, expectations.
**Quality Gate:** Client understands what they are buying. Attorney understands what they are committed to.

---

## Exit Criteria
Done when: (1) outcome expectations are recalibrated to reality, (2) scope has a clear line, (3) fee estimate is phased and specific, (4) client responsibilities are listed with deadlines, (5) engagement strategy is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
