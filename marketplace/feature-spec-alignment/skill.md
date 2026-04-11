# Feature Spec Alignment

**One-line description:** Product and engineering each submit their real requirements and technical constraints before a feature is specced — Claude aligns on what is buildable, surfaces architectural concerns early, and produces a spec both sides have actually agreed to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both product and engineering must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_feature_name` (string, required): Feature name.

### Product Manager Submits Privately
- `product_desired_outcome` (string, required): What does this feature accomplish for the user? What problem does it solve?
- `product_user_problem` (string, required): What is the user experiencing that this feature addresses? Include evidence — user research, support tickets, sales feedback.
- `product_proposed_solution` (object, required): What is your proposed solution? How should it work from the user's perspective?
- `product_success_metrics` (object, required): How will you know if this feature is successful?
- `product_timeline_requirements` (string, required): When does this need to ship? What is driving the timeline?

### Engineering Lead Submits Privately
- `eng_technical_constraints` (object, required): What constraints does the current architecture impose on how this can be built?
- `eng_complexity_and_effort_estimate` (object, required): How complex is this to build? What is the effort estimate?
- `eng_architectural_concerns` (array, required): What architectural risks or concerns does this feature create? Does it create tech debt, scalability issues, or security risks?
- `eng_what_is_not_possible_in_timeline` (array, required): What aspects of the proposed solution cannot be delivered in the stated timeline?
- `eng_alternative_approaches` (array, required): Are there simpler or more technically sound ways to achieve the user outcome?

## Outputs
- `requirements_feasibility_assessment` (object): Which requirements are feasible, which require trade-offs, and which are not possible in the timeline.
- `scope_and_timeline_alignment` (object): What can be built in the timeline and what must be deferred.
- `technical_constraint_summary` (object): The architectural constraints and what they mean for implementation.
- `alternative_approaches` (array): Engineering's suggested alternatives with user outcome assessment.
- `agreed_spec_draft` (string): The feature specification both sides have agreed to — user outcome, scope, behavior, edge cases.
- `acceptance_criteria` (array): Specific, testable criteria that define when the feature is done.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm user problem and technical constraints present.
**Output:** Readiness confirmation.
**Quality Gate:** User problem statement and engineering constraints both present.

---

### Phase 1: Assess Feasibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Review each element of the proposed solution against the technical constraints — what is straightforward, what requires significant engineering work, what is not feasible in the current architecture. 2. Check the timeline requirement against the effort estimate — is it achievable? 3. Identify architectural concerns that should affect the design decision. 4. Assess whether engineering's alternative approaches achieve the same user outcome.
**Output:** Solution element feasibility map, timeline vs. effort check, architectural concern list, alternative approach assessment.
**Quality Gate:** Every solution element has a feasibility status — "straightforward," "complex but feasible," "not feasible in timeline," or "not feasible without rearchitecture."

---

### Phase 2: Align on Scope
**Entry Criteria:** Feasibility assessed.
**Actions:** 1. Define what ships in the first version vs. what is deferred — based on timeline, user outcome priority, and technical risk. 2. Resolve the tension between product's timeline requirements and engineering's "not possible in timeline" items. 3. Evaluate whether a simpler version that achieves the core user outcome should be prioritized over the full solution. 4. Identify edge cases and error states that must be handled.
**Output:** V1 scope vs. deferred list, timeline tension resolution, edge case list.
**Quality Gate:** Scope decision is specific — "V1 includes X, defers Y to V2." Deferred items are not abandoned — they have a next step.

---

### Phase 3: Write the Spec
**Entry Criteria:** Scope aligned.
**Actions:** 1. Draft the feature specification — user outcome, feature behavior, scope boundaries, and edge case handling. 2. Incorporate engineering's constraints and the agreed scope. 3. Write acceptance criteria that are specific, testable, and binary. 4. Identify what monitoring or analytics need to be built to measure the success metrics.
**Output:** Feature spec draft, acceptance criteria, monitoring requirements.
**Quality Gate:** Spec is specific enough that a developer can build from it without ambiguity. Acceptance criteria are testable — "user can complete X action in under Y steps" not "feature works correctly."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Spec written.
**Actions:** 1. Present feasibility assessment. 2. Present scope alignment and what is deferred. 3. Deliver agreed spec draft. 4. Deliver acceptance criteria. 5. State technical constraints and architectural concerns.
**Output:** Full synthesis — feasibility, scope, spec, acceptance criteria, technical constraints.
**Quality Gate:** Product and engineering can hand this spec to the team knowing it reflects what was actually agreed, not what one side assumed.

---

## Exit Criteria
Done when: (1) every solution element has feasibility status, (2) V1 scope defined with deferred items having next steps, (3) spec is specific enough to build from, (4) acceptance criteria are testable, (5) architectural concerns documented.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
