# Trademark Similarity Analysis (DuPont Factors)

**One-line description:** Applies the 13-factor DuPont likelihood-of-confusion analysis to each identified conflict candidate. Scores mark similarity, goods/services relatedness, channels of trade, consumer sophistication, and senior-mark strength.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party analysis.

**Legal framework:** The DuPont factors (*In re E.I. du Pont de Nemours & Co.*, 476 F.2d 1357, C.C.P.A. 1973) are the USPTO's 13-factor test for whether a proposed mark is likely to cause consumer confusion with a senior mark. The TTAB and federal courts apply this test. Not every factor is relevant in every case.

---

## Inputs

- `proposed_mark` (string, required)
- `proposed_goods_services` (object, required): What the applicant will sell. Free-text description + class assignments.
- `conflict_candidates` (array, required): Consolidated conflicts from upstream searches (`uspto-search`, `common-law-search`, `international-search`).
- `proposed_channels_of_trade` (array, required): How the applicant will reach customers (e.g., "direct enterprise sales", "online SaaS self-serve", "reseller").
- `proposed_consumer_sophistication` (string, required): "consumer retail" | "SMB" | "mid-market" | "enterprise" | "government". Sophistication raises the confusion bar.

## Outputs

- `mark_similarity_scored` (array): Per conflict, three sub-scores  --  sight / sound / meaning  --  each 0-100, plus a weighted composite. Methodology: sight uses Levenshtein + visual-confusable normalization; sound uses Metaphone + vowel/consonant-cluster analysis; meaning uses semantic comparison (shared roots, translation equivalence).
- `goods_services_relatedness` (array): Per conflict, a relatedness score 0-100 based on: shared class, coordinated classes, overlapping customer type, substitutability, complementarity.
- `channels_of_trade_analysis` (array): Per conflict, overlap score on distribution channels.
- `consumer_sophistication_analysis` (array): Per conflict, the effect of sophistication on confusion risk. Enterprise/government reduces risk; consumer retail raises it.
- `senior_mark_strength` (array): Per conflict, the senior mark's distinctiveness rating  --  arbitrary / suggestive / descriptive + secondary meaning / generic  --  which scales the injunctive weight of any infringement finding.
- `dupont_factor_table` (array of objects): Per conflict, a DuPont-factor-by-factor table with qualitative notes.
- `likelihood_of_confusion_rating` (array): Per conflict, an overall rating  --  "very low" / "low" / "moderate" / "high" / "very high"  --  plus rationale.

---

## Execution Phases

### Phase 0: Candidate Intake
### Entry Criteria
`conflict_candidates` array non-empty.
### Actions
Consolidate all candidates into one uniform schema with {entity_name, mark, goods_services, class, status, jurisdiction, source_flow}.
### Output
Unified candidate list.
### Quality Gate
Every candidate has all seven required fields.

### Phase 1: Mark Similarity (DuPont Factor 1)
### Entry Criteria
Candidates ready.
### Actions
For each conflict: compute sight similarity (Levenshtein distance + visual-confusable normalization), sound similarity (Metaphone + phonetic-cluster match), meaning similarity (semantic root + translation equivalence). Weighted composite: 0.35 sight + 0.35 sound + 0.30 meaning.
### Output
`mark_similarity_scored`.
### Quality Gate
Every conflict has three sub-scores + composite.

### Phase 2: Goods/Services Relatedness (DuPont Factor 2)
### Entry Criteria
Mark similarity complete.
### Actions
For each conflict, compute relatedness: same class (+40), coordinated classes per TMEP (+25), overlapping end-customer profile (+20), substitutability/complementarity (+15). Max 100.
### Output
`goods_services_relatedness`.
### Quality Gate
Every conflict has explicit rationale for the score.

### Phase 3: Channels of Trade (DuPont Factor 3)
### Entry Criteria
Relatedness complete.
### Actions
Assess overlap of distribution channels. Enterprise direct-sales shares almost nothing with consumer retail. SaaS self-serve + enterprise sales overlap moderately. Same channels → higher confusion risk.
### Output
`channels_of_trade_analysis`.
### Quality Gate
Each conflict has an explicit channel-overlap rationale.

### Phase 4: Consumer Sophistication (DuPont Factor 4)
### Entry Criteria
Channels complete.
### Actions
Enterprise/government buyers (CROs, reinsurers, DoD contractors) do significant due diligence; less likely to confuse. Consumer retail buyers do quick impulse decisions; more likely to confuse. Adjust confusion risk accordingly.
### Output
`consumer_sophistication_analysis`.
### Quality Gate
Each conflict labeled with sophistication adjustment.

### Phase 5: Senior Mark Strength (DuPont Factor 5-6)
### Entry Criteria
Sophistication complete.
### Actions
Classify each senior mark on the distinctiveness spectrum (fanciful > arbitrary > suggestive > descriptive + secondary meaning > generic). Famous marks get a broader zone of protection regardless of class.
### Output
`senior_mark_strength`.
### Quality Gate
Every senior mark has a distinctiveness label.

### Phase 6: DuPont Table Assembly
### Entry Criteria
All factor analyzes complete.
### Actions
For each conflict, emit a factor-by-factor table covering the 13 DuPont factors. Factors not analyzed (e.g., actual-confusion evidence, market-interface analyzes) are explicitly marked "not applicable  --  litigation-only" or "data not available in pre-clearance."
### Output
`dupont_factor_table`.
### Quality Gate
Every conflict table has 13 rows; unreachable factors marked.

### Phase 7: Likelihood-of-Confusion Rating
### Entry Criteria
DuPont tables built.
### Actions
Weight the factors (similarity × relatedness has the largest weight per TTAB precedent) and emit a 5-level rating per conflict. Include rationale citing the dominant factors.
### Output
`likelihood_of_confusion_rating`.
### Quality Gate
Every rating has a 2-3 sentence rationale.


---

## Worked Example

Illustrative only.

Given typical inputs for Applies the 13-factor DuPont likelihood-of-confusion analysis (In re E.I. du Pon, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


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
