# Veterinary Practice Client Engagement

**One-line description:** A veterinary practice and a pet owner each submit their real concerns about their pet's health, care preferences, and financial constraints before a significant treatment decision — Claude aligns on a care plan that serves the animal's wellbeing within the owner's real circumstances without the guilt and miscommunication that make veterinary relationships difficult.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both veterinarian and pet owner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_practice_and_client` (string, required): Veterinary practice name and pet owner name.
- `shared_patient` (string, required): Pet name, species, breed, age, and presenting concern.

### Veterinarian Submits Privately
- `vet_clinical_assessment` (object, required): Diagnosis or differential, recommended treatment options, prognosis, what you believe is in the animal's best interest.
- `vet_treatment_options` (object, required): Options from least to most aggressive — what each involves, expected outcomes, costs.
- `vet_quality_of_life_assessment` (object, required): Your honest assessment of the animal's quality of life — current and projected under each treatment option.
- `vet_concerns_about_this_case` (array, required): Compliance risk, financial capacity, owner's emotional state, complexity that may require referral.
- `vet_what_they_will_recommend_against` (array, required): Treatments that are not in the animal's interest, owner requests you cannot accommodate.

### Pet Owner Submits Privately
- `owner_goals_for_the_pet` (object, required): What you want for your animal — quality of life, duration of life, what a good outcome looks like to you.
- `owner_financial_reality` (object, required): What you can actually spend — not what you feel you should spend, but what is financially real given your situation.
- `owner_concerns_about_treatment` (object, required): Fear of suffering, invasiveness, likelihood of success, recovery, lifestyle impact on the pet.
- `owner_prior_veterinary_experiences` (array, required): What has happened before — good and bad — that affects how you approach this decision.
- `owner_what_they_cannot_accept` (array, required): Treatment approaches, outcomes, or financial commitments you cannot accept.

## Outputs
- `treatment_plan_recommendation` (object): Recommended care path with rationale — what is in the animal's best interest within the owner's real constraints.
- `options_and_tradeoffs` (object): Each treatment option — outcomes, costs, what is required of the owner.
- `financial_plan` (object): Total estimated cost, payment options, what is included, what might add cost.
- `quality_of_life_framework` (object): How quality of life will be assessed at each stage and what triggers re-evaluation.
- `owner_commitment_plan` (object): What the owner must do at home — medications, monitoring, follow-up visits.
- `communication_and_follow_up_plan` (object): How progress is monitored, when to call, what constitutes an emergency.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm veterinarian's clinical assessment and owner's goals and financial reality both present.
**Output:** Readiness confirmation.
**Quality Gate:** Clinical assessment and owner's goals and financial constraints both present.

---

### Phase 1: Assess Clinical and Owner Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate each treatment option against the owner's goals and financial reality. 2. Assess quality of life considerations against owner's stated values. 3. Identify disconnects between clinical recommendation and owner's expectations. 4. Assess compliance feasibility given owner's constraints.
**Output:** Treatment-owner fit, quality of life alignment, expectation gap, compliance assessment.
**Quality Gate:** Every treatment option has a specific expected outcome, specific cost, and specific compliance requirements assessed against this owner's actual situation.

---

### Phase 2: Build the Care Plan
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the recommended care plan — specific treatment, specific timeline. 2. Build the financial plan — total cost estimate, payment approach. 3. Define the owner's home care requirements. 4. Establish the quality of life monitoring framework.
**Output:** Care plan, financial plan, home care requirements, quality of life monitoring.
**Quality Gate:** Home care requirements are specific — named medications, named frequencies, named warning signs to watch for.

---

### Phase 3: Plan Communication and Follow-Up
**Entry Criteria:** Plan built.
**Actions:** 1. Define the follow-up schedule — next appointment, check-in calls, what to monitor at home. 2. Build the decision framework — what progress at each milestone looks like, when to re-evaluate. 3. Define emergency criteria — what requires an immediate call or visit. 4. Assemble the care engagement framework.
**Output:** Follow-up schedule, decision framework, emergency criteria, engagement framework.
**Quality Gate:** Emergency criteria are specific signs and behaviors — not "if you are concerned" but named conditions.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — treatment recommendation, options and tradeoffs, financial plan, home care, follow-up schedule, emergency criteria.
**Quality Gate:** Owner understands the recommended path, the costs, and what is required of them. Veterinarian knows the owner's real goals and constraints.

---

## Exit Criteria
Done when: (1) treatment plan is specific, (2) financial plan is complete, (3) home care requirements are named, (4) follow-up schedule is defined, (5) emergency criteria are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
