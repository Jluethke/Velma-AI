# Contract Scope Alignment

**One-line description:** Client and contractor each submit what they actually expect before signing — Claude surfaces the scope, budget, and timeline divergences and produces a draft Statement of Work.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both client and contractor must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_project_name` (string, required): What is this project called?
- `shared_project_type` (string, required): e.g., "Website redesign," "Brand identity," "Software integration," "Marketing campaign."

### Client Submits Privately
- `project_description` (string, required): What do you need built or done? Be specific about what success looks like.
- `budget_ceiling` (object, required): Hard ceiling vs. ideal budget. Is there flexibility? What triggers scope reduction?
- `timeline` (object, required): When do you need delivery? Are there hard deadlines (launch event, board presentation, fiscal year)?
- `success_definition` (object, required): How will you know this worked? What are you measuring?
- `flexibility_areas` (object, optional): What could be cut if budget or timeline gets tight? What is non-negotiable?
- `concerns` (array, optional): What are you worried about? Past project failures, communication issues, quality concerns?

### Contractor Submits Privately
- `scope_interpretation` (object, required): What do you think you've been asked to build? List specific deliverables as you understand them.
- `realistic_timeline` (object, required): What does an honest timeline look like for this scope? What is the risk to the client's desired timeline?
- `pricing_rationale` (object, required): How do you price this? Fixed fee, hourly, or milestone-based? What assumptions drive the number?
- `constraints` (object, required): What dependencies, client inputs, or approvals do you need to execute? What slows you down most?
- `concerns` (array, optional): What are you worried about? Scope creep, unclear decision-making, budget reality, timeline?
- `flexibility_areas` (object, optional): What could be phased or descoped if needed? What would you never cut?

## Outputs
- `scope_alignment_map` (object): Where client and contractor agree on deliverables vs. where interpretations diverge, with specific examples of each gap.
- `budget_bridge` (object): Gap between client's budget and contractor's pricing with options — full scope, phased delivery, descoped version.
- `timeline_reconciliation` (object): Honest assessment of timeline feasibility with risk factors and options.
- `risk_register` (array): Top risks to project success with owner assignment and mitigation approach.
- `sow_draft` (string): Plain-English Statement of Work covering scope, deliverables, timeline, payment terms, revision policy, and out-of-scope definition.
- `negotiation_priorities` (array): The 3 items to resolve in the kickoff call, in priority order.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both client and contractor have submitted their Fabric session.

**Actions:**
1. Confirm both sides contain all required inputs. Flag if scope_interpretation or project_description is absent — these are the critical comparison points.
2. Note any fields that are vague or incomplete and flag them in the synthesis.

**Output:** Readiness confirmation or fields needing more detail.

**Quality Gate:** Both sides submitted. At minimum, project_description (client) and scope_interpretation (contractor) are present.

---

### Phase 1: Extract the Deliverable Lists
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. From the client: extract the actual deliverable list — both what they stated and what they implied.
2. From the contractor: extract their deliverable interpretation as a concrete list.
3. Create a comparison table: what the client thinks they're getting vs. what the contractor thinks they're building. Item by item.
4. Flag anything the client listed that the contractor didn't mention.
5. Flag anything the contractor included that the client didn't ask for.
6. Identify scope creep setups: anything the client mentioned in passing that the contractor may interpret as in-scope.

**Output:** Side-by-side deliverable comparison table with flagged gaps and additions.

**Quality Gate:** Both deliverable lists are explicit and specific. Vague items (e.g., "website") are broken into components.

---

### Phase 2: Assess Budget and Timeline Reality
**Entry Criteria:** Deliverable comparison complete.

**Actions:**
1. Budget gap: Is the contractor's pricing compatible with the client's budget? Quantify the gap. Assess whether it's bridgeable with descoping, phasing, or payment terms.
2. Timeline feasibility: Is the client's desired timeline achievable given the contractor's honest estimate? What are the specific risk factors? What would have to go perfectly right?
3. Dependency asymmetry: Does the contractor need approvals, content, or decisions from the client that the client hasn't budgeted time for? This is the most common hidden cause of delays.
4. Assess both sides' flexibility areas for negotiating room.

**Output:** Budget gap with bridging options, timeline feasibility assessment with risk factors, dependency map.

**Quality Gate:** Budget gap is quantified with specific numbers. Timeline risk factors are specific (e.g., "requires client content delivery by Week 2"), not generic.

---

### Phase 3: Draft the Statement of Work
**Entry Criteria:** Budget and timeline assessed.

**Actions:**
1. List all deliverables explicitly — no vague language. "Website" → specific pages, features, and exclusions.
2. Define out-of-scope with equal specificity to in-scope.
3. Set milestone-based payment terms reflecting both sides' risk tolerance.
4. Define the revision policy: number of rounds, what constitutes a round, what triggers additional charges.
5. Set a client decision turnaround SLA — the most common cause of timeline slippage.
6. Include a change order process: how scope changes are requested, priced, and approved.
7. Include acceptance criteria: how both sides know a deliverable is complete.

**Output:** Draft SOW covering scope, deliverables, timeline, payment milestones, revision policy, decision SLA, change order process, acceptance criteria.

**Quality Gate:** Every item flagged in the deliverable comparison table is addressed in the SOW — either included with specifics or explicitly excluded.

---

### Phase 4: Deliver the Alignment Package
**Entry Criteria:** SOW drafted.

**Actions:**
1. Present the scope comparison table first — this is usually the biggest surprise.
2. Present the budget bridge with options clearly labeled.
3. Present timeline assessment honestly. Don't soften the risk.
4. Present the risk register with owners and mitigations.
5. Deliver the SOW draft labeled as a starting point. Both sides should edit before signing.
6. Close with the 3 negotiation priorities for the kickoff call.

**Output:** Full alignment package — scope comparison, budget bridge, timeline assessment, risk register, SOW draft, negotiation priorities.

**Quality Gate:** Both parties can read this and immediately identify the conversations they need to have. The SOW is specific enough that a lawyer could use it as a foundation.

---

## Exit Criteria
Done when: (1) deliverable gap is mapped item by item, (2) budget gap is quantified with at least two options, (3) timeline feasibility is assessed with specific risk factors, (4) risk register covers top 5 risks with owners, (5) SOW draft covers scope, timeline, payment, revisions, and change orders.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 0 | Scope descriptions are completely different in nature | This is the most valuable finding. A complete scope mismatch caught before signing saves both sides a failed project. Highlight this prominently. |
| Phase 2 | Budget is fundamentally insufficient for the scope | Name the gap with numbers. Present the descoped version that fits the budget. Don't just say "this won't work." |
| Phase 3 | Client has a hard deadline the contractor says is unachievable | Present the three options: reduced scope, additional resources, or delayed launch. Flag the risk if none are acceptable. |
| Phase 4 | Contractor's constraints reveal the client needs to do work they haven't planned for | Quantify the client-side effort required. This is often the most surprising finding for clients. |

## State Persistence
- Project history (scope, budget, and timeline patterns across engagements)
- Revision and change order history
- Dependency patterns (which client inputs consistently caused delays)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
