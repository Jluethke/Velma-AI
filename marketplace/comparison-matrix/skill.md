# Comparison Matrix

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for comparing 2-5 options across weighted criteria. Takes options and evaluation criteria with importance weights, scores each option, and produces a ranked recommendation with tradeoff analysis. Fork this to create domain-specific decision tools (product comparison, vendor selection, job offer comparison, tool evaluation, treatment option comparison, etc.).

## Execution Pattern: ORPA Loop

```
OBSERVE --> Gather options, define criteria, assign weights
REASON  --> Score each option per criterion, compute weighted totals
PLAN    --> Rank options, identify tradeoffs, assess confidence
ACT     --> Output comparison matrix, winner, and tradeoff summary
     \                                                              /
      +--- New option or changed criteria --- loop OBSERVE --------+
```

## Inputs

- `options`: list[string] -- The 2-5 options to compare (product names, vendors, job offers, cities, etc.)
- `criteria`: list[object] -- Evaluation criteria. Each: `{name, weight (0.0-1.0), direction ("higher_better"|"lower_better")}`
- `context`: string -- Background on the decision: who is deciding, what matters most, any dealbreakers
- `dealbreakers`: list[object] -- Optional hard constraints that eliminate options. Each: `{criterion, threshold, operator ("min"|"max"|"equals")}`

## Outputs

- `comparison_matrix`: object -- Options x criteria table with raw scores, weighted scores, and totals
- `ranking`: list[object] -- Options ranked by weighted total with score gaps
- `tradeoff_summary`: list[string] -- Plain-language description of what you gain/lose choosing each top option
- `recommendation`: object -- Top pick with confidence (0.0-1.0) and one-paragraph rationale
- `sensitivity_flags`: list[string] -- Criteria where a small weight change would flip the winner

---

## Execution

### OBSERVE: Frame the Comparison

**Entry criteria:** At least 2 options and 1 criterion are provided.

**Actions:**
1. Validate options. Ensure 2-5 options are provided. If more than 5, ask the user to shortlist or group similar options. If fewer than 2, this is not a comparison -- suggest the Pros and Cons Analyzer skill instead.
2. Validate and normalize criteria weights. Weights must sum to 1.0. If raw weights are provided (e.g., "cost is twice as important as speed"), normalize them. If no weights are given, start with equal weights and flag for user adjustment.
3. Apply dealbreakers. For each option, check against dealbreaker thresholds. Eliminate options that fail hard constraints. Document which options were eliminated and why.
4. Set scoring scale. Use 1-10 for all criteria. Define anchor points: 1 = worst realistic, 5 = acceptable, 10 = best realistic. Scoring anchors should be specific to the domain when possible.

**Output:** Validated option list (post-dealbreakers), normalized criteria with weights, scoring scale with anchors.

**Quality gate:** 2-5 options survive dealbreakers. Weights sum to 1.0. Each criterion has a clear direction (higher_better or lower_better).

---

### REASON: Score and Compute

**Entry criteria:** Options and weighted criteria are finalized.

**Actions:**
1. Score each option on each criterion (1-10). Provide a one-sentence justification for every score. Score all options on a single criterion before moving to the next criterion -- this prevents halo effects.
2. Compute weighted scores. For each cell: `weighted = raw_score * criterion_weight`. For "lower_better" criteria, invert: `weighted = (11 - raw_score) * criterion_weight`.
3. Compute weighted totals per option. Sum all weighted scores. Normalize to 0-100 scale for readability.
4. Run sensitivity check. For each criterion, test: if this weight moved +/- 20%, would the top-ranked option change? Flag sensitive criteria.
5. Identify tradeoffs between top 2 options. For each criterion where they differ by 2+ points, state the tradeoff in plain language: "Option A is stronger on X but weaker on Y."

**Output:** Scored matrix, weighted totals, sensitivity flags, tradeoff analysis.

**Quality gate:** Every cell has a score and justification. Weighted totals are mathematically consistent. Sensitivity check completed.

---

### PLAN: Rank and Recommend

**Entry criteria:** Scoring and analysis are complete.

**Actions:**
1. Rank options by weighted total. Note the gap between adjacent ranks. Gaps under 5 points (on 100-point scale) mean the options are effectively tied.
2. Assess recommendation confidence. High (0.7-1.0): clear winner with 10+ point gap and no sensitivity flags. Medium (0.4-0.7): winner with small gap or 1-2 sensitivity flags. Low (0.0-0.4): near-tie or multiple sensitivity flags -- needs more information or refined weights.
3. Write tradeoff summary. For the top 2-3 options, one sentence each: "Choose X if you prioritize A and B. Choose Y if C matters more than A."
4. Draft recommendation. State the winner, the confidence level, and a one-paragraph rationale referencing the key criteria that drove the result.

**Output:** Ranked list, confidence assessment, tradeoff summaries, recommendation.

**Quality gate:** Recommendation confidence is justified by gap size and sensitivity. Tradeoff summary covers top 2 options minimum.

---

### ACT: Deliver Comparison Package

**Entry criteria:** Ranking and recommendation are ready.

**Actions:**
1. Format the comparison matrix as a table: options as rows, criteria as columns, with raw scores, weighted scores, and totals.
2. Output the ranking with score gaps.
3. Output tradeoff summaries in plain language.
4. Output recommendation with confidence.
5. List sensitivity flags so the user knows where weight adjustments could change the outcome.
6. Check for loop trigger: did scoring reveal a missing criterion or a new option worth considering? If so, note it but do not loop automatically.

**Output:** Complete comparison package: matrix, ranking, tradeoffs, recommendation, sensitivity flags.

**Quality gate:** Matrix is internally consistent. Ranking matches weighted totals. Recommendation references specific criteria scores.

## Exit Criteria

The skill is DONE when:
1. A comparison matrix with weighted scores exists for all options x criteria
2. Options are ranked with score gaps noted
3. Tradeoff summaries explain what you gain/lose with each top option
4. A recommendation with confidence level is stated
5. Sensitivity flags identify fragile rankings

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | All options eliminated by dealbreakers | **Escalate** -- ask user to relax constraints or provide new options |
| OBSERVE | Only 1 option remains | **Adjust** -- switch to Pros and Cons analysis for the single option |
| REASON | Cannot score an option on a criterion (no data) | **Adjust** -- assign score of 5 (neutral), flag as estimated, reduce confidence |
| REASON | Two options tied exactly | **Adjust** -- add tiebreaker criterion (cost of switching, gut preference, reversibility) |
| PLAN | Confidence too low to recommend | **Escalate** -- present the matrix without a recommendation, ask user to refine weights |
| ACT | User rejects the recommendation or disputes specific scores | **Adjust** -- incorporate specific feedback (e.g., a score is wrong due to domain knowledge the model lacked, a criterion weight doesn't reflect actual priorities), update the affected cells and recompute weighted totals; do not restart from OBSERVE unless new options need to be added or criteria fundamentally changed |

## Reference

### Scoring Anchors (1–10 Scale)

| Score | Meaning |
|---|---|
| 10 | Best realistic outcome — exceeds all requirements |
| 8–9 | Strong — fully meets requirements with notable upside |
| 6–7 | Acceptable — meets core requirements, minor gaps |
| 4–5 | Marginal — meets some requirements, notable gaps |
| 2–3 | Weak — significant shortfall on this criterion |
| 1 | Worst realistic — fails the criterion entirely |

### Sensitivity Threshold Rule

A criterion is **sensitivity-flagged** if:
- Moving its weight by ±20% (absolute) would change the top-ranked option
- The gap between the top two options is less than 5 points on a 100-point normalized scale

When sensitivity flags exist, report as: "The winner changes if [criterion] weight moves from X to Y."

### Effective Tie Rule

Options are **effectively tied** when their normalized total scores are within 5 points. In a tie:
1. Identify the criterion with the largest score difference between the two tied options
2. Ask the user to rate that single criterion's weight relative to their actual priorities
3. Use the response to break the tie — never recommend arbitrarily when tied

### Common Weight Distributions by Decision Type

| Decision Type | Common High-Weight Criteria |
|---|---|
| Vendor / tool selection | Reliability (0.25), Cost (0.20), Support (0.20) |
| Job offer comparison | Compensation (0.25), Growth potential (0.25), Culture fit (0.20) |
| Location / relocation | Cost of living (0.20), Career opportunity (0.20), Quality of life (0.20) |
| Product purchase | Core feature fit (0.30), Price (0.25), Reliability (0.20) |

## State Persistence

Between runs, this skill accumulates:
- **Criteria libraries**: commonly used criteria sets per domain (vendor selection criteria, job offer criteria, etc.)
- **Scoring calibration**: historical accuracy of scores vs. actual outcomes
- **Weight patterns**: which weight distributions led to decisions the user was satisfied with

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
