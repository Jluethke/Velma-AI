# Creative Collaboration

**One-line description:** Two creatives each submit their real vision, non-negotiables, and working style before a project — AI finds the creative tensions, aligns the direction, and drafts the ownership structure before the collaboration ends a friendship.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both creatives must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name or working title.
- `shared_medium` (string, required): e.g., "Album," "Short film," "Novel," "Design system," "Photography series."

### Each Creative Submits Privately
- `creative_vision` (string, required): What is this project, at its core, to you? What are you trying to make?
- `aesthetic_references` (array, required): What work — by anyone — comes closest to what you want this to be?
- `what_you_will_not_compromise_on` (array, required): What aspects of your vision are non-negotiable?
- `your_working_style` (object, required): How do you actually work? Deadlines, feedback loops, how you handle creative disagreement.
- `credit_and_ownership_expectations` (object, required): How should credit be allocated? Who owns what? What happens if the project is sold or licensed?
- `commercial_expectations` (object, required): Is this commercial? If it makes money, how is it split? What if one person wants to commercialize and the other doesn't?
- `what_success_looks_like` (string, required): What does a successful outcome mean to you?
- `what_failure_looks_like` (string, required): What would make this collaboration a failure?

## Outputs
- `creative_alignment` (object): Where both visions converge — the shared creative core.
- `vision_tensions` (array): Where the visions diverge and what those tensions mean creatively.
- `ownership_structure` (object): Proposed credit and ownership split with rationale.
- `working_agreement` (object): How creative disagreements get resolved, deadlines are set, and work is reviewed.
- `creative_direction_synthesis` (string): A synthesized creative direction statement that holds both visions.
- `collaboration_risks` (array): The specific things most likely to kill this collaboration.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both creatives have submitted.
**Actions:** Confirm `creative_vision`, `what_you_will_not_compromise_on`, and `credit_and_ownership_expectations` present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** Vision and ownership fields present from both sides.

---

### Phase 1: Find the Shared Creative Core
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Extract each person's vision and find what's genuinely shared — themes, tone, intent. 2. Compare aesthetic references — do they point toward the same creative territory? 3. Identify where the visions are pulling in different directions. 4. Note what each person will not compromise on and check whether those non-negotiables conflict.
**Output:** Shared creative core, divergence map, non-negotiable conflict check.
**Quality Gate:** Creative direction synthesis is specific enough to evaluate work against.

---

### Phase 2: Map the Ownership and Commercial Tensions
**Entry Criteria:** Creative core found.
**Actions:** 1. Compare credit and ownership expectations — are they compatible? 2. Compare commercial expectations — does one person want to commercialize what the other sees as purely artistic? 3. Assess whether working styles are compatible enough for sustained collaboration. 4. Identify what failure looks like for each person — often the clearest signal of their real priorities.
**Output:** Ownership compatibility, commercial tension, working style assessment, failure mode comparison.
**Quality Gate:** Commercial expectations are compared with specific scenarios (licensing, sale, public release).

---

### Phase 3: Draft the Agreements
**Entry Criteria:** Tensions mapped.
**Actions:** 1. Draft the creative direction synthesis — one paragraph that holds both visions. 2. Draft ownership structure with specific percentages or split logic. 3. Draft the working agreement: how creative disagreements are resolved (discuss, then one person decides, then pause), deadlines, review process. 4. Name the top 3 collaboration risks with specific prevention strategies.
**Output:** Creative direction draft, ownership structure, working agreement, risk list.
**Quality Gate:** Ownership structure covers the "what if it makes money" and "what if we break up" scenarios.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreements drafted.
**Actions:** 1. Present shared creative core. 2. Present vision tensions — name them as creative fuel, not just problems. 3. Deliver creative direction synthesis for both to ratify. 4. Deliver ownership structure. 5. Deliver working agreement. 6. Name collaboration risks.
**Output:** Full synthesis — creative core, tensions, direction synthesis, ownership, working agreement, risks.
**Quality Gate:** Both people feel their vision is represented. The tension is named as something to work with, not work around.

---

## Exit Criteria
Done when: (1) shared creative core identified, (2) non-negotiable conflicts named, (3) ownership structure covers revenue and dissolution, (4) working agreement addresses creative disagreement process, (5) top 3 collaboration risks named.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Visions are fundamentally incompatible | Name it. "These visions are pulling toward very different projects. Before proceeding, both people need to decide whether to compromise their vision or find a different collaborator." |
| Phase 2 | One person wants commercial, the other doesn't | This is a dealbreaker if unresolved. Propose a structure: "All commercial decisions require mutual consent." |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
