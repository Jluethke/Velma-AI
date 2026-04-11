# Roommate Agreement

**One-line description:** Both roommates submit their real expectations about sleep, guests, cleanliness, noise, and money before moving in — Claude finds the incompatibilities before they become passive-aggressive notes on the fridge.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both roommates must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_living_situation` (string, required): e.g., "2BR apartment, both names on lease, moving in July 1."

### Each Roommate Submits Privately
- `sleep_schedule` (object, required): When do you sleep and wake up? How sensitive are you to noise at night?
- `guests_and_partners` (object, required): How often do you have guests? Overnight stays? A partner who's effectively a third roommate? What's acceptable?
- `cleanliness_standard` (object, required): What does "clean" mean to you? How often should shared spaces be cleaned? What's your threshold before it bothers you?
- `noise_and_quiet_hours` (object, required): Music, TV, phone calls, video game nights. When and how loud?
- `shared_spaces` (object, required): Kitchen use, bathroom time, fridge space, living room scheduling.
- `bills_and_expenses` (object, required): How should shared costs be split? Groceries, cleaning supplies, household items?
- `communication_style` (string, required): How do you prefer to handle issues — direct conversation, text, avoid unless critical?
- `dealbreakers` (array, required): What would make living together unworkable for you?
- `what_a_good_living_situation_looks_like` (string, required): What does a good roommate situation look like to you day-to-day?

## Outputs
- `compatibility_map` (object): Areas of genuine alignment vs. tension zones.
- `tension_zones` (array): Specific areas of incompatibility with severity — minor / worth discussing / potential dealbreaker.
- `household_agreement_draft` (string): Plain-English household rules covering all key areas, ready to edit.
- `conflict_resolution_process` (string): How disagreements get raised and resolved.
- `review_schedule` (string): Recommended check-in cadence to prevent buildup.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both roommates have submitted.
**Actions:** Confirm all required fields present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** `dealbreakers` and `cleanliness_standard` present from both sides.

---

### Phase 1: Map Compatibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare every input category side by side. 2. Score each: aligned / workable difference / significant tension / potential dealbreaker. 3. Pay special attention to cleanliness standards and guest policies — these are the two most common roommate conflict sources. 4. Flag if either side's dealbreakers are implicitly present in the other's answers.
**Output:** Category-by-category compatibility map with scores.
**Quality Gate:** Dealbreaker conflicts are flagged even if implicit.

---

### Phase 2: Assess the Tension Zones
**Entry Criteria:** Compatibility map complete.
**Actions:** 1. For each tension zone, describe what the daily friction looks like in practice. 2. Assess whether each tension is resolvable with a clear rule, or requires ongoing negotiation. 3. Identify the one tension most likely to end the living arrangement if unaddressed.
**Output:** Tension zone analysis with practical descriptions and resolution assessments.
**Quality Gate:** Each tension is described as a real scenario, not an abstract label.

---

### Phase 3: Draft the Household Agreement
**Entry Criteria:** Tension zones assessed.
**Actions:** 1. Draft specific rules for each category — not vague preferences, specific agreements. 2. For tension zones, propose a rule that meets both sides' core need. 3. Draft the conflict resolution process: how either roommate raises an issue and how it gets resolved. 4. Set a recommended check-in schedule.
**Output:** Household agreement draft with rules, conflict process, and check-in schedule.
**Quality Gate:** Every tension zone has a proposed rule. Rules are specific enough to evaluate compliance.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement drafted.
**Actions:** 1. Present the compatibility map. 2. Name the tension zones with practical descriptions. 3. Deliver the household agreement draft. 4. Deliver the conflict resolution process. 5. Close: "This agreement is yours to edit. Review it together before moving in."
**Output:** Full synthesis — compatibility map, tension zones, household agreement, conflict process, review schedule.
**Quality Gate:** Both roommates could sign this and know what they're agreeing to.

---

## Exit Criteria
Done when: (1) every category mapped, (2) tension zones described practically, (3) agreement covers all key areas with specific rules, (4) conflict process is clear, (5) check-in schedule set.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Cleanliness standards are significantly incompatible | Name this as a high-risk tension. "One person's 'normal' is another person's 'disgusting.' This needs a direct conversation before moving in." |
| Phase 3 | Dealbreaker conflict is present | Flag as a potential incompatibility. Recommend the two people discuss it before signing a lease. |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
