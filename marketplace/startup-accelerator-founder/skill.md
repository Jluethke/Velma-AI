# Startup Accelerator Founder Engagement

**One-line description:** An accelerator program and a founding team each submit their real program expectations, equity terms, and startup needs before the cohort begins — AI aligns on an accelerator relationship where the founders get the help that actually moves their company, not just a demo day and a networking list.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both accelerator and founder must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_accelerator_and_startup` (string, required): Accelerator program name and startup/founder names.
- `shared_stage_and_sector` (string, required): Startup stage, industry, and what the company does.

### Accelerator Submits Privately
- `accelerator_program_value` (object, required): What you actually provide — mentors, capital, customer intros, media, investor network — the real value, not the brochure version.
- `accelerator_investment_terms` (object, required): Equity stake, check size, SAFE terms, pro-rata rights, any fees.
- `accelerator_selection_rationale` (object, required): Why this startup was selected — what you see, what you are betting on.
- `accelerator_concerns_about_this_team` (array, required): Founder dynamics, market size, traction, coachability, what you are worried about.
- `accelerator_what_they_expect_from_founders` (array, required): Engagement, time commitment, honesty about progress, what makes founders difficult to work with.

### Founder Submits Privately
- `founder_company_reality` (object, required): Honest current state — traction, team gaps, what is working, what is not, what this accelerator needs to know that is not in the application.
- `founder_program_goals` (object, required): What you actually need from this accelerator — specific intros, specific help, what would make this worth the equity.
- `founder_equity_position` (object, required): Your honest view of the equity ask — whether it is reasonable given your stage, other offers you have, your cap table situation.
- `founder_concerns_about_this_accelerator` (array, required): Whether the network is real, mentor quality, batch quality, whether demo day actually produces investment.
- `founder_what_they_will_not_change` (array, required): Business model elements, target market, team composition, or strategy you will not pivot regardless of mentor pressure.

## Outputs
- `program_value_alignment` (object): What the accelerator will specifically deliver for this startup.
- `equity_and_investment_terms_assessment` (object): Whether the terms are market standard and appropriate for this company's stage.
- `founder_program_commitment_plan` (object): What the founders must do to get value from the program.
- `milestone_and_progress_framework` (object): What progress looks like at 30, 60, 90 days and at demo day.
- `mentor_and_resource_plan` (object): Which mentors, which intros, which resources are being specifically committed.
- `accelerator_agreement_framework` (object): Key terms for the accelerator agreement and investment documents.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm accelerator's investment terms and program value and founder's company reality and program goals both present.
**Output:** Readiness confirmation.
**Quality Gate:** Investment terms and founder's company state and equity position both present.

---

### Phase 1: Assess Fit and Value
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate the accelerator's value proposition against what this startup actually needs. 2. Assess the equity ask against stage comparables. 3. Identify specific mentors and intros that would move this company. 4. Assess founder concerns about program authenticity.
**Output:** Value fit assessment, equity fairness, specific resource plan, concern resolution.
**Quality Gate:** Every value claim is specific — not "strong investor network" but named investors and named intros the accelerator can make.

---

### Phase 2: Define the Engagement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the specific deliverables — which mentors, which intros, what programming. 2. Build the founder commitment plan — what attendance and engagement is required. 3. Define the milestone framework for this startup specifically. 4. Establish the investment and equity terms.
**Output:** Specific deliverables, founder commitment, milestones, investment terms.
**Quality Gate:** Deliverables are commitments — "three meetings with [named investor]" not "exposure to our investor network."

---

### Phase 3: Define Governance and Exit
**Entry Criteria:** Engagement defined.
**Actions:** 1. Define the reporting and communication expectations during the program. 2. Build the post-program support — what the accelerator provides after demo day. 3. Define pro-rata rights and follow-on investment process. 4. Assemble the accelerator agreement framework.
**Output:** Communication plan, post-program support, follow-on investment terms, agreement framework.
**Quality Gate:** Post-program support is specific — named activities for a specific period after demo day.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — program value, investment terms, specific deliverables, founder commitment, milestones, post-program support, agreement framework.
**Quality Gate:** Founders know exactly what they are getting for the equity. Accelerator knows the company's real situation and what help is needed.

---

## Exit Criteria
Done when: (1) specific deliverables are committed, (2) equity terms are assessed against market, (3) milestone framework is defined, (4) founder commitment is established, (5) post-program support is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
