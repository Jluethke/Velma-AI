# Residential Buyer Agent Engagement

**One-line description:** A buyer's agent and a homebuyer each submit their real priorities, financial constraints, and market expectations before the search begins — Claude aligns on a search strategy that finds the right home without wasting months on misaligned showings.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agent and buyer must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_agent_and_buyer` (string, required): Agent name and buyer name(s).
- `shared_market_and_price_range` (string, required): Target market, neighborhoods of interest, and price range.

### Agent Submits Privately
- `agent_market_assessment` (object, required): Current market conditions — inventory, competition, days on market, how quickly buyers must move, where the value is.
- `agent_buyer_qualification_read` (object, required): Your read on this buyer's financial strength, decision-making speed, and likely challenges in this market.
- `agent_search_strategy` (object, required): How you will approach this search — what to look for, what to avoid, how you identify value.
- `agent_compensation` (object, required): How you are compensated — buyer agent commission, who pays, what happens in a transaction without a cooperating commission.
- `agent_concerns_about_this_buyer` (array, required): Decision-making speed, unrealistic expectations, competing agents, financing pre-qualification status.

### Buyer Submits Privately
- `buyer_real_priorities` (object, required): What actually matters — not the initial wish list, but the ranked priorities: school district, commute, space, neighborhood, condition, timeline.
- `buyer_financial_reality` (object, required): Pre-approval status, true budget ceiling, cash reserves, competing financial obligations that affect what you can actually spend.
- `buyer_flexibility_and_constraints` (object, required): What you will and will not compromise on — what is a dealbreaker vs. what you can live without.
- `buyer_timeline_and_pressure` (object, required): Why you are buying now, what happens if you don't find something by a specific date, lease expiration or other pressure.
- `buyer_concerns_about_agents` (array, required): Feeling pushed toward properties you don't want, commission bias, lack of responsiveness, market access.

## Outputs
- `search_criteria_alignment` (object): Agreed priorities, hard criteria vs. preferences, neighborhoods and property types to target.
- `market_reality_briefing` (object): What this buyer can realistically expect in this market at this budget.
- `financial_and_offer_strategy` (object): Pre-approval status, offer approach, escalation clauses, how to compete in this market.
- `agent_compensation_disclosure` (object): How the agent is paid, what happens in various transaction scenarios.
- `search_process_plan` (object): How many homes per week, showing schedule, feedback process, decision timeline.
- `buyer_representation_framework` (object): Key terms of the buyer representation agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm agent's market assessment and buyer's real priorities and financial reality both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' market knowledge and financial position present.

---

### Phase 1: Align on Market Reality and Criteria
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare buyer's priorities against what is actually available in their budget in this market. 2. Assess financial readiness — is the buyer pre-approved and realistic about costs? 3. Identify gaps between wish list and market reality. 4. Assess timeline pressure against market pace.
**Output:** Market reality assessment, financial readiness, wish list vs. reality gap, timeline pressure assessment.
**Quality Gate:** Every unachievable priority is named with the budget required to achieve it — not "you can't get that" but "that adds $X to your budget."

---

### Phase 2: Build the Search Strategy
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the search criteria — hard requirements, strong preferences, dealbreakers. 2. Build the offer strategy — what to offer, escalation approach, contingencies. 3. Define the showing schedule and decision process. 4. Disclose agent compensation fully.
**Output:** Search criteria, offer strategy, showing and decision process, compensation disclosure.
**Quality Gate:** Hard requirements are the list the buyer agrees not to compromise on. Offer strategy addresses this specific market's dynamics.

---

### Phase 3: Define the Representation Agreement
**Entry Criteria:** Strategy built.
**Actions:** 1. Define the representation period — duration, exclusivity, what triggers early termination. 2. Build the compensation terms — what is owed, when, in what scenarios. 3. Define the agent's obligations — search frequency, market updates, offer support. 4. Assemble the buyer representation framework.
**Output:** Representation period, compensation terms, agent obligations, representation framework.
**Quality Gate:** Compensation terms address all scenarios — cooperative commission, no commission, dual agency.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — market reality, search criteria, financial strategy, offer approach, agent compensation, representation terms.
**Quality Gate:** Buyer knows what to expect in this market. Agent knows the buyer's real priorities and financial position.

---

## Exit Criteria
Done when: (1) search criteria are ranked and agreed, (2) market reality is communicated, (3) offer strategy is defined, (4) agent compensation is fully disclosed, (5) representation terms are clear.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
