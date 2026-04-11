# Family Business Succession

**One-line description:** Founder and successor each submit their real vision, fears, and financial expectations before the transition — Claude finds the gaps before they destroy the business or the family relationship, whichever matters more to you.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both founder and successor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_timeline` (string, required): Intended transition timeline, e.g., "2 years," "End of 2027."

### Founder Submits Privately
- `founder_vision_for_legacy` (string, required): What do you want this business to be after you're gone? What does the legacy look like?
- `founder_concerns_about_successor` (array, required): What are your honest concerns about this person's readiness?
- `founder_conditions` (array, required): What conditions must be met for you to hand over control?
- `founder_what_they_cannot_let_go_of` (string, required): What aspect of the business are you most afraid of losing control over? Be honest.
- `founder_financial_expectations` (object, required): What do you expect financially from this transition? Buyout, ongoing distributions, retained stake?

### Successor Submits Privately
- `successor_vision` (string, required): Where do you want to take this business? What would you change?
- `successor_what_they_would_change` (array, required): Specifically, what would you do differently from how the founder runs it?
- `successor_concerns_about_transition` (array, required): What are you worried about — the founder letting go, the business state, employee reactions?
- `successor_financial_expectations` (object, required): What do you expect financially? What's a fair structure?
- `successor_relationship_with_founder_post_transition` (string, required): What role, if any, do you want the founder to play after the handover?

## Outputs
- `alignment_map` (object): Where founder and successor share the same vision and expectations.
- `vision_gap` (object): Where the successor would take the business in a direction the founder doesn't expect — surfaced before, not after.
- `financial_alignment` (object): Gap between financial expectations with options for bridging.
- `transition_risks` (array): Top risks to a successful transition — operational, relational, and financial.
- `succession_plan_draft` (object): Timeline, decision transfer stages, financial structure, and the founder's post-transition role.
- `relationship_structure_post_transition` (object): How the founder-successor relationship changes after handover, with explicit boundaries.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm vision, financial expectations, and concerns present from both sides. Flag if `founder_what_they_cannot_let_go_of` is populated — this is the highest-risk field.
**Output:** Readiness confirmation.
**Quality Gate:** Vision and financial fields present from both sides.

---

### Phase 1: Compare Vision and Direction
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare the founder's legacy vision to the successor's intended direction. 2. Extract what the successor would change and assess how the founder would react. 3. Identify whether the successor's changes are tactical (low risk) or strategic (potentially alarming to founder). 4. Map financial expectations side by side.
**Output:** Vision comparison, change categorization, financial gap.
**Quality Gate:** What the successor would change is assessed against what the founder said they cannot let go of.

---

### Phase 2: Assess Transition Readiness
**Entry Criteria:** Vision compared.
**Actions:** 1. Assess the founder's ability to let go — their concerns and conditions reveal this. 2. Assess the successor's readiness — their concerns reveal what they're not sure about. 3. Identify the financial gap and options: buyout, earn-out, retained equity, gifted stake. 4. Assess post-transition role expectations — if the founder expects continued influence and the successor expects full autonomy, this is a collision course.
**Output:** Readiness assessment for both sides, financial options, post-transition role conflict.
**Quality Gate:** Post-transition role conflict is named directly if present.

---

### Phase 3: Draft the Succession Plan
**Entry Criteria:** Readiness assessed.
**Actions:** 1. Draft a phased transition timeline with decision-transfer milestones. 2. Draft the financial structure with 2-3 options based on both sides' expectations. 3. Define the founder's post-transition role explicitly — what they can and cannot weigh in on. 4. Name the top 3 risks with mitigation strategies. 5. Identify conversations that must happen with employees, advisors, and legal counsel.
**Output:** Succession plan draft with timeline, financial structure, post-transition role definition, risk mitigations.
**Quality Gate:** Founder's "cannot let go of" item is addressed explicitly in the plan. Financial structure options are specific.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Succession plan drafted.
**Actions:** 1. Present alignment. 2. Present vision gap — especially what the successor would change. 3. Present financial gap with options. 4. Deliver succession plan draft. 5. Name post-transition role conflicts. 6. List conversations that must happen before proceeding.
**Output:** Full synthesis — alignment, vision gap, financial options, succession plan, relationship structure, required conversations.
**Quality Gate:** Succession plan is specific enough that both parties can review it with a lawyer.

---

## Exit Criteria
Done when: (1) vision gap identified with specific changes flagged, (2) financial gap quantified with options, (3) post-transition role conflict named, (4) succession plan has phased timeline, (5) top 3 risks named with mitigations.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Successor's planned changes are significantly outside founder's vision | Name this clearly. A successor who plans to make major changes the founder doesn't know about will create a crisis the moment they're in control. |
| Phase 2 | Founder's conditions are effectively unachievable | Name the gap: "The founder's conditions may prevent a transition from ever happening. This needs a direct conversation." |

## State Persistence
- Transition milestone tracking
- Financial structure evolution
- Relationship health post-transition

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
