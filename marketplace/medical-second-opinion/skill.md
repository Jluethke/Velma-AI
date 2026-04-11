# Medical Second Opinion

**One-line description:** Patient submits their symptoms, concerns, and questions they were too afraid to ask — second-opinion doctor submits their clinical assessment — Claude produces a decision framework and the questions to bring back to the primary doctor.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both patient and second-opinion doctor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_primary_diagnosis` (string, required): The diagnosis from the primary doctor.
- `shared_proposed_treatment` (string, required): The treatment being proposed.

### Patient Submits Privately
- `patient_symptoms_and_history` (object, required): Symptoms, timeline, relevant medical history, medications.
- `patient_concerns_about_proposed_treatment` (array, required): What worries you about the proposed treatment?
- `patient_quality_of_life_priorities` (object, required): What matters most to you in terms of quality of life, side effects, and treatment burden?
- `patient_questions_never_asked` (array, required): The questions you've been afraid to ask or didn't know to ask.
- `patient_what_they_fear_most` (string, required): What outcome are you most afraid of?

### Doctor Submits Privately
- `doctor_clinical_assessment` (object, required): Your clinical read on the case based on what you've reviewed.
- `doctor_agreement_or_difference` (string, required): Do you agree with the primary diagnosis and treatment plan? If not, where do you differ and why?
- `doctor_recommended_additional_workup` (array, optional): Any additional tests or imaging you'd recommend before proceeding.
- `doctor_treatment_alternatives` (array, optional): Alternative treatment approaches worth considering.
- `doctor_prognosis_view` (object, required): Your honest prognosis view with this treatment vs. alternatives.

## Outputs
- `diagnosis_alignment` (object): Whether the second opinion confirms or questions the primary diagnosis.
- `treatment_comparison` (object): Primary treatment vs. alternatives with tradeoffs aligned to patient's quality of life priorities.
- `patient_questions_answered` (array): The patient's unasked questions, answered based on the doctor's submission.
- `recommended_next_steps` (array): What to do next — additional workup, treatment changes, or proceeding with primary plan.
- `decision_framework` (object): A framework for the patient to make an informed decision based on their stated priorities.
- `questions_for_primary_doctor` (array): Specific questions to bring to the primary doctor based on the second opinion findings.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm patient symptoms, concerns, and doctor's assessment and agreement/difference fields are present.
**Output:** Readiness confirmation.
**Quality Gate:** Clinical assessment and patient quality of life priorities both present.

---

### Phase 1: Compare Clinical Assessments
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Extract the second opinion doctor's view on diagnosis — does it align or differ? 2. Extract any differences in treatment recommendation. 3. Note recommended additional workup. 4. Assess the doctor's prognosis view vs. what the patient has been told.
**Output:** Diagnosis alignment, treatment differences, workup recommendations, prognosis comparison.
**Quality Gate:** Any diagnostic difference is named specifically with the clinical reasoning.

---

### Phase 2: Align to Patient Priorities
**Entry Criteria:** Clinical assessments compared.
**Actions:** 1. Map each treatment option against the patient's stated quality of life priorities. 2. Address each of the patient's concerns about the proposed treatment. 3. Answer the patient's unasked questions using the doctor's submission. 4. Note where the patient's fears align with or differ from clinical reality.
**Output:** Treatment-to-priorities map, concern responses, question answers, fear calibration.
**Quality Gate:** Every patient question is answered. Fears are calibrated against clinical reality.

---

### Phase 3: Build the Decision Framework
**Entry Criteria:** Patient priorities aligned.
**Actions:** 1. Draft a decision framework: what the patient needs to weigh, in order of their stated priorities. 2. Draft the questions to bring back to the primary doctor based on where the second opinion differs or raises questions. 3. Draft next steps based on the doctor's recommendations.
**Output:** Decision framework, questions for primary doctor, next steps.
**Quality Gate:** Questions for primary doctor are specific — not "ask about alternatives" but the actual questions.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Framework built.
**Actions:** 1. Present diagnosis alignment or difference. 2. Present treatment comparison with patient priority alignment. 3. Answer the patient's questions. 4. Deliver decision framework. 5. List next steps and questions for primary doctor.
**Output:** Full synthesis — diagnosis alignment, treatment comparison, answered questions, decision framework, next steps.
**Quality Gate:** Patient has enough information to make an informed decision or to know what information they still need.

---

## Exit Criteria
Done when: (1) diagnostic alignment or difference stated, (2) treatment options compared against patient's priorities, (3) every unasked question answered, (4) decision framework reflects patient's stated values, (5) questions for primary doctor are specific.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Second opinion significantly contradicts primary diagnosis | Present this plainly with both clinical rationales. Recommend the patient seek a third opinion or request a consultation between the two doctors. |
| Phase 3 | Patient's fears are significantly inconsistent with clinical reality | Address gently. Provide accurate information while acknowledging the fear. Don't dismiss the emotional reality. |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
