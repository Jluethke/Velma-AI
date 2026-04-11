# Org Design

**One-line description:** Two executives each submit their real views on org structure and concerns about each other's approach — Claude finds the structural consensus, names the real tensions, and recommends a design both sides can commit to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both executives must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_context` (string, required): Why is org design being revisited? e.g., "Post-acquisition integration," "Scaling from 50 to 200," "Functional to product org."

### Each Executive Submits Privately
- `exec_view_on_structure` (object, required): What structure do you think the company needs and why?
- `exec_concerns_about_current_org` (array, required): What's broken about the current structure?
- `exec_non_negotiables` (array, required): What aspects of your function or team cannot be compromised?
- `exec_concerns_about_other_exec` (array, required): What about the other executive's likely preferences or approach worries you?

## Outputs
- `structural_alignment` (object): Where both executives agree on what the org needs.
- `tension_zones` (array): Structural tensions — ownership conflicts, reporting line disputes, functional vs. product debates.
- `design_options` (array): 2-3 structural options with tradeoffs for each.
- `decision_rights_implications` (object): How each option changes who controls what.
- `change_management_risks` (array): Top risks to successful implementation.
- `recommended_structure` (object): A recommended structure with rationale, addressing both sides' non-negotiables.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm structural views and non-negotiables present from both executives.
**Output:** Readiness confirmation.
**Quality Gate:** Both views and non-negotiables present.

---

### Phase 1: Find the Structural Consensus
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Extract both views on structure and find the shared ground. 2. Identify where the two views conflict — ownership, reporting lines, team boundaries. 3. Check each executive's non-negotiables against the other's position.
**Output:** Structural alignment, conflict map, non-negotiable clash check.
**Quality Gate:** Non-negotiable conflicts are named explicitly.

---

### Phase 2: Design Options
**Entry Criteria:** Consensus and conflicts mapped.
**Actions:** 1. Build 2-3 structural options that represent the real design space. 2. For each option, assess: who controls what, what problems it solves, what new problems it creates. 3. Assess change management complexity for each.
**Output:** 3 design options with decision rights and change management implications.
**Quality Gate:** Each option addresses the shared concerns. No option is a strawman.

---

### Phase 3: Recommend
**Entry Criteria:** Options built.
**Actions:** 1. Recommend a structure that best addresses both sides' non-negotiables and the company context. 2. Name what each executive gives up and why it's worth it. 3. Draft the top change management risks and mitigations.
**Output:** Recommendation with rationale, trade-offs named, change management risks.
**Quality Gate:** Recommendation is specific, not "a hybrid approach." Tradeoffs are honest.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Recommendation made.
**Actions:** 1. Present structural alignment. 2. Present tension zones. 3. Deliver design options. 4. Deliver recommendation. 5. Name change management risks.
**Output:** Full synthesis — alignment, tensions, options, recommendation, risks.
**Quality Gate:** Both executives understand what they're agreeing to and what they're giving up.

---

## Exit Criteria
Done when: (1) structural alignment and conflicts named, (2) non-negotiable conflicts addressed, (3) 3 design options with decision rights implications, (4) recommendation with specific rationale.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
