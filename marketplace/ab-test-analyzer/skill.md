# A/B Test Analyzer

**One-line description:** Performs comprehensive statistical analysis on A/B test results, including significance testing, confidence intervals, practical significance assessment, power analysis, and actionable recommendations.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `control_data`: array of numbers -- Metric values from the control group (e.g., conversion rates, session durations). Required.
- `treatment_data`: array of numbers -- Metric values from the treatment group. Required.
- `metric_name`: string -- Name of the metric being tested (e.g., "conversion_rate", "avg_session_duration"). Required.
- `alpha`: number (optional, default 0.05) -- Significance level for hypothesis testing. Typical values: 0.05, 0.01. Note: Consider increasing to 0.01 for high-cost implementations.
- `confidence_level`: number (optional, default 0.95) -- Confidence level for interval estimation (0.90, 0.95, 0.99).
- `minimum_detectable_effect`: number (optional) -- Smallest effect size considered practically significant (e.g., 0.05 for 5% improvement). If not provided, practical significance defaults to statistical significance.
- `test_type`: string (optional, default "auto") -- Type of statistical test: "t-test", "chi-square", "mann-whitney", or "auto" (inferred from data).
- `business_context`: object (optional) -- Business impact parameters: `implementation_cost` (string: "low", "medium", "high"), `cost_of_false_positive` (string: "low", "medium", "high"), `cost_of_false_negative` (string: "low", "medium", "high"). Used to adjust decision thresholds.
- `enable_sensitivity_analysis`: boolean (optional, default false) -- If true, re-run analysis with outliers removed and alternative test types to assess robustness.
- `enable_power_analysis`: boolean (optional, default true) -- If true, calculate post-hoc statistical power and recommend sample size if power < 0.80.

---

## Outputs

- `analysis_report`: object -- Complete analysis with the following structure:
  - `metric_name`: string
  - `control_stats`: object with `mean`, `std_dev`, `sample_size`, `min`, `max`
  - `treatment_stats`: object with `mean`, `std_dev`, `sample_size`, `min`, `max`
  - `effect_size`: number -- Difference between treatment and control means
  - `effect_size_percent`: number -- Effect size as percentage of control mean
  - `significance_test`: object with `test_type`, `test_statistic`, `p_value`, `is_significant` (boolean), `assumptions_met` (boolean)
  - `confidence_intervals`: object with `control_ci`, `treatment_ci`, `effect_size_ci` (each with `lower`, `upper`, `confidence_level`)
  - `practical_significance`: object with `is_practically_significant` (boolean), `mde_threshold`, `justification`
  - `power_analysis`: object (if enabled) with `post_hoc_power`, `recommended_sample_size`, `power_interpretation`
  - `sensitivity_analysis`: object (if enabled) with `outliers_removed_result`, `alternative_test_result`, `robustness_assessment`
  - `recommendation`: string -- One of: "implement", "reject", "continue_testing", "inconclusive"
  - `recommendation_rationale`: string -- Explanation of the decision
  - `decision_threshold_applied`: string -- Describes which thresholds were used (e.g., "alpha=0.05, MDE=0.05, high implementation cost applied alpha=0.01")
  - `caveats`: array of strings -- Important limitations or assumptions
  - `visualizations`: object (optional) with `distribution_plot_description`, `effect_size_plot_description`, `interpretation_guide`

---

## Execution Phases

### Phase 0: Pre-Flight Assumption Validation (NEW)

**Entry Criteria:**
- Inputs are provided
- User has confirmed this is a randomized A/B test (not observational data)

**Actions:**
1. Validate that control and treatment groups are independent (no overlap in subjects).
2. Confirm that assignment to groups was random or quasi-random (not self-selected).
3. Verify that metric is well-defined and consistently measured across both groups.
4. Check that no peeking or early stopping occurred (if user provides test duration, flag if results were checked mid-test).
5. Confirm that control and treatment groups are comparable on known confounders (if user provides demographic data, check balance).
6. Document any assumption violations as caveats.

**Output:**
- `assumptions_validated`: boolean
- `assumption_violations`: array of strings
- `proceed_with_analysis`: boolean (false if critical violations detected)

**Quality Gate:**
- All assumptions are explicitly checked
- If any critical violation is detected (e.g., non-random assignment), analysis is flagged for manual review
- Violations are documented in final caveats

---

### Phase 1: Data Validation and Descriptive Statistics

**Entry Criteria:**
- `control_data` and `treatment_data` are provided as arrays of numbers
- Both arrays contain at least 2 values (minimum for statistical testing)
- Assumption validation has completed (Phase 0)

**Actions:**
1. Check for missing or invalid values (NaN, null, non-numeric). Flag and document any removed records.
2. Calculate descriptive statistics for control group: mean, standard deviation, sample size, min, max, median, IQR.
3. Calculate descriptive statistics for treatment group: mean, standard deviation, sample size, min, max, median, IQR.
4. Identify extreme outliers using IQR method (values outside 1.5×IQR from Q1/Q3) and Z-score method (>3 SD from mean). Document count and values.
5. Assess data distribution shape: test for normality using Shapiro-Wilk test (if n<50) or Kolmogorov-Smirnov test (if n≥50). Report normality p-value.
6. Check for skewness and kurtosis. Flag if |skewness| > 1 or kurtosis > 3 (indicates non-normal distribution).

**Output:**
- `control_stats`: object with mean, std_dev, sample_size, min, max, median, iqr, outlier_count, outlier_values
- `treatment_stats`: object with mean, std_dev, sample_size, min, max, median, iqr, outlier_count, outlier_values
- `normality_test`: object with `control_normality_p_value`, `treatment_normality_p_value`, `is_normal` (boolean)
- `data_quality_notes`: array of strings documenting any issues found
- `records_removed`: number

**Quality Gate:**
- Both groups have valid sample sizes (n ≥ 2, ideally n ≥ 30 for t-test)
- No more than 5% of records were removed as invalid
- Data quality notes are explicit about outliers, normality violations, and skewness
- Normality assessment is quantified (p-value provided, not subjective)

---

### Phase 2: Statistical Significance Testing

**Entry Criteria:**
- Descriptive statistics are calculated
- Data quality is acceptable (Phase 1 quality gate passed)
- Normality assessment is complete

**Actions:**
1. Determine appropriate test type if `test_type` is "auto" using this decision tree:
   - If both n ≥ 30 AND normality p-value > 0.05 for both groups: use independent samples t-test (Welch's variant if variances differ by >2×)
   - If n < 30 OR normality p-value ≤ 0.05 for either group: use Mann-Whitney U test
   - If data is binary (only 0 and 1 values): use chi-square test (if expected cell frequencies ≥ 5) or Fisher's exact test (if expected frequencies < 5)
   - If data is count data (non-negative integers): use Poisson regression or negative binomial test
2. Perform the selected statistical test with null hypothesis: control mean = treatment mean (or median = median for Mann-Whitney).
3. Calculate test statistic and p-value to 4 decimal places.
4. Compare p-value to alpha level. Determine if result is statistically significant (p < alpha).
5. Calculate 95% confidence interval for the test statistic (if applicable).
6. Document the test assumptions and whether they are met (e.g., equal variances for t-test, independence for all tests).

**Output:**
- `test_type`: string (the test performed)
- `test_statistic`: number
- `p_value`: number (to 4 decimals; report as "<0.0001" if p < 0.0001)
- `is_significant`: boolean (p_value < alpha)
- `assumptions_met`: boolean
- `assumption_notes`: string (specific violations if any)
- `alpha_level_applied`: number

**Quality Gate:**
- Test type is justified based on data characteristics and documented in assumption_notes
- P-value is between 0 and 1 (or reported as <0.0001 or >0.9999)
- Assumptions are explicitly documented with pass/fail status
- If assumptions are violated, alternative test is noted

---

### Phase 3: Confidence Interval Estimation

**Entry Criteria:**
- Descriptive statistics are calculated
- Significance test is complete
- Test assumptions are documented

**Actions:**
1. Calculate confidence interval for control group mean using the specified `confidence_level`:
   - For normal data or large samples (n ≥ 30): use t-distribution with df = n-1
   - For non-normal or small samples (n < 30): use bootstrap method (10,000 resamples) or non-parametric percentile method
   - Report CI to 2-3 decimal places (same precision as mean)
2. Calculate confidence interval for treatment group mean using the same method
3. Calculate confidence interval for the effect size (treatment mean - control mean) using delta method or bootstrap
4. Interpret intervals: if effect size CI does not include zero, it is consistent with statistical significance at the same alpha level
5. Calculate CI width as (upper - lower) and document as measure of precision

**Output:**
- `control_ci`: object with `lower`, `upper`, `confidence_level`, `method` ("t-distribution" or "bootstrap")
- `treatment_ci`: object with `lower`, `upper`, `confidence_level`, `method`
- `effect_size_ci`: object with `lower`, `upper`, `confidence_level`, `method`
- `ci_width`: number (effect_size_ci upper - lower, measure of precision)

**Quality Gate:**
- All intervals are properly bounded (lower < upper)
- Confidence level matches input specification
- Effect size CI interpretation is consistent with significance test result (CI excludes zero iff p < alpha)
- CI method is appropriate for data distribution

---

### Phase 4: Practical Significance Assessment

**Entry Criteria:**
- Effect size is calculated
- Confidence intervals are established
- `minimum_detectable_effect` is provided (or defaults to statistical significance)
- Business context is available (optional)

**Actions:**
1. Calculate effect size as absolute difference: treatment_mean - control_mean
2. Calculate effect size as percentage: (effect_size / control_mean) × 100 (handle division by zero if control_mean ≈ 0)
3. Calculate Cohen's d (standardized effect size): effect_size / pooled_std_dev
4. If `minimum_detectable_effect` is provided:
   - Compare absolute effect size to MDE threshold
   - Check if lower bound of effect size CI exceeds MDE (conservative approach)
   - Determine if effect size meets or exceeds business threshold
   - Classify as: "exceeds MDE", "within MDE range", or "below MDE"
5. If `minimum_detectable_effect` is not provided:
   - Default: practical significance = statistical significance
   - Note this assumption in output
6. If `business_context` is provided (implementation_cost, cost_of_false_positive, cost_of_false_negative):
   - Adjust decision thresholds: high implementation cost → require higher confidence (lower alpha or higher effect size)
   - High cost of false positive → require p < 0.01 instead of 0.05
   - High cost of false negative → lower threshold to p < 0.10
   - Document adjusted thresholds in output
7. Document business context impact if provided

**Output:**
- `effect_size`: number (absolute)
- `effect_size_percent`: number
- `cohens_d`: number (standardized effect size)
- `effect_size_interpretation`: string ("small", "medium", "large" based on Cohen's d)
- `is_practically_significant`: boolean
- `mde_threshold`: number or null
- `mde_comparison`: string ("exceeds", "within", "below", or "not_specified")
- `business_context_applied`: object with adjusted thresholds if provided
- `justification`: string explaining the practical significance determination

**Quality Gate:**
- Effect size is calculated correctly (verified by recalculating from means)
- Practical significance determination is explicit and justified
- If MDE is used, the lower bound of CI is compared to threshold (not just point estimate)
- Business context adjustments are documented and justified

---

### Phase 5: Power Analysis (NEW)

**Entry Criteria:**
- Significance test is complete
- Effect size is calculated
- Sample sizes are known
- `enable_power_analysis` is true (default)

**Actions:**
1. Calculate post-hoc statistical power given observed effect size, sample sizes, and alpha level
2. Use appropriate power calculation method:
   - For t-test: use non-centrality parameter λ = effect_size × sqrt(n/2)
   - For Mann-Whitney: approximate power using effect size and sample sizes
   - For chi-square: use non-centrality parameter based on effect size (Cramér's V)
3. Interpret power result:
   - Power ≥ 0.80: adequate power, non-significant result is likely true null effect
   - Power 0.60-0.80: moderate power, non-significant result is ambiguous
   - Power < 0.60: low power, non-significant result may be due to insufficient sample size
4. If power < 0.80 and result is not significant, calculate recommended sample size to achieve 80% power
5. Provide interpretation: "If the true effect size equals the observed effect size, repeating this study would detect it 80% of the time with n=X per group"

**Output:**
- `post_hoc_power`: number (0-1)
- `power_interpretation`: string ("adequate", "moderate", "low")
- `recommended_sample_size`: number or null (if power < 0.80)
- `power_rationale`: string (explanation of what power means for this result)

**Quality Gate:**
- Power is calculated using appropriate method for test type
- Power is between 0 and 1
- If power < 0.80, recommended sample size is provided
- Interpretation is clear about what power does and does not mean

---

### Phase 6: Sensitivity Analysis (NEW, OPTIONAL)

**Entry Criteria:**
- All previous phases are complete
- `enable_sensitivity_analysis` is true

**Actions:**
1. Re-run Phase 1-5 analysis with outliers removed (using IQR method: remove values outside 1.5×IQR)
2. Compare results: does removing outliers change the significance decision? By how much does effect size change?
3. If original test violated normality assumption, re-run Phase 2 with alternative test type (e.g., if t-test was used, also run Mann-Whitney)
4. Compare p-values and effect sizes across test types. If conclusions are consistent, robustness is high.
5. Assess robustness: "Conclusions are robust if all sensitivity checks agree on significance decision"
6. Document any sensitivity checks that change the conclusion (flag for manual review)

**Output:**
- `outliers_removed_result`: object with `effect_size`, `p_value`, `is_significant`, `conclusion_changed` (boolean)
- `alternative_test_result`: object with `test_type`, `p_value`, `is_significant`, `conclusion_changed` (boolean)
- `robustness_assessment`: string ("high", "moderate", "low") based on agreement across sensitivity checks
- `sensitivity_notes`: array of strings documenting any concerning findings

**Quality Gate:**
- Sensitivity analysis is only run if enabled
- Results are compared to original analysis
- Robustness assessment is explicit
- Any conclusion changes are flagged

---

### Phase 7: Recommendation Generation

**Entry Criteria:**
- Statistical significance is determined
- Practical significance is assessed
- Confidence intervals are available
- Power analysis is complete (if enabled)
- Business context thresholds are applied (if provided)

**Actions:**
1. Apply decision logic using this priority order:
   - **Implement:** Statistical significance (p < alpha) AND practical significance (effect ≥ MDE or meets business threshold) AND power ≥ 0.60
   - **Reject:** Statistical significance (p < alpha) BUT NOT practical significance, OR effect is negative and significant, OR power < 0.60 and effect is small
   - **Continue Testing:** NOT statistically significant AND power < 0.80 AND confidence interval is wide (CI width > 2×MDE) AND effect size is in the direction of interest (same sign as MDE)
   - **Inconclusive:** NOT statistically significant AND (power ≥ 0.80 OR CI is narrow) AND effect size is small or opposite to expected direction
2. Apply business context thresholds if provided:
   - High implementation cost: require p < 0.01 (not 0.05) for "implement"
   - High cost of false positive: require p < 0.01 and effect size > 2×MDE
   - High cost of false negative: lower threshold to p < 0.10 for "implement"
3. Check for conflicts between statistical and practical significance. If conflict exists, explain in rationale.
4. Generate rationale explaining the recommendation in 2-3 sentences.
5. List caveats: sample size limitations, assumption violations, external validity concerns, sensitivity analysis findings.

**Output:**
- `recommendation`: string (one of: "implement", "reject", "continue_testing", "inconclusive")
- `recommendation_rationale`: string (2-3 sentences explaining the decision)
- `decision_logic_applied`: string (describes which thresholds and criteria were used)
- `caveats`: array of strings (specific limitations and assumptions)
- `next_steps`: string (if continue_testing, suggest sample size increase; if inconclusive, suggest clarifying business threshold)

**Quality Gate:**
- Recommendation is justified by statistical and practical significance results
- Rationale is clear and actionable
- Caveats are specific, not generic (e.g., "sample size n=50 is below recommended n=64 for medium effect size" not "small sample size")
- Decision logic is transparent and documented

---

### Phase 8: Report Compilation

**Entry Criteria:**
- All previous phases are complete
- All outputs are available

**Actions:**
1. Assemble all results into the `analysis_report` object structure
2. Verify all required fields are populated
3. Add summary statistics section: control mean, treatment mean, effect size, p-value, recommendation, power (if available)
4. Add interpretation guide: explain what each metric means for a non-technical audience
   - "P-value: probability of observing this result if there is no true difference. P < 0.05 means result is unlikely by chance."
   - "Confidence interval: range where the true effect likely falls. If CI doesn't include zero, result is statistically significant."
   - "Effect size: magnitude of the difference. Percentage change shows practical importance."
5. Format confidence intervals and p-values to appropriate precision (p-value to 4 decimals, means to 2-3 decimals)
6. If visualizations are requested, generate descriptions of plots (distribution overlay, effect size with CI, p-value interpretation)
7. Add decision threshold documentation: which alpha, MDE, and business context adjustments were applied

**Output:**
- `analysis_report`: complete object with all sections
- `interpretation_guide`: object with plain-language explanations

**Quality Gate:**
- All fields in analysis_report are populated
- No contradictions between sections (e.g., significant p-value but inconclusive recommendation must be explained)
- Report is self-contained and interpretable without external context
- Interpretation guide uses non-technical language

---

## Exit Criteria

The skill is complete when:
1. Pre-flight assumption validation is performed and documented
2. Data validation is performed and data quality is documented (outliers, normality, distribution shape)
3. Statistical significance test is executed with p-value, test statistic, and assumption check
4. Confidence intervals are calculated for control, treatment, and effect size with appropriate method
5. Practical significance is assessed against MDE threshold or business context
6. Post-hoc power analysis is performed (if enabled) with interpretation
7. Sensitivity analysis is performed (if enabled) with robustness assessment
8. A clear recommendation (implement/reject/continue/inconclusive) is provided with rationale and decision logic
9. All results are compiled into a structured analysis_report object
10. Caveats and limitations are explicitly documented with specific details
11. Interpretation guide is provided for non-technical stakeholders

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 0 | Non-randomized assignment detected | **Abort** -- Analysis cannot proceed on observational data. Recommend causal inference methods (propensity score matching, instrumental variables) instead. |
| Phase 1 | Sample size < 2 in either group | **Abort** -- Insufficient data for statistical testing. Require minimum n=2 per group, ideally n≥30. |
| Phase 1 | >5% of records are invalid/missing | **Adjust** -- Document removed records. If >20% removed, flag as data quality issue and recommend data review before proceeding. |
| Phase 1 | Extreme outliers detected (>3 SD) | **Adjust** -- Document outliers. If enable_sensitivity_analysis=true, automatically re-run with outliers removed. Otherwise offer option for sensitivity check. |
| Phase 2 | Data violates test assumptions severely (e.g., normality p < 0.001) | **Adjust** -- Switch to non-parametric test (Mann-Whitney). Document assumption violations in output. Re-run significance test with alternative method. |
| Phase 2 | P-value is exactly 0 or 1 | **Adjust** -- Report as p < 0.0001 or p > 0.9999. Investigate for data entry errors or perfect separation. Flag in caveats. |
| Phase 3 | Confidence interval calculation fails (e.g., bootstrap fails to converge) | **Retry** -- Use alternative CI method (t-distribution if n≥30, percentile bootstrap with more resamples). Document method used. |
| Phase 4 | MDE is larger than observed effect size range | **Adjust** -- Note that study is underpowered for the specified MDE. Calculate required sample size and recommend larger study. |
| Phase 5 | Power calculation fails (e.g., effect size is zero) | **Adjust** -- Report power as undefined. Note that effect size is too small to estimate power. Recommend larger study or different metric. |
| Phase 6 | Sensitivity analysis contradicts main result | **Adjust** -- Flag in robustness_assessment as "low". Highlight in caveats and recommendation_rationale. Recommend manual review before implementation. |
| Phase 7 | Recommendation conflicts with business context | **Adjust** -- Highlight the conflict in rationale. Recommend stakeholder review before implementation. Document which thresholds were applied. |
| Phase 8 | Report exceeds 500 lines | **Adjust** -- Summarize detailed statistics in appendix. Keep main report to key findings, recommendation, and interpretation guide. |
| ACT | User rejects the recommendation or disputes the statistical conclusions | **Adjust** -- Incorporate the user's specific objection (e.g., disagreement with MDE threshold, alpha level, or practical significance definition), update the relevant phase inputs, and regenerate the affected section; do not restart from Phase 0 unless the original data or test design was wrong |

---

## Reference Section

### Statistical Test Selection Guide

- **Independent samples t-test:** Use when both groups have n ≥ 30 OR data is approximately normal (Shapiro-Wilk p > 0.05). Assumes independent observations and equal variances (use Welch's t-test if variances differ by >2×).
- **Mann-Whitney U test:** Use when n < 30 or data is non-normal (Shapiro-Wilk p ≤ 0.05). Non-parametric alternative to t-test. Does not assume normality.
- **Chi-square test:** Use when data is categorical (binary outcomes, counts). Requires expected cell frequencies ≥ 5. Use Yates' correction for 2×2 tables with small frequencies.
- **Fisher's exact test:** Use for 2×2 contingency tables with expected frequencies < 5. Exact p-value, no approximation.

### Effect Size Interpretation

- **Cohen's d (standardized effect size):**
  - 0.2 = small effect
  - 0.5 = medium effect
  - 0.8 = large effect
- **Percentage change:** Interpret relative to control mean. A 5% improvement is often considered practically significant in conversion rate optimization; 1-2% in retention metrics; 3-10% in revenue metrics.
- **Cramér's V (categorical effect size):** 0.1 = small, 0.3 = medium, 0.5 = large

### Confidence Interval Interpretation

- A 95% CI means: if the experiment were repeated 100 times, the true parameter would fall within the calculated interval approximately 95 times.
- If the CI for effect size does not include zero, the result is consistent with statistical significance at the same alpha level.
- A wide CI suggests high uncertainty; a narrow CI suggests precise estimation.
- CI width is a measure of precision: narrower CI = more precise estimate = larger sample size or less variability

### Statistical Power Interpretation

- **Power = probability of detecting a true effect** if it exists. Power of 0.80 means 80% chance of detecting the effect, 20% chance of missing it (Type II error).
- **Post-hoc power:** calculated after the study using observed effect size. Useful for interpreting non-significant results.
- **If power < 0.80 and result is not significant:** cannot conclude there is no effect; may be due to insufficient sample size.
- **If power ≥ 0.80 and result is not significant:** stronger evidence for null hypothesis; effect size is likely small.

### Practical Significance Thresholds (Domain-Dependent)

- **Conversion rate optimization:** 1-5% improvement is typically considered practically significant
- **Retention/churn:** 0.5-2% improvement is significant
- **Revenue per user:** 3-10% improvement is significant
- **User engagement (time on site):** 5-15% improvement is significant
- **Cost reduction:** 2-5% improvement is significant
- **Always consider business cost:** high implementation cost requires higher effect size threshold

### Common Pitfalls

1. **P-hacking:** Running multiple tests and reporting only significant results. Adjust alpha level for multiple comparisons (Bonferroni: alpha/k, or FDR control).
2. **Underpowered studies:** Small sample sizes lead to high false negative rates. Aim for 80% statistical power. Use sample size calculator before running test.
3. **Ignoring practical significance:** A statistically significant result with tiny effect size (e.g., 0.1% improvement) may not be worth implementing.
4. **Peeking at results:** Stopping the test early when results look good inflates false positive rates. Use sequential testing boundaries (Pocock, O'Brien-Fleming) if early stopping is planned.
5. **Confounding variables:** Ensure control and treatment groups are comparable except for the treatment itself. Check demographic balance.
6. **Misinterpreting p-value:** P-value is NOT probability that null hypothesis is true. It is probability of observing data this extreme IF null is true.
7. **Confusing confidence interval with probability:** A 95% CI is not "95% probability the true value is in this range." It is "if we repeated the study 100 times, 95 intervals would contain the true value."

### Minimum Sample Size Guidance

For a two-sample t-test with alpha=0.05, power=0.80, and effect size d:
- d=0.2 (small effect): n ≈ 393 per group
- d=0.5 (medium effect): n ≈ 64 per group
- d=0.8 (large effect): n ≈ 26 per group

For chi-square test with alpha=0.05, power=0.80, and effect size w (Cramér's V):
- w=0.1 (small effect): n ≈ 785
- w=0.3 (medium effect): n ≈ 88
- w=0.5 (large effect): n ≈ 35

Use a sample size calculator (e.g., G*Power) for specific scenarios. Always calculate required sample size BEFORE running the test.

### Business Context Decision Framework

- **High implementation cost (e.g., infrastructure change):** Require p < 0.01 and effect size > 2×MDE. Demand strong evidence before implementation.
- **Low implementation cost (e.g., copy change):** Standard p < 0.05 threshold is acceptable. Lower barrier to implementation.
- **High cost of false positive (e.g., brand damage):** Require p < 0.01 and practical significance. Avoid implementing ineffective changes.
- **High cost of false negative (e.g., missing revenue opportunity):** Lower threshold to p < 0.10. Accept higher risk of false positive to avoid missing true effects.
- **Always balance Type I and Type II error costs:** Default alpha=0.05 assumes equal costs. Adjust based on business context.
