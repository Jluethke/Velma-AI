# Therapy Intake Alignment

**One-line description:** A therapist and a prospective client each submit their real therapeutic goals, concerns, and fit requirements before the first session — Claude aligns on a therapeutic approach, expectations, and boundaries that give this relationship the best chance of producing meaningful progress.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both therapist and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_therapist_and_client` (string, required): Therapist name/practice and client first name (or initials for privacy).
- `shared_therapy_modality` (string, required): Individual, couples, family, group — and presenting concern category.

### Therapist Submits Privately
- `therapist_clinical_approach` (object, required): Your theoretical orientation, modalities, what types of presenting concerns you are trained for and effective with.
- `therapist_initial_clinical_impression` (object, required): Your read on what this client is presenting — what they said, what you observed, what the clinical picture looks like.
- `therapist_scope_and_limitations` (object, required): What you can and cannot treat — conditions outside your scope, issues requiring a higher level of care.
- `therapist_fee_and_logistics` (object, required): Session rate, insurance, cancellation policy, between-session contact, telehealth vs. in-person.
- `therapist_clinical_concerns` (array, required): Risk factors, diagnostic considerations, what you need to monitor — safety, crisis history, complexity.

### Client Submits Privately
- `client_real_reason_for_therapy` (object, required): The actual reason — not the polished intake answer, but what you are actually struggling with and what you want to be different.
- `client_therapy_history` (object, required): Prior therapy — what helped, what did not, what ended those relationships, what you are still carrying from before.
- `client_goals_and_fears` (object, required): What you want from this — specific changes, relief, understanding — and what you are afraid therapy will surface or require.
- `client_practical_constraints` (object, required): Schedule, cost, insurance, how long you can commit, what would make you stop coming.
- `client_concerns_about_this_therapist` (array, required): Fit concerns — approach, identity, experience, whether this person can understand your situation.

## Outputs
- `therapeutic_fit_assessment` (object): Whether this therapist-client pairing has the clinical and personal ingredients for productive work.
- `treatment_approach_alignment` (object): Agreed therapeutic direction, modalities, and what the work will focus on.
- `goals_and_expectations_framework` (object): What the client is working toward and how progress will be assessed.
- `scope_and_referral_assessment` (object): Whether the presenting concern is within scope, or whether a referral or adjunct service is needed.
- `logistics_and_boundaries` (object): Session frequency, fee, cancellation, between-session contact, crisis plan.
- `engagement_framework` (object): Informed consent elements and what the client is agreeing to.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm therapist's clinical approach and client's real reason for therapy both present.
**Output:** Readiness confirmation.
**Quality Gate:** Clinical assessment and client's goals, history, and concerns all present.

---

### Phase 1: Assess Clinical Fit and Scope
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess whether the presenting concern is within the therapist's training and scope. 2. Evaluate prior therapy history — what patterns are relevant? 3. Assess clinical risk factors — safety, crisis history, complexity. 4. Evaluate personal fit — can this therapist understand this client's situation?
**Output:** Scope assessment, prior therapy analysis, risk assessment, fit evaluation.
**Quality Gate:** Scope determination is specific — not "might be complex" but named concerns and what they require.

---

### Phase 2: Align on Approach and Goals
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the therapeutic approach for this client — modality, focus, what the work will look like. 2. Establish goals that are meaningful to the client and clinically appropriate. 3. Identify what the client needs to understand about the therapeutic process. 4. Define logistics and boundaries.
**Output:** Therapeutic approach, goal framework, process expectations, logistics.
**Quality Gate:** Goals are specific and belong to the client — not what the therapist thinks they should want.

---

### Phase 3: Plan the Engagement
**Entry Criteria:** Approach aligned.
**Actions:** 1. Define the initial treatment plan — what to address in the first 4-8 sessions. 2. Build the crisis and safety plan. 3. Define how progress is assessed and when to reevaluate approach. 4. Assemble the informed consent framework.
**Output:** Initial treatment plan, safety plan, progress assessment framework, informed consent elements.
**Quality Gate:** Safety plan is specific — named contacts, named crisis resources, named conditions that trigger escalation.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — fit assessment, treatment approach, goals, logistics, safety plan, informed consent framework.
**Quality Gate:** Client understands what therapy will address and what it will require. Therapist has the clinical picture to begin work.

---

## Exit Criteria
Done when: (1) scope and fit are assessed, (2) treatment approach is defined, (3) goals are specific and client-owned, (4) logistics and boundaries are clear, (5) safety plan is in place.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
