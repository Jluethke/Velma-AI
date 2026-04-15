# Portfolio Add-On Acquisition

**One-line description:** A private equity platform company and an add-on acquisition target each submit their real strategic fit assessment, valuation expectations, and integration concerns before the deal closes — AI aligns on an acquisition structure where the target understands what they are joining and the platform understands what they are buying.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both platform and target must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_platform_and_target` (string, required): Platform company name and acquisition target name.
- `shared_deal_context` (string, required): Industry, deal size range, strategic rationale, and PE sponsor.

### Platform Submits Privately
- `platform_strategic_rationale` (object, required): Why this acquisition — capability, geography, customer, revenue synergy — the specific thesis.
- `platform_valuation_and_deal_structure` (object, required): Valuation range, EBITDA multiple target, deal structure (earnout, rollover equity, seller financing), what you will and will not do.
- `platform_integration_plan` (object, required): How the target will be integrated — standalone, partial integration, full merger — timeline and what changes immediately.
- `platform_concerns_about_the_target` (array, required): Customer concentration, key person risk, quality of earnings, cultural fit, undisclosed liabilities.
- `platform_what_will_kill_the_deal` (array, required): Due diligence findings or negotiation outcomes that cause you to walk.

### Target Submits Privately
- `target_seller_objectives` (object, required): What the owner wants — price, structure, liquidity, role post-close, what happens to employees, legacy.
- `target_business_reality` (object, required): The honest version of the business — customer concentrations, key person dependencies, normalized EBITDA, anything that didn't make the CIM.
- `target_valuation_expectations` (object, required): What you believe the business is worth, what multiple you are expecting, what deal structure is acceptable.
- `target_concerns_about_joining_a_platform` (array, required): Loss of autonomy, PE time horizon, integration risk, earn-out risk, cultural fit.
- `target_what_they_will_not_accept` (array, required): Deal structures, earnout terms, employment conditions, or integration approaches that are deal-breakers.

## Outputs
- `strategic_fit_and_synergy_assessment` (object): Whether the acquisition thesis is sound and how specifically synergies will be achieved.
- `valuation_and_structure_alignment` (object): Where buyer and seller are aligned and what the gaps are — price, structure, earnout.
- `due_diligence_risk_map` (object): What the platform needs to verify before closing and what the target has disclosed.
- `integration_plan_framework` (object): How the target will operate post-close — what changes, what stays, timeline.
- `earnout_and_retention_structure` (object): Earnout mechanics, seller role, key employee retention, equity rollover.
- `loi_and_purchase_agreement_framework` (object): Key terms for legal and investment banking teams.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm platform's valuation and integration plan and target's business reality and valuation expectations both present.
**Output:** Readiness confirmation.
**Quality Gate:** Platform's deal structure and target's business reality and valuation expectations all present.

---

### Phase 1: Assess Strategic and Economic Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate the acquisition thesis against the target's actual business. 2. Assess valuation gap — platform's multiple vs. seller's expectation. 3. Identify key diligence risks. 4. Assess integration approach compatibility with seller's objectives.
**Output:** Thesis assessment, valuation gap, diligence risk priorities, integration-seller compatibility.
**Quality Gate:** Valuation gap is a specific dollar amount with the assumptions driving each party's position.

---

### Phase 2: Structure the Deal
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the deal structure — price, earnout, rollover equity, seller financing. 2. Design the earnout mechanics — what triggers it, how it is measured, what is within the seller's control. 3. Define the integration approach — what changes at close, what stays standalone. 4. Establish the retention and employment framework.
**Output:** Deal structure, earnout mechanics, integration approach, retention framework.
**Quality Gate:** Earnout mechanics are specific — named metric, named calculation method, named payment dates.

---

### Phase 3: Define Governance and Close Process
**Entry Criteria:** Structure built.
**Actions:** 1. Define post-close governance — reporting, board composition, decision rights. 2. Build the diligence-to-close timeline. 3. Define representations, warranties, and indemnification framework. 4. Assemble the LOI and purchase agreement framework.
**Output:** Post-close governance, close timeline, reps and warranties framework, LOI framework.
**Quality Gate:** Decision rights post-close are specific — what the target management retains vs. what requires PE approval.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — strategic fit, deal structure, earnout mechanics, integration plan, retention framework, governance, LOI framework.
**Quality Gate:** Seller understands what they are joining and what they are getting. Buyer understands what they are buying and what needs to be verified.

---

## Exit Criteria
Done when: (1) strategic fit is assessed with specific synergy identification, (2) valuation gap is quantified, (3) earnout mechanics are specific, (4) integration approach is defined, (5) governance post-close is established.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
