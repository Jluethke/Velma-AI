# Clinical Trial Site Agreement

**One-line description:** A pharmaceutical sponsor and a clinical trial site each submit their real protocol requirements, site capabilities, and budget expectations before activating the site — AI aligns on a site agreement that enrolls the right patients on time without the amendments and budget disputes that delay most trials.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both sponsor and site must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_sponsor_and_site` (string, required): Sponsor company and clinical site names.
- `shared_trial_and_indication` (string, required): Protocol number, indication, phase, and patient population.

### Sponsor Submits Privately
- `sponsor_enrollment_requirements` (object, required): Target enrollment, timeline, patient eligibility criteria, screen failure expectations.
- `sponsor_protocol_and_procedure_requirements` (object, required): Required procedures, visit schedule, lab requirements, imaging, what the site must be able to perform.
- `sponsor_budget_parameters` (object, required): Budget range per patient, what categories are covered, what requires justification, payment milestones.
- `sponsor_concerns_about_this_site` (object, required): Prior performance, IRB timeline, patient population access, staff retention, data quality.
- `sponsor_what_they_will_not_negotiate` (array, required): Budget floors, protocol requirements, data quality standards, timeline commitments.

### Site Submits Privately
- `site_capabilities_and_capacity` (object, required): Staff, equipment, patient population access, current study load, competing protocol conflicts.
- `site_budget_requirements` (object, required): What it actually costs to run this protocol — staff time, procedures, overhead — and what you need to cover costs and overhead.
- `site_enrollment_feasibility` (object, required): Realistic enrollment estimate — how many patients, at what screen failure rate, in what timeline.
- `site_protocol_concerns` (array, required): Procedures that are difficult to perform, eligibility criteria that limit your population, timeline that conflicts with your capacity.
- `site_what_they_will_not_accept` (array, required): Budget levels, protocol requirements, or sponsor demands that make participation unworkable.

## Outputs
- `enrollment_feasibility_assessment` (object): Realistic enrollment commitment based on site's patient population and capacity.
- `protocol_capability_alignment` (object): Which procedures the site can perform and any gaps requiring training or equipment.
- `budget_and_payment_structure` (object): Per-patient budget, covered procedures, payment milestones, budget adjustment process.
- `site_activation_plan` (object): IRB submission, training, start-up activities, and activation timeline.
- `performance_and_quality_standards` (object): Enrollment milestones, data quality expectations, site visit schedule.
- `clinical_trial_agreement_framework` (object): Key terms for the CTA — budget, enrollment, amendments, termination.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm sponsor's protocol requirements and site's enrollment feasibility and budget both present.
**Output:** Readiness confirmation.
**Quality Gate:** Enrollment requirements and site's feasibility assessment and budget needs all present.

---

### Phase 1: Assess Feasibility and Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate site's patient population against eligibility criteria — realistic enrollment? 2. Assess site's procedural capabilities against protocol requirements. 3. Build the budget gap — site's requirement vs. sponsor's parameters. 4. Evaluate capacity and competing study conflicts.
**Output:** Enrollment feasibility assessment, procedural gap, budget gap, capacity assessment.
**Quality Gate:** Enrollment estimate is specific — number of patients per month at stated screen failure rate.

---

### Phase 2: Build the Agreement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the enrollment commitment — monthly targets, total enrollment, timelines. 2. Build the budget and payment structure — per procedure or per patient, milestone payments. 3. Define protocol modification handling — who approves, how costs are adjusted. 4. Establish the start-up plan.
**Output:** Enrollment commitment, budget structure, amendment process, start-up plan.
**Quality Gate:** Budget is built up by procedure — every line item costed, not a lump sum per patient.

---

### Phase 3: Define Performance and Governance
**Entry Criteria:** Agreement built.
**Actions:** 1. Define enrollment milestone triggers — what triggers sponsor concern, site support, or termination. 2. Build the monitoring plan — visit frequency, data expectations, issue escalation. 3. Define the termination provisions — patient safety, enrollment failure, sponsor discretion. 4. Assemble the CTA framework.
**Output:** Enrollment milestone triggers, monitoring plan, termination provisions, CTA framework.
**Quality Gate:** Enrollment triggers are specific patient numbers at specific timeframes — not "insufficient enrollment."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — enrollment feasibility, protocol capability, budget, start-up plan, monitoring, termination provisions, CTA framework.
**Quality Gate:** Sponsor knows what the site will deliver and when. Site knows the budget, the enrollment commitment, and the protocol requirements.

---

## Exit Criteria
Done when: (1) enrollment is committed by month, (2) budget is built by procedure, (3) protocol capabilities are confirmed, (4) start-up timeline is defined, (5) termination provisions are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
