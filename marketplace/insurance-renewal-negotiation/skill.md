# Insurance Renewal Negotiation

**One-line description:** Broker and underwriter each submit their real rate position and market reality — AI assesses rate adequacy against loss history and produces terms both sides can bind on.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both broker and underwriter must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_account_name` (string, required): Insured account name.
- `shared_coverage_lines` (array, required): Lines renewing.
- `shared_renewal_date` (string, required): Renewal effective date.

### Broker Submits Privately
- `broker_loss_history` (object, required): Loss runs — frequency, severity, trends, and loss ratio over the policy period.
- `broker_risk_improvements` (array, required): What has the insured done to improve the risk since last renewal?
- `broker_rate_position` (object, required): What rate movement does the broker believe is justified? What are they going to market asking for?
- `broker_alternative_markets_available` (array, required): What other markets are willing to write this risk and at what pricing?
- `broker_what_client_will_accept` (object, required): What rate change and terms is the insured willing to accept before walking?

### Underwriter Submits Privately
- `underwriter_portfolio_concerns` (array, required): What concerns does the underwriter have about this account or risk segment?
- `underwriter_rate_adequacy_requirements` (object, required): What rate level is needed for this risk to be adequately priced given the loss experience?
- `underwriter_market_conditions` (object, required): Current market pricing trends for this risk segment.
- `underwriter_terms_required` (object, required): Any changes to terms, conditions, deductibles, or exclusions required at renewal.
- `underwriter_appetite_for_account` (string, required): Is the underwriter motivated to retain this account? What is the strategic value?

## Outputs
- `rate_gap_analysis` (object): The gap between broker's position and underwriter's rate adequacy requirement.
- `loss_ratio_assessment` (object): Whether the account has been adequately priced historically and what the trend suggests.
- `negotiation_range` (object): The range within which a binding agreement is achievable.
- `terms_and_conditions_alignment` (object): Where terms changes are required vs. where the broker has flexibility.
- `binding_conditions` (object): What needs to be agreed to bind coverage.
- `renewal_terms_recommendation` (object): Recommended final terms — rate, conditions, and structure.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm loss history and rate adequacy requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** Loss runs and underwriter's rate requirement both present.

---

### Phase 1: Assess Rate Adequacy
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Calculate the loss ratio over the policy period — is this account profitable, unprofitable, or marginal for the insurer? 2. Assess whether the broker's risk improvement narrative is credible and material enough to offset the loss experience. 3. Compare the underwriter's rate adequacy requirement against the broker's opening position — calculate the gap. 4. Check alternative markets against underwriter's pricing — is there real competition or is it a bluff?
**Output:** Loss ratio analysis, risk improvement credibility assessment, rate gap, market competition assessment.
**Quality Gate:** Loss ratio is calculated with specifics — not "the account has had some losses" but "loss ratio was X% over 3 years, driven primarily by Y."

---

### Phase 2: Map Terms and Conditions Conflicts
**Entry Criteria:** Rate assessed.
**Actions:** 1. Compare underwriter's required terms changes against the broker's client tolerances. 2. Identify which terms changes are driven by underwriting concern vs. portfolio management vs. negotiating leverage. 3. Assess whether the underwriter's appetite for the account is strong enough to compromise on any terms requirements. 4. Identify the binding conditions — what must be agreed before coverage can be confirmed.
**Output:** Terms conflict map, term change driver assessment, appetite leverage analysis, binding conditions.
**Quality Gate:** Every required terms change has a driver — underwriting necessity, portfolio policy, or negotiating leverage — which affects how hard to push back.

---

### Phase 3: Build the Renewal Recommendation
**Entry Criteria:** Terms mapped.
**Actions:** 1. Establish the negotiation range — minimum the insurer should write at and maximum the insured should pay. 2. Recommend the terms structure that satisfies both sides' core requirements. 3. Identify where broker should apply market pressure vs. where the underwriter has genuine non-negotiables. 4. Draft the final renewal terms recommendation.
**Output:** Negotiation range, leverage strategy, final terms recommendation.
**Quality Gate:** Negotiation range is specific. Leverage strategy identifies where competition is real vs. where it is positioning.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Recommendation built.
**Actions:** 1. Present rate gap and loss ratio assessment. 2. Present terms and conditions alignment. 3. Deliver negotiation range. 4. Deliver binding conditions. 5. Deliver renewal terms recommendation.
**Output:** Full synthesis — rate gap, loss ratio, terms alignment, negotiation range, binding conditions, recommendation.
**Quality Gate:** Broker can negotiate with full knowledge of what the underwriter needs. Underwriter can bind with confidence in the terms.

---

## Exit Criteria
Done when: (1) loss ratio calculated with specifics, (2) rate gap stated in percentage points, (3) every terms change has a driver, (4) negotiation range established, (5) binding conditions defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
