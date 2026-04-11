# Healthcare Payer Contract

**One-line description:** Health system and payer each submit their real rate requirements and contract terms — Claude models the economics, surfaces value-based alignment, and produces contract terms both sides can execute.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both health system and payer must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_contract_scope` (string, required): What services and facilities are covered by this contract?
- `shared_contract_term` (string, required): Proposed contract term and renewal structure.

### Health System / Provider Submits Privately
- `provider_rate_requirements` (object, required): Rate requirements by service category — inpatient, outpatient, professional, ancillary. What is the floor?
- `provider_value_based_programs` (object, required): What value-based care programs are you proposing or willing to participate in?
- `provider_contract_terms` (array, required): Key contract terms required — rates, escalators, payment terms, dispute resolution, termination rights.
- `provider_non_negotiables` (array, required): What cannot be accepted — rate floors, operational requirements, administrative burdens.
- `provider_concerns_about_payer` (array, required): What about this payer's behavior or requirements concerns you?

### Payer / Insurer Submits Privately
- `payer_rate_targets` (object, required): Target rate levels by service category. What is the maximum the payer can accept?
- `payer_network_requirements` (object, required): What does the payer need from this provider to maintain network adequacy?
- `payer_quality_requirements` (array, required): Quality measures, reporting requirements, and performance standards.
- `payer_value_based_care_goals` (object, required): What value-based programs does the payer want to implement?
- `payer_concerns_about_provider` (array, required): What concerns you about this provider's rates, quality, or administrative compliance?

## Outputs
- `rate_gap_analysis` (object): The gap between provider's floor and payer's ceiling by service category.
- `value_based_alignment` (object): Where both sides' value-based goals align and where they diverge.
- `contract_term_negotiation_map` (array): Each major term rated — aligned, workable gap, or significant conflict.
- `network_adequacy_assessment` (object): Whether the contract structure satisfies the payer's network needs.
- `contract_draft_terms` (string): Key contract provisions — rates, escalators, quality requirements, value-based programs, payment terms, termination.
- `implementation_requirements` (object): Operational requirements to activate the contract — credentialing, EDI setup, quality reporting.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm rate requirements and rate targets present.
**Output:** Readiness confirmation.
**Quality Gate:** Provider rate floor and payer rate ceiling both present.

---

### Phase 1: Assess Rate Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare provider's rate floor against payer's rate ceiling by service category — is there a zone of agreement? 2. Calculate the gap in dollar terms and as a percentage of current market rates. 3. Assess whether value-based programs can bridge the gap — shared savings, quality bonuses, or population health payments. 4. Identify service categories where the gap is unbridgeable vs. negotiable.
**Output:** Rate gap by service category, value-based bridge potential, bridgeable vs. unbridgeable gaps.
**Quality Gate:** Rate gap is specific — "$X per unit gap on inpatient DRG rates, representing Y% of provider's ask."

---

### Phase 2: Align Value-Based Programs
**Entry Criteria:** Rate viability assessed.
**Actions:** 1. Compare provider's proposed value-based programs against payer's goals — where do they overlap? 2. Model the financial impact of value-based programs on both sides' effective rates. 3. Identify operational requirements for value-based participation — data sharing, care management integration, quality reporting. 4. Assess whether value-based programs are additive to the rate structure or serve as a substitute.
**Output:** Value-based program alignment, financial model, operational requirements, structure recommendation.
**Quality Gate:** Value-based financial model is specific — "if the provider achieves target quality scores, effective rates increase by $X, closing Y% of the rate gap."

---

### Phase 3: Draft Contract Terms
**Entry Criteria:** VBC aligned.
**Actions:** 1. Draft rate schedule and escalator provisions. 2. Draft quality requirements and performance standards. 3. Draft value-based care program terms. 4. Draft operational provisions — payment terms, billing requirements, dispute resolution, termination rights. 5. Identify implementation requirements before the contract can go live.
**Output:** Contract draft terms, implementation requirements.
**Quality Gate:** Contract terms are specific — rates, escalators, and quality thresholds in numbers, not ranges.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Terms drafted.
**Actions:** 1. Present rate gap analysis. 2. Present value-based alignment. 3. Deliver contract term negotiation map. 4. Deliver contract draft terms. 5. State implementation requirements.
**Output:** Full synthesis — rate gap, VBC alignment, term map, draft terms, implementation requirements.
**Quality Gate:** Both sides can enter contract execution knowing the economics and operational requirements.

---

## Exit Criteria
Done when: (1) rate gap by service category in specific dollars, (2) value-based bridge potential modeled, (3) every major term has alignment status, (4) draft contract terms with specific rates and thresholds, (5) implementation requirements defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
