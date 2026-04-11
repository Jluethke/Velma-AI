# PE 100-Day Plan

**One-line description:** PE operating partner and portfolio CEO each submit their real priorities and concerns at close — Claude aligns on what is achievable, names the expectation gaps before they become relationship problems, and produces a 100-day plan both sides have committed to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both PE operating partner and portfolio CEO must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Portfolio company name.
- `shared_investment_close_date` (string, required): Investment close date.

### PE Operating Partner Submits Privately
- `pe_priorities_identified` (array, required): The top priorities the PE firm identified in diligence — what must be addressed in the first 100 days.
- `pe_value_creation_thesis` (string, required): What is the core value creation thesis? What needs to happen for the investment to generate target returns?
- `pe_concerns_about_business` (array, required): What worries you about the business that you may not have fully resolved in diligence?
- `pe_resources_they_will_provide` (array, required): What operating resources, expertise, or network is the PE firm committing to provide?
- `pe_what_they_expect_in_100_days` (object, required): What specific deliverables, milestones, or organizational changes do you expect to see by day 100?

### Portfolio Company CEO Submits Privately
- `ceo_what_they_think_needs_to_happen` (array, required): In your judgment, what are the most important things to accomplish in the first 100 days?
- `ceo_concerns_about_pe_expectations` (array, required): What about the PE firm's expected direction or pace worries you?
- `ceo_what_they_need_to_succeed` (array, required): What do you need from the PE firm — decisions, resources, runway, authority — to execute effectively?
- `ceo_what_they_think_is_unrealistic` (array, required): What about what the PE firm wants in the first 100 days do you think is unrealistic given the business realities?
- `ceo_team_capacity_reality` (object, required): What is the management team's actual capacity given current operations and the transition itself?

## Outputs
- `priority_alignment` (object): Where PE priorities and CEO priorities overlap vs. where they diverge.
- `expectation_gap_analysis` (object): Where PE's 100-day expectations exceed what the CEO believes is achievable and why.
- `100_day_plan` (object): Committed milestones for the first 30, 60, and 100 days with owners and success criteria.
- `resource_commitment` (object): What the PE firm is specifically committing to provide and by when.
- `success_metrics` (array): How both sides will measure whether the first 100 days were successful.
- `governance_cadence` (object): Meeting rhythm, reporting requirements, and escalation protocol.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm PE priorities and CEO's assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** PE priorities and CEO's view of what needs to happen both present.

---

### Phase 1: Map the Alignment and Expectation Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare PE priorities against CEO priorities — where are they aligned and where do they diverge? 2. Identify each item in the PE's 100-day expectations that the CEO believes is unrealistic — assess whether the concern is valid. 3. Check the CEO's needs list against what the PE firm has committed to provide. 4. Assess team capacity against the combined workload of operations and transformation priorities.
**Output:** Priority alignment, expectation gap with validity assessment, resource commitment vs. need, capacity check.
**Quality Gate:** Every expectation gap is specific — "PE expects sales reorganization complete by day 60; CEO believes this requires 120 days minimum given team capacity."

---

### Phase 2: Resolve the Gaps
**Entry Criteria:** Gaps mapped.
**Actions:** 1. For each expectation gap, determine whether it should be resolved by: adjusting the timeline, adjusting the scope of the deliverable, adding PE resources, or descoping other priorities. 2. Identify which PE concerns about the business require early action vs. continued monitoring. 3. Build the resource commitment — what the PE firm will specifically provide, to whom, and by when. 4. Resolve priority conflicts — when the CEO and PE firm have different top priorities, which takes precedence and why.
**Output:** Gap resolution decisions, resource commitment specifics, priority conflict resolution.
**Quality Gate:** Every expectation gap has a resolution. "We will figure it out" is not a resolution.

---

### Phase 3: Build the 100-Day Plan
**Entry Criteria:** Gaps resolved.
**Actions:** 1. Build the 30/60/100-day milestone plan with specific deliverables, owners, and success criteria. 2. Design the governance cadence — weekly CEO-PE check-in, monthly board update, 30/60/100-day review milestones. 3. Define success metrics for the 100-day period. 4. Build the escalation protocol — what triggers an unscheduled conversation.
**Output:** 100-day plan with milestones and owners, governance cadence, success metrics, escalation protocol.
**Quality Gate:** Milestones are specific and binary — either achieved or not. Success metrics are observable, not subjective.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present priority alignment and expectation gap analysis. 2. Present gap resolutions. 3. Deliver 100-day plan. 4. Deliver resource commitment. 5. Deliver governance cadence and success metrics.
**Output:** Full synthesis — alignment, expectation gaps, 100-day plan, resource commitment, governance.
**Quality Gate:** Both sides leave the session knowing exactly what they are committing to and what they can expect from each other.

---

## Exit Criteria
Done when: (1) every expectation gap has a specific resolution, (2) 100-day plan has milestones for 30/60/100 days with owners, (3) resource commitment is specific, (4) success metrics are observable, (5) governance cadence defined with escalation protocol.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
