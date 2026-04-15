# Insurance Reinsurance Treaty

**One-line description:** Cedent and reinsurer each submit their real portfolio exposure and pricing requirements — AI models the economics, surfaces terms misalignment, and produces a treaty structure both sides can execute.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both cedent and reinsurer must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_treaty_name` (string, required): Treaty name or identifier.
- `shared_treaty_type` (string, required): Treaty structure — quota share, excess of loss, aggregate, etc.

### Cedent (Primary Insurer) Submits Privately
- `cedent_portfolio_exposure` (object, required): Underlying portfolio — lines, premium volume, geography, loss history, concentration risks.
- `cedent_desired_cession_terms` (object, required): Cession percentage, retention, limits, attachment points, and commission requirements.
- `cedent_pricing_expectations` (object, required): What rate on line or cession commission are you expecting?
- `cedent_loss_history` (object, required): Ceded loss experience — treaty-level loss ratio, large loss events, trends.
- `cedent_concerns_about_reinsurer` (array, required): What concerns you about this reinsurer — security, terms, claims handling?

### Reinsurer Submits Privately
- `reinsurer_portfolio_analysis` (object, required): Assessment of the cedent's underlying portfolio — quality, concentration, accumulation risk.
- `reinsurer_treaty_terms_required` (object, required): What treaty structure, cession limits, exclusions, and conditions are required?
- `reinsurer_pricing_requirements` (object, required): Minimum rate on line or cession commission based on expected loss cost.
- `reinsurer_capacity_available` (object, required): How much capacity is the reinsurer willing to provide on this treaty?
- `reinsurer_concerns_about_cedent_portfolio` (array, required): What concerns you about the underlying book — adverse selection, data quality, management?

## Outputs
- `exposure_and_pricing_gap` (object): The gap between cedent's pricing expectations and reinsurer's minimum requirements.
- `terms_alignment_map` (object): Where treaty terms are aligned vs. where there are conflicts.
- `cession_structure_options` (array): 2-3 treaty structures with economics modeled for both sides.
- `pricing_negotiation_range` (object): The range within which a treaty can be executed.
- `treaty_draft_terms` (string): Key treaty terms — structure, limits, attachment, pricing, exclusions, reporting.
- `capacity_commitment` (object): Capacity the reinsurer is prepared to commit and any conditions.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm portfolio exposure data and reinsurer's pricing requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** Cedent's portfolio data and reinsurer's pricing floor both present.

---

### Phase 1: Assess Portfolio and Price Adequacy
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Review the cedent's loss history — calculate the treaty-level loss ratio and trend. 2. Assess the reinsurer's portfolio concerns against the cedent's data — are the concerns data-driven or perception-driven? 3. Compare cedent's pricing expectations against reinsurer's minimum rate on line — calculate the gap. 4. Assess whether the cession terms the cedent wants are compatible with the reinsurer's capacity appetite.
**Output:** Treaty loss ratio, concern validity assessment, pricing gap, cession-capacity compatibility.
**Quality Gate:** Pricing gap is stated in rate on line basis points. Loss ratio is actual, not estimated.

---

### Phase 2: Map Terms Conflicts
**Entry Criteria:** Pricing assessed.
**Actions:** 1. Compare cedent's desired cession structure against reinsurer's required terms — attachment points, exclusions, reporting, claims cooperation. 2. Identify non-negotiable terms on each side. 3. Assess whether the portfolio concerns the reinsurer raised justify the terms requirements, or whether they are standard protective language. 4. Identify where structuring alternatives could bridge the gap.
**Output:** Terms conflict map, non-negotiable identification, concern-to-terms justification, structuring alternatives.
**Quality Gate:** Every terms conflict is specific. Non-negotiables are separated from negotiating positions.

---

### Phase 3: Build Treaty Structure Options
**Entry Criteria:** Conflicts mapped.
**Actions:** 1. Design 2-3 treaty structures that address both sides' core requirements. 2. Model the economics for each structure — cedent's net retention economics and reinsurer's expected loss ratio. 3. Identify the capacity commitment available for each structure. 4. Draft the treaty terms for the recommended structure.
**Output:** Structure options with modeled economics, capacity commitment, treaty terms draft.
**Quality Gate:** Every option is economically modeled. "Option A works for the cedent but not the reinsurer" is named, not softened.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Treaty structures built.
**Actions:** 1. Present pricing gap and portfolio assessment. 2. Present terms alignment map. 3. Deliver treaty structure options with economic models. 4. Deliver treaty draft terms. 5. State capacity commitment.
**Output:** Full synthesis — pricing gap, terms map, structure options, treaty terms, capacity.
**Quality Gate:** Both sides can negotiate from the draft terms with a clear understanding of where they are apart and what it would take to close.

---

## Exit Criteria
Done when: (1) pricing gap stated in rate on line basis points, (2) every terms conflict identified, (3) two or three treaty structures with economic models, (4) treaty draft terms specific enough to negotiate from, (5) capacity commitment stated.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
