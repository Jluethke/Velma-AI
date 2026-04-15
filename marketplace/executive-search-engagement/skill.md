# Executive Search Engagement

**One-line description:** An executive search firm and a client company each submit their real requirements for the role, candidate criteria, and search process expectations — AI aligns on a search mandate that finds the right leader rather than the fastest placement.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both search firm and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_and_firm` (string, required): Client company name and search firm name.
- `shared_role_and_level` (string, required): Role title, reporting relationship, and function.

### Search Firm Submits Privately
- `firm_search_assessment` (object, required): How you read the mandate — where the real talent market is, what will be hard to find, realistic timeline and candidate pool.
- `firm_fee_structure` (object, required): Retained fee structure, success fee, expenses, guarantee period.
- `firm_search_process` (object, required): How you conduct the search — sourcing methodology, assessment approach, reference process, how long each stage takes.
- `firm_concerns_about_this_search` (object, required): Compensation competitiveness, internal candidate situation, decision-making process, what will make this search difficult.
- `firm_what_they_will_not_do` (array, required): Searches you will not run with the proposed parameters — compensation below market, unrealistic requirements, clients who interfere with the process.

### Client Submits Privately
- `client_real_requirements` (object, required): What you actually need — the non-negotiable skills, experience, and leadership qualities, ranked by importance.
- `client_organizational_context` (object, required): Why this role is open, organizational dynamics this person will inherit, what makes this a hard or easy role.
- `client_compensation_reality` (object, required): Approved compensation package, flexibility, equity, relocation — what you can actually offer.
- `client_decision_process` (object, required): Who is involved in the decision, how many rounds, how long it takes, what has gone wrong in prior hiring.
- `client_concerns_about_the_search` (array, required): Timeline pressure, internal candidate, board involvement, confidentiality requirements.

## Outputs
- `role_definition_alignment` (object): Agreed requirements — what is essential vs. preferred, what the right candidate profile looks like.
- `market_and_compensation_reality` (object): Whether compensation is competitive and what the talent pool actually looks like.
- `search_process_plan` (object): Sourcing approach, assessment stages, timeline, milestone plan.
- `fee_and_engagement_terms` (object): Retained fee structure, expenses, guarantee, payment schedule.
- `decision_process_alignment` (object): Who is involved, how decisions are made, what prevents a good hire from being lost in process.
- `search_agreement_framework` (object): Key terms for the search engagement agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm firm's search assessment and client's real requirements and compensation both present.
**Output:** Readiness confirmation.
**Quality Gate:** Role requirements, compensation package, and firm's market assessment all present.

---

### Phase 1: Assess the Mandate
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate requirements against realistic talent pool — is this person findable? 2. Assess compensation competitiveness — can this company win in the market? 3. Identify organizational context factors that affect candidate attraction. 4. Assess decision process risk — what will lose good candidates?
**Output:** Talent pool assessment, compensation competitiveness, attraction factors, decision process risk.
**Quality Gate:** Every market constraint is specific — not "this will be hard" but named reasons with named impact on timeline and pool.

---

### Phase 2: Define the Search Mandate
**Entry Criteria:** Assessment complete.
**Actions:** 1. Finalize the candidate requirements — essential vs. preferred, what truly matters. 2. Build the search process — sourcing, assessment, reference approach. 3. Define the timeline — milestones with specific weeks. 4. Establish the fee and engagement terms.
**Output:** Candidate requirements, search process, timeline, engagement terms.
**Quality Gate:** Requirements are prioritized — every "essential" requirement is one that would cause the client to reject an otherwise strong candidate.

---

### Phase 3: Align on Decision Process
**Entry Criteria:** Mandate defined.
**Actions:** 1. Define the decision-making process — who meets candidates, in what order, how decisions are made. 2. Build the offer process — who approves, turnaround time, negotiation authority. 3. Define the guarantee and replacement process. 4. Assemble the search agreement framework.
**Output:** Decision process, offer process, guarantee terms, search agreement framework.
**Quality Gate:** Decision process names every stakeholder with their role and turnaround commitment.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — role requirements, market reality, search process, timeline, compensation, decision process, engagement terms.
**Quality Gate:** Client knows what to expect and what they must commit to. Search firm knows the mandate and what makes this search hard.

---

## Exit Criteria
Done when: (1) candidate requirements are prioritized, (2) compensation competitiveness is assessed, (3) search process has specific milestones, (4) decision process is defined, (5) engagement terms are complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
