# Insurance Claims Settlement

**One-line description:** Adjuster and claimant each submit their real coverage position and damages evidence — Claude identifies the gap, surfaces documentation needs, and builds a resolution path that closes the claim fairly and efficiently.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both adjuster and claimant must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_claim_number` (string, required): Claim reference number.
- `shared_loss_description` (string, required): What happened? Date, type of loss, and basic facts.

### Claims Adjuster / Insurer Submits Privately
- `adjuster_coverage_analysis` (object, required): Coverage determination — what is covered, what is excluded, what requires further investigation.
- `adjuster_reserve_position` (object, required): Current reserve and settlement authority range.
- `adjuster_settlement_authority` (object, required): What the adjuster is authorized to offer.
- `adjuster_documentation_requirements` (array, required): What documentation does the insurer still need to evaluate or close the claim?
- `adjuster_concerns_about_claim` (array, required): What concerns you about this claim — coverage questions, fraud indicators, documentation gaps?

### Claimant / Public Adjuster Submits Privately
- `claimant_damages_claimed` (object, required): Total damages being claimed by category — property damage, business interruption, extra expense, liability, etc.
- `claimant_supporting_evidence` (array, required): What documentation has been or will be submitted?
- `claimant_urgency` (string, required): What is the financial or operational urgency? What is the impact of a prolonged claim?
- `claimant_minimum_acceptable` (object, required): What is the minimum settlement that resolves the claim?
- `claimant_concerns_about_process` (array, required): What concerns you about how the claim is being handled?

## Outputs
- `coverage_position_summary` (object): What is covered, what is disputed, what is excluded — with the basis for each position.
- `damages_gap_analysis` (object): The gap between what is claimed and what the insurer has reserved, by category.
- `documentation_checklist` (array): What documentation is needed to support each category of damages.
- `negotiation_range` (object): The range within which a settlement is achievable based on coverage and reserves.
- `settlement_path_options` (array): Options to resolve the claim — full settlement, partial payment with reservation, alternative dispute resolution.
- `resolution_timeline` (object): Realistic timeline to close the claim given documentation needs.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm coverage analysis and damages claim present.
**Output:** Readiness confirmation.
**Quality Gate:** Coverage position and damages amount both present.

---

### Phase 1: Assess Coverage and Map the Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Review the adjuster's coverage analysis against the claimant's damages categories — which categories are covered, disputed, or excluded? 2. Calculate the gap between claimed damages and reserve position by category. 3. Identify documentation that, if provided, would support covered damages and potentially increase the settlement range. 4. Assess the adjuster's concerns — are they coverage-based, documentation-based, or fraud-related?
**Output:** Coverage status by damages category, gap by category, documentation opportunity, concern classification.
**Quality Gate:** Every damages category has a coverage status — covered, disputed, excluded, or insufficient documentation.

---

### Phase 2: Build the Documentation Checklist
**Entry Criteria:** Gap mapped.
**Actions:** 1. For each covered or disputed category, identify the specific documentation needed to support the claim amount. 2. Prioritize documentation by dollar value and likelihood of shifting the settlement range. 3. Identify documentation the claimant may not know they need. 4. Assess the urgency against the claimant's financial situation.
**Output:** Prioritized documentation checklist by damages category, gap between documented and total claim.
**Quality Gate:** Checklist is specific — "invoices for emergency repairs from licensed contractor" not "documentation of repairs."

---

### Phase 3: Build the Settlement Path
**Entry Criteria:** Documentation assessed.
**Actions:** 1. Establish the negotiation range — floor (minimum the insurer must pay under coverage), ceiling (maximum within authority given full documentation). 2. Assess whether the claimant's minimum acceptable falls within the negotiation range. 3. Identify which settlement path is most efficient given the gap and urgency — direct settlement, partial payment with reservation, appraisal, or mediation. 4. Draft the resolution timeline.
**Output:** Negotiation range, gap assessment, settlement path recommendation, resolution timeline.
**Quality Gate:** Negotiation range is in specific dollars. Settlement path is chosen based on the actual gap and documentation status.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Settlement path built.
**Actions:** 1. Present coverage position by category. 2. Present damages gap analysis. 3. Deliver documentation checklist. 4. Deliver negotiation range and settlement path options. 5. State resolution timeline.
**Output:** Full synthesis — coverage position, gap analysis, documentation checklist, settlement path, timeline.
**Quality Gate:** Both sides know what documentation is needed, what the settlement range is, and what the fastest path to resolution is.

---

## Exit Criteria
Done when: (1) coverage status for every damages category, (2) gap stated in specific dollars by category, (3) documentation checklist with specific items, (4) negotiation range established, (5) settlement path recommendation with timeline.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
