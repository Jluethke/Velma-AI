# Technology Reseller Agreement

**One-line description:** A software vendor (ISV) and a reseller each submit their real sales expectations, margin requirements, and support obligations before formalizing the channel arrangement — Claude aligns on a reseller program that drives revenue for both without the channel conflict and margin disputes that end most ISV-reseller relationships.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both ISV and reseller must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_isv_and_reseller` (string, required): Software vendor name and reseller/VAR company name.
- `shared_product_and_market` (string, required): Software product, target customer segment, and geography.

### ISV Submits Privately
- `isv_channel_strategy` (object, required): Why you are using a channel partner for this segment, what the reseller must bring that you cannot do directly.
- `isv_margin_and_economics` (object, required): Reseller discount structure, deal registration, MDF availability, what margin you can afford at different deal sizes.
- `isv_requirements_from_reseller` (object, required): Sales certifications, technical certifications, minimum revenue commitments, customer success expectations.
- `isv_channel_conflict_policy` (object, required): How direct deals are handled, when you go direct, deal registration protection, house accounts.
- `isv_concerns_about_this_reseller` (array, required): Competing products, commitment level, technical capability, customer overlap with your direct team.

### Reseller Submits Privately
- `reseller_market_and_customer_access` (object, required): What customers you serve, the relationships you have, why your customers would buy this product through you.
- `reseller_margin_requirements` (object, required): What margin you need to build a practice, invest in certification, and make this worth prioritizing over other vendors.
- `reseller_support_and_enablement_needs` (object, required): What training, technical support, and sales support you need from the ISV to be effective.
- `reseller_concerns_about_this_isv` (array, required): Channel conflict risk, margin sustainability, product competitiveness, vendor financial stability.
- `reseller_what_they_will_not_do` (array, required): Commitments you will not make, customer types you will not pursue, products you will not displace.

## Outputs
- `channel_value_and_fit_assessment` (object): Whether this reseller has the market access and capability to drive the ISV's business.
- `margin_and_economics_structure` (object): Discount tiers, deal registration benefits, MDF, total economics for both parties.
- `reseller_requirements_and_commitments` (object): Certifications, revenue commitments, customer success standards.
- `channel_conflict_framework` (object): How direct and indirect motions coexist — deal registration, house accounts, rules of engagement.
- `enablement_and_support_plan` (object): Training, technical support, sales support the ISV provides.
- `reseller_agreement_framework` (object): Key terms for the reseller agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm ISV's channel requirements and reseller's market access and margin needs both present.
**Output:** Readiness confirmation.
**Quality Gate:** ISV's requirements and reseller's market access and economics both present.

---

### Phase 1: Assess Channel Fit and Economics
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate reseller's customer access against ISV's target segment. 2. Assess margin structure — can the reseller build a practice at the offered margins? 3. Identify channel conflict risk — where will direct and reseller motions collide? 4. Evaluate technical capability against product complexity.
**Output:** Channel fit assessment, margin viability, conflict risk map, capability gap.
**Quality Gate:** Channel conflict assessment identifies specific customer types or accounts where conflict is likely — not general risk.

---

### Phase 2: Structure the Agreement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the discount and deal registration structure. 2. Build the commitment framework — certifications, minimums, customer success standards. 3. Establish the channel conflict rules of engagement. 4. Define the enablement and support program.
**Output:** Discount structure, commitment framework, conflict rules, enablement plan.
**Quality Gate:** Conflict rules are specific — named account types, named situations, named resolution process.

---

### Phase 3: Define Performance and Governance
**Entry Criteria:** Structure built.
**Actions:** 1. Define performance review cadence — quarterly business reviews, pipeline reviews. 2. Build the remediation process for under-performance. 3. Define term and termination — including impact on in-flight deals. 4. Assemble the reseller agreement framework.
**Output:** Performance review process, remediation plan, term and termination, agreement framework.
**Quality Gate:** Termination provisions address in-flight deals and customer protection specifically.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — channel fit, margin structure, commitments, conflict framework, enablement plan, performance governance.
**Quality Gate:** Reseller knows what margin and support to expect. ISV knows what commitment and capability the reseller brings.

---

## Exit Criteria
Done when: (1) channel fit is assessed, (2) discount structure is complete, (3) conflict rules are specific, (4) commitments are defined, (5) term and performance governance are established.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
