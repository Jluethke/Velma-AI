# Tech Debt Prioritization

**One-line description:** Engineering and product each submit their real debt inventory and roadmap constraints — Claude models the trade-offs and produces a prioritized plan both sides have actually agreed to fund.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both engineering and product must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_planning_horizon` (string, required): Planning period. e.g., "Q3 2026," "H2 2026."

### Engineering Lead Submits Privately
- `eng_debt_inventory` (array, required): List of tech debt items with description and affected systems.
- `eng_risk_ratings` (object, required): Risk level for each item if left unaddressed — what fails, when, and how severely.
- `eng_effort_estimates` (object, required): Estimated engineering effort per item in weeks/sprints.
- `eng_what_is_causing_most_pain` (array, required): Top items that are slowing down feature development right now.
- `eng_what_creates_risk_if_ignored` (array, required): Items that create security, reliability, or data integrity risk.

### Product Lead Submits Privately
- `product_roadmap_priorities` (array, required): The feature roadmap for the planning horizon — what product needs engineering to build.
- `product_capacity_needed` (object, required): How much engineering capacity does the roadmap require?
- `product_what_they_will_trade` (string, required): What feature work would you delay or descope to fund tech debt reduction?
- `product_reliability_concerns` (array, required): What reliability or performance issues are customers complaining about?
- `product_concerns_about_eng_estimates` (array, required): What do you think engineering is over- or under-estimating?

## Outputs
- `debt_risk_matrix` (array): Tech debt items ranked by business risk and effort.
- `capacity_trade_off_model` (object): What the roadmap costs vs. what debt reduction costs at different allocation splits.
- `prioritized_debt_backlog` (array): Ordered debt items with rationale for priority.
- `roadmap_impact_assessment` (object): What features get delayed at each debt investment level.
- `investment_recommendation` (object): Recommended capacity split with rationale.
- `agreed_allocation_plan` (object): Committed allocation for the planning horizon.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm debt inventory and roadmap priorities present.
**Output:** Readiness confirmation.
**Quality Gate:** Debt inventory with risk ratings and roadmap with capacity requirements both present.

---

### Phase 1: Map the Risk and Capacity Conflict
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build the debt risk matrix — rate each item by business risk (security/reliability/velocity) and effort. 2. Calculate total capacity required for the roadmap vs. what would be needed to address high-priority debt. 3. Identify debt items that overlap with product's reliability concerns — these are doubly justified. 4. Identify where product's capacity estimate conflicts with engineering's.
**Output:** Debt risk matrix, capacity conflict map, overlapping reliability concerns.
**Quality Gate:** Every high-risk debt item has a business consequence stated — not "it will become a problem" but "this will cause X to fail under Y conditions."

---

### Phase 2: Model the Trade-Offs
**Entry Criteria:** Risk mapped.
**Actions:** 1. Model three capacity allocation scenarios: 0% debt / 100% roadmap, 20% debt / 80% roadmap, 40% debt / 60% roadmap. 2. For each scenario: what debt gets addressed, what roadmap features are delayed, and what residual risk remains. 3. Identify the tipping point — where does debt compound and create more roadmap drag than the allocation costs? 4. Assess product's willingness to trade.
**Output:** Three allocation scenarios with debt coverage and roadmap impact.
**Quality Gate:** Each scenario has specific features delayed and specific risks addressed — no abstract percentages.

---

### Phase 3: Build the Prioritized Plan
**Entry Criteria:** Trade-offs modeled.
**Actions:** 1. Recommend the allocation that addresses the highest-risk debt while preserving the highest-value roadmap items. 2. Order the debt backlog within the recommended allocation. 3. Identify debt items deferred and document the accepted risk. 4. Build the agreed plan for the planning horizon.
**Output:** Prioritized debt backlog, allocation recommendation, accepted risk register, committed plan.
**Quality Gate:** Recommended allocation is specific — "X sprints on debt, Y on roadmap" not "a balance." Deferred debt risks are explicitly accepted, not ignored.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present debt risk matrix. 2. Present capacity trade-off model at three scenarios. 3. Deliver prioritized debt backlog. 4. Deliver allocation recommendation and roadmap impact. 5. State accepted risk register.
**Output:** Full synthesis — debt risk matrix, trade-off model, prioritized backlog, allocation plan, accepted risks.
**Quality Gate:** Both leads can explain to their teams what they agreed to and why specific items are in or out.

---

## Exit Criteria
Done when: (1) all debt items have business risk consequence stated, (2) three allocation scenarios with specific roadmap trade-offs, (3) prioritized backlog with rationale, (4) committed allocation plan, (5) deferred risk explicitly accepted.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
