# Cohort Analyzer

**One-line description:** Transforms revenue and churn data into cohort-based retention curves, LTV projections, and prioritized churn reduction strategies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `revenue_data` (object, required): Dataset containing transaction records with fields: customer_id (string), transaction_date (ISO 8601), revenue_amount (number ≥ 0), product_tier (string, optional).
- `churn_metrics` (object, required): Dataset containing customer status with fields: customer_id (string), churn_date (ISO 8601, null if active), churn_reason (string, optional), last_activity_date (ISO 8601).
- `cohort_dimension` (string, optional, default: "acquisition_month"): Dimension for grouping cohorts. Options: "acquisition_month", "acquisition_quarter", "product_tier", "geography".
- `retention_period_unit` (string, optional, default: "month"): Time unit for retention measurement. Options: "week", "month", "quarter".
- `max_retention_periods` (number, optional, default: 24): Number of periods to track retention (e.g., 24 months post-acquisition). Must be ≥ 3.
- `ltv_discount_rate` (number, optional, default: 0.1): Annual discount rate for LTV projection. Valid range: 0.0–1.0.
- `revenue_model` (string, optional, default: "constant"): Revenue projection model. Options: "constant" (assume flat revenue), "linear" (linear growth/decline), "cohort_trend" (use observed cohort trends).
- `churn_risk_threshold` (number, optional, default: 0.5): Retention rate threshold below which a cohort is flagged as high-risk. Valid range: 0.0–1.0.
- `business_constraints` (object, optional): Object with fields: budget (number ≥ 0, in currency units), timeline_weeks (number ≥ 1), priority_areas (array of strings, e.g., ["engagement", "pricing"]).

---

## Outputs

- `cohort_assignments` (object[]): Array of customer cohort assignments with fields: customer_id (string), cohort_id (string), acquisition_date (ISO 8601), cohort_dimension_value (string).
- `retention_matrix` (object): Cohort × time period matrix with fields: cohort_id (string), period_number (number ≥ 0), active_count (number ≥ 0), churned_count (number ≥ 0), retention_rate (number, 0.0–1.0).
- `retention_curves` (object[]): Array of cohort retention curves with fields: cohort_id (string), curve_data (array of {period (number), retention_rate (number, 0.0–1.0), fitted_value (number, 0.0–1.0)}), curve_fit (string: "exponential", "power_law", "linear"), r_squared (number, 0.0–1.0), curve_equation (string).
- `ltv_projections` (object[]): Array of LTV projections by cohort with fields: cohort_id (string), projected_ltv (number ≥ 0), confidence_interval_lower (number ≥ 0), confidence_interval_upper (number ≥ 0), revenue_forecast (array of {period (number), cumulative_revenue (number ≥ 0)}).
- `churn_patterns` (object): Analysis of churn drivers with fields: high_risk_cohorts (array of strings), low_risk_cohorts (array of strings), churn_triggers (array of {trigger_name (string), affected_cohorts (array of strings), magnitude (number, churn_rate 0.0–1.0), period (number)}), cohort_specific_drivers (object mapping cohort_id to driver description), median_time_to_churn_by_cohort (object mapping cohort_id to number of periods).
- `churn_reduction_strategies` (object[]): Prioritized list of interventions with fields: strategy_id (string), name (string), description (string), target_cohorts (array of strings), estimated_retention_lift (number, 0.01–0.30), estimated_ltv_impact (number), implementation_effort (string: "low", "medium", "high"), estimated_roi (number ≥ 0), priority (string: "quick_win", "medium_term", "long_term").
- `analysis_report` (string): Markdown-formatted comprehensive report with executive summary, detailed findings, visualizations (as embedded descriptions or links), and recommendations. Minimum 500 characters, maximum 50,000 characters.
- `execution_metadata` (object): Metadata with fields: execution_timestamp (ISO 8601), data_quality_score (number, 0.0–1.0), total_customers_analyzed (number ≥ 0), cohorts_identified (number ≥ 1), analysis_completeness (string: "full", "partial", "limited"), analysis_version (string, e.g., "1.0"), previous_analysis_timestamp (ISO 8601, optional).

---

## Execution Phases

### Phase 1: Data Ingestion and Validation

**Entry Criteria:**
- Revenue data and churn metrics are provided in structured format (JSON, CSV, or database query result).
- Both datasets contain customer_id field for joining.
- At least 100 customers are present in the combined dataset.

**Actions:**
1. Load revenue_data and churn_metrics into memory or data processing environment.
2. Validate schema: confirm required fields (customer_id, dates, amounts/status) are present and have correct types.
3. Standardize date formats to ISO 8601; convert all dates to UTC.
4. Remove duplicate transactions: identify and remove rows where customer_id, transaction_date (within ±1 second), and revenue_amount are identical.
5. Validate numeric fields: confirm revenue_amount ≥ 0 and all retention_rate values are 0.0–1.0.
6. Identify and log missing values: count null values in churn_date, last_activity_date, churn_reason; flag cohorts with >20% missing churn_date.
7. Calculate data quality score: (rows_valid / rows_total) × (fields_complete / fields_expected). Score must be ≥ 0.95 to pass quality gate.
8. Join revenue_data and churn_metrics on customer_id to create unified customer view; flag unmatched customers (in revenue but not churn metrics, or vice versa).

**Output:**
- Cleaned, deduplicated dataset with unified schema.
- Data quality report: quality_score (0.0–1.0), row_count (total and valid), missing_value_summary (by field), duplicate_count (removed), unmatched_customer_count.

**Quality Gate:**
- Data quality score ≥ 0.95 (verified by: rows_valid / rows_total ≥ 0.95 AND fields_complete / fields_expected ≥ 0.95).
- No duplicate transactions remain (duplicate_count = 0).
- All dates are in ISO 8601 format and UTC timezone.
- Customer_id is unique and non-null in merged dataset (verified by: count(distinct customer_id) = count(rows)).
- Unmatched customer count ≤ 5% of total customers.

---

### Phase 2: Cohort Definition and Assignment

**Entry Criteria:**
- Cleaned dataset from Phase 1 is available with quality_score ≥ 0.95.
- cohort_dimension parameter is specified and valid (one of: "acquisition_month", "acquisition_quarter", "product_tier", "geography").

**Actions:**
1. Extract acquisition_date for each customer: use earliest transaction_date from revenue_data, or explicit signup_date if available in churn_metrics.
2. Group customers by cohort_dimension: extract year-month (for "acquisition_month"), year-quarter (for "acquisition_quarter"), product_tier value (for "product_tier"), or geography value (for "geography").
3. Assign cohort_id to each customer using format: cohort_dimension_value (e.g., "2023-01" for January 2023, "tier_premium" for premium tier).
4. Validate cohort distribution: count customers per cohort; flag cohorts with <10 customers as "low_confidence" (insufficient statistical power).
5. Generate cohort_assignments output with customer_id, cohort_id, acquisition_date, cohort_dimension_value.
6. Document cohort summary: cohort_count (total unique cohorts), size_distribution (min, max, median, mean customers per cohort), low_confidence_cohort_count.

**Output:**
- cohort_assignments array (one row per customer).
- Cohort summary: cohort_count (number), size_distribution (object with min, max, median, mean), low_confidence_cohort_count (number), low_confidence_cohorts (array of cohort_ids).

**Quality Gate:**
- Every customer is assigned to exactly one cohort (verified by: count(cohort_assignments) = count(customers)).
- Cohort_id is consistent and reproducible (verified by: same input produces same cohort_ids).
- No cohort is empty (verified by: min(customers_per_cohort) > 0).
- Cohort count is reasonable: 3 ≤ cohort_count ≤ 50 (if outside range, suggest alternative cohort_dimension).
- Cohorts with <10 customers are documented in low_confidence_cohorts array.

---

### Phase 3: Retention Rate Calculation

**Entry Criteria:**
- cohort_assignments from Phase 2 are available with cohort_count between 3 and 50.
- retention_period_unit and max_retention_periods are specified and valid.
- max_retention_periods ≥ 3.

**Actions:**
1. For each cohort, define time periods: 0, 1, 2, ..., max_retention_periods (e.g., months 0–24 post-acquisition).
2. For each customer in each cohort, calculate age_in_periods: floor((current_date - acquisition_date) / period_unit_duration).
3. For each cohort and period, count:
   - active_count: customers with age_in_periods ≥ period AND (churn_date is null OR churn_date > period_end_date).
   - churned_count: customers with age_in_periods ≥ period AND churn_date ≤ period_end_date.
   - cohort_size: total customers in cohort (denominator; constant across periods).
4. Calculate retention_rate = active_count / cohort_size for each cohort-period pair. Verify 0.0 ≤ retention_rate ≤ 1.0.
5. Build retention_matrix: rows = cohorts, columns = periods, cells = {cohort_id, period_number, active_count, churned_count, retention_rate}.
6. Validate monotonicity: for each cohort, check that retention_rate(t) ≥ retention_rate(t+1) for all t. Flag non-monotonic cohorts (e.g., reactivation spikes) in anomaly_report.
7. Document data sparsity: if >30% of cohort-period cells have active_count = 0, flag as sparse and note in report.

**Output:**
- retention_matrix array (one row per cohort-period pair).
- Anomaly report: non_monotonic_cohorts (array of cohort_ids with retention spikes), sparse_data_flag (boolean), sparsity_percentage (number, 0.0–1.0).

**Quality Gate:**
- All retention_rate values are between 0.0 and 1.0 (verified by: min(retention_rate) ≥ 0.0 AND max(retention_rate) ≤ 1.0).
- Retention is non-increasing over time for ≥70% of cohorts (verified by: count(monotonic_cohorts) / cohort_count ≥ 0.70). Non-monotonic cohorts are documented.
- Every cohort has retention data for at least 3 periods (verified by: min(periods_per_cohort) ≥ 3). Cohorts with <3 periods are flagged.
- Data sparsity is ≤30% (verified by: sparsity_percentage ≤ 0.30). If >30%, adjust max_retention_periods or retention_period_unit.

---

### Phase 4: Retention Curve Fitting and Visualization

**Entry Criteria:**
- retention_matrix from Phase 3 is available with ≥3 periods per cohort.
- Data sparsity is ≤30%.

**Actions:**
1. For each cohort, extract retention_rate time series: array of {period_number, retention_rate}.
2. Fit three curve models to retention data using least-squares regression:
   - Exponential decay: retention(t) = a × e^(-b×t). Fit by log-transforming and using linear regression.
   - Power law: retention(t) = a × t^(-b). Fit by log-transforming both axes and using linear regression.
   - Linear: retention(t) = a - b×t. Fit using standard linear regression.
3. For each model, calculate goodness-of-fit (R²) = 1 - (SS_residual / SS_total). Select model with highest R².
4. Generate curve_data: array of {period, retention_rate (observed), fitted_value (predicted by best-fit model)}.
5. Create visualization descriptions (for embedding in report):
   - Line chart: x-axis = period (0 to max_retention_periods), y-axis = retention_rate (0.0–1.0), one line per cohort, overlay fitted curves.
   - Include legend, axis labels, and title (e.g., "Retention Curves by Acquisition Month").
6. Identify inflection points: periods where retention decline rate changes by >50% (d²retention/dt² changes sign or magnitude).
7. Document curve equations and parameters for each cohort: e.g., "Cohort 2023-01: exponential decay with a=0.95, b=0.08, R²=0.92".

**Output:**
- retention_curves array with: cohort_id, curve_data (array of {period, retention_rate, fitted_value}), curve_fit ("exponential", "power_law", or "linear"), r_squared (0.0–1.0), curve_equation (string, e.g., "retention(t) = 0.95 × e^(-0.08×t)").
- Visualization description: markdown-formatted chart description with axis labels, legend, and key insights.
- Inflection point summary: array of {cohort_id, period, inflection_type ("acceleration" or "deceleration")}.

**Quality Gate:**
- R² ≥ 0.80 for fitted curves in ≥70% of cohorts (verified by: count(cohorts with R² ≥ 0.80) / cohort_count ≥ 0.70). Cohorts with R² < 0.80 are flagged as "irregular retention pattern".
- Curve equations are mathematically valid: a > 0, b > 0, and fitted values are 0.0–1.0 (verified by: min(fitted_value) ≥ 0.0 AND max(fitted_value) ≤ 1.0).
- Visualization description is clear and includes all cohorts (verified by: description length > 100 characters AND all cohort_ids mentioned).

---

### Phase 5: Lifetime Value Projection

**Entry Criteria:**
- retention_curves from Phase 4 are available with R² ≥ 0.80 for ≥70% of cohorts.
- revenue_data, ltv_discount_rate, and revenue_model are specified.
- ltv_discount_rate is 0.0–1.0.

**Actions:**
1. Calculate average revenue per user (ARPU) by cohort and period:
   - ARPU(cohort, period) = sum(revenue_amount for users in cohort during period) / active_count(cohort, period).
   - Handle division by zero: if active_count = 0, set ARPU = 0.
2. Validate ARPU: flag outliers (ARPU > 10× median ARPU for cohort) and remove or cap at 10× median.
3. Project future ARPU based on revenue_model:
   - "constant": assume ARPU(t) = mean(ARPU observed) for all future t.
   - "linear": fit linear trend to observed ARPU over time; extrapolate: ARPU(t) = a + b×t. Cap extrapolation to max_retention_periods.
   - "cohort_trend": use cohort-specific ARPU trends observed in historical data; fit linear model per cohort.
4. Calculate LTV for each cohort using discounted cash flow:
   - LTV = Σ(ARPU(t) × retention_rate(t) / (1 + discount_rate)^t) for t = 0 to max_retention_periods.
   - Verify LTV ≥ 0 and LTV ≤ 10× annual_revenue (flag unrealistic projections).
5. Estimate confidence intervals using bootstrap resampling (1000 iterations):
   - Resample ARPU and retention_rate with replacement; recalculate LTV for each sample.
   - Calculate 5th and 95th percentiles as confidence_interval_lower and confidence_interval_upper.
6. Generate revenue_forecast: cumulative revenue by period for each cohort:
   - cumulative_revenue(t) = Σ(ARPU(τ) × retention_rate(τ)) for τ = 0 to t.
7. Compare LTV across cohorts: identify highest_ltv_cohort, lowest_ltv_cohort, ltv_variance (std dev of LTV across cohorts).

**Output:**
- ltv_projections array with: cohort_id, projected_ltv (number ≥ 0), confidence_interval_lower (number ≥ 0), confidence_interval_upper (number ≥ 0), revenue_forecast (array of {period, cumulative_revenue}).
- LTV comparison summary: highest_ltv_cohort (string), highest_ltv_value (number), lowest_ltv_cohort (string), lowest_ltv_value (number), ltv_variance (number), ltv_mean (number).
- ARPU validation report: outlier_count (number), outliers_removed_or_capped (number).

**Quality Gate:**
- All LTV values are positive and ≤ 10× annual_revenue (verified by: min(projected_ltv) ≥ 0 AND max(projected_ltv) ≤ 10× annual_revenue). Unrealistic projections are flagged.
- Confidence intervals are non-zero and symmetric around projected_ltv (verified by: confidence_interval_upper > confidence_interval_lower AND abs((projected_ltv - confidence_interval_lower) - (confidence_interval_upper - projected_ltv)) / projected_ltv ≤ 0.20).
- Revenue forecasts are monotonically non-decreasing (verified by: cumulative_revenue(t) ≤ cumulative_revenue(t+1) for all t). Non-monotonic forecasts are flagged.

---

### Phase 6: Churn Pattern Analysis

**Entry Criteria:**
- retention_curves, ltv_projections, and churn_metrics from previous phases are available.
- churn_risk_threshold is specified (0.0–1.0).

**Actions:**
1. Identify high-risk cohorts: cohorts with retention_rate(final_period) < churn_risk_threshold. Document cohort_id, final_retention_rate, and ltv_impact.
2. Identify low-risk cohorts: cohorts with retention_rate(final_period) > (1 - churn_risk_threshold). Document cohort_id and final_retention_rate.
3. Analyze churn timing: for each cohort, calculate:
   - Median time-to-churn: median period at which customers churn (50th percentile of churn_date - acquisition_date).
   - Churn rate by period: churn_rate(t) = churned_count(t) / active_count(t-1) for each period.
4. Detect churn triggers (temporal anomalies):
   - For each cohort, identify periods where churn_rate(t) > 2× baseline_churn_rate (baseline = mean churn_rate across all periods).
   - Record trigger_name (e.g., "Month 3 spike"), affected_cohorts (array), magnitude (churn_rate value), and period.
5. Detect cohort-specific drivers:
   - If churn_reason data is available and >50% of churned customers have reason: segment churn by reason (e.g., "price sensitivity", "feature gap", "competitive", "support").
   - Calculate churn_reason_distribution: percentage of churn attributed to each reason, by cohort.
   - Assign primary_driver to each cohort: reason with highest percentage.
   - If churn_reason data is <50% available: rely on temporal patterns and note "inferred from behavior" in report.
6. Calculate churn elasticity (qualitative assessment based on patterns):
   - If price-related churn is evident (e.g., spikes after price increase): note "price-sensitive".
   - If feature-gap churn is evident (e.g., churn correlates with feature adoption): note "feature-dependent".
   - If engagement-related churn is evident (e.g., churn correlates with inactivity): note "engagement-dependent".
7. Identify reactivation opportunities: if reactivation data is available, count customers who churned and later reactivated; calculate reactivation_rate by cohort.

**Output:**
- churn_patterns object with:
  - high_risk_cohorts (array of cohort_ids with retention < threshold).
  - low_risk_cohorts (array of cohort_ids with retention > (1 - threshold)).
  - churn_triggers (array of {trigger_name (string), affected_cohorts (array), magnitude (0.0–1.0), period (number)}).
  - cohort_specific_drivers (object mapping cohort_id to primary_driver string, e.g., {"2023-01": "price_sensitivity", "2023-02": "feature_gap"}).
  - median_time_to_churn_by_cohort (object mapping cohort_id to number of periods).
  - churn_reason_distribution (object, optional, if data available): {cohort_id: {reason: percentage}}.
  - reactivation_rate_by_cohort (object, optional, if data available): {cohort_id: rate (0.0–1.0)}.

**Quality Gate:**
- High-risk and low-risk cohorts are clearly differentiated (verified by: high_risk_cohorts and low_risk_cohorts have no overlap AND at least one cohort in each category, or note if all cohorts are in one category).
- Churn triggers are statistically significant: magnitude > 2× baseline_churn_rate (verified by: all triggers have magnitude ≥ 2× baseline).
- Churn drivers are specific and actionable: each driver is one of {"price_sensitivity", "feature_gap", "competitive", "support", "engagement", "other"} (verified by: all drivers in cohort_specific_drivers are from this list).
- Churn reason data completeness is documented: if <50% of churned customers have reason, note "inferred from behavior" in report.

---

### Phase 7: Churn Reduction Strategy Generation

**Entry Criteria:**
- churn_patterns from Phase 6 are available with high_risk_cohorts identified.
- ltv_projections from Phase 5 are available.
- business_constraints (optional) are specified.

**Actions:**
1. For each high-risk cohort, brainstorm interventions based on identified drivers:
   - Engagement campaigns: email, in-app messaging, outreach (target: engagement-dependent churn).
   - Pricing adjustments: discounts, tiered pricing, win-back offers (target: price-sensitive churn).
   - Feature improvements: address feature gaps, improve onboarding (target: feature-gap churn).
   - Customer success: dedicated support, training, proactive outreach (target: support-related churn).
   - Retention incentives: loyalty programs, exclusive benefits, early access (target: competitive churn).
2. For each intervention, estimate:
   - Target cohorts: array of cohort_ids that would benefit (high-risk cohorts with matching driver).
   - Estimated retention_lift: % point improvement in retention rate. Use ranges: engagement (0.02–0.08), pricing (0.03–0.15), features (0.05–0.20), support (0.02–0.10), incentives (0.01–0.05). Document assumptions.
   - Estimated LTV impact: change in projected LTV per customer = retention_lift × average_ltv_of_target_cohorts.
   - Implementation effort: "low" (<2 weeks, <$10k), "medium" (2–8 weeks, $10k–$100k), "high" (>8 weeks, >$100k).
   - Implementation cost (if business_constraints.budget available): estimate in currency units.
   - Estimated ROI: (LTV_impact × target_cohort_size × retention_lift) / implementation_cost. If cost unavailable, use effort-based proxy (ROI = LTV_impact / effort_score, where low=1, medium=3, high=10).
3. Prioritize strategies by ROI, feasibility (effort vs. budget), and alignment with business_constraints (timeline, budget, priority_areas):
   - Quick wins: ROI ≥ 2.0 AND effort = "low" AND timeline_fit = true.
   - Medium-term: ROI ≥ 1.5 AND effort = "medium" AND timeline_fit = true.
   - Long-term: effort = "high" OR ROI < 1.5 OR timeline_fit = false.
4. Group strategies into portfolio: if multiple strategies target same cohort, estimate combined impact (retention_lift_combined ≤ min(0.50, sum of individual lifts × 0.8, accounting for diminishing returns)).
5. Estimate combined impact: if all strategies are implemented, project cumulative retention and LTV improvement (cap at 50% total retention lift).
6. Document assumptions: discount rate, revenue model, retention_lift ranges, cost estimates, timeline constraints.

**Output:**
- churn_reduction_strategies array with:
  - strategy_id (string, e.g., "S001").
  - name (string, e.g., "Tier-specific onboarding program").
  - description (string, 50–200 characters, specific and actionable).
  - target_cohorts (array of cohort_ids).
  - estimated_retention_lift (number, 0.01–0.30, documented with assumptions).
  - estimated_ltv_impact (number, in currency units).
  - implementation_effort ("low", "medium", or "high").
  - estimated_roi (number ≥ 0, e.g., 3.5 = 3.5× return).
  - priority ("quick_win", "medium_term", or "long_term").
- Combined impact summary: total_estimated_retention_lift (number, capped at 0.50), total_estimated_ltv_impact (number), implementation_timeline (weeks), total_estimated_cost (number, if budget available).
- Strategy assumptions document: discount_rate, revenue_model, retention_lift_ranges (by intervention type), cost_estimates, timeline_constraints.

**Quality Gate:**
- Every strategy targets at least one high-risk cohort (verified by: all target_cohorts in high_risk_cohorts).
- Estimated retention_lift is realistic: 0.01 ≤ retention_lift ≤ 0.30 per intervention (verified by: all retention_lift values in this range).
- ROI is calculated consistently across all strategies (verified by: ROI = (LTV_impact × cohort_size × retention_lift) / cost, or effort-based proxy if cost unavailable).
- Strategies are specific and actionable: each description includes concrete action (e.g., "Send weekly engagement emails to inactive users in cohort 2023-01", not "improve engagement").
- Combined retention_lift is capped at 0.50 (verified by: total_estimated_retention_lift ≤ 0.50).

---

### Phase 8: Report Compilation and Delivery

**Entry Criteria:**
- All previous phases are complete and outputs are available.
- All quality gates from Phases 1–7 are passed (or failures are documented).

**Actions:**
1. Assemble executive summary (300–500 words):
   - Key findings: total customers analyzed, cohorts identified, overall retention trend (e.g., "median retention at 12 months: 65%"), LTV range (min–max by cohort).
   - Top 3 churn drivers and affected cohorts (e.g., "Price sensitivity affects 2023-01 and 2023-02 cohorts; 35% of churn").
   - Top 3 recommended strategies with estimated combined impact (e.g., "Implementing engagement campaigns + pricing adjustments could improve 12-month retention by 12% and increase LTV by $150 per customer").
   - Risk factors: data quality issues, small cohorts, irregular retention patterns, unrealistic LTV projections (if any).
2. Build detailed findings section (1000–2000 words):
   - Cohort overview: table with cohort_id, size, acquisition_date_range, final_retention_rate, projected_ltv, risk_level (high/low).
   - Retention curves: description of observed patterns (e.g., "Exponential decay with half-life of 6 months"), comparison across cohorts (e.g., "2023 cohorts show 10% better retention than 2022 cohorts"), anomalies (if any).
   - LTV analysis: projected LTV by cohort (table), revenue forecast (description of cumulative revenue trends), high-value vs. low-value cohorts, sensitivity analysis (e.g., "LTV ranges from $X to $Y depending on discount rate assumption").
   - Churn analysis: high-risk cohorts (table with retention rate, median time-to-churn, primary driver), churn triggers (temporal spikes), churn reason distribution (if available), reactivation opportunities (if available).
3. Create visualizations (as descriptions or embedded links):
   - Retention curve chart: line chart with all cohorts, fitted curves, legend, axis labels.
   - LTV projection chart: bar chart or line chart showing projected LTV by cohort, with confidence intervals.
   - Churn risk heatmap: cohorts (rows) × time periods (columns), color-coded by churn_rate (green = low, yellow = medium, red = high).
   - Strategy prioritization matrix: x-axis = implementation effort (low to high), y-axis = estimated ROI (low to high), bubble size = target cohort size, color = priority (quick_win, medium_term, long_term).
4. Write recommendations section (500–1000 words):
   - Prioritized list of strategies: for each strategy, include name, description, target cohorts, estimated impact, implementation timeline, and success metrics (e.g., "Target: increase 12-month retention from 65% to 75% within 6 months").
   - Quick wins: strategies to implement immediately (next 4 weeks), expected ROI, resource requirements.
   - Medium-term initiatives: strategies to implement in 2–3 months, expected ROI, dependencies.
   - Long-term initiatives: strategies requiring >3 months or significant investment, expected ROI, strategic rationale.
   - Implementation roadmap: timeline (Gantt chart or text description), resource allocation, success metrics, monitoring plan (e.g., "Re-run cohort analysis monthly to track strategy impact").
5. Add appendix (500–1000 words):
   - Detailed cohort statistics: table with cohort_id, size, acquisition_date_range, retention_rate (by period), median_time_to_churn, ltv_projection, confidence_interval.
   - Curve equations: for each cohort, document fitted curve model and equation (e.g., "Cohort 2023-01: exponential decay, retention(t) = 0.95 × e^(-0.08×t), R² = 0.92").
   - Methodology notes: data quality score, cohort definition, retention calculation method, LTV projection method, churn risk threshold, revenue model assumptions.
   - Assumptions and limitations: discount rate, ARPU model, reactivation definition, data completeness, small cohort flags, irregular retention patterns.
6. Format as markdown with clear headings (##, ###), tables (markdown format), bullet points, and embedded visualization descriptions.
7. Validate report: length 500–50,000 characters, all key findings from previous phases represented, recommendations are specific and actionable.
8. Calculate execution_metadata:
   - execution_timestamp: current date/time in ISO 8601.
   - data_quality_score: from Phase 1 (0.0–1.0).
   - total_customers_analyzed: count of unique customers in cleaned dataset.
   - cohorts_identified: count of unique cohorts.
   - analysis_completeness: "full" if all 8 phases completed without Abort errors; "partial" if some phases had Adjust errors; "limited" if major phases failed.
   - analysis_version: "1.0" for first run; increment for subsequent runs (e.g., "1.1", "2.0").
   - previous_analysis_timestamp: ISO 8601 timestamp of prior analysis (if available from state persistence).

**Output:**
- analysis_report: markdown-formatted comprehensive report (500–50,000 characters).
- execution_metadata: object with execution_timestamp, data_quality_score, total_customers_analyzed, cohorts_identified, analysis_completeness, analysis_version, previous_analysis_timestamp (optional).

**Quality Gate:**
- Report is self-contained and readable by non-technical stakeholders (verified by: no unexplained jargon, clear headings, summary tables, visualization descriptions).
- All key findings from Phases 1–7 are represented in report (verified by: report mentions data quality score, cohort count, retention trends, LTV range, high-risk cohorts, churn drivers, top 3 strategies).
- Recommendations are specific and actionable: each strategy includes name, description, target cohorts, estimated impact, timeline, and success metrics (verified by: no vague language like "improve", "optimize", "enhance").
- Visualizations are clear and support narrative (verified by: chart descriptions include axis labels, legend, key insights, and are >100 characters each).
- Report length is 500–50,000 characters (verified by: len(analysis_report) in this range).

---

## State Persistence

**Purpose:** Track cohort analysis results over time to monitor retention trend changes and measure strategy effectiveness.

**Persistence Mechanism:**
- Store execution_metadata and key outputs (retention_matrix, ltv_projections, churn_patterns, churn_reduction_strategies) with execution_timestamp.
- On subsequent runs, retrieve previous_analysis_timestamp and compare outputs to prior analysis.
- Generate trend report: retention improvement/decline by cohort, LTV change, strategy impact (if strategies were implemented between analyses).

**Versioning:**
- Increment analysis_version on each run: "1.0" → "1.1" (minor update, same cohort_dimension) → "2.0" (major update, different cohort_dimension or methodology).
- Document version history: array of {version, execution_timestamp, data_quality_score, cohort_count, key_findings}.

**Monitoring Plan:**
- Re-run analysis monthly or quarterly to track retention trends and strategy effectiveness.
- Compare retention_rate(t) across versions to identify improving/declining cohorts.
- Measure strategy impact: if strategy was implemented, compare retention_rate before and after implementation.
- Alert on anomalies: if retention drops >10% or LTV drops >15% compared to prior analysis, flag for investigation.

---

## Exit Criteria

The skill is DONE when:
1. All 8 phases have completed successfully (no Abort errors).
2. Data quality score ≥ 0.95 (Phase 1 quality gate passed).
3. Every customer is assigned to exactly one cohort (Phase 2 quality gate passed).
4. Retention rates are monotonically non-increasing for ≥70% of cohorts, or anomalies are documented (Phase 3 quality gate passed).
5. Retention curve fits have R² ≥ 0.80 for ≥70% of cohorts (Phase 4 quality gate passed).
6. LTV projections are positive and ≤10× annual_revenue; confidence intervals are non-zero (Phase 5 quality gate passed).
7. Churn patterns are specific and actionable; drivers are from defined list {"price_sensitivity", "feature_gap", "competitive", "support", "engagement", "other"} (Phase 6 quality gate passed).
8. Churn reduction strategies are prioritized by ROI; retention_lift is 0.01–0.30 per strategy; all strategies target high-risk cohorts (Phase 7 quality gate passed).
9. analysis_report is complete (500–50,000 characters), self-contained, and analysis_completeness = "full" (Phase 8 quality gate passed).
10. All outputs are populated and non-empty: cohort_assignments (≥100 rows), retention_matrix (≥3 rows), retention_curves (≥1 row), ltv_projections (≥1 row), churn_patterns (non-empty object), churn_reduction_strategies (≥1 row), analysis_report (≥500 characters), execution_metadata (complete).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Data quality score < 0.95 (>5% invalid/missing data) | **Adjust** -- flag low-quality cohorts or periods in report; document data limitations; consider re-running with cleaned subset if quality can be improved to ≥0.95. Proceed with analysis if quality ≥0.90; mark analysis_completeness = "partial". |
| Phase 1 | Revenue and churn datasets cannot be joined (no common customer_id or <100 customers match) | **Abort** -- require datasets to have matching customer identifiers; ask for data reconciliation; suggest using customer ID mapping or data cleaning. |
| Phase 2 | Cohort dimension results in >50 cohorts or <3 cohorts | **Adjust** -- suggest alternative cohort_dimension (e.g., switch from daily to monthly acquisition, or from product_tier to acquisition_month); document rationale; re-run with suggested dimension. |
| Phase 2 | >20% of cohorts have <10 customers (low statistical confidence) | **Adjust** -- flag small cohorts in output (low_confidence_cohorts array); consider merging small cohorts or excluding from analysis; note confidence limitations in report. Proceed with analysis; mark analysis_completeness = "partial". |
| Phase 3 | Retention data is sparse (>30% of cohort-period cells are empty) | **Adjust** -- reduce max_retention_periods or increase retention_period_unit (e.g., switch from weeks to months); document data sparsity in report; re-run with adjusted parameters. |
| Phase 4 | Curve fit R² < 0.80 for >30% of cohorts | **Adjust** -- document poor fit in report; flag cohorts as "irregular retention pattern"; consider alternative curve models or note that retention patterns do not follow standard decay models. Proceed with analysis; mark analysis_completeness = "partial". |
| Phase 5 | ARPU is highly volatile or negative (data quality issue) | **Adjust** -- validate revenue data; identify and remove outliers (ARPU > 10× median ARPU for cohort); recalculate LTV with cleaned data; document outlier removal in report. |
| Phase 5 | Projected LTV exceeds business expectations (e.g., >10× annual_revenue) | **Adjust** -- review discount_rate and revenue_model assumptions; consider shorter projection horizon; flag as unrealistic and use conservative estimate (e.g., cap at 5× annual_revenue); document assumption change in report. |
| Phase 6 | Churn reason data is missing or incomplete (<50% of churned customers have reason) | **Adjust** -- rely on temporal and cohort-specific patterns instead; note that churn drivers are "inferred from behavior" in report; do not assign specific churn_reason drivers; use temporal triggers and retention patterns. |
| Phase 7 | No feasible strategies identified (all have ROI < 1.0 or effort > budget) | **Adjust** -- recommend lower-cost interventions (e.g., email campaigns, process improvements, feature prioritization); suggest that churn may be structural and require product/pricing changes; escalate to product/pricing team for strategic review. |
| Phase 7 | Estimated combined retention_lift exceeds 50% (unrealistic) | **Adjust** -- cap combined_lift at 0.50; note that strategies may have diminishing returns or overlap; document assumption in report; recommend phased implementation to measure incremental impact. |
| Phase 8 | Report exceeds 50 pages or is too complex for stakeholders | **Adjust** -- create executive summary (2–3 pages) and detailed appendix; split into separate reports for different audiences (e.g., product team, finance team, executive leadership); provide interactive dashboard link if available. |
| All Phases | Input data is not in valid format (not JSON, CSV, or database query result) | **Abort** -- require data in structured format; suggest using data export or API to retrieve data in standard format. |

---

## Reference Section

### Cohort Analysis Fundamentals

**Cohort Definition:** A cohort is a group of customers who share a common characteristic or experience within a defined time period (e.g., customers acquired in January 2023).

**Retention Rate:** The percentage of customers in a cohort who remain active (have not churned) at a given time period post-acquisition. Formula: retention_rate(t) = active_customers(t) / cohort_size.

**Churn Rate:** The percentage of customers in a cohort who leave (churn) during a time period. Formula: churn_rate(t) = churned_customers(t) / active_customers(t-1).

**Lifetime Value (LTV):** The total revenue expected from a customer over their entire relationship with the company. Formula: LTV = Σ(ARPU(t) × retention_rate(t) / (1 + discount_rate)^t).

**Retention Curve Models:**
- **Exponential Decay:** retention(t) = a × e^(-b×t). Assumes constant churn rate; common in SaaS.
- **Power Law:** retention(t) = a × t^(-b). Assumes decreasing churn rate over time; common in mobile apps.
- **Linear:** retention(t) = a - b×t. Simple model; less common but useful for short-term projections.

**Cohort Comparison:** Compare retention curves across cohorts to identify:
- Improving cohorts: newer cohorts have better retention (product improvements, better onboarding).
- Declining cohorts: older cohorts have worse retention (market saturation, competitive pressure).
- Seasonal patterns: cohorts acquired in certain seasons have different retention profiles.

**Churn Reduction Strategies:**
- **Engagement:** Increase customer interaction (email, in-app messaging, events) to improve retention. Typical lift: 2–8%.
- **Pricing:** Adjust pricing strategy (discounts, tiered pricing, value-based pricing) to reduce price-driven churn. Typical lift: 3–15%.
- **Product:** Improve product features, onboarding, and user experience to reduce feature-gap churn. Typical lift: 5–20%.
- **Support:** Provide proactive customer success support (training, dedicated account managers) to reduce support-related churn. Typical lift: 2–10%.
- **Incentives:** Offer loyalty programs, exclusive benefits, or win-back offers to reduce voluntary churn. Typical lift: 1–5%.

**Key Metrics to Monitor:**
- Retention rate at key milestones (30-day, 90-day, 1-year).
- Median time-to-churn (when do customers typically leave?).
- LTV-to-CAC ratio (is customer lifetime value sufficient to justify acquisition cost?).
- Churn rate by cohort, segment, or reason (where is churn concentrated?).
- Strategy impact: retention improvement post-implementation (measured via A/B test or cohort comparison).

### Decision Criteria for Cohort Dimension

- **Acquisition Month/Quarter:** Best for understanding seasonal trends and product evolution over time. Use if analyzing 12+ months of data.
- **Product Tier:** Best for identifying pricing-related churn and upsell opportunities. Use if product has distinct tiers or pricing levels.
- **Geography:** Best for understanding regional differences in retention and LTV. Use if business operates in multiple regions.
- **Acquisition Channel:** Best for evaluating marketing channel quality and ROI. Use if tracking customer source.
- **Customer Segment:** Best for tailoring retention strategies to specific customer types. Use if customer base has distinct segments (e.g., SMB vs. Enterprise).

### Decision Criteria for Revenue Model

- **Constant:** Assume flat ARPU over time. Use when historical data shows stable revenue per customer (variance <20%).
- **Linear:** Assume ARPU grows or declines linearly. Use when there is a clear trend in historical data (R² > 0.7 for linear fit).
- **Cohort Trend:** Use observed ARPU trends from historical data for each cohort. Most accurate but requires ≥6 periods of historical data per cohort.

### Checklists

**Pre-Analysis Checklist:**
- [ ] Revenue data includes customer_id (string), transaction_date (ISO 8601), and revenue_amount (number ≥ 0).
- [ ] Churn metrics include customer_id (string), churn_date (ISO 8601, null if active), and churn_reason (string, optional).
- [ ] Datasets can be joined on customer_id with ≥95% match rate.
- [ ] Date formats are consistent (ISO 8601 preferred) and in UTC timezone.
- [ ] Cohort dimension is clearly defined and valid (one of: acquisition_month, acquisition_quarter, product_tier, geography).
- [ ] Business constraints (budget, timeline, priorities) are documented (optional but recommended).
- [ ] At least 100 customers are present in combined dataset.

**Post-Analysis Checklist:**
- [ ] Data quality score ≥ 0.95 (or ≥0.90 with documented limitations).
- [ ] Cohort count is reasonable: 3 ≤ cohort_count ≤ 50.
- [ ] Retention curves show expected patterns (monotonic decline or documented anomalies).
- [ ] Curve fits have R² ≥ 0.80 for ≥70% of cohorts (or irregular patterns documented).
- [ ] LTV projections are positive and ≤10× annual_revenue.
- [ ] Confidence intervals are non-zero and symmetric.
- [ ] Churn patterns are specific and actionable (drivers from defined list).
- [ ] Strategies are prioritized by ROI and feasibility.
- [ ] Report is clear, complete, and ready for stakeholder review (500–50,000 characters).
- [ ] All outputs are populated and non-empty.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.