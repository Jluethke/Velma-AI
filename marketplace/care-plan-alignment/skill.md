# Care Plan Alignment

**One-line description:** Patient submits real symptoms and life priorities; doctor submits clinical goals and concerns — AI produces a modified care plan that accounts for both the medical evidence and the patient's actual life.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both patient and care provider must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_condition` (string, required): Condition being managed.
- `shared_current_treatment` (string, required): Current treatment plan.

### Patient Submits Privately
- `patient_symptoms` (object, required): Current symptoms, what's improved, what hasn't, what's gotten worse.
- `patient_treatment_experience` (string, required): How is the treatment actually going? Side effects, compliance, what you're skipping and why.
- `patient_life_priorities` (object, required): What matters most to you in daily life? What is the treatment disrupting?
- `patient_questions` (array, required): Questions you haven't asked or didn't get answered.
- `patient_compliance_barriers` (array, required): What's preventing you from following the treatment plan fully? Be honest.

### Doctor Submits Privately
- `doctor_clinical_goals` (object, required): What outcomes are you trying to achieve and on what timeline?
- `doctor_concerns_about_patient` (array, required): What concerns you about this patient's progress or compliance?
- `doctor_treatment_rationale` (string, required): Why this treatment? What's the evidence base and what are the alternatives?
- `doctor_what_they_need_from_patient` (array, required): What does the patient need to do for this treatment to work?
- `doctor_alternatives_being_considered` (array, optional): Other approaches you're weighing.

## Outputs
- `goal_alignment` (object): Where clinical goals and patient priorities are compatible.
- `barrier_map` (array): Patient's compliance barriers assessed against clinical requirements.
- `modified_care_plan` (object): An adjusted plan that maintains clinical goals while accommodating real-life barriers.
- `patient_questions_answered` (array): Each patient question answered based on the doctor's submission.
- `shared_decision_summary` (string): A plain-English summary of the clinical rationale and the patient's role.
- `follow_up_plan` (object): What to monitor, when to follow up, what would trigger a plan change.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm patient compliance barriers and doctor's clinical goals present.
**Output:** Readiness confirmation.
**Quality Gate:** Compliance barriers and clinical goals both present.

---

### Phase 1: Assess the Treatment Reality
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Extract the patient's actual treatment experience — what they're doing vs. what was prescribed. 2. Extract the doctor's concerns about compliance. 3. Map the patient's compliance barriers against the clinical requirements. 4. Identify where the treatment plan is incompatible with the patient's life.
**Output:** Treatment reality assessment, barrier-to-requirement map, incompatibility list.
**Quality Gate:** Compliance gaps are named specifically.

---

### Phase 2: Align Clinical Goals to Patient Priorities
**Entry Criteria:** Treatment reality assessed.
**Actions:** 1. Map the doctor's clinical goals against the patient's life priorities. 2. Identify where they're compatible, where they conflict, and where a modification could serve both. 3. Answer the patient's questions using the doctor's submission. 4. Assess whether the doctor's concerns are addressable with plan modifications.
**Output:** Goal-priority alignment, question answers, modification opportunities.
**Quality Gate:** Every patient question is answered.

---

### Phase 3: Draft the Modified Care Plan
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Propose specific modifications that address compliance barriers while maintaining clinical goals. 2. Define what's non-negotiable from a clinical standpoint — and explain why in plain language. 3. Draft the shared decision summary: what the treatment is for, why it matters, what the patient needs to do. 4. Draft the follow-up plan with specific monitoring checkpoints.
**Output:** Modified care plan, non-negotiables with rationale, shared decision summary, follow-up plan.
**Quality Gate:** Modified plan is clinically sound and realistically followable.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan drafted.
**Actions:** 1. Present goal alignment. 2. Present barrier map. 3. Deliver modified care plan. 4. Deliver answered questions. 5. Deliver shared decision summary. 6. Deliver follow-up plan.
**Output:** Full synthesis — goal alignment, barriers, modified plan, answered questions, decision summary, follow-up.
**Quality Gate:** Patient understands the clinical rationale. Doctor has an actionable compliance improvement plan.

---

## Exit Criteria
Done when: (1) compliance barriers mapped to clinical requirements, (2) every patient question answered, (3) modified plan addresses barriers while maintaining core clinical goals, (4) follow-up plan has specific checkpoints.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
