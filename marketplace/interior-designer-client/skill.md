# Interior Designer Client Engagement

**One-line description:** An interior designer and a client each submit their real aesthetic vision, budget, and lifestyle requirements before the design begins — Claude aligns on a design engagement that produces a space the client loves without the scope creep and budget overruns that define most interior design projects.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both designer and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_designer_and_client` (string, required): Interior designer/firm name and client name.
- `shared_project_scope` (string, required): Space type, square footage, scope — full renovation, soft furnishings only, new construction, staging.

### Designer Submits Privately
- `designer_creative_approach` (object, required): Your design philosophy, process, how you approach this type of project, what makes your work distinctive.
- `designer_fees_and_scope` (object, required): Fee structure — hourly, flat fee, percentage of project, trade discounts, markup on purchases — full cost picture.
- `designer_project_assessment` (object, required): How you see this project — scope realism, budget adequacy, timeline feasibility, what will be challenging.
- `designer_concerns_about_this_client` (array, required): Decision-making speed, design-by-committee, unrealistic budget, taste that conflicts with good design, contractor relationships.
- `designer_what_they_will_not_do` (array, required): Design approaches you will not pursue, budget levels that cannot produce good work, clients you will not work with again.

### Client Submits Privately
- `client_aesthetic_vision` (object, required): What you want the space to feel like — references, style, what you love and hate, how you will use the space.
- `client_true_budget` (object, required): The actual total budget — for design fees, furniture, materials, contractors, everything — not the number you give designers before negotiating.
- `client_lifestyle_and_functional_needs` (object, required): How you actually live — family, pets, entertaining, work from home, storage, what the space must accommodate.
- `client_decision_process` (object, required): Who makes decisions, how quickly, whether there is a partner or committee, what slows decisions down.
- `client_past_design_experiences` (array, required): What went wrong before — budget blowout, design you hated, contractors who disappeared, what you will not repeat.

## Outputs
- `design_direction_alignment` (object): Agreed aesthetic direction, style vocabulary, what the space must feel and function like.
- `scope_and_phase_plan` (object): What is included, what is phased, realistic project scope given the budget.
- `budget_allocation_plan` (object): How the budget is allocated — design fees, furniture, materials, contingency.
- `designer_fee_transparency` (object): Full disclosure — fee structure, markups, trade discounts, what the designer earns.
- `project_timeline` (object): Design phases, procurement timelines, installation schedule.
- `engagement_agreement_framework` (object): Key terms for the letter of agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm designer's fees and project assessment and client's true budget and vision both present.
**Output:** Readiness confirmation.
**Quality Gate:** Designer's fee structure and client's total budget and aesthetic vision both present.

---

### Phase 1: Assess Budget and Vision Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare client's budget against what the scope realistically costs. 2. Evaluate aesthetic vision against designer's approach — genuine fit? 3. Assess decision process against design timeline requirements. 4. Identify lifestyle requirements that affect design.
**Output:** Budget-scope feasibility, aesthetic fit, decision process risk, functional requirements.
**Quality Gate:** Budget-scope gap is specific — what the client's vision costs vs. their stated budget with named elements and named costs.

---

### Phase 2: Define the Engagement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the design scope — rooms, phases, what is included and not. 2. Build the budget allocation — design fees, furniture, materials, trade costs, contingency. 3. Establish the timeline with procurement lead times. 4. Disclose the designer's full economics — fee structure, markups, trade discounts.
**Output:** Design scope, budget allocation, timeline, full fee disclosure.
**Quality Gate:** Budget allocation accounts for every cost category — not just furniture and designer fees.

---

### Phase 3: Define Process and Decision Protocol
**Entry Criteria:** Engagement defined.
**Actions:** 1. Define the design approval process — how concepts are presented, what "approval" means, how many rounds. 2. Build the change order process — what triggers additional fees. 3. Define the contractor selection and coordination role. 4. Assemble the engagement agreement framework.
**Output:** Approval process, change order protocol, contractor role, agreement framework.
**Quality Gate:** Change order triggers are specific — named types of changes with named fee impacts.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — design direction, scope, budget allocation, designer economics, timeline, approval process, agreement framework.
**Quality Gate:** Client knows the true total cost and what is included. Designer knows the vision, the decision process, and the budget.

---

## Exit Criteria
Done when: (1) design direction is aligned, (2) scope is defined with phasing, (3) budget allocation is complete, (4) designer economics are fully disclosed, (5) decision process is established.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
