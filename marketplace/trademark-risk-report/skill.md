# Trademark Risk Report

**One-line description:** Synthesizes USPTO, common-law, international, and DuPont-factor outputs into a single attorney-ready preliminary clearance opinion brief.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party synthesis.

**DISCLAIMER:** This is a *preliminary screening report* designed to accelerate trademark-attorney review. It is NOT a formal clearance opinion. No attorney-client privilege attaches. Do not rely on this as the sole basis for a go/no-go decision on brand investment.

---

## Inputs

All outputs from the prior four flows in the chain:
- `exact_matches`, `phonetic_neighbors`, `visual_similarities` (from `trademark-uspto-search`)
- `common_law_conflict_candidates` (from `trademark-common-law-search`)
- `international_conflict_candidates` (from `trademark-international-search`)
- `likelihood_of_confusion_rating`, `dupont_factor_table` (from `trademark-similarity-analysis`)
- `proposed_mark` (string)
- `proposed_goods_services` (object)

## Outputs

- `overall_risk_level` (string): "low" / "medium" / "high" / "blocker" for the proposed mark across all surveyed jurisdictions and bases.
- `per_conflict_risk_breakdown` (array): Each conflict with its individual risk rating and dominant DuPont factors.
- `action_recommendations` (array): Per conflict, a recommended action  --  PROCEED, MODIFY_MARK, NEGOTIATE_CONSENT, FILE_WITH_RISK, ABANDON.
- `attorney_review_flags` (array): Specific conflicts or factor combinations that require manual attorney judgment (e.g., "famous-mark analysis required" or "coordinated-class question  --  TMEP 1207.01 interpretation").
- `clearance_opinion_brief` (markdown document): The attorney-ready brief combining all the above into a single reviewable narrative.
- `filing_strategy_notes` (object): If `overall_risk_level` is "low" or "medium", notes on filing strategy  --  which classes to file in first, Madrid protocol advisability, timing considerations, budget envelope.

---

## Execution Phases

### Phase 0: Input Consolidation
### Entry Criteria
All upstream flows have produced their outputs.
### Actions
Merge all conflict arrays, de-duplicate across upstream flows (same mark may appear in USPTO + common-law + international). Preserve provenance tags.
### Output
Unified conflict set with per-conflict upstream-flow attribution.
### Quality Gate
Every conflict has at least one upstream attribution and its full DuPont analysis.

### Phase 1: Risk Calibration Per Conflict
### Entry Criteria
Unified set ready.
### Actions
For each conflict, map the `likelihood_of_confusion_rating` to a risk level:
- "very low" → LOW
- "low" → LOW (unless conflict is in exact-same class → MEDIUM)
- "moderate" → MEDIUM
- "high" → HIGH
- "very high" → BLOCKER

Apply escalators:
- Senior mark is famous (regardless of class) → escalate one level
- Senior mark is in all required jurisdictions → escalate one level
- Senior mark has pending litigation history → flag for attorney review

### Output
`per_conflict_risk_breakdown`.
### Quality Gate
Every conflict has a risk level and at least one rationale line.

### Phase 2: Overall Risk Aggregation
### Entry Criteria
Per-conflict risk levels assigned.
### Actions
Overall risk = MAX of per-conflict risks, BUT with count adjustment:
- 1-2 LOW conflicts → overall LOW
- 3+ LOW or any MEDIUM → overall MEDIUM
- Any HIGH → overall HIGH
- Any BLOCKER → overall BLOCKER

### Output
`overall_risk_level`.
### Quality Gate
Overall level is supported by enumerated per-conflict evidence.

### Phase 3: Per-Conflict Action Recommendations
### Entry Criteria
Risk levels set.
### Actions
Per conflict, recommend action based on risk + conflict-specific factors:
- LOW → PROCEED (note the conflict in the application but no action needed)
- MEDIUM + coordinated-class overlap → FILE_WITH_RISK (pursue, but document assumed defenses)
- MEDIUM + exact-class overlap → MODIFY_MARK (try adding a distinguishing qualifier) OR NEGOTIATE_CONSENT
- HIGH → NEGOTIATE_CONSENT (letter of coexistence) OR ABANDON
- BLOCKER → ABANDON (and restart naming)

### Output
`action_recommendations`.
### Quality Gate
Every conflict has an action + the factors driving it.

### Phase 4: Attorney Review Flags
### Entry Criteria
Recommendations drafted.
### Actions
Identify conflicts or factor combinations that a human attorney must review before any filing decision:
- Coordinated-class interpretations (TMEP 1207.01) are judgment-sensitive
- Famous-mark analyzes (Playboy, Polaroid, etc.)
- International-designation bundles (Madrid filings that haven't been nationally examined yet)
- Consent-agreement drafting
- Prior litigation patterns of the senior owner

### Output
`attorney_review_flags`.
### Quality Gate
At minimum, every HIGH or BLOCKER-level conflict is flagged for review.

### Phase 5: Clearance Opinion Brief Assembly
### Entry Criteria
All analyzes complete.
### Actions
Assemble `clearance_opinion_brief` (markdown) with:
1. Executive summary (overall risk, headline recommendation)
2. Proposed mark + proposed goods/services
3. Enumerated conflicts by source (USPTO / common-law / international)
4. Per-conflict DuPont tables (summarized)
5. Overall risk determination with rationale
6. Recommendations (per conflict + overall)
7. Attorney-review flags
8. Filing strategy (if risk is LOW or MEDIUM)
9. Disclaimer

### Output
`clearance_opinion_brief` as a single markdown document, suitable for email to a trademark attorney as a preliminary briefing.
### Quality Gate
Document is under 10 pages and includes all nine sections.

### Phase 6: Filing Strategy Notes (if viable)
### Entry Criteria
`overall_risk_level` is LOW or MEDIUM.
### Actions
Produce filing-strategy notes:
- Which classes to file first (by priority market)
- Whether to file ITU (intent-to-use) vs. use-based
- Madrid Protocol filing timing (6-month priority window)
- Budget envelope: USPTO filing fees + attorney fees per class
### Output
`filing_strategy_notes`.
### Quality Gate
Budget envelope is explicit and class-by-class.


---

## Worked Example

Illustrative only.

Given typical inputs for Synthesizes USPTO, common-law, international, and DuPont-factor outputs into a s, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


---

## Exit Criteria

DONE when all phase quality gates pass and all outputs are populated.


---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Any | Missing required input | **Stop**: report which input is missing and what it should contain. |
| Any | Upstream phase output incomplete | **Return**: re-run the upstream phase with the gap identified. |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
