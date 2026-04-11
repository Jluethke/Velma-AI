# Build vs. Buy

**One-line description:** Engineering and finance each submit their real constraints and preferences before a build-vs-buy decision — Claude models the true cost of each path and produces a recommendation both sides can defend.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both engineering and finance/business must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_capability_in_question` (string, required): What capability is being evaluated? e.g., "customer data platform," "authentication service," "analytics pipeline."

### Engineering Lead Submits Privately
- `eng_build_complexity` (object, required): How complex is this to build? What are the technical challenges?
- `eng_maintenance_burden` (object, required): What does ongoing maintenance look like? What is the long-term engineering cost?
- `eng_team_capacity` (object, required): Does the team have the capacity and skills to build this? What would it displace?
- `eng_integration_concerns` (array, required): What integration challenges exist with either path?
- `eng_technical_risks` (array, required): What can go wrong with the build option?
- `eng_build_preference_and_rationale` (string, required): What is your preference and why?

### Finance / Business Lead Submits Privately
- `finance_budget_available` (object, required): What is the budget for this capability? One-time and ongoing.
- `finance_strategic_value_assessment` (string, required): Is this a strategic differentiator or commodity infrastructure?
- `finance_vendor_options` (array, required): What vendors exist? What are the pricing models?
- `finance_timeline_constraints` (string, required): When is this needed? Does the timeline favor build or buy?
- `finance_concerns_about_build_estimates` (array, required): Where do you think engineering is underestimating the build cost or complexity?

## Outputs
- `capability_requirements_definition` (object): What does this capability actually need to do? Agreed functional requirements.
- `build_cost_model` (object): Full cost to build — engineering time, opportunity cost, maintenance burden over 3 years.
- `buy_cost_model` (object): Full cost to buy — license, integration, ongoing fees, vendor risk over 3 years.
- `strategic_fit_assessment` (object): Whether this is a differentiating capability that justifies building or commodity infrastructure that should be bought.
- `risk_comparison` (object): Build risks vs. buy risks side by side.
- `recommendation_with_rationale` (object): A specific recommendation — build, buy, or build-with-buy-bridge — with the deciding factors stated.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm capability description, build complexity estimate, and vendor options present.
**Output:** Readiness confirmation.
**Quality Gate:** Build complexity and at least one vendor option present.

---

### Phase 1: Define the Real Requirements
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Extract what the capability actually needs to do from both submissions — often the engineering view and business view differ. 2. Identify where requirements are gold-plated vs. genuinely needed. 3. Check whether vendor options cover the actual requirements or require workarounds. 4. Establish the functional baseline both paths must meet.
**Output:** Agreed capability requirements, requirement gap vs. vendor coverage, gold-plating flags.
**Quality Gate:** Requirements are specific enough to evaluate against vendors and engineering estimates.

---

### Phase 2: Model the True Cost of Each Path
**Entry Criteria:** Requirements defined.
**Actions:** 1. Build the 3-year total cost of ownership for the build option: engineering time at fully-loaded rate, opportunity cost of displaced work, maintenance burden, integration cost. 2. Build the 3-year TCO for the buy option: license, implementation, integration, ongoing fees, switching cost. 3. Identify where finance's concerns about engineering estimates change the build model. 4. Model timeline implications — when is each option live?
**Output:** 3-year TCO for build and buy, timeline comparison, cost sensitivity to engineering estimate accuracy.
**Quality Gate:** Build cost includes opportunity cost and maintenance, not just initial development hours.

---

### Phase 3: Assess Strategic Fit and Risk
**Entry Criteria:** Costs modeled.
**Actions:** 1. Assess whether this capability is a strategic differentiator (build candidate) or commodity infrastructure (buy candidate). 2. Compare build risks vs. buy risks — timeline, quality, vendor lock-in, maintenance dependency. 3. Identify a build-with-buy-bridge option if relevant — buy now, build later when the need is better understood. 4. Make the recommendation.
**Output:** Strategic fit assessment, risk comparison, recommendation with deciding factors.
**Quality Gate:** Recommendation is specific — "buy" or "build" or "buy now, evaluate building in 18 months" — not "it depends."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Recommendation made.
**Actions:** 1. Present agreed capability requirements. 2. Present 3-year TCO comparison. 3. Present strategic fit and risk comparison. 4. Deliver recommendation with rationale. 5. State the assumptions that, if wrong, would change the recommendation.
**Output:** Full synthesis — requirements, cost models, strategic fit, recommendation, sensitivity analysis.
**Quality Gate:** Decision-maker can explain why the recommendation was made and what would change it.

---

## Exit Criteria
Done when: (1) agreed capability requirements defined, (2) 3-year TCO modeled for both paths including opportunity cost, (3) strategic fit assessment made, (4) specific recommendation stated, (5) assumption sensitivities named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
