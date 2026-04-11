# Staffing Agency Placement

**One-line description:** The staffing agency and the client company each submit their real requirements, candidate expectations, and fill constraints — Claude aligns on role definition, compensation range, timeline, and what success looks like so the agency fills the role and the client stops rejecting candidates for reasons never stated upfront.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agency and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_role_title` (string, required): Role being filled.
- `shared_agency_and_client` (string, required): Agency and client company names.

### Staffing Agency Submits Privately
- `agency_candidate_market_reality` (object, required): What the talent market actually looks like — availability, compensation benchmarks, competing demand, realistic time to fill.
- `agency_concerns_about_the_job_order` (array, required): What in the client's requirements will make this impossible — unrealistic comp, vague requirements, too many must-haves, slow interview process?
- `agency_what_they_need_from_the_client` (array, required): Decision speed, feedback, availability for interviews, exclusive or retained arrangement — what makes this fillable.
- `agency_fee_and_engagement_structure` (object, required): Fee percentage, guarantee period, retained vs. contingency, replacement terms.
- `agency_candidate_pipeline_assessment` (object, required): Do you have candidates for this role now? What does the pipeline look like?

### Client Company Submits Privately
- `client_real_requirements` (object, required): Must-have skills and experience — be honest about what you truly cannot compromise on vs. what you put on the job description for aspiration.
- `client_compensation_budget` (object, required): Base range, total comp, bonus, equity if applicable — the real budget, not the stated range.
- `client_timeline_urgency` (string, required): When you actually need someone and why. What happens if the role is open for 60 more days?
- `client_interview_process` (string, required): How many rounds, who is involved, how long decisions take — the real process, not the ideal.
- `client_past_hire_failures_on_this_role` (array, required): What went wrong with prior hires or searches — why did candidates reject, why did offers fall through, why did recent hires not work out?

## Outputs
- `role_definition_alignment` (object): The agreed must-haves vs. nice-to-haves — what the agency is actually filling.
- `market_reality_assessment` (object): What is realistically findable at the comp level and in the timeline — with honest trade-offs.
- `compensation_strategy` (object): Whether the budget is competitive, what to do if it is not, and how to structure the offer.
- `search_strategy` (object): How the agency will run the search — sourcing approach, timeline, candidate profile.
- `engagement_terms` (object): Fee structure, exclusivity, guarantee, process commitments from both sides.
- `success_criteria` (array): How both parties will know the search is working and when to escalate if it is not.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm role requirements and market reality present.
**Output:** Readiness confirmation.
**Quality Gate:** Client's real requirements and agency's market assessment both present.

---

### Phase 1: Assess Fit Between Requirements and Market
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare client's must-haves against what the market can provide at the stated comp — is this role fillable as described? 2. Identify the requirement or compensation gaps that will prevent a successful fill. 3. Review past hire failures — what patterns explain why this role is hard? 4. Assess the interview process against market competition — are candidates going to drop out?
**Output:** Fillability assessment, gap identification, failure pattern analysis, process risk.
**Quality Gate:** Fillability is specific — "role is fillable at $X if requirement Y is removed or if comp ceiling is raised to $Z."

---

### Phase 2: Align on the Actual Search
**Entry Criteria:** Fit assessed.
**Actions:** 1. Agree on the true must-haves vs. the preferred profile. 2. Define the compensation strategy — what to offer, how to position it in the market. 3. Build the search strategy — sourcing channels, candidate profile, timeline milestones. 4. Agree on the engagement terms — fee, exclusivity, process commitments.
**Output:** Aligned role profile, comp strategy, search plan, engagement terms.
**Quality Gate:** Role profile has explicit must-haves and explicit compromises. Timeline has milestones, not just a final date.

---

### Phase 3: Define Success and Escalation
**Entry Criteria:** Search agreed.
**Actions:** 1. Define what the client commits to — feedback speed, interview availability, decision timeline. 2. Define what the agency commits to — weekly updates, candidate flow rate, submission quality. 3. Build the escalation plan — what triggers a strategy review, what happens if the search stalls. 4. Define the guarantee and replacement terms.
**Output:** Client commitments, agency commitments, escalation triggers, guarantee terms.
**Quality Gate:** Every commitment is specific — not "timely feedback" but "feedback within 48 hours of submission."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present role definition alignment. 2. Deliver market reality assessment. 3. Deliver compensation strategy. 4. Deliver search strategy. 5. Present engagement terms and success criteria.
**Output:** Full synthesis — role definition, market reality, comp strategy, search plan, terms, success criteria.
**Quality Gate:** Agency knows what they are filling. Client knows what to expect and what they committed to.

---

## Exit Criteria
Done when: (1) must-haves are explicit and realistic, (2) comp is positioned for the market, (3) search strategy has specific milestones, (4) process commitments are specific from both sides, (5) escalation triggers defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
