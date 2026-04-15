# OKR Alignment

**One-line description:** Manager and team lead each submit their real priorities and capacity constraints before OKR setting — AI surfaces the conflicts between company direction and team reality, and produces a negotiated OKR set both sides can commit to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both manager and team lead must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_period` (string, required): e.g., "Q2 2026" or "H1 2026."

### Manager Submits Privately
- `company_objectives` (array, required): The company-level objectives this team needs to contribute to.
- `manager_priorities` (array, required): Your specific priorities for this team this period. What matters most?
- `manager_concerns_about_team_direction` (array, required): What are you worried the team will focus on that doesn't align with company priorities?
- `manager_non_negotiables` (array, required): What must be in the OKRs, regardless of capacity?

### Team Lead Submits Privately
- `team_proposed_okrs` (array, required): Your proposed OKRs for this period. What does the team think they should focus on?
- `team_capacity_reality` (object, required): What is the team's actual capacity? What's already committed? What will prevent new work from getting done?
- `team_concerns_about_company_direction` (array, required): What company objectives worry you in terms of feasibility or fit?
- `team_what_they_need_to_succeed` (array, required): What resources, clarity, or decisions do you need to execute well?

## Outputs
- `alignment_map` (object): Where manager priorities and team proposed OKRs point in the same direction.
- `okr_conflicts` (array): Specific conflicts between what the manager wants and what the team proposed or can realistically do.
- `capacity_reality_check` (object): Honest assessment of whether the desired OKRs are achievable given the team's actual capacity.
- `negotiated_okr_set` (array): A proposed OKR set that incorporates both sides, with realistic key results.
- `dependency_map` (array): Things the team needs from other teams, leadership, or the manager to hit the OKRs.
- `success_conditions` (array): What needs to be true for these OKRs to be achievable.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm `company_objectives`, `team_proposed_okrs`, and `team_capacity_reality` present.
**Output:** Readiness confirmation.
**Quality Gate:** Both OKR proposals and capacity reality present.

---

### Phase 1: Map Alignment and Conflicts
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map each company objective to the team's proposed OKRs — does the team's proposal address the company priorities? 2. Identify OKRs the team proposed that the manager would deprioritize. 3. Identify manager priorities the team hasn't addressed. 4. Flag manager non-negotiables that conflict with team capacity.
**Output:** Alignment map, conflict list, unaddressed priority list.
**Quality Gate:** Every manager non-negotiable is checked against team capacity.

---

### Phase 2: Reality-Check the Capacity
**Entry Criteria:** Conflicts mapped.
**Actions:** 1. Assess whether the combined desired OKRs are achievable given the team's stated capacity. 2. Calculate the gap between desired scope and realistic capacity. 3. Identify which OKRs need to be descoped, deferred, or resourced differently.
**Output:** Capacity gap, prioritization options.
**Quality Gate:** Capacity gap is quantified (not just "too much to do").

---

### Phase 3: Draft the Negotiated OKR Set
**Entry Criteria:** Capacity assessed.
**Actions:** 1. Build a negotiated OKR set: manager non-negotiables in, adjusted for team capacity. 2. Write specific, measurable key results for each objective. 3. Flag OKRs that require external dependencies. 4. Draft the success conditions: what needs to be true for these to be achievable.
**Output:** Negotiated OKR set with key results, dependency map, success conditions.
**Quality Gate:** Key results are specific and measurable. Stretch vs. committed OKRs are distinguished.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** OKR set drafted.
**Actions:** 1. Present alignment. 2. Present conflicts with resolution. 3. Present capacity reality check. 4. Deliver negotiated OKR set. 5. Deliver dependency map. 6. State success conditions.
**Output:** Full synthesis — alignment, conflicts, capacity check, OKR set, dependencies, success conditions.
**Quality Gate:** Both manager and team lead can commit to this set. No OKR is present without the capacity to achieve it.

---

## Exit Criteria
Done when: (1) every manager non-negotiable is accounted for, (2) capacity gap quantified, (3) negotiated OKR set has specific measurable key results, (4) dependencies named, (5) success conditions stated.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
