# Insurance Coverage Placement

**One-line description:** Broker and client each submit their real risk profile and budget before designing coverage — AI closes the exposure gap, models budget trade-offs, and produces a placement strategy so the client understands exactly what they are and are not covered for.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both broker and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Insured company name.
- `shared_lines_of_coverage` (array, required): Lines of coverage being placed. e.g., "Commercial property," "General liability," "D&O," "Cyber."

### Insurance Broker Submits Privately
- `broker_risk_profile_assessment` (object, required): Broker's assessment of the client's actual risk exposures by line.
- `broker_market_conditions` (object, required): Current underwriting market — hard, soft, and for which lines. What are carriers willing to write?
- `broker_coverage_recommendations` (object, required): What coverage structures and limits do you recommend and why?
- `broker_pricing_expectations` (object, required): Expected premium ranges by line based on market.
- `broker_concerns_about_client_exposures` (array, required): What risks does the client have that they may not be fully aware of or adequately protecting against?

### Client / Risk Manager Submits Privately
- `client_perceived_coverage_needs` (object, required): What coverage do you think you need by line? What are you most worried about?
- `client_budget` (object, required): Total insurance budget and by-line constraints if any.
- `client_risk_tolerance` (string, required): How much risk are you willing to self-insure or retain? What is your deductible appetite?
- `client_coverage_gaps_they_have_identified` (array, required): Coverage gaps or limitations you are already aware of.
- `client_concerns_about_broker_recommendations` (array, required): What about the broker's likely recommendations concerns you — cost, coverage adequacy, complexity?

## Outputs
- `exposure_gap_analysis` (object): Risks the client has that are not adequately covered under the current or proposed program.
- `coverage_recommendation` (object): Recommended coverage structure with limits, deductibles, and key provisions by line.
- `budget_vs_coverage_trade_offs` (object): What you get and what you give up at different premium levels.
- `market_placement_strategy` (object): How to approach the market — target carriers, submission strategy, timing.
- `risk_retention_recommendation` (object): Where it makes financial sense to self-insure vs. transfer risk to the market.
- `coverage_decision_framework` (array): Key decisions the client needs to make with the tradeoffs for each.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm broker's risk assessment and client's budget present.
**Output:** Readiness confirmation.
**Quality Gate:** Risk profile and budget both present.

---

### Phase 1: Map the Exposure Gaps
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare broker's risk assessment against client's perceived coverage needs — where is the client underestimating their exposure? 2. Identify gaps between what the client thinks they have and what the broker believes is needed. 3. Cross-reference client's identified gaps against broker's recommendations — are the gaps the client named the right ones? 4. Assess which exposures are uninsurable in the current market vs. available but expensive.
**Output:** Exposure gap map, client perception vs. actual risk comparison, market availability assessment.
**Quality Gate:** Every material exposure has a coverage status — well-covered, inadequate, uncovered, or uninsurable.

---

### Phase 2: Model Budget Trade-Offs
**Entry Criteria:** Gaps mapped.
**Actions:** 1. Design the full recommended program and price it against broker's market expectations. 2. Compare total recommended premium against client's budget. 3. Model three program options: full recommended coverage, budget-constrained with gaps named, minimum viable coverage. 4. For each budget trade-off, state explicitly what risk the client is retaining.
**Output:** Full program cost estimate, three coverage options with cost and gap trade-offs, retained risk by option.
**Quality Gate:** Every trade-off identifies the retained risk in dollars — "reducing the cyber limit from $10M to $5M retains approximately $X of exposure per incident."

---

### Phase 3: Build the Placement Strategy
**Entry Criteria:** Trade-offs modeled.
**Actions:** 1. Recommend the coverage option that best balances protection and budget given the client's risk tolerance. 2. Build the market placement strategy — which carriers to target, submission timeline, how to handle capacity challenges. 3. Recommend where self-insured retention makes financial sense vs. where risk transfer is critical. 4. Draft the key decisions the client needs to make with the tradeoffs explained.
**Output:** Coverage recommendation, placement strategy, risk retention analysis, client decision framework.
**Quality Gate:** Recommendation is specific. Risk retention recommendation is based on the client's financial capacity to absorb losses, not default to full transfer.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Strategy built.
**Actions:** 1. Present exposure gap analysis. 2. Present coverage options with budget trade-offs. 3. Deliver coverage recommendation. 4. Deliver market placement strategy. 5. Present risk retention recommendation.
**Output:** Full synthesis — exposure gaps, coverage options, recommendation, placement strategy, risk retention.
**Quality Gate:** Client knows exactly what they are covered for, what they are not covered for, and why — not just what their broker recommended.

---

## Exit Criteria
Done when: (1) every material exposure has coverage status, (2) three coverage options with cost and retained risk, (3) coverage recommendation with specific rationale, (4) placement strategy with target carriers, (5) risk retention recommendation with financial basis.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
