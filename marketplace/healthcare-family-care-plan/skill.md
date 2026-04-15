# Healthcare Family Care Plan

**One-line description:** Care team and patient family each submit their real clinical perspective and values before a treatment decision — AI surfaces the questions not yet asked and ensures no decision is made in a vacuum of fear or incomplete information.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both care team and patient/family must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_patient_situation` (string, required): Current situation — hospitalization, diagnosis, treatment decision, or care transition.
- `shared_diagnosis_or_condition` (string, required): Diagnosis or clinical condition driving the care planning conversation.

### Care Team / Physician Submits Privately
- `care_team_diagnosis` (object, required): Clinical diagnosis, prognosis, and disease trajectory — what is happening medically.
- `care_team_treatment_options` (array, required): All viable treatment options with clinical description of each.
- `care_team_clinical_recommendation` (string, required): What the care team recommends and why.
- `care_team_risks_of_inaction` (string, required): What happens medically if no treatment decision is made or the recommended course is declined?
- `care_team_what_they_need_from_family` (array, required): What information, decisions, or consent does the care team need from the patient/family?

### Patient / Family Decision-Maker Submits Privately
- `family_patient_wishes` (string, required): What does the patient want, if known? Have they expressed preferences about treatment, quality of life, or end-of-life care?
- `family_concerns_about_treatment` (array, required): What concerns do you have about the recommended treatment? What are you afraid of?
- `family_practical_constraints` (object, required): What practical factors affect the decision — geography, work, finances, caregiver capacity?
- `family_values_and_priorities` (string, required): What matters most in this situation — length of life, quality of life, pain management, ability to be at home?
- `family_questions_not_yet_asked` (array, required): What questions do you have that you have not yet been able to ask or get a clear answer to?

## Outputs
- `aligned_care_plan` (object): The care plan that reflects both clinical recommendation and patient/family values.
- `treatment_option_summary` (string): Plain-language summary of each option — what it involves, what the likely outcome is, and what the experience would be like.
- `risk_and_benefit_breakdown` (object): What each treatment option offers and what it requires, in terms the family can actually use to decide.
- `decision_framework` (object): A structured way to think through the decision given the patient's values and the clinical options.
- `care_coordination_plan` (object): What needs to happen next — who to see, what to schedule, what decisions need to be made and by when.
- `questions_to_address_before_proceeding` (array): Questions that must be answered before a decision can be made — including questions the family has not yet asked.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm clinical information and family values/concerns present.
**Output:** Readiness confirmation.
**Quality Gate:** Clinical diagnosis and family's expressed concerns both present.

---

### Phase 1: Understand the Full Picture
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Identify where the care team's clinical recommendation aligns with the family's values and where there is tension. 2. Surface the questions the family has not yet asked that are clinically material — what would change the decision if answered. 3. Identify what the care team needs from the family that has not yet been provided. 4. Assess whether the family's practical constraints affect any of the treatment options.
**Output:** Values-to-recommendation alignment, unanswered critical questions, unmet care team information needs, practical constraint impact.
**Quality Gate:** Every critical unanswered question is named — not as a criticism but as something that will affect the decision.

---

### Phase 2: Translate Options Into Plain Language
**Entry Criteria:** Full picture understood.
**Actions:** 1. Translate each treatment option into plain language — what the patient would experience, what the recovery or ongoing management looks like, what the realistic outcome is. 2. Present the risks and benefits of each option in terms of the patient's stated values — not in medical statistics alone but in what it would mean for the patient's life. 3. Explain the risks of inaction in the same plain-language framing. 4. Identify what is unknown and what can and cannot be predicted.
**Output:** Plain-language treatment option summaries, values-based risk and benefit framing, inaction risks, uncertainty acknowledgment.
**Quality Gate:** Every option is described in terms of what the patient and family would experience, not just clinical outcomes. Uncertainty is named honestly.

---

### Phase 3: Build the Decision and Care Plan
**Entry Criteria:** Options translated.
**Actions:** 1. Build the decision framework — what the patient and family need to weigh given their values, the clinical reality, and the practical constraints. 2. Draft the aligned care plan based on the family's direction. 3. Build the care coordination plan — next steps, who to contact, decisions with deadlines. 4. List questions that must still be answered.
**Output:** Decision framework, aligned care plan, care coordination plan, open questions.
**Quality Gate:** Care plan reflects the patient's values, not just the clinically optimal path. Open questions are named with urgency level.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present treatment option summary in plain language. 2. Present risk and benefit breakdown. 3. Deliver decision framework. 4. Deliver aligned care plan. 5. List questions to address before proceeding.
**Output:** Full synthesis — options in plain language, risk/benefit, decision framework, care plan, open questions.
**Quality Gate:** Family can make a decision with full understanding. Care team has the direction they need to proceed.

---

## Exit Criteria
Done when: (1) all treatment options described in plain language, (2) values-based risk and benefit framing for each option, (3) all unasked critical questions surfaced, (4) care plan aligned with patient values, (5) care coordination next steps defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
