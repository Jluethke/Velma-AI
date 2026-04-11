# Medical Device Hospital Contract

**One-line description:** A medical device company and a hospital or GPO each submit their clinical requirements, pricing constraints, and contract terms before negotiation — Claude aligns on a supply agreement that gets the right devices to patients at terms both sides can live with.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both device company and hospital must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_device_category` (string, required): Device type, clinical application, and volume estimate.
- `shared_facility_and_company` (string, required): Hospital/health system name and device company name.

### Device Company Submits Privately
- `company_pricing_and_margin` (object, required): List price, floor price, volume discount structure, what margin you need to maintain.
- `company_clinical_support_offer` (object, required): Field clinical support, training, in-service, outcomes data you provide.
- `company_contract_requirements` (object, required): Sole-source vs. dual-source, volume commitments, contract term, rebate structure.
- `company_concerns_about_this_account` (array, required): Payment history, compliance risk, competitive pressure, price sensitivity.
- `company_what_they_will_not_do` (array, required): Pricing floors you will not cross, clinical support you will not provide, contract terms you will not accept.

### Hospital/GPO Submits Privately
- `hospital_clinical_requirements` (object, required): Device specifications required for clinical outcomes — what the clinical team will not compromise on.
- `hospital_budget_and_pricing_target` (object, required): Target price per unit, annual budget, savings required, GPO contract obligations.
- `hospital_current_vendor_situation` (object, required): Who you currently use, what is working, what is not, what would make you switch.
- `hospital_contract_terms_required` (array, required): Pricing guarantees, sole-source vs. dual-source, compliance reporting, service requirements.
- `hospital_concerns_about_this_vendor` (array, required): Clinical evidence gaps, support reliability, price escalation history, supply chain risk.

## Outputs
- `pricing_and_contract_structure` (object): Unit price, volume discounts, rebates, and total contract value.
- `clinical_support_plan` (object): What support is provided, frequency, documentation.
- `volume_and_commitment_terms` (object): Committed volume, sole-source or dual-source, compliance measurement.
- `performance_and_outcomes_framework` (object): Clinical outcomes tracked, reporting, what triggers contract review.
- `supply_reliability_provisions` (object): Supply guarantees, backorder procedures, substitution rights.
- `contract_agreement_framework` (object): Key terms for legal and supply chain teams.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm company's pricing floor and hospital's budget target both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' pricing positions and clinical requirements present.

---

### Phase 1: Assess Clinical and Commercial Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare clinical requirements against what the device delivers — are there specification gaps? 2. Assess pricing gap — company's floor vs. hospital's target. 3. Evaluate clinical support expectations against what the company actually provides. 4. Assess sole-source vs. dual-source compatibility.
**Output:** Clinical fit assessment, pricing gap, support expectation gap, sourcing compatibility.
**Quality Gate:** Pricing gap is a specific dollar amount. Clinical gaps are named requirements, not general concerns.

---

### Phase 2: Structure the Agreement
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Build the pricing structure — unit price, volume tiers, rebates, total contract value. 2. Define clinical support obligations — frequency, scope, documentation. 3. Establish volume commitments and compliance measurement. 4. Define supply reliability provisions and backorder procedures.
**Output:** Pricing structure, support obligations, volume terms, supply provisions.
**Quality Gate:** Every pricing tier has a specific unit count and dollar amount. Support obligations have specific frequencies and deliverables.

---

### Phase 3: Define Performance and Governance
**Entry Criteria:** Structure established.
**Actions:** 1. Define outcomes tracking — what clinical metrics, how measured, reporting cadence. 2. Build the contract review triggers — what performance failures trigger renegotiation. 3. Define the term, renewal, and termination provisions. 4. Assemble the contract framework for legal review.
**Output:** Outcomes framework, review triggers, term and termination, contract framework.
**Quality Gate:** Review triggers are specific metrics with specific thresholds — not "poor performance" but named failures.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — pricing, clinical support, volume terms, supply provisions, outcomes framework, contract structure.
**Quality Gate:** Hospital knows total cost and clinical support. Device company knows committed volume and floor pricing.

---

## Exit Criteria
Done when: (1) pricing structure is complete with all tiers, (2) clinical support obligations are specific, (3) volume commitments are measurable, (4) supply reliability provisions are defined, (5) termination terms are complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
