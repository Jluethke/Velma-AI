# Client Agency Brief

**One-line description:** Client submits what they actually need; agency submits what they actually heard — Claude finds the gap between the brief that was given and the brief that was received.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both client and agency must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_project_name` (string, required): Project name or working title.
- `shared_deliverable_type` (string, required): e.g., "Brand identity," "Website," "TV commercial," "Social campaign," "Product launch."

### Client Submits Privately
- `business_goal` (string, required): What business problem are you solving? Not the creative deliverable — the underlying business outcome you need.
- `target_audience` (object, required): Who is this for? Demographics, psychographics, what they currently think/feel/do vs. what you want them to think/feel/do.
- `budget` (object, required): Total budget including agency fees and production. Hard ceiling vs. ideal. What triggers scope reduction?
- `timeline` (object, required): When do you need final delivery? Are there hard milestones — launch event, media buy, fiscal year?
- `success_metrics` (object, required): How will you measure whether this worked? What does success look like in 6 months?
- `past_attempts` (array, optional): What has been tried before? What worked, what didn't, and why?
- `constraints` (object, optional): Brand guidelines, legal/compliance, stakeholder sign-off requirements, things that are definitely off the table.

### Agency Submits Privately
- `creative_interpretation` (object, required): What do you think you've been asked to make? Describe your creative interpretation of the brief in your own words.
- `strategic_approach` (object, required): How would you approach this strategically? What's your read on the real problem and the right solution?
- `realistic_scope` (object, required): What can you actually deliver for this budget? Where are the tradeoffs?
- `timeline_read` (object, required): Is the client's timeline achievable? What are the dependencies? What would need to go perfectly right?
- `concerns` (array, optional): What are you worried about? Brief clarity, stakeholder approval processes, budget reality, creative risk tolerance?
- `inspiration` (array, optional): What reference work or direction are you excited to pursue? What would you avoid?

## Outputs
- `brief_alignment` (object): Where client and agency are reading the brief the same way vs. where they've diverged.
- `scope_gaps` (array): Specific deliverable interpretations that diverge, with examples of what each side means.
- `timeline_reconciliation` (object): Honest assessment of timeline feasibility with risk factors and options.
- `creative_direction_draft` (object): A synthesized creative direction statement that incorporates both the client's business goal and the agency's strategic read.
- `approval_process_draft` (object): Proposed approval stages, reviewers, and decision turnaround times to prevent timeline slippage.
- `project_risks` (array): Top risks to a successful project with owner and mitigation.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both client and agency have submitted their Fabric session.

**Actions:**
1. Confirm business_goal (client) and creative_interpretation (agency) are present — these are the core comparison.
2. Confirm budget (client) and realistic_scope (agency) are present — the financial reality check.
3. Flag any absent required fields.

**Output:** Readiness confirmation or missing fields.

**Quality Gate:** business_goal and creative_interpretation are both present. Budget and realistic_scope are both present.

---

### Phase 1: Compare the Brief as Given vs. Received
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Extract the client's core intent: what business outcome they're trying to achieve, not just what they asked for.
2. Extract the agency's interpretation: what they think they're being asked to make.
3. Compare directly: does the agency's interpretation serve the client's business goal? Or has it drifted to a creative direction that's interesting but disconnected from the objective?
4. Identify brief gaps: what did the client fail to specify that the agency has had to assume?
5. Identify brief additions: what has the agency added (strategic context, audience insight, creative territory) that the client didn't include but should consider?

**Output:** Brief comparison with gaps and additions flagged.

**Quality Gate:** The comparison is specific. Vague brief language has been identified and noted as a risk.

---

### Phase 2: Assess Budget and Timeline Reality
**Entry Criteria:** Brief comparison complete.

**Actions:**
1. Budget reality: can the agency deliver the client's actual expectation for the stated budget? What are the tradeoffs? What gets cut first if budget is constrained?
2. Timeline feasibility: is the client's timeline achievable given normal production realities? What are the dependencies (client approvals, third-party productions, media deadlines)?
3. Identify approval process risks: how many stakeholders need to sign off? How long do approvals typically take? Is there a realistic path to the client's deadline?
4. Note any constraints that the client listed that the agency may not be aware of or may conflict with the creative direction.

**Output:** Budget assessment with tradeoffs, timeline feasibility with dependency map, approval risk assessment.

**Quality Gate:** Budget tradeoffs are specific. Timeline risks name specific dependencies.

---

### Phase 3: Synthesize the Creative Direction
**Entry Criteria:** Budget and timeline assessed.

**Actions:**
1. Draft a creative direction statement that combines the client's business goal with the agency's strategic read. One paragraph. Specific enough to evaluate work against.
2. Draft a target audience brief: synthesizing both sides' views of who this is for and what it needs to do to them.
3. Identify what needs to be agreed on before work starts:
   - Success metrics (how will both sides know the work worked?)
   - Creative risk tolerance (how bold can the work be?)
   - Reference points (what examples can both sides point to and agree are right?)
4. Draft the approval process with specific stages, named reviewers, and turnaround SLAs.

**Output:** Creative direction draft, audience brief, pre-work alignment items, approval process draft.

**Quality Gate:** The creative direction statement is specific enough to evaluate work against. "Bold and engaging" is not a creative direction. "Challenges the assumption that [X] by showing [target audience] that [Y]" is.

---

### Phase 4: Deliver the Brief Alignment Package
**Entry Criteria:** Creative direction synthesized.

**Actions:**
1. Present the brief comparison — what the client said vs. what the agency heard. Show specific examples of divergence.
2. Present scope gaps with what each side means.
3. Present budget reality and tradeoffs.
4. Present timeline assessment honestly. Don't soften the risks.
5. Deliver the creative direction draft for both sides to ratify.
6. Deliver the approval process draft.
7. List project risks with owners.
8. Close with the 3 conversations that need to happen before work starts.

**Output:** Full brief alignment package — brief comparison, scope gaps, budget reality, timeline assessment, creative direction draft, approval process, project risks, pre-work conversation list.

**Quality Gate:** Both sides can use this document to have a specific conversation about where they're aligned and where they need to resolve before a single pixel or word is created.

---

## Exit Criteria
Done when: (1) brief comparison maps client intent to agency interpretation specifically, (2) scope gaps are identified with examples, (3) budget tradeoffs are specific, (4) timeline risks name dependencies, (5) creative direction draft is specific enough to evaluate work against, (6) approval process has named reviewers and SLAs.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Agency's creative interpretation is completely disconnected from client's business goal | Name this directly. A beautiful campaign that doesn't serve the business objective is a failed project waiting to happen. |
| Phase 2 | Budget is insufficient for the scope the client expects | Present the realistic scope for the budget. Don't let both sides enter production with incompatible expectations. |
| Phase 3 | Client's constraints make the creative direction very narrow | Name the constraints and their impact on the creative territory. If constraints eliminate the effective creative range, that's a conversation to have before briefing starts. |
| Phase 4 | Approval process involves too many stakeholders to hit the timeline | Flag the math: if 6 stakeholders each take 3 days to respond, that's 18 days per approval round. Name the risk and recommend streamlining. |

## State Persistence
- Brief history (track how briefs evolve and where gaps typically appear)
- Approval process performance (track whether SLAs are hit)
- Creative direction evolution (how the strategic territory develops over an engagement)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
