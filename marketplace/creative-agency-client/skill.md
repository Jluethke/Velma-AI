# Creative Agency Client Engagement

**One-line description:** A creative agency and a client each submit their real creative vision, budget, approval process, and timeline before the engagement begins — Claude aligns on a scope of work that produces great creative without the revision spiral that kills every deadline.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agency and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_client_and_agency` (string, required): Client brand name and agency name.
- `shared_project_brief` (string, required): What needs to be created — campaign, identity, content, digital, advertising, or multi-channel.

### Agency Submits Privately
- `agency_creative_approach` (object, required): How you approach this type of work — process, creative philosophy, what makes great work in this category.
- `agency_scope_and_pricing` (object, required): What is included, what is not, hourly rates, project fees, revision policy, production costs.
- `agency_resource_plan` (object, required): Who is on this account — creative director, writers, designers, strategists — and how much of their time.
- `agency_concerns_about_this_client` (array, required): Approval chain complexity, brand guardrails that constrain creative, timeline pressure, decision-maker access.
- `agency_what_kills_good_work` (array, required): Client behaviors that produce mediocre outcomes — design by committee, late feedback, brief changes mid-execution.

### Client Submits Privately
- `client_creative_vision` (object, required): What you want to feel, look, and say — target audience, brand voice, aesthetic direction, examples you love and hate.
- `client_business_objective` (object, required): What this creative must achieve — leads, brand awareness, conversion, retention — measurable outcomes.
- `client_budget_and_timeline` (object, required): Total budget, hard deadline, what is flexible, what is not.
- `client_approval_and_decision_process` (object, required): Who approves creative — names, titles, how decisions get made, how long it takes.
- `client_past_agency_problems` (array, required): What went wrong before — work that missed the mark, timelines that blew up, agencies that didn't listen.

## Outputs
- `scope_of_work` (object): Deliverables, rounds of revision, what is and is not included.
- `creative_brief_alignment` (object): Agreed creative direction, audience, tone, objectives.
- `timeline_and_milestone_plan` (object): Kickoff, concepts, revisions, final delivery — with review windows.
- `budget_and_fee_structure` (object): Project fee, hourly rates for out-of-scope, production cost structure.
- `approval_process_agreement` (object): Who reviews, in what order, turnaround time commitments.
- `engagement_framework` (object): Key terms for the statement of work — scope, fees, IP, revision policy.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm agency's scope/pricing and client's budget/timeline both present.
**Output:** Readiness confirmation.
**Quality Gate:** Agency's scope and client's objectives and budget both present.

---

### Phase 1: Align on Creative Direction and Scope
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare client's creative vision against agency's approach — is there a genuine fit? 2. Assess business objectives against what creative can realistically deliver. 3. Evaluate budget against proposed scope — what can actually be done? 4. Identify approval complexity risks.
**Output:** Creative fit assessment, objective-to-scope alignment, budget-scope gap, approval risk.
**Quality Gate:** Scope is specific deliverables with revision rounds — not "a campaign" but specific assets, formats, and quantities.

---

### Phase 2: Build the Engagement
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define the scope of work — specific deliverables, revision rounds, exclusions. 2. Build the timeline with review windows — realistic, not aspirational. 3. Define the budget and what out-of-scope costs. 4. Establish the approval process — named reviewers, turnaround commitments.
**Output:** Scope of work, timeline, budget structure, approval process.
**Quality Gate:** Every deliverable is named. Timeline includes review windows with specific days. Approval chain is named individuals.

---

### Phase 3: Define Governance and IP
**Entry Criteria:** Engagement built.
**Actions:** 1. Define IP ownership — who owns what, work for hire, usage rights. 2. Build the change order process — what triggers a change order and how it is priced. 3. Define what kills the engagement — missed approvals, budget overruns, brief changes. 4. Assemble the statement of work framework.
**Output:** IP ownership, change order process, engagement termination triggers, SOW framework.
**Quality Gate:** IP ownership is specific — what the client owns outright vs. what is licensed vs. what the agency retains.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — scope, creative direction, timeline, budget, approval process, IP ownership, SOW framework.
**Quality Gate:** Client knows exactly what they are buying. Agency knows what they are committed to deliver.

---

## Exit Criteria
Done when: (1) deliverables are named and specific, (2) revision rounds are defined, (3) timeline has review windows, (4) approval chain is named, (5) IP ownership is clear.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
