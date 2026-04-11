# SaaS Enterprise Deal

**One-line description:** The SaaS account executive and the enterprise buyer each submit their real deal requirements, procurement constraints, and internal pressures — Claude aligns on a contract structure that closes on time, meets security and compliance needs, and does not set a pricing precedent that kills the next deal.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both AE and buyer must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_vendor_and_company` (string, required): SaaS vendor and enterprise buyer names.
- `shared_product_and_deal_size` (string, required): Product and estimated annual contract value.

### Account Executive Submits Privately
- `ae_pricing_and_discount_authority` (object, required): List price, discount authority, what requires deal desk or VP approval, floor pricing.
- `ae_deal_timeline_pressure` (string, required): Quarter-end pressure, competitor situation, what happens if this slips.
- `ae_concerns_about_the_deal` (array, required): What worries you — procurement grinding, legal redlines, internal champion going cold, competitive threat?
- `ae_what_they_have_committed_or_implied` (array, required): Anything you have said or implied to the customer that is not standard — features, SLAs, professional services, pricing.
- `ae_what_they_need_from_legal_and_procurement` (array, required): What the deal needs to close — approved redlines, fast turnaround, specific contract modifications.

### Enterprise Buyer Submits Privately
- `buyer_procurement_requirements` (object, required): Procurement process, approval chain, legal review timeline, security review requirements.
- `buyer_contract_redlines` (array, required): Specific contract terms the buyer needs changed — data processing, liability cap, SLA, termination, IP ownership.
- `buyer_budget_and_approval_constraints` (object, required): Approved budget, financial approval thresholds, fiscal year constraints.
- `buyer_internal_politics` (string, required): Who is the champion, who is the skeptic, what internal obstacles could slow or kill this deal?
- `buyer_what_must_be_true_to_sign` (array, required): What non-negotiable conditions must be met before legal will authorize the signature.

## Outputs
- `deal_close_assessment` (object): Likelihood and obstacles to closing in the stated timeline.
- `pricing_and_commercial_terms` (object): The specific commercial structure — pricing, term, payment, volume discounts — that closes the deal.
- `contract_redline_resolution` (object): Position on each buyer redline — accept, modify with specific language, escalate, or decline with rationale.
- `internal_alignment_plan` (object): How to keep the champion engaged and neutralize the skeptics.
- `close_plan` (object): The specific sequence of steps from today to signature — legal, security, procurement, approvals.
- `commitment_risk_register` (array): Any commitments made or implied that need to be formalized or walked back.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm AE's pricing authority and buyer's requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** AE's deal constraints and buyer's procurement requirements both present.

---

### Phase 1: Assess Deal Feasibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check the buyer's budget against the deal size — is there money? 2. Assess the procurement and legal timeline against the AE's close date — is the timeline realistic? 3. Review buyer's redlines against AE's approval authority — what can be resolved at the AE level vs. what needs escalation? 4. Identify internal political risks — is the champion strong enough to drive this through procurement?
**Output:** Budget confirmation, timeline feasibility, redline authority assessment, political risk.
**Quality Gate:** Timeline feasibility is specific — "buyer's security review takes 3 weeks; AE's quarter ends in 2 weeks; deal cannot close this quarter without expedited review."

---

### Phase 2: Resolve Commercial and Contract Terms
**Entry Criteria:** Feasibility assessed.
**Actions:** 1. Build the commercial structure — pricing, discount, payment terms. 2. For each redline, determine the resolution — vendor's approved position, alternative language, escalation path. 3. Identify commitments AE made that are non-standard and determine how to formalize or walk back. 4. Define the security and compliance deliverables — what the vendor provides, by when.
**Output:** Commercial structure, redline resolutions, commitment resolutions, compliance deliverables.
**Quality Gate:** Every redline has a specific resolution. No redlines are left as "to be discussed."

---

### Phase 3: Build the Close Plan
**Entry Criteria:** Terms resolved.
**Actions:** 1. Build the close plan — legal, security, procurement, executive approval in sequence with dates. 2. Define the internal alignment actions — what the AE does with the champion to maintain momentum. 3. Define the escalation path — what goes to VP, what goes to legal. 4. Define what happens if security review slips — options to close anyway.
**Output:** Close plan with dates, champion alignment actions, escalation path, contingency for delays.
**Quality Gate:** Close plan has specific dates for every step. Champion alignment has specific actions, not "stay in touch."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present deal close assessment. 2. Deliver commercial terms. 3. Deliver redline resolution. 4. Deliver internal alignment plan. 5. Present close plan and commitment risk register.
**Output:** Full synthesis — feasibility, commercial terms, redlines, alignment plan, close plan.
**Quality Gate:** AE and buyer both know what it takes to close and what each party must do next.

---

## Exit Criteria
Done when: (1) budget and timeline confirmed, (2) every redline has a resolution, (3) non-standard commitments resolved, (4) close plan has specific dates, (5) internal alignment plan is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
