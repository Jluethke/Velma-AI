# Healthcare Clinical Trial Site Agreement

**One-line description:** Sponsor and principal investigator each submit their real enrollment expectations and site constraints — AI assesses feasibility, surfaces protocol concerns, and produces site agreement terms both can execute without surprises.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both sponsor and principal investigator must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_trial_name` (string, required): Trial name and protocol number.
- `shared_indication` (string, required): Disease indication and patient population.

### Sponsor / CRO Submits Privately
- `sponsor_enrollment_targets` (object, required): Target number of patients, enrollment timeline, and site allocation.
- `sponsor_protocol_requirements` (object, required): Key protocol requirements — eligibility criteria, visit schedule, procedures, data requirements.
- `sponsor_timeline` (object, required): First patient in, last patient in, and site activation deadline.
- `sponsor_what_they_will_provide` (array, required): What the sponsor provides — investigational product, equipment, budget, monitoring support.
- `sponsor_concerns_about_site` (array, required): What concerns do you have about this site's capacity, experience, or patient population?

### Principal Investigator / Site Submits Privately
- `pi_site_capacity` (object, required): Staff available for the trial, competing studies, coordinator availability, and data entry capacity.
- `pi_patient_population_reality` (object, required): How many eligible patients are in your practice or referral network? What is realistic monthly enrollment?
- `pi_resource_requirements` (object, required): What does the site need from the sponsor — budget, equipment, training, monitoring frequency?
- `pi_protocol_concerns` (object, required): What aspects of the protocol are operationally challenging? What creates burden for staff or patients?
- `pi_what_would_make_enrollment_targets_unrealistic` (array, required): What factors — eligibility criteria, competing trials, patient population limits — make the sponsor's enrollment targets difficult to achieve?

## Outputs
- `enrollment_feasibility_assessment` (object): Whether the sponsor's enrollment target is achievable at this site given realistic patient population and site capacity.
- `protocol_concern_resolution` (object): How each operational concern is addressed — protocol amendment, site guidance, or accepted burden.
- `site_agreement_terms` (object): Budget, milestone payments, deliverables, and site responsibilities.
- `resource_commitment_plan` (object): What the sponsor will provide and when.
- `realistic_enrollment_timeline` (object): Revised enrollment projection based on site reality.
- `go_no_go_recommendation` (object): Whether to proceed with this site, proceed with modified expectations, or not activate.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm enrollment targets and site capacity present.
**Output:** Readiness confirmation.
**Quality Gate:** Sponsor's enrollment target and PI's patient population estimate both present.

---

### Phase 1: Assess Enrollment Feasibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare sponsor's enrollment target against PI's realistic patient population and monthly enrollment estimate. 2. Check eligibility criteria against the PI's patient population — how restrictive are the criteria relative to the population that presents? 3. Assess site capacity against the protocol's operational burden — visit frequency, procedures, data requirements. 4. Identify the factors the PI raised that could prevent meeting targets.
**Output:** Enrollment feasibility assessment, eligibility-to-population match, site capacity vs. protocol burden, constraint factors.
**Quality Gate:** Feasibility is stated as a number — "site can realistically enroll X patients per month, reaching sponsor's target of Y patients in Z months vs. the planned W months."

---

### Phase 2: Address Protocol Concerns
**Entry Criteria:** Feasibility assessed.
**Actions:** 1. For each protocol concern the PI raised, assess whether it requires a protocol amendment, site-specific guidance, or operational adjustment. 2. Identify concerns that, unaddressed, will drive screen failure rates up or patient dropout rates up. 3. Check whether the sponsor's concerns about the site are valid based on the PI's capacity and experience data. 4. Determine which resource gaps require sponsor investment to make the site viable.
**Output:** Protocol concern resolution plan, screen failure and dropout risk assessment, sponsor concern validity, resource gaps requiring investment.
**Quality Gate:** Every protocol concern has a resolution or an acceptance with the enrollment impact stated.

---

### Phase 3: Build the Site Agreement
**Entry Criteria:** Concerns addressed.
**Actions:** 1. Draft the site budget — per-patient payments, overhead, procedures, pass-through costs. 2. Build the milestone payment structure. 3. Define site deliverables and sponsor obligations. 4. Draft the realistic enrollment timeline based on PI's assessment. 5. Draft the go/no-go recommendation.
**Output:** Site budget, milestone structure, deliverables, realistic timeline, go/no-go recommendation.
**Quality Gate:** Budget covers actual site costs. Realistic timeline is based on PI's data, not sponsor's wishful planning.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present enrollment feasibility assessment. 2. Present protocol concern resolutions. 3. Deliver site agreement terms. 4. Deliver resource commitment plan. 5. State go/no-go recommendation.
**Output:** Full synthesis — feasibility, protocol resolutions, site agreement, resource plan, recommendation.
**Quality Gate:** Sponsor has a realistic site contribution. PI has a budget that covers costs. Both parties know what they are agreeing to deliver.

---

## Exit Criteria
Done when: (1) enrollment feasibility stated in specific monthly and total numbers, (2) every protocol concern has a resolution, (3) site budget covers identified costs, (4) realistic timeline based on site data, (5) go/no-go recommendation with rationale.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
