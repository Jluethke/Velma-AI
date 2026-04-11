# Immigration Attorney Client Engagement

**One-line description:** An immigration attorney and a client each submit their real immigration goals, timeline pressures, and case facts before the engagement begins — Claude aligns on a legal strategy and engagement structure that navigates the actual pathway to the client's immigration objective without false hope or missed deadlines.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both attorney and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_attorney_and_client` (string, required): Immigration attorney/firm name and client name.
- `shared_immigration_objective` (string, required): What the client is trying to achieve — visa, green card, citizenship, asylum, work authorization, family petition.

### Attorney Submits Privately
- `attorney_case_assessment` (object, required): Your honest evaluation of the client's case — eligibility, timeline, likelihood of approval, risks.
- `attorney_recommended_strategy` (object, required): The legal pathway you recommend, alternatives, and why this approach.
- `attorney_fees_and_timeline` (object, required): Total fee estimate, government fees, what is included, what is not, realistic timeline from filing to approval.
- `attorney_concerns_about_this_case` (array, required): Prior immigration violations, criminal history, employer cooperation issues, timeline pressure that may exceed what is legally achievable.
- `attorney_what_they_will_not_do` (array, required): Strategies you will not pursue — submissions you believe are fraudulent, unrealistic timelines you will not promise.

### Client Submits Privately
- `client_immigration_history` (object, required): Full immigration history — prior visas, entries, exits, violations, applications — including anything that could affect the case.
- `client_timeline_and_pressure` (object, required): Why the timeline matters — job start date, family situation, expiring status, deportation order — what happens if the timeline is not met.
- `client_employer_and_sponsor_situation` (object, required): Employer cooperation, sponsor willingness, financial sponsorship capacity — the supporting parties' real position.
- `client_concerns_about_the_process` (array, required): What you are afraid of — delays, denials, disclosure requirements, impact on family members.
- `client_what_they_have_not_disclosed` (array, required): Facts about your history you have not mentioned — prior denials, removal proceedings, criminal matters, status violations.

## Outputs
- `legal_pathway_analysis` (object): The recommended pathway and why — eligibility, timeline, likelihood, alternatives.
- `case_risk_assessment` (object): What could complicate or defeat this case — specific risk factors and how to address them.
- `timeline_and_milestone_plan` (object): Filing sequence, USCIS processing times, what the client must do and when.
- `fee_and_government_cost_disclosure` (object): Total cost — attorney fees, USCIS fees, what is included, what might add cost.
- `client_obligations` (object): What the client must provide, what the employer/sponsor must do, disclosure requirements.
- `engagement_agreement_framework` (object): Key terms for the attorney-client engagement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm attorney's case assessment and client's full immigration history and timeline pressure both present.
**Output:** Readiness confirmation.
**Quality Gate:** Attorney's legal analysis and client's immigration history and undisclosed facts both present.

---

### Phase 1: Assess Eligibility and Risk
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate eligibility based on full immigration history including undisclosed facts. 2. Assess timeline feasibility against client's deadline. 3. Identify risk factors that could complicate the case. 4. Evaluate employer/sponsor situation.
**Output:** Eligibility assessment, timeline feasibility, risk map, sponsor assessment.
**Quality Gate:** Risk factors are specific — named prior issues with specific legal impact and specific mitigation steps.

---

### Phase 2: Build the Legal Strategy
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the recommended legal pathway with rationale. 2. Build the filing sequence and timeline — forms, supporting documents, USCIS milestones. 3. Define the employer/sponsor obligations. 4. Establish the fee structure with full government fee disclosure.
**Output:** Legal strategy, filing timeline, sponsor obligations, full fee disclosure.
**Quality Gate:** Timeline is specific — filing date, expected response date, approval window — with named USCIS processing time assumptions.

---

### Phase 3: Define Client Obligations and Risks
**Entry Criteria:** Strategy built.
**Actions:** 1. Define what the client must provide — documents, records, employer letters, financial evidence. 2. Build the disclosure strategy — how to address prior violations or complications. 3. Define the contingency plan — what happens if the primary pathway is denied. 4. Assemble the engagement agreement framework.
**Output:** Client obligations, disclosure strategy, contingency plan, engagement framework.
**Quality Gate:** Every required document is named with the standard it must meet — not "employment verification" but specific letter requirements.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — legal pathway, timeline, risk factors, full cost, client obligations, contingency plan, engagement framework.
**Quality Gate:** Client understands the realistic timeline, the risks, and what is required of them. Attorney knows the full case history.

---

## Exit Criteria
Done when: (1) eligibility is assessed with full history, (2) timeline is specific and realistic, (3) risks are named with mitigation, (4) full cost is disclosed, (5) client obligations are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
