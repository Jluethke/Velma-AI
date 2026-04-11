# CRE Acquisition Underwriting

**One-line description:** Buyer and broker each submit their real underwriting views and market evidence — Claude stress-tests the assumptions, names the pricing gap, and produces an offer strategy grounded in what will actually close.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both buyer and broker must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_address` (string, required): Property address.
- `shared_asset_type` (string, required): Asset type — office, retail, multifamily, industrial, mixed-use, etc.

### Buyer / Acquisition Lead Submits Privately
- `buyer_investment_thesis` (string, required): Why does this asset fit your strategy? What are you underwriting to?
- `buyer_underwriting_assumptions` (object, required): Your cap rate, rent growth, vacancy, exit cap, hold period, and return targets.
- `buyer_due_diligence_findings` (object, required): What have you found in DD? What concerns have surfaced?
- `buyer_pricing_view` (object, required): What is this asset worth to you and why? What is your walk-away price?
- `buyer_concerns_about_deal` (array, required): What worries you about this acquisition?

### Broker / Sell-Side Advisor Submits Privately
- `broker_market_comps` (object, required): Recent sales comps — actual transactions, not asking prices. Cap rates, price PSF, pricing.
- `broker_seller_expectations` (string, required): What is the seller expecting? What is the seller's motivation and timeline?
- `broker_what_will_kill_the_deal` (array, required): What offer terms, conditions, or due diligence requests will cause the seller to walk or go with another buyer?
- `broker_other_interest_in_asset` (string, required): How competitive is the process? Are there other offers or bidders?
- `broker_deal_timeline_reality` (string, required): What is a realistic timeline from offer to close given seller and asset complexity?

## Outputs
- `pricing_gap_analysis` (object): The gap between buyer's pricing view and seller's expectations against market comps.
- `underwriting_assumption_review` (object): Which assumptions are conservative, market-rate, or aggressive relative to comps.
- `risk_flag_summary` (array): Key risks from DD findings and broker's market read.
- `deal_viability_assessment` (object): Is this a dealable gap or a fundamental misalignment?
- `offer_strategy` (object): Recommended offer structure — price, terms, contingencies, timeline — designed to be competitive while protecting the buyer.
- `due_diligence_checklist` (array): Outstanding DD items to resolve before proceeding.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm underwriting assumptions and market comps present.
**Output:** Readiness confirmation.
**Quality Gate:** Buyer's pricing and broker's comp evidence both present.

---

### Phase 1: Stress-Test the Underwriting
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare buyer's cap rate, rent growth, and exit assumptions against market comps — are the assumptions in-line, conservative, or aggressive? 2. Identify which assumptions, if wrong, would make the investment fail to meet return targets. 3. Assess DD findings against broker's market read — do the findings change the thesis? 4. Calculate the maximum price that still meets return targets given conservative assumptions.
**Output:** Assumption stress test, return-sensitivity analysis, DD finding impact, maximum viable price.
**Quality Gate:** Every key assumption has a market-comparison label — conservative, at-market, or aggressive — with the comp evidence cited.

---

### Phase 2: Assess the Pricing Gap
**Entry Criteria:** Underwriting stress-tested.
**Actions:** 1. Compare buyer's pricing view against seller's expectations against market comps. 2. Assess whether the gap is bridgeable with structure (seller financing, earnout, closing terms) or is a fundamental valuation difference. 3. Check the competitive dynamic — how does buyer's pricing compare to what other bidders are likely to offer? 4. Identify what the seller actually cares about beyond price — timing, certainty, contingencies.
**Output:** Pricing gap analysis, bridge options, competitive positioning, seller motivation assessment.
**Quality Gate:** Gap is stated in specific dollars and cap rate basis points — not "they are far apart."

---

### Phase 3: Build the Offer Strategy
**Entry Criteria:** Gap assessed.
**Actions:** 1. Design the offer structure — price, earnest money, contingency period, closing timeline, inspection access — optimized to be competitive on the seller's priorities, not just price. 2. Identify where buyer can give on terms to close the price gap. 3. Draft the due diligence checklist for unresolved items. 4. Recommend a go/no-go based on the full picture.
**Output:** Offer structure, term trade options, DD checklist, go/no-go recommendation.
**Quality Gate:** Offer strategy is designed against what will actually win the deal, not just what protects the buyer maximally.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Offer strategy built.
**Actions:** 1. Present pricing gap and underwriting assumption review. 2. Present risk flags. 3. Deliver deal viability assessment. 4. Deliver offer strategy. 5. Present DD checklist.
**Output:** Full synthesis — pricing gap, assumption review, risk flags, viability assessment, offer strategy, DD checklist.
**Quality Gate:** Buyer can submit an offer knowing the assumptions have been stress-tested and the strategy is competitive.

---

## Exit Criteria
Done when: (1) every assumption has a market-comparison label with comp evidence, (2) pricing gap stated in specific dollars, (3) deal viability assessed, (4) offer structure designed against seller priorities, (5) outstanding DD items listed.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
