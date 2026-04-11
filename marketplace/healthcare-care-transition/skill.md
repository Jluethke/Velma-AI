# Healthcare Care Transition

**One-line description:** Discharging and receiving care teams each submit their real clinical status and capacity constraints — Claude surfaces safety gaps, aligns on care plan, and produces a handoff protocol that protects the patient.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both discharging care team and receiving facility must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_patient_id` (string, required): Patient identifier (de-identified or internal).
- `shared_diagnosis` (string, required): Primary diagnosis and relevant comorbidities.

### Discharging Care Team Submits Privately
- `discharging_patient_clinical_status` (object, required): Current clinical status — vitals, functional status, medication regimen, recent procedures, and outstanding clinical questions.
- `discharging_reason_for_transition` (string, required): Why is the patient being transitioned now? What is the clinical rationale for this level of care?
- `discharging_care_plan` (object, required): The care plan being handed off — medications, follow-up requirements, wound care, therapy needs, dietary restrictions, monitoring parameters.
- `discharging_safety_concerns` (array, required): What clinical concerns exist about the transition? What could go wrong?
- `discharging_timeline_pressure` (string, required): What is driving the timing of this discharge? Is there bed pressure, insurance authorization, or clinical readiness driving the decision?

### Receiving Facility / Care Team Submits Privately
- `receiving_capacity` (object, required): Current census, available beds, staffing levels, and specialty capability.
- `receiving_what_they_need_to_accept` (array, required): What information, documentation, or clinical conditions must be met before this patient can be accepted?
- `receiving_clinical_concerns` (array, required): What concerns does the receiving team have about accepting this patient?
- `receiving_resource_constraints` (object, required): Any resource limitations that affect care delivery — equipment, staffing, specialty access.
- `receiving_what_would_prevent_acceptance` (array, required): What clinical or logistical factors could prevent or delay acceptance?

## Outputs
- `transition_readiness_assessment` (object): Whether the patient is clinically ready for transition and the receiving facility is ready to accept.
- `clinical_handoff_summary` (string): Complete clinical handoff document — diagnosis, status, medications, care plan, follow-up requirements.
- `safety_concern_resolution_plan` (object): How each identified safety concern is addressed before and after transition.
- `care_plan_alignment` (object): Where the care plan is clear and where there are gaps or ambiguities.
- `transition_timeline` (object): Recommended timing and logistics for the transition.
- `escalation_criteria` (array): Specific clinical parameters that should trigger re-evaluation or return to a higher level of care.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm patient clinical status and receiving capacity present.
**Output:** Readiness confirmation.
**Quality Gate:** Clinical status and receiving capacity both present.

---

### Phase 1: Assess Transition Readiness and Safety
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess whether the patient's clinical status is appropriate for the level of care at the receiving facility. 2. Identify whether the receiving facility has the capacity and capability to manage the care plan. 3. Cross-reference the discharging team's safety concerns against the receiving team's clinical concerns — where are they aligned and where does one team see a risk the other has not acknowledged? 4. Identify any outstanding clinical questions that must be resolved before transition.
**Output:** Clinical appropriateness assessment, capacity and capability match, safety concern alignment, outstanding clinical questions.
**Quality Gate:** Every safety concern named by either team has a status — resolved, manageable with plan, or requires pre-transition action.

---

### Phase 2: Align on the Care Plan
**Entry Criteria:** Safety assessed.
**Actions:** 1. Review the care plan for completeness — are medications, doses, administration routes, and durations specified? Are follow-up appointments identified? Are monitoring parameters defined? 2. Identify ambiguities or gaps the receiving team would need to clarify. 3. Check whether the receiving facility's resource constraints affect the ability to deliver any element of the care plan. 4. Define escalation criteria — specific clinical parameters that trigger urgent contact with the discharging provider.
**Output:** Care plan gap analysis, resource constraint impact, escalation criteria.
**Quality Gate:** Care plan has no ambiguous instructions. Every medication has a dose, route, and duration. Escalation criteria are specific clinical values, not "if the patient deteriorates."

---

### Phase 3: Build the Transition Protocol
**Entry Criteria:** Care plan aligned.
**Actions:** 1. Build the clinical handoff summary — organized for the receiving team to use immediately upon arrival. 2. Define the transition timeline — when the patient is ready to transfer, what documentation must accompany them, and who contacts whom. 3. Build the safety concern resolution plan — what happens before transfer for each outstanding concern. 4. Define follow-up communication requirements.
**Output:** Clinical handoff summary, transition timeline with logistics, safety resolution plan, follow-up protocol.
**Quality Gate:** Handoff summary is organized by clinical priority, not by form template. Receiving team can act on it without calling for clarification.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Protocol built.
**Actions:** 1. Present transition readiness assessment. 2. Present care plan alignment and gaps. 3. Deliver clinical handoff summary. 4. Deliver safety concern resolution plan. 5. State escalation criteria.
**Output:** Full synthesis — readiness assessment, care plan, handoff summary, safety plan, escalation criteria.
**Quality Gate:** Both care teams can execute the transition with a shared understanding of what the patient needs and what to watch for.

---

## Exit Criteria
Done when: (1) every safety concern has a status, (2) care plan has no ambiguous instructions, (3) escalation criteria are specific clinical parameters, (4) clinical handoff summary is complete and actionable, (5) transition timeline and logistics defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
