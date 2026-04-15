# Architecture Client Brief

**One-line description:** The architect and the client each submit their real vision, budget, constraints, and must-haves before design begins — AI aligns on a brief that gives the architect a clear mandate and gives the client a realistic expectation of what their budget will actually produce.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both architect and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name or description.
- `shared_architect_and_client` (string, required): Architecture firm and client names.

### Architect Submits Privately
- `architect_project_assessment` (object, required): Initial assessment of the project — complexity, constraints, comparable project experience, what excites and concerns them about the brief.
- `architect_fee_and_scope` (object, required): Proposed fee structure, services included, what is excluded — schematic design, design development, construction documents, CA.
- `architect_what_the_budget_will_produce` (string, required): Honest assessment of what the client's stated budget will actually deliver at current construction costs — what will have to give.
- `architect_design_concerns` (array, required): Site constraints, regulatory requirements, structural or mechanical challenges, program conflicts.
- `architect_what_they_need_from_the_client` (array, required): Decisions, access, approvals, timeline commitments — what slows projects down when clients do not provide it.

### Client Submits Privately
- `client_vision_and_program` (object, required): What they want to build — spaces, uses, character, how they will live or work in it.
- `client_budget` (object, required): Construction budget, soft cost budget, total project budget — what you have and what you will not exceed.
- `client_non_negotiables` (array, required): Elements that must be in the project — space types, features, design qualities that cannot be value-engineered out.
- `client_timeline` (string, required): When you need to be in the building and what milestones matter — permits, construction start, completion.
- `client_concerns_about_the_process` (array, required): What worries you — going over budget, slow approvals, contractor quality, design not matching vision?

## Outputs
- `brief_alignment_assessment` (object): Where client vision and architect's assessment agree vs. where there is a gap.
- `budget_reality_check` (object): What the budget will realistically deliver — with specific trade-offs if the vision exceeds the budget.
- `program_and_scope_definition` (object): The agreed project scope — spaces, systems, finishes level, what is included and excluded.
- `fee_and_service_agreement` (object): Services, fee structure, exclusions, reimbursables.
- `project_schedule` (object): Design phases, permitting timeline, construction duration — realistic dates.
- `decision_and_approval_framework` (object): How decisions are made, what the client approves at each phase, escalation for changes.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm client's vision and architect's assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Client's program and budget and architect's scope and fee both present.

---

### Phase 1: Assess Vision Against Budget and Constraints
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess the client's program against their budget — can it be built for what they have? 2. Identify the gap — what must be cut, phased, or value-engineered if the program exceeds the budget. 3. Map client's non-negotiables against site and regulatory constraints — what cannot be delivered regardless of budget. 4. Assess the timeline against the realistic permitting and construction schedule.
**Output:** Budget coverage assessment, program-budget gap, constraint conflicts, timeline reality.
**Quality Gate:** Budget gap is specific — "program as described pencils to $X at current costs; budget is $Y; gap is $Z concentrated in kitchen/bath finishes and structural complexity."

---

### Phase 2: Define the Brief
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define the agreed program — spaces, areas, finishes level, systems. 2. Identify what is value-engineered vs. what is deferred vs. what is removed. 3. Define the services scope — what phases, what the architect does and does not do. 4. Build the realistic project schedule.
**Output:** Agreed program, value engineering decisions, services scope, project schedule.
**Quality Gate:** Program is specific — room-by-room with approximate areas. Value engineering decisions are named, not "reduce finishes."

---

### Phase 3: Establish the Working Relationship
**Entry Criteria:** Brief defined.
**Actions:** 1. Define the fee — amount, payment schedule, what triggers additional services. 2. Define the decision framework — what client approves at each phase, turnaround expectations. 3. Define design review process — how the client provides feedback, what constitutes approval. 4. Define change management — what triggers a fee change and how it is handled.
**Output:** Fee agreement, decision framework, review process, change management.
**Quality Gate:** Decision turnaround is specific. Additional services triggers are named, not "any client-directed change."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Relationship established.
**Actions:** 1. Present brief alignment assessment. 2. Deliver budget reality check. 3. Deliver program and scope definition. 4. Deliver fee and service agreement. 5. Present project schedule and decision framework.
**Output:** Full synthesis — brief, budget reality, program, fee, schedule, decision process.
**Quality Gate:** Client knows what they are getting for their budget. Architect knows what they are designing and what they are being paid.

---

## Exit Criteria
Done when: (1) budget gap is named and trade-offs are agreed, (2) program is specific, (3) services scope has explicit inclusions and exclusions, (4) schedule has specific phase dates, (5) decision framework is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
