# Retail Vendor Terms

**One-line description:** The retail buyer and the vendor each submit their real commercial requirements, margin needs, and concerns before vendor terms are set — AI designs the trading terms that keep the shelf stocked, protect margins on both sides, and build a vendor relationship that lasts more than one season.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both buyer and vendor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_retailer_and_vendor` (string, required): Retailer name and vendor/brand name.
- `shared_product_category` (string, required): Product category being discussed.

### Retail Buyer Submits Privately
- `buyer_margin_requirements` (object, required): Target gross margin, required markdown allowance, promotional funding expectations.
- `buyer_trading_terms_requirements` (object, required): Payment terms, returns policy, co-op advertising, slotting fees — what you need to put this vendor in.
- `buyer_performance_expectations` (object, required): Sell-through rate, inventory turn, in-stock requirements, fill rate.
- `buyer_concerns_about_this_vendor` (array, required): What worries you — product quality, fill rate reliability, price competitiveness, exclusivity?
- `buyer_what_would_cause_delisting` (array, required): What performance failures or term violations would end the relationship?

### Vendor Submits Privately
- `vendor_cost_and_margin_structure` (object, required): Cost to produce, target selling margin, what allowances and terms the business model can support.
- `vendor_what_they_need_from_the_retailer` (array, required): Shelf space, placement, promotional support, payment timing — what makes this account viable.
- `vendor_concerns_about_the_terms` (array, required): What trading terms create margin or cash flow problems for your business?
- `vendor_performance_capacity` (object, required): Realistic fill rate, lead times, and minimum order quantities — what you can actually commit to.
- `vendor_strategic_importance_of_this_account` (string, required): Is this a must-win account, a volume driver, or a prestige placement? What are you willing to invest to win or keep it?

## Outputs
- `commercial_viability_assessment` (object): Whether the deal works financially for both parties with the proposed terms.
- `trading_terms_framework` (object): Payment terms, allowances, co-op, returns — specific terms both sides can accept.
- `performance_standards` (object): Fill rate, in-stock, sell-through — with measurement and consequence.
- `promotional_plan` (object): What promotional support the vendor is committing to and what the retailer is providing in return.
- `vendor_agreement_framework` (object): Key terms ready for documentation — commercial terms, performance standards, remedies.
- `relationship_development_plan` (object): How the account grows — new items, expanded distribution, joint planning.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm buyer's margin requirements and vendor's cost structure present.
**Output:** Readiness confirmation.
**Quality Gate:** Buyer's margin and trading term requirements and vendor's cost and capacity both present.

---

### Phase 1: Assess Commercial Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model the deal at proposed terms — does the vendor's cost structure support the retailer's margin requirements? 2. Identify where the margin gap is — which trading terms are the primary cost to the vendor. 3. Assess the vendor's fill rate and capacity commitments against the buyer's performance expectations. 4. Check whether the buyer's payment terms work with the vendor's cash flow needs.
**Output:** Margin model, gap driver analysis, performance feasibility, cash flow assessment.
**Quality Gate:** Margin model is specific — "at buyer's required 45% GM and 2% co-op, vendor net margin is X%; their floor is Y%; gap is Z percentage points."

---

### Phase 2: Design the Trading Terms
**Entry Criteria:** Viability assessed.
**Actions:** 1. Design the trading terms package — payment terms, markdown protection, co-op rate, returns allowance — that lands within both parties' constraints. 2. Define performance standards with measurement methodology and non-performance consequences. 3. Build the promotional plan — what events, what vendor funding, what retailer support, on what schedule. 4. Identify what the vendor must invest to make this account viable and whether the strategic importance justifies it.
**Output:** Trading terms package, performance standards, promotional plan, vendor investment assessment.
**Quality Gate:** Every trading term is a specific number — not "standard co-op" but "2% co-op on net invoiced sales, paid quarterly."

---

### Phase 3: Build the Vendor Agreement
**Entry Criteria:** Terms designed.
**Actions:** 1. Assemble the vendor agreement framework — all commercial terms in one document. 2. Define the annual review process — when terms are renegotiated, what triggers a change. 3. Build the new item introduction process — how new products are evaluated and authorized. 4. Define the delist process — what triggers a delisting conversation and how it is handled.
**Output:** Agreement framework, review process, new item process, delist process.
**Quality Gate:** Agreement framework is specific enough to implement. Review process has specific triggers, not "as needed."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present commercial viability assessment. 2. Deliver trading terms framework. 3. Deliver performance standards. 4. Deliver promotional plan. 5. Present vendor agreement framework and relationship development plan.
**Output:** Full synthesis — viability, trading terms, performance, promotional plan, agreement, relationship plan.
**Quality Gate:** Buyer and vendor both know the deal terms and what they are committing to before anyone signs.

---

## Exit Criteria
Done when: (1) deal is commercially viable for both parties, (2) every trading term is a specific number, (3) performance standards are measurable, (4) promotional plan is specific, (5) agreement framework is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
