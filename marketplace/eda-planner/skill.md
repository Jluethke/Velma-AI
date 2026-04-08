# EDA Planner

**One-line description:** Converts a CSV dataset description into a comprehensive, prioritized exploratory data analysis plan with distribution checks, correlation tests, missing value strategies, outlier detection methods, visualization recommendations, and hypothesis generation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dataset_description` (string, required): Plain-text or structured description of the CSV dataset, including column names, data types, row count, and domain context (e.g., "Sales data with 50k rows: date, product_id (int), revenue (float), region (string), customer_segment (categorical)").
- `domain_context` (string, optional): Business or scientific domain (e.g., "e-commerce", "healthcare", "climate science"). Helps tailor outlier thresholds, correlation priorities, and hypothesis generation.
- `analysis_scope` (string, optional): "quick" (top 5 insights), "standard" (comprehensive), or "deep" (include advanced multivariate methods and feature engineering). Default: "standard".
- `known_constraints` (string[], optional): Data quality issues, missing value patterns, or measurement limitations (e.g., ["revenue has 15% nulls", "dates are partially formatted"]).

---

## Outputs

- `dataset_profile` (object): Structured inventory of columns with types, cardinality, preliminary observations, and data quality flags.
- `missing_value_plan` (object[]): Array of missing value analyses, each specifying column, missingness pattern (MCAR/MAR/MNAR), percentage missing, and recommended handling strategy (imputation method, exclusion, or investigation).
- `distribution_plan` (object[]): Array of distribution analyses, each with column name, recommended methods (histogram, KDE, Q-Q plot, etc.), and specific insight to be gained.
- `correlation_plan` (object[]): Array of correlation tests, each specifying variable pair, statistical test (Pearson, Spearman, Chi-square, ANOVA), and interpretation guidance.
- `outlier_detection_plan` (object[]): Array of outlier detection strategies per column, including method (IQR, Z-score, isolation forest, domain rule), threshold, and action (flag, remove, investigate).
- `visualization_recommendations` (object[]): Prioritized list of visualizations with chart type, variables, expected insight, and effort estimate.
- `feature_engineering_opportunities` (object[]): Derived features, interaction terms, temporal lags, or transformations that may reveal hidden patterns, with rationale and implementation complexity.
- `hypothesis_generation` (object[]): Top 3-5 testable hypotheses derived from the EDA plan, each with variables involved, expected direction, and statistical test to confirm.
- `eda_execution_plan` (string): Narrative summary of the complete EDA workflow, sequenced by dependency, effort estimates, sample size considerations, and checkpoints.

---

## Execution Phases

### Phase 1: Profile the Dataset

**Entry Criteria:**
- Dataset description is provided and contains at least column names and types.

**Actions:**
1. Parse the dataset description and extract: column names, inferred data types (numeric, categorical, datetime, text), row count, and domain context.
2. Classify each column: numeric (continuous or discrete), categorical (nominal or ordinal), temporal, or text.
3. Estimate cardinality for categorical columns (high cardinality >100 unique values vs. low).
4. Extract data quality issues from `known_constraints` and note any mentioned missing values, formatting issues, or measurement limitations.
5. Compile into a structured profile object with columns, types, cardinality, and quality flags.

**Output:** `dataset_profile` with columns, types, cardinality estimates, and quality notes.

**Quality Gate:** Every column from the input description appears in the profile. Data types are correctly inferred. Cardinality estimates are reasonable (e.g., product_id with 50k rows marked as high cardinality). All known constraints are documented.

---

### Phase 2: Plan Missing Value Analysis

**Entry Criteria:**
- Dataset profile is complete.

**Actions:**
1. For each column with known or suspected missing values: estimate the percentage missing (from constraints or infer as 0% if not mentioned).
2. Classify missingness pattern: MCAR (Missing Completely At Random, no relationship to other variables), MAR (Missing At Random, related to observed variables), or MNAR (Missing Not At Random, related to unobserved variables). Use domain knowledge and constraints to infer pattern.
3. For MCAR with <5% missing: recommend listwise deletion or simple imputation (mean/median for numeric, mode for categorical).
4. For MCAR with 5-20% missing: recommend multiple imputation or KNN imputation.
5. For MAR or MNAR: recommend investigation before imputation; document the mechanism (e.g., "revenue missing for cancelled orders").
6. For columns with >20% missing: recommend excluding from analysis or creating a 'missing' indicator variable.
7. Prioritize by impact: missing values in target variables or key predictors first.

**Output:** `missing_value_plan` array with column, missingness pattern, percentage, and handling strategy.

**Quality Gate:** Every column with known missing values has a handling strategy. Missingness patterns are justified by domain knowledge or data constraints. Strategies are reversible (flag before removing) and documented.

---

### Phase 3: Plan Distribution Analyses

**Entry Criteria:**
- Dataset profile and missing value plan are complete.

**Actions:**
1. For each numeric column: recommend histogram (for shape), KDE (for smoothness), and Q-Q plot (for normality). Document the specific insight: e.g., "Check if revenue is normally distributed or right-skewed; informs choice of correlation test and outlier threshold."
2. For each categorical column with cardinality <50: recommend frequency bar chart. For cardinality ≥50: recommend top-N bar chart or grouped analysis. Document insight: e.g., "Identify dominant categories and long-tail distribution."
3. For temporal columns: recommend time series line plot and seasonal decomposition if applicable. Document insight: e.g., "Detect trends, seasonality, or structural breaks."
4. For each distribution analysis, specify the insight it will provide in measurable terms (not "understand the data" but "check normality assumption for Pearson correlation").
5. Prioritize by analytical value: distributions of target/outcome variables first, then predictors, then supporting variables.

**Output:** `distribution_plan` array with column, methods, and specific insight to be gained.

**Quality Gate:** Every numeric and categorical column has at least one distribution method. Insight is specific and measurable, not generic. Prioritization reflects domain importance and downstream analysis needs.

---

### Phase 4: Plan Correlation and Relationship Tests

**Entry Criteria:**
- Dataset profile is complete.

**Actions:**
1. Identify all numeric column pairs: recommend Pearson correlation (if both normally distributed per Phase 3 results) or Spearman (if skewed or ordinal). Include scatter plot. Document expected direction and magnitude based on domain knowledge.
2. Identify numeric-categorical pairs: recommend ANOVA (if categorical has 2-10 groups and numeric is normally distributed) or Kruskal-Wallis (if non-normal or ordinal). Include box plot or violin plot.
3. Identify categorical-categorical pairs: recommend Chi-square test of independence (if expected cell counts >5) or Fisher's exact (if small sample). Include contingency table or mosaic plot.
4. For temporal columns paired with numeric: recommend time series correlation, lag analysis, or Granger causality if applicable.
5. Prioritize by domain relevance: relationships involving target variables, known business drivers, suspected confounders, or interactions first.
6. For each test, document expected direction (positive, negative, none) and magnitude (weak, moderate, strong) based on domain knowledge.

**Output:** `correlation_plan` array with variable pairs, statistical tests, and interpretation guidance.

**Quality Gate:** All meaningful variable pairs are included. Statistical test choice matches data type and distribution assumptions from Phase 3. Prioritization reflects analytical goals and domain knowledge.

---

### Phase 5: Design Outlier Detection

**Entry Criteria:**
- Dataset profile, distribution plan, and correlation plan are available.

**Actions:**
1. For each numeric column: recommend IQR method (robust, interpretable) as default. Document IQR bounds: Lower = Q1 - 1.5 * IQR; Upper = Q3 + 1.5 * IQR.
2. For skewed distributions (identified in Phase 3): recommend Z-score with threshold 3 or 4 (less aggressive than 2.5) instead of IQR.
3. For multivariate outliers (e.g., unusual combinations of features): recommend isolation forest or local outlier factor (LOF) if analysis_scope is "deep".
4. For domain-specific outliers: document business rules (e.g., "revenue >$1M is anomalous for small customers") and use as thresholds.
5. For each outlier detection method, specify action: flag for investigation, remove, or cap at threshold. Recommend flagging before removing to preserve reversibility.
6. Prioritize by impact: outliers in target variables or key predictors first.

**Output:** `outlier_detection_plan` array with column, method, threshold, and action.

**Quality Gate:** Every numeric column has an outlier detection method. Thresholds are justified (statistical or domain-based). Actions are clear, reversible, and documented.

---

### Phase 6: Recommend Visualizations

**Entry Criteria:**
- Distribution, correlation, and outlier plans are complete.

**Actions:**
1. For univariate distributions: recommend histogram + KDE for numeric, bar chart for categorical, time series for temporal. Rank by insight value: target variables first.
2. For bivariate relationships: recommend scatter plot (numeric-numeric), box plot (numeric-categorical), heatmap (categorical-categorical). Rank by correlation strength or domain importance.
3. For multivariate patterns: recommend faceted plots (e.g., scatter by segment), 3D scatter (if 3 numeric variables), or parallel coordinates (if >3 variables). Include only if analysis_scope is "standard" or "deep".
4. For outliers: recommend scatter plot with outliers highlighted, or box plot with outlier annotations.
5. Prioritize visualizations by: (1) involvement of target variable, (2) correlation strength or effect size, (3) outlier impact, (4) audience (executive vs. technical).
6. Estimate effort for each: simple (1 line of code), moderate (5-10 lines), complex (custom logic or interactive).
7. If visualization count exceeds 20, recommend creating a dashboard structure or report with sections (univariate, bivariate, multivariate, outliers).

**Output:** `visualization_recommendations` array with chart type, variables, insight, and effort estimate.

**Quality Gate:** Visualizations cover all major relationships and distributions. Prioritization is explicit and measurable. Effort estimates are realistic. If count >20, a dashboard structure is recommended.

---

### Phase 7: Identify Feature Engineering Opportunities

**Entry Criteria:**
- Distribution, correlation, and outlier plans are complete.

**Actions:**
1. For numeric columns with non-normal distributions: recommend log, square root, or Box-Cox transformation. Document expected benefit: e.g., "Normalize revenue distribution to improve linear model assumptions."
2. For temporal columns: recommend derived features (day-of-week, month, quarter, year, days-since-event, rolling averages). Document expected insight: e.g., "Detect seasonal patterns or trend acceleration."
3. For high-cardinality categorical columns: recommend grouping, target encoding, or dimensionality reduction (PCA, clustering). Document expected benefit: e.g., "Reduce feature space from 500 to 10 categories."
4. For numeric pairs with strong correlations: recommend interaction terms or polynomial features (if analysis_scope is "deep"). Document expected insight: e.g., "Capture non-linear relationships."
5. For temporal data: recommend lag features or rolling statistics (mean, std, min, max over windows). Document expected insight: e.g., "Capture momentum or trend reversal."
6. Prioritize by complexity and expected impact: simple transformations first, advanced feature engineering only if analysis_scope is "deep".

**Output:** `feature_engineering_opportunities` array with feature type, input columns, transformation, rationale, and implementation complexity.

**Quality Gate:** Opportunities are grounded in Phase 3-5 findings (distributions, correlations, outliers). Each has a clear rationale and complexity estimate. Prioritization matches analysis_scope.

---

### Phase 8: Generate Hypotheses

**Entry Criteria:**
- Distribution, correlation, and feature engineering plans are complete.

**Actions:**
1. From the correlation plan, identify the 3-5 strongest or most business-relevant relationships.
2. For each relationship, formulate a testable hypothesis: e.g., "Customer segment (categorical) significantly predicts revenue (numeric); we expect premium segment to have 2x higher mean revenue."
3. Specify the variables involved, expected direction (positive, negative, no effect), and magnitude (if quantifiable).
4. Recommend the statistical test to confirm (from Phase 4 plan).
5. For temporal or feature-engineered hypotheses, specify the test: e.g., "Seasonal decomposition will reveal Q4 revenue spike >20% above trend."
6. Prioritize by business impact and analytical novelty: hypotheses that could drive decisions first.

**Output:** `hypothesis_generation` array with hypothesis statement, variables, expected direction/magnitude, and confirmation test.

**Quality Gate:** Hypotheses are grounded in the EDA plan (not speculative). Each is testable with a specified statistical method. Prioritization reflects business value.

---

### Phase 9: Compile EDA Execution Plan

**Entry Criteria:**
- All previous phases are complete.

**Actions:**
1. Sequence the analyses by dependency: profile → missing values → distributions → correlations → outliers → visualizations → feature engineering → hypothesis confirmation.
2. Group related analyses (e.g., all numeric distributions together) to minimize context switching.
3. Estimate total effort: count simple (0.5 hours), moderate (1-2 hours), complex (2-4 hours) analyses. Sum to total.
4. For sample size considerations: if row count <1k, note that statistical tests may lack power; recommend conservative thresholds (α=0.01) and effect size reporting. If row count >1M, note that even tiny effects are significant; recommend effect size reporting and practical significance thresholds.
5. Identify quick wins: analyses that are fast and high-value (e.g., correlation matrix heatmap, top-N bar charts).
6. Document assumptions and limitations (e.g., "assumes no missing values; adjust if >10% null", "assumes temporal independence; check for autocorrelation").
7. Include checkpoints after each phase to allow for course correction (e.g., "After Phase 3, if >50% of columns are non-normal, consider non-parametric tests throughout").
8. Compile into a narrative execution plan with sequenced steps, effort estimates, sample size notes, and checkpoints.

**Output:** `eda_execution_plan` string with sequenced steps, effort estimates, sample size considerations, and checkpoints.

**Quality Gate:** Plan is executable in order without backtracking. Effort estimate is realistic and includes sample size adjustments. Checkpoints allow for course correction. Assumptions are explicit.

---

## Exit Criteria

The EDA plan is DONE when:
- Dataset profile is complete and accurate.
- Missing value plan specifies handling strategy for every column with nulls or suspected missingness.
- Distribution plan covers all numeric and categorical columns with justified methods and specific insights.
- Correlation plan includes all meaningful variable pairs with appropriate statistical tests and expected directions.
- Outlier detection plan specifies method, threshold, and action for each numeric column.
- Visualization recommendations are prioritized by insight value and effort-estimated.
- Feature engineering opportunities are identified with rationale and complexity estimates.
- Hypothesis generation produces 3-5 testable hypotheses with confirmation tests.
- Execution plan is sequenced, realistic, includes sample size considerations, and has checkpoints.
- A data analyst unfamiliar with the dataset could execute the plan and produce comprehensive EDA results, confirm or refute hypotheses, and identify actionable insights.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dataset description lacks column names or types | **Adjust** -- ask for clarification; assume all columns are numeric if types are missing. Document assumption in profile. |
| Phase 1 | Row count is missing | **Adjust** -- assume 10k rows; note assumption in profile and flag for verification. |
| Phase 2 | No missing value information provided in constraints | **Adjust** -- assume 0% missing for all columns; recommend data quality audit as first step. |
| Phase 3 | All columns are categorical with high cardinality | **Adjust** -- recommend dimensionality reduction (PCA, clustering, target encoding) before distribution analysis. |
| Phase 4 | Dataset has <3 columns | **Adjust** -- skip correlation phase; focus on univariate distributions and univariate outlier detection. |
| Phase 5 | Domain context is missing | **Adjust** -- use statistical thresholds (IQR, Z-score) only; note that domain rules cannot be applied. Flag for domain expert review. |
| Phase 6 | Visualization count exceeds 20 | **Adjust** -- prioritize top 10 by: (1) target variable involvement, (2) correlation strength, (3) outlier impact. Recommend dashboard structure with sections. |
| Phase 7 | analysis_scope is "quick" | **Adjust** -- skip feature engineering phase; focus on simple transformations (log, grouping) only. |
| Phase 8 | Fewer than 3 meaningful correlations identified | **Adjust** -- generate hypotheses from univariate distributions and domain knowledge instead. Recommend domain expert consultation. |
| Phase 9 | Estimated effort exceeds 40 hours | **Adjust** -- recommend splitting into "quick" (Phases 1-4) and "deep" (Phases 5-9) sub-plans. Prioritize by business impact. |

---

## Reference Section

### Statistical Test Selection Guide

**Numeric-Numeric:**
- Pearson correlation: both normally distributed, linear relationship expected. Report r and p-value.
- Spearman correlation: at least one skewed, ordinal, or non-linear relationship. Report ρ and p-value.

**Numeric-Categorical:**
- ANOVA: categorical has 2-10 groups, numeric is normally distributed. Report F-statistic, p-value, and effect size (η²).
- Kruskal-Wallis: categorical has 2-10 groups, numeric is non-normal or ordinal. Report H-statistic, p-value, and effect size (ε²).
- T-test: categorical has exactly 2 groups. Report t-statistic, p-value, and Cohen's d.

**Categorical-Categorical:**
- Chi-square test: both categorical, expected cell counts >5. Report χ², p-value, and Cramér's V.
- Fisher's exact: small sample or low expected counts. Report odds ratio and p-value.

### Outlier Detection Thresholds

- **IQR method:** Lower bound = Q1 - 1.5 * IQR; Upper bound = Q3 + 1.5 * IQR. Flags ~0.7% of data in normal distribution. Use as default.
- **Z-score (threshold 2.5):** Flags ~1.2% of data in normal distribution. Use for moderate outlier detection.
- **Z-score (threshold 3):** Flags ~0.3% of data in normal distribution. Use for conservative outlier detection or skewed distributions.
- **Isolation Forest:** Unsupervised, multivariate. Use for complex outlier patterns or high-dimensional data.
- **Local Outlier Factor (LOF):** Density-based, multivariate. Use for local anomalies in clustered data.

### Visualization Selection by Data Type

| Variable Type | Univariate | Bivariate (with numeric) | Bivariate (with categorical) |
|---|---|---|---|
| Numeric | Histogram, KDE, Box plot, Q-Q plot | Scatter, Hexbin, Regression line | Box plot, Violin plot, Strip plot |
| Categorical | Bar chart, Pie chart, Pareto chart | Bar chart (grouped), Mosaic plot | Heatmap, Mosaic plot, Grouped bar |
| Temporal | Line plot, Area chart, Seasonal plot | Line plot (colored), Lag plot | Faceted line plot, Heatmap (time × category) |

### Missing Value Handling Decision Tree

1. **Estimate missingness percentage and pattern (MCAR/MAR/MNAR).**
2. **If <5% missing and MCAR:** Listwise deletion or simple imputation (mean/median/mode).
3. **If 5-20% missing and MCAR:** Multiple imputation (MI) or KNN imputation.
4. **If 5-20% missing and MAR:** Multiple imputation with auxiliary variables; investigate mechanism.
5. **If >20% missing or MNAR:** Exclude column, create 'missing' indicator, or investigate mechanism before imputation.
6. **For target variable:** Never delete; use appropriate imputation or model missing as separate class.

### Reproducibility Checklist

- [ ] **Random seed:** Document seed value used for any stochastic analyses (e.g., KNN imputation, isolation forest).
- [ ] **Data version:** Record dataset name, version, source, and download/extraction date.
- [ ] **Analysis date:** Document when EDA was performed.
- [ ] **Software versions:** Record Python/R version, key library versions (pandas, scikit-learn, matplotlib, etc.).
- [ ] **Code repository:** Link to version-controlled code or notebook.
- [ ] **Data dictionary:** Maintain a data dictionary with column definitions, units, and valid ranges.
- [ ] **Assumptions:** Document all assumptions made (e.g., "assumed 0% missing", "assumed temporal independence").
- [ ] **Limitations:** Note any data quality issues, sample biases, or analytical constraints.

### Domain Knowledge Extraction Checklist

- [ ] What is the target variable (if any)? Prioritize its distributions and relationships.
- [ ] What are known drivers or confounders? Prioritize their correlations.
- [ ] What are business rules or constraints? Document as outlier thresholds or exclusion criteria.
- [ ] What is the expected data quality? Adjust outlier sensitivity and missing value handling accordingly.
- [ ] What is the audience? Tailor visualization complexity and narrative (executive summary vs. technical deep-dive).
- [ ] What are known temporal patterns (seasonality, trends, cycles)? Prioritize temporal feature engineering.
- [ ] What are measurement limitations or known biases? Document and adjust thresholds accordingly.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.