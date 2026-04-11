# Deal Desk Approval

**One-line description:** Sales and finance each submit their real deal context and approval constraints — Claude models margin impact, assesses precedent risk, and produces an approval recommendation with conditions both sides can live with.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both sales and finance/deal desk must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_deal_name` (string, required): Customer or deal name.

### Account Executive / Sales Lead Submits Privately
- `sales_deal_context` (object, required): Deal size, product mix, contract length, and why this customer matters.
- `sales_discount_requested` (object, required): Discount percentage or absolute price requested and against what list price.
- `sales_competitive_pressure` (string, required): What competitive situation is driving the discount request? Is there a competing offer?
- `sales_relationship_and_strategic_value` (string, required): Why does this customer matter beyond the immediate deal — logo value, expansion potential, reference value?
- `sales_what_happens_if_not_approved` (string, required): What is the likely outcome if the discount is not approved? Is this a real risk or leverage?

### Finance / Deal Desk Submits Privately
- `finance_standard_pricing_policy` (object, required): Standard pricing policy and what the current discount is within the pre-approved range.
- `finance_margin_floor` (object, required): What is the minimum margin required on this deal?
- `finance_precedent_concerns` (array, required): What precedent does this discount set? How many other deals could this affect?
- `finance_what_they_need_to_approve` (array, required): What additional evidence, conditions, or deal terms would allow finance to approve?
- `finance_flexibility_available` (object, required): Where is there flexibility — multi-year commitment, upfront payment, reduced support tier?

## Outputs
- `margin_impact_analysis` (object): What the discount does to deal margin and ARR, and how it compares to the margin floor.
- `precedent_risk_assessment` (object): How many deals are similarly positioned and what the revenue impact of applying this discount broadly would be.
- `approval_recommendation` (object): Approve as submitted, approve with conditions, or deny — with the specific rationale.
- `conditional_approval_terms` (object): If conditional, what the conditions are — contract length, payment terms, volume commitment, renewal lock-in.
- `alternative_deal_structures` (array): Structures that achieve the customer's effective price while protecting margin — multi-year, payment timing, tiered pricing.
- `decision_rationale` (string): How to explain the decision to the rep and the customer.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm deal context and margin floor present.
**Output:** Readiness confirmation.
**Quality Gate:** Discount request and margin floor both present.

---

### Phase 1: Assess Margin Impact
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Calculate the deal margin at the requested discount vs. standard pricing. 2. Compare deal margin against the margin floor — does the discount put the deal below floor? 3. Assess whether the competitive pressure claim is credible — is there documentation of a competing offer or is this sales leverage? 4. Evaluate the strategic value claim — is the logo/reference/expansion value real and quantifiable?
**Output:** Margin calculation at discount vs. floor, competitive pressure credibility assessment, strategic value quantification.
**Quality Gate:** Margin impact is in specific dollars and percentage points. Strategic value has a number attached — "estimated $X expansion within 18 months" not "high growth potential."

---

### Phase 2: Assess Precedent Risk
**Entry Criteria:** Margin assessed.
**Actions:** 1. Identify how many deals in the current pipeline are similarly positioned — same segment, same competitive situation. 2. Model the revenue impact if this discount level is applied to that pipeline. 3. Assess whether this discount creates a citable precedent or whether the deal conditions are genuinely unique. 4. Identify the conditions in finance's requirements that could make this a one-off rather than a precedent.
**Output:** Pipeline impact model, precedent uniqueness assessment, condition requirements.
**Quality Gate:** Precedent risk is stated in dollars — "if applied to 10 similarly positioned deals, this discount reduces ARR by $X."

---

### Phase 3: Build the Recommendation
**Entry Criteria:** Precedent assessed.
**Actions:** 1. Recommend approval, conditional approval, or denial. 2. For conditional approval, define the specific conditions — contract length, payment terms, volume commitment, or other terms that offset the discount. 3. Design alternative structures that achieve the customer's price goal while improving margin. 4. Draft the decision rationale for communicating to the rep.
**Output:** Approval recommendation with rationale, conditional terms, alternative structures, communication draft.
**Quality Gate:** Recommendation is specific — not "we can be flexible" but "approved at X% discount contingent on Y."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Recommendation built.
**Actions:** 1. Present margin impact analysis. 2. Present precedent risk assessment. 3. Deliver approval recommendation. 4. Deliver conditional approval terms and alternative structures. 5. Deliver decision rationale.
**Output:** Full synthesis — margin impact, precedent risk, recommendation, conditions, alternatives, rationale.
**Quality Gate:** Sales has a clear decision and can explain it to the customer. Finance has conditions that protect margin.

---

## Exit Criteria
Done when: (1) margin impact in specific dollars, (2) precedent risk in pipeline dollar impact, (3) recommendation is specific with conditions, (4) alternative structures designed, (5) communication rationale drafted.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
