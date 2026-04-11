# Process Design

**One-line description:** Two team leads each submit their real workflow pain points, non-negotiables, and concerns about the other team before redesigning a shared process — Claude maps the conflicts, drafts the redesigned process, and defines the handoffs.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both team leads must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_process_name` (string, required): Name of the process being redesigned. e.g., "Sales to CS handoff," "Engineering to QA release process."
- `shared_current_problem` (string, required): What's broken about the current process?

### Team Lead A Submits Privately
- `team_a_current_workflow` (object, required): How does your team currently execute this process? Steps, tools, timing.
- `team_a_pain_points` (array, required): What's broken from your team's perspective? Be specific about where time is wasted, errors happen, or handoffs fail.
- `team_a_non_negotiables` (array, required): What aspects of how your team works cannot change?
- `team_a_concerns_about_team_b` (array, required): What does Team B do — or not do — that causes your team problems?
- `team_a_what_they_need_to_change` (array, required): What changes do you need Team B to make for the process to work?

### Team Lead B Submits Privately
- `team_b_current_workflow` (object, required): How does your team currently execute this process? Steps, tools, timing.
- `team_b_pain_points` (array, required): What's broken from your team's perspective?
- `team_b_non_negotiables` (array, required): What aspects of how your team works cannot change?
- `team_b_concerns_about_team_a` (array, required): What does Team A do — or not do — that causes your team problems?
- `team_b_what_they_need_to_change` (array, required): What changes do you need Team A to make for the process to work?

## Outputs
- `pain_point_alignment` (object): Where both teams agree the process is broken vs. where they see the problem differently.
- `workflow_conflicts` (array): Specific points where Team A's workflow conflicts with Team B's — timing, ownership, tooling, standards.
- `redesigned_process_draft` (object): Step-by-step redesigned process with owners at each step.
- `handoff_definition` (object): Exact handoff criteria — what must be true before Team A hands to Team B, and vice versa.
- `success_metrics` (array): How both teams will know the new process is working.
- `change_management_plan` (object): What each team needs to change, sequenced by what to do first.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm workflow descriptions and pain points present from both teams.
**Output:** Readiness confirmation.
**Quality Gate:** Both workflow descriptions and pain point lists present.

---

### Phase 1: Map the Conflicts
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare the two workflow descriptions — where do they assume different things about timing, ownership, or standards? 2. Cross-reference Team A's concerns about Team B against Team B's self-described workflow — is the concern accurate? 3. Do the same for Team B's concerns about Team A. 4. Identify non-negotiable conflicts — where Team A's non-negotiable clashes with what Team B needs to change.
**Output:** Workflow conflict map, concern accuracy check, non-negotiable clash analysis.
**Quality Gate:** Every conflict is specific — "Team A closes the ticket before Team B has completed QA" not "there are handoff issues."

---

### Phase 2: Diagnose the Root Cause
**Entry Criteria:** Conflicts mapped.
**Actions:** 1. For each conflict, identify whether the root cause is ownership ambiguity, tooling mismatch, timing mismatch, or standards disagreement. 2. Identify which pain points are caused by the other team's behavior vs. structural process gaps that neither team created. 3. Identify the single highest-leverage change that would improve the process for both teams.
**Output:** Root cause analysis by conflict, structural vs. behavioral diagnosis, highest-leverage intervention.
**Quality Gate:** Root causes are specific enough that a redesign can address them. Blame is separated from structural cause.

---

### Phase 3: Design the New Process
**Entry Criteria:** Root causes diagnosed.
**Actions:** 1. Draft the redesigned process step-by-step with explicit owners at each step. 2. Define exact handoff criteria — what conditions must be met before ownership transfers. 3. Identify which non-negotiables from each team are preserved and which must be compromised. 4. Build success metrics that both teams can observe. 5. Draft the change management plan — what each team changes first, what comes second.
**Output:** Redesigned process, handoff definition, non-negotiable disposition, success metrics, change management plan.
**Quality Gate:** Handoff criteria are binary — either the condition is met or it is not. No "when it feels ready" language.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Process designed.
**Actions:** 1. Present pain point alignment and conflict map. 2. Present root cause analysis. 3. Deliver redesigned process with owners. 4. Deliver handoff definition and success metrics. 5. Deliver change management plan.
**Output:** Full synthesis — conflict map, root causes, redesigned process, handoff definition, success metrics, change management plan.
**Quality Gate:** Both team leads know exactly what they're agreeing to change and what the handoff looks like from both sides.

---

## Exit Criteria
Done when: (1) every workflow conflict mapped with root cause, (2) redesigned process has explicit step owners, (3) handoff criteria are specific and binary, (4) success metrics are observable by both teams, (5) change management plan is sequenced.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
