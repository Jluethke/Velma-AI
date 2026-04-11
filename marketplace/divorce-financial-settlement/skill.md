# Divorce Financial Settlement

**One-line description:** Both parties submit their real financial priorities, non-negotiables, and fears before settlement negotiations — Claude finds the zones of agreement and sticking points so the conversation with lawyers is shorter.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both parties must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_marriage_duration` (string, required): Length of marriage.
- `shared_assets_overview` (string, required): High-level asset summary — home, retirement accounts, business interests, debts.
- `shared_children` (string, required): Children and custody situation overview.

### Each Party Submits Privately
- `priorities` (array, required): What matters most to you in the settlement? Rank your top 3 priorities.
- `non_negotiables` (array, required): What will you not compromise on?
- `financial_fears` (array, required): What are you most afraid of financially in the outcome?
- `what_a_fair_outcome_looks_like` (string, required): In your own words, what would a fair settlement look like?
- `concerns_about_the_process` (array, required): What are you worried about in how this plays out?
- `what_you_are_willing_to_compromise_on` (array, required): Where do you have flexibility?

## Outputs
- `priority_alignment` (object): Where both parties' priorities overlap — the foundation for agreement.
- `negotiation_zones` (array): Specific areas where compromise is possible based on flexibility stated by both sides.
- `potential_agreements` (array): Items that could be agreed to without significant negotiation.
- `sticking_points` (array): Items where both parties' non-negotiables conflict — needs direct resolution.
- `mediation_agenda` (object): A structured agenda for the first mediation session.
- `what_each_side_needs_to_feel_the_outcome_is_fair` (object): The emotional and financial elements each person needs for acceptance.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both parties have submitted.
**Actions:** Confirm priorities, non-negotiables, and flexibility areas present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** Non-negotiables present from both sides.

---

### Phase 1: Map Priority Overlap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare both parties' ranked priorities. 2. Identify areas where priorities align (both want the same outcome). 3. Identify areas where one party's priority conflicts with the other's non-negotiable. 4. Extract what each side is willing to compromise on.
**Output:** Priority comparison, alignment zones, conflict zones, flexibility map.
**Quality Gate:** Every non-negotiable is checked against the other side's flexibility.

---

### Phase 2: Identify What Can Be Agreed
**Entry Criteria:** Priority map complete.
**Actions:** 1. Identify items that can likely be agreed to without significant negotiation — both sides have similar priorities or both show flexibility. 2. Identify negotiation zones: areas where one side's flexibility overlaps with the other's priority. 3. Identify true sticking points: non-negotiable conflicts with no flexibility on either side. 4. Compare both sides' definition of "fair" — the gap between these definitions shapes the whole process.
**Output:** Potential agreements list, negotiation zones, sticking points, fairness definition gap.
**Quality Gate:** Sticking points are separated from negotiation zones. Nothing is labelled a sticking point if there's any flexibility on either side.

---

### Phase 3: Build the Mediation Agenda
**Entry Criteria:** Agreement landscape mapped.
**Actions:** 1. Build agenda starting with potential agreements — early wins reduce tension. 2. Move to negotiation zones with specific framing. 3. Save sticking points for last — approach with both sides' fears in mind. 4. Draft what each side needs to feel the outcome is fair — the emotional acceptance conditions.
**Output:** Mediation agenda with ordering rationale, fairness acceptance conditions.
**Quality Gate:** Agenda addresses both financial and emotional needs.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agenda built.
**Actions:** 1. Present priority alignment. 2. Present potential agreements. 3. Present negotiation zones with framing. 4. Name the sticking points directly. 5. Deliver mediation agenda. 6. Present what each side needs to feel the outcome is fair.
**Output:** Full synthesis — alignment, agreements, negotiation zones, sticking points, agenda, fairness conditions.
**Quality Gate:** Both parties understand where agreement is possible and where the real work is. Nothing is softened.

---

## Exit Criteria
Done when: (1) potential agreements identified, (2) negotiation zones mapped with both sides' flexibility, (3) sticking points named with specific conflicts, (4) mediation agenda ordered for maximum progress, (5) fairness conditions articulated for both sides.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Non-negotiables on both sides conflict on the same asset | Name the sticking point directly and suggest professional mediation for that specific item. |
| Phase 3 | One side's fear is that the other side is being dishonest about assets | Note this and recommend full financial disclosure as a prerequisite. |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
