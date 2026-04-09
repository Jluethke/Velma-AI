# Flow Performance Optimizer

Reads a flow's execution history and validation results to identify performance bottlenecks -- slow phases, frequent failures, inconsistent outputs, and test coverage gaps -- then produces specific, implementable optimization recommendations with predicted impact on validation success rate and execution quality.

## Execution Pattern: ORPA Loop

## Inputs
- skill_md_content: string -- The flow.md being optimized (current version)
- execution_history: array -- Past execution data: per-run records with phase timing, success/failure per phase, output quality signals
- validation_results: object -- Shadow validation results: pass/fail counts, keyword match rates, consistency scores across runs

## Outputs
- performance_analysis: object -- Quantified performance profile: per-phase timing, failure rates, consistency scores, bottleneck identification
- optimization_report: object -- Root cause analysis for each identified issue with severity ranking
- recommended_changes: array -- Specific modifications to flow.md with predicted impact on performance metrics

## Execution

### OBSERVE: Collect Performance Data
**Entry criteria:** At least skill_md_content is provided. Execution history and validation results are optional but produce better analysis.
**Actions:**
1. If execution history is available:
   - Calculate per-phase metrics: average execution time, failure rate, output variability
   - Identify the slowest phase (bottleneck)
   - Identify the most failure-prone phase (reliability issue)
   - Calculate overall execution time distribution (P50, P90, P99)
2. If validation results are available:
   - Calculate keyword match rates per test case
   - Identify which keywords are consistently missed (weak coverage)
   - Calculate consistency score: how similar are outputs across the 5 shadow runs?
   - Identify test cases with the lowest pass rates
3. If only flow.md is available (no history):
   - Perform static analysis: identify structural weaknesses that predict poor performance
   - Flag: vague actions, missing quality gates, undefined outputs, no error handling
   - Estimate risk per phase based on structural quality
4. Cross-reference: do structural weaknesses in flow.md correlate with observed failures in execution history?

**Output:** Performance profile: per-phase metrics (timing, failure rate, consistency), overall validation success rate, bottleneck identification, structural weaknesses.
**Quality gate:** At least one performance dimension is quantified (timing, failure rate, or consistency). Bottleneck phase is identified with evidence.

### REASON: Root Cause Analysis
**Entry criteria:** Performance profile exists.
**Actions:**
1. For each identified performance issue, determine root cause:
   - **Slow phase:** Is it doing too much? Are actions sequential when some could be parallel? Is it waiting on external data? Is the scope too broad?
   - **Frequent failures:** Is the entry criteria too weak (garbage in)? Is the phase attempting something beyond its capability? Is error handling missing?
   - **Inconsistent outputs:** Are actions vague (different interpretations each run)? Is output format undefined? Are there multiple valid approaches and the flow doesn't specify which to use?
   - **Low keyword match:** Are expected keywords too specific (synonyms fail)? Is the flow not covering the concept the keywords test? Are keywords from phases the flow skips?
2. Classify root causes by type:
   - **Structural:** The flow.md design is flawed (missing phases, wrong pattern, etc.)
   - **Prompt quality:** Actions are described ambiguously, producing variable outputs
   - **Test misalignment:** Tests don't match what the flow actually does well
   - **Scope:** The flow tries to do too much in one phase or one run
   - **Dependency:** The flow depends on external data or capabilities it doesn't always have
3. Rank issues by impact: which root cause, if fixed, would most improve the overall validation success rate?

**Output:** Root cause analysis per issue, classified by type, ranked by impact.
**Quality gate:** Every identified performance issue has a root cause. Root causes are specific (not "Phase 3 is bad" but "Phase 3 actions 2 and 3 are ambiguous, producing different output structures across runs"). Impact ranking is justified.

### PLAN: Generate Optimization Recommendations
**Entry criteria:** Root causes identified and ranked.
**Actions:**
1. For each root cause, generate a specific, implementable recommendation:

   **For structural issues:**
   - "Split Phase 3 into two phases: 3A (generate candidates) and 3B (evaluate and select). This reduces per-phase complexity and adds a quality gate between generation and evaluation."
   - "Add entry criteria to Phase 2: 'All inputs validated, at least N items in the input list.' This prevents Phase 2 from executing on garbage data."

   **For prompt quality issues:**
   - "Replace 'analyze the data' with 'For each item in the input: (1) classify by [specific taxonomy], (2) score on [specific dimensions], (3) rank by weighted score. Output as a table with columns: item, classification, score, rank.'"
   - "Add an output format specification: 'Output must be a JSON object with keys: {specific keys}. Each value must be {specific type}.' This constrains output variability."

   **For test misalignment:**
   - "Replace keyword 'analysis' (too generic, matches any response) with 'Eisenhower quadrant' (specific to this flow's methodology)."
   - "Add a test case targeting Phase 4 specifically -- current tests only exercise Phases 1-3."

   **For scope issues:**
   - "Move the reference data lookup from Phase 2 (executed every run) to a pre-computed input. This reduces Phase 2 execution time by ~40%."
   - "Set a hard limit on Phase 3 output: maximum 10 items. Currently unbounded, causing variable execution time."

2. Predict impact of each recommendation:
   - "Tightening Phase 3 output format is predicted to improve consistency score from 0.65 to 0.80, which would increase shadow validation pass rate from 60% to ~75%."
3. Order recommendations by ROI: predicted improvement / implementation effort.

**Output:** Specific recommendations with predicted impact, ordered by ROI.
**Quality gate:** Every recommendation includes: (1) exactly what to change in flow.md (with before/after text), (2) which performance metric it targets, (3) predicted improvement magnitude. No recommendation is vague ("improve the prompts").

### ACT: Deliver Optimization Report
**Entry criteria:** Recommendations generated with impact predictions.
**Actions:**
1. Format the optimization report:
   - **Performance summary:** Current metrics (pass rate, consistency, avg execution time) and target metrics after optimization.
   - **Top 3 quick wins:** Changes that can be implemented in <15 minutes with highest impact.
   - **Full recommendation list:** All changes with before/after examples, target metric, and predicted impact.
   - **Implementation order:** Which changes to make first (some changes unlock others).
   - **Monitoring plan:** What to measure after changes are implemented to verify improvement.
2. If this is a re-entry (optimizing a previously optimized flow):
   - Compare current metrics to pre-optimization baseline
   - Evaluate: did previous recommendations actually improve performance?
   - Identify remaining issues or new issues introduced by changes
3. Record optimization patterns for reuse:
   - "Adding output format constraints improved consistency by X% across Y flows" -- this becomes a general optimization heuristic.

**Output:** Complete optimization report with summary, quick wins, full recommendations, implementation order, monitoring plan.
**Quality gate:** Report addresses the flow's top 3 performance issues. Every recommendation has predicted impact. Quick wins are genuinely quick (<15 min to implement). Monitoring plan specifies what to measure and when.

## Exit Criteria
Complete when: (1) performance profile is quantified, (2) root causes are identified for all major issues, (3) specific recommendations are delivered with predicted impact, (4) implementation order is defined. On re-entry, includes comparison to previous baseline.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No execution history or validation data available | Adjust -- perform static analysis only, note that recommendations are predictive rather than data-driven |
| OBSERVE | Execution history is too small (<5 runs) | Adjust -- analyze available data but flag low confidence in statistical conclusions |
| REASON | Cannot determine root cause (multiple possible explanations) | Adjust -- present multiple hypotheses ranked by likelihood, recommend A/B testing to confirm |
| PLAN | Recommended changes conflict with each other | Adjust -- present changes as alternative paths, recommend implementing one at a time and measuring |
| ACT | Flow is already high-performing (>90% validation pass rate) | Skip major recommendations -- focus on marginal improvements and maintenance |

## Reference

### Performance Optimization Hierarchy
Fix in this order (each level builds on the previous):
1. **Structure:** Ensure phases, quality gates, and exit criteria exist. No point optimizing a flow with missing foundations.
2. **Specificity:** Make phase actions concrete and unambiguous. This is the #1 driver of consistency.
3. **Output format:** Constrain outputs to specific structures (JSON, tables, templates). Reduces variability.
4. **Error handling:** Add fallbacks for known failure modes. Improves reliability.
5. **Test alignment:** Ensure tests actually test the right things with discriminating keywords.
6. **Efficiency:** Optimize execution time (only after reliability and quality are solved).

### Consistency Improvement Techniques
- **Structured output templates:** Instead of "generate a report," specify "generate a report with sections: [Section A], [Section B], [Section C], each containing [specific content]."
- **Enumerated choices:** Instead of "select an approach," specify "select one of: (A) conservative approach when [condition], (B) aggressive approach when [condition], (C) balanced approach when [condition]."
- **Few-shot examples:** Include a concrete example in the phase description showing the expected output format.
- **Negative examples:** "Do NOT produce [common wrong output]. Instead, produce [correct output]."

### Common Failure Patterns and Fixes
| Pattern | Symptom | Fix |
|---|---|---|
| Vague phase | Output varies wildly between runs | Add specific action steps and output format |
| Missing gate | Later phases produce garbage | Add quality gate with testable condition |
| Scope creep | Execution time varies 3x | Add hard limits on per-phase scope |
| Wrong pattern | Generative task uses ORPA | Switch to Phase Pipeline for predictable scope |
| Over-testing | Keywords too strict, false failures | Broaden keywords, use domain terms not exact phrases |
| Under-testing | Bad outputs pass validation | Add more discriminating keywords, cover more phases |

### Metrics Definitions
- **Validation pass rate:** % of shadow runs where all expected keywords are present = primary quality metric
- **Consistency score:** Jaccard similarity of keyword sets across 5 shadow runs = measures output stability
- **Phase failure rate:** % of executions where a specific phase fails or produces degraded output
- **Execution time P90:** 90th percentile execution time = measures worst-case performance
- **Keyword match rate:** % of expected keywords found in output = measures completeness per test

### State Persistence
Tracks over time:
- Per-flow performance metrics before and after each optimization
- Which recommendation types had the most impact (building an optimization playbook)
- Common root causes by flow domain
- Optimization effort vs. actual improvement (calibrating impact predictions)
