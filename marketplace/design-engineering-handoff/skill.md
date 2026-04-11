# Design-Engineering Handoff

**One-line description:** Design and engineering each submit their real fidelity requirements and implementation constraints — Claude maps what must be exact vs. what can flex and produces a spec that gets built right without 12 rounds of QA feedback.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both design and engineering must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_feature_or_project` (string, required): Feature or project being handed off.

### Design Lead Submits Privately
- `design_intended_experience` (string, required): What is the experience you are designing for? What should the user feel and accomplish?
- `design_non_negotiable_interactions` (array, required): What interactions, transitions, or visual details are critical to the experience and cannot be simplified?
- `design_flexibility_areas` (array, required): Where can implementation flex on visual detail without breaking the experience?
- `design_concerns_about_implementation_fidelity` (array, required): What has been built incorrectly in the past? What gets lost in translation most often?
- `design_what_has_broken_in_past_handoffs` (array, required): Specific past examples where implementation diverged from design intent and why it mattered.

### Engineering Lead Submits Privately
- `eng_implementation_concerns` (array, required): What aspects of the design are technically complex or require significant effort to implement exactly?
- `eng_technical_constraints_on_design` (object, required): What technical constraints — browser limitations, performance requirements, component library standards — affect implementation?
- `eng_effort_to_achieve_full_fidelity` (object, required): What is the estimated effort delta between full fidelity and a simplified implementation?
- `eng_what_would_be_much_simpler_to_implement` (array, required): What design details, if simplified, would significantly reduce implementation effort without destroying the experience?
- `eng_what_breaks_the_experience_vs_what_is_polish` (string, required): In your view, what is functionally essential vs. what is aesthetic polish?

## Outputs
- `fidelity_priority_map` (object): Every design element classified — must-be-exact, implement-with-judgment, or can-simplify.
- `technical_constraint_summary` (object): The constraints engineering is working within and what they mean for the design.
- `interaction_negotiation` (object): Specific interactions where design and engineering have agreed on the implementation approach.
- `implementation_spec` (string): The handoff document — what to build, the fidelity level required for each element, and the design intent for judgment calls.
- `qa_acceptance_criteria` (array): How each component will be reviewed — what passes, what fails, and who approves edge cases.
- `escalation_process_for_fidelity_disputes` (object): How to handle disagreements during implementation before they become QA failures.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm design intent and engineering constraints present.
**Output:** Readiness confirmation.
**Quality Gate:** Non-negotiable interactions and engineering constraints both present.

---

### Phase 1: Map What Must Be Exact
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. For each design element — layout, interactions, animations, typography, color — classify it: must-be-exact, implement-with-judgment, or can-simplify. 2. Check engineering's "much simpler to implement" list against design's non-negotiables — does the simplification break a non-negotiable experience? 3. Identify where engineering's view of "aesthetic polish" conflicts with design's view of "functionally essential." 4. Prioritize based on user impact.
**Output:** Fidelity classification for every element, simplification validity check, experience-critical vs. polish list.
**Quality Gate:** Every element has a fidelity level. Design's non-negotiables are not overridden by engineering preference — but are tested against actual user impact.

---

### Phase 2: Resolve Interactions and Constraints
**Entry Criteria:** Fidelity mapped.
**Actions:** 1. For each technically complex interaction, determine the implementation approach — exact implementation, approved simplification, or alternative that achieves the same experience. 2. Document the technical constraints and what they require from the design. 3. Identify design elements that require design revision due to technical constraints. 4. Build the escalation process for fidelity disputes during implementation.
**Output:** Interaction resolution decisions, constraint-driven design revisions, escalation process.
**Quality Gate:** Every technically complex interaction has an agreed implementation approach. Design revisions required by constraints are documented, not assumed.

---

### Phase 3: Build the Handoff Spec
**Entry Criteria:** Interactions resolved.
**Actions:** 1. Write the handoff document — what to build, the fidelity level required, the design intent for each judgment-call area, and the approved simplifications. 2. Write QA acceptance criteria — specific, visual, and behavioral — for each component. 3. Define what requires design review during implementation vs. what engineering can approve independently. 4. Document the escalation path.
**Output:** Handoff spec, QA criteria, review requirements, escalation path.
**Quality Gate:** Spec is specific enough that a developer making a judgment call knows what the intent is. QA criteria are specific — "animation duration is 200ms ± 20ms" not "animation feels right."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Spec built.
**Actions:** 1. Present fidelity priority map. 2. Present technical constraint summary. 3. Deliver implementation spec. 4. Deliver QA acceptance criteria. 5. State escalation process.
**Output:** Full synthesis — fidelity map, constraints, spec, QA criteria, escalation.
**Quality Gate:** Engineering can build without guessing design intent. Design can review without rewriting QA notes for every component.

---

## Exit Criteria
Done when: (1) every element has a fidelity classification, (2) every technically complex interaction has an agreed approach, (3) spec captures design intent for judgment-call areas, (4) QA criteria are specific and measurable, (5) escalation process defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
