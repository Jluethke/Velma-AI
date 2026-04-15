# Insurance Agency Client Engagement

**One-line description:** An insurance agent and a client each submit their real coverage needs, risk profile, and budget before the placement — AI aligns on a coverage program that addresses the client's actual exposures without paying for coverage they don't need.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agent and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_client_and_agency` (string, required): Client name and agency name.
- `shared_coverage_lines_needed` (string, required): Lines of coverage being discussed — property, liability, professional, workers comp, etc.

### Insurance Agent Submits Privately
- `agent_risk_assessment` (object, required): How you assess the client's exposures — industry, operations, claims history, key risk factors.
- `agent_coverage_recommendations` (object, required): What coverage you recommend, why, key limits and deductibles.
- `agent_market_options` (object, required): Carriers you are placing with, premium range, what markets will and will not write this risk.
- `agent_compensation_and_fees` (object, required): Commission structure, broker fees, contingent commissions — full disclosure.
- `agent_concerns_about_this_client` (array, required): Claims history concerns, coverage gaps the client is resisting, risk management deficiencies.

### Client Submits Privately
- `client_operations_and_exposures` (object, required): What your business does, assets at risk, employees, revenue — the facts that drive your risk profile.
- `client_coverage_priorities` (object, required): What you need to protect most — operations, assets, liability, key person, professional liability.
- `client_budget_and_constraints` (object, required): Total insurance budget, what you currently pay, where you are willing to accept more risk to reduce cost.
- `client_claims_and_loss_history` (array, required): Prior claims — what happened, what it cost, what changed.
- `client_concerns_about_coverage` (array, required): Gaps you are worried about, exclusions you don't understand, whether you are being over- or under-sold.

## Outputs
- `coverage_program_design` (object): Recommended coverage lines, limits, deductibles, and why each is appropriate for this client.
- `premium_and_cost_summary` (object): Total program cost, carrier options, cost vs. coverage tradeoffs.
- `coverage_gaps_and_exclusions` (object): What is not covered, what exclusions apply, what the client is accepting as uninsured risk.
- `risk_management_recommendations` (object): Steps the client can take to reduce risk and reduce premium.
- `agent_compensation_disclosure` (object): Full compensation disclosure — commissions, fees, contingents.
- `renewal_and_service_plan` (object): Review frequency, what triggers mid-term review, claims handling expectations.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm agent's coverage recommendations and client's operations and budget both present.
**Output:** Readiness confirmation.
**Quality Gate:** Agent's market assessment and client's budget and exposures both present.

---

### Phase 1: Assess Exposure and Coverage Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare agent's risk assessment against client's stated operations — are there gaps in how the agent understands the risk? 2. Evaluate coverage recommendations against client priorities and budget. 3. Assess claims history impact on pricing and coverage availability. 4. Identify concerns about coverage gaps the client is not aware of.
**Output:** Exposure assessment, coverage fit analysis, claims impact, gap identification.
**Quality Gate:** Every coverage gap is named with specific dollar exposure — not "insufficient liability" but the specific exposure and recommended limit.

---

### Phase 2: Build the Coverage Program
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the coverage program — each line, limit, deductible, carrier. 2. Build the cost summary with tradeoff analysis — what does more or less coverage cost? 3. Define what is excluded and what the client accepts as uninsured risk. 4. Build the risk management recommendations that could reduce cost.
**Output:** Coverage program, cost summary, exclusion map, risk management plan.
**Quality Gate:** Every limit and deductible is a specific number. Exclusions are named, not paraphrased.

---

### Phase 3: Define Compensation and Service
**Entry Criteria:** Program built.
**Actions:** 1. Disclose all agent compensation — commissions, fees, contingents — fully and specifically. 2. Define the service plan — renewal timeline, mid-term review triggers, claims advocacy. 3. Define what happens at renewal — how pricing is re-evaluated, market remarketing process. 4. Assemble the engagement framework.
**Output:** Compensation disclosure, service plan, renewal process, engagement framework.
**Quality Gate:** Compensation is fully disclosed with specific dollar or percentage amounts for each component.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — coverage program, cost, gaps, risk management, compensation, service plan.
**Quality Gate:** Client understands what is covered, what is not, what it costs, and what the agent earns.

---

## Exit Criteria
Done when: (1) coverage program is complete with specific limits and deductibles, (2) total cost is disclosed, (3) exclusions and gaps are named, (4) agent compensation is fully disclosed, (5) service plan is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
