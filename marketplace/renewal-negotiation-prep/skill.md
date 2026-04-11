# Renewal Negotiation Prep

**One-line description:** CS and sales each submit their real read on account health and commercial goals — Claude produces a negotiation strategy that protects the relationship and hits the number.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both CS and sales must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_customer_name` (string, required): Customer name.
- `shared_renewal_date` (string, required): Renewal date.

### Customer Success Manager Submits Privately
- `cs_account_health` (object, required): Usage data, support ticket history, NPS or sentiment, executive relationship status.
- `cs_customer_sentiment` (string, required): What is the customer actually feeling about the product and the relationship right now?
- `cs_what_customer_values` (array, required): What do they love? What features are sticky?
- `cs_risks_to_renewal` (array, required): What could cause them not to renew? What are they unhappy about?
- `cs_what_customer_has_complained_about` (array, required): Specific complaints, unresolved issues, or unfulfilled promises from the past year.

### Account Executive Submits Privately
- `sales_target_contract_value` (object, required): Target ACV/TCV for the renewal. What is the base renewal and what is expansion?
- `sales_expansion_opportunity` (object, required): What upsell or cross-sell is possible? What is the likelihood?
- `sales_pricing_flexibility` (object, required): What is the floor on the renewal? What discounts are you authorized to offer?
- `sales_what_they_need_from_cs` (array, required): What do you need CS to do to support the renewal? Executive intro, health data, reference call?
- `sales_concerns_about_account` (array, required): What are you worried about going into this renewal?

## Outputs
- `account_health_summary` (object): Honest health assessment combining usage data, sentiment, and relationship status.
- `negotiation_strategy` (object): Approach to the renewal conversation — sequencing, framing, who leads.
- `concession_framework` (object): What to concede first, what to protect, and what each concession costs.
- `expansion_opportunity_assessment` (object): Whether expansion is realistic given account health, and how to position it.
- `renewal_proposal_draft` (object): The proposed renewal terms — base, expansion, pricing, contract length.
- `risk_mitigation_plan` (object): How to address each risk CS identified before the renewal conversation happens.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm account health data and renewal target present.
**Output:** Readiness confirmation.
**Quality Gate:** Account health data and target contract value both present.

---

### Phase 1: Build the Honest Account Picture
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Combine CS's health data with sales' commercial concerns to build a full account picture. 2. Assess renewal probability given health, complaints, and relationship status. 3. Check whether the expansion opportunity is realistic given the account's current sentiment. 4. Identify the gap between target contract value and what the account health supports.
**Output:** Combined account health summary, renewal probability, expansion feasibility, commercial gap.
**Quality Gate:** Renewal probability is based on evidence — usage, sentiment, complaints — not optimism.

---

### Phase 2: Address Risks Before the Conversation
**Entry Criteria:** Account picture built.
**Actions:** 1. For each risk CS identified, determine whether it can be addressed before the renewal conversation or must be addressed during it. 2. Build the risk mitigation plan — what needs to happen, who does it, by when. 3. Identify whether any unresolved complaints require product or leadership escalation before the renewal can proceed. 4. Determine what CS needs to deliver to sales and vice versa.
**Output:** Risk mitigation plan with owners and timeline, pre-renewal action items.
**Quality Gate:** Every risk has an owner and a mitigation step. "We'll address it in the renewal call" is not a mitigation.

---

### Phase 3: Build the Negotiation Strategy
**Entry Criteria:** Risks addressed.
**Actions:** 1. Design the negotiation approach — who opens the conversation, how the value story is framed, what is offered proactively vs. held in reserve. 2. Build the concession framework — what to offer first (least costly), what to protect (highest margin), what each concession costs. 3. Draft the renewal proposal terms. 4. Determine how and when to introduce expansion.
**Output:** Negotiation strategy, concession framework, renewal proposal draft, expansion timing.
**Quality Gate:** Concession framework has specific price floors, not "be flexible." Expansion is timed to account health, not sales urgency.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Strategy built.
**Actions:** 1. Present account health summary. 2. Present renewal probability and risks. 3. Deliver risk mitigation plan. 4. Deliver negotiation strategy and concession framework. 5. Deliver renewal proposal draft.
**Output:** Full synthesis — account health, risk plan, negotiation strategy, concession framework, proposal draft.
**Quality Gate:** CS and AE walk into the renewal conversation aligned and prepared for every likely scenario.

---

## Exit Criteria
Done when: (1) renewal probability based on evidence, (2) every risk has a mitigation owner and timeline, (3) concession framework with specific floors, (4) renewal proposal with base and expansion terms, (5) negotiation strategy with sequencing.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
