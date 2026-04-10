# Dashboard Optimizer

**One-line description:** Analyze a dashboard description and recommend improvements by removing vanity metrics, adding actionable KPIs, improving data hierarchy, and designing drill-down paths.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dashboard_description` (string, required): Plain-text or structured description of the current dashboard, including metric names, visualizations, layout, and any metadata about data sources. Can also reference an image or dashboard URL.
- `business_context` (string, required): The business domain, primary decisions the dashboard supports, and key stakeholder roles (e.g., "SaaS product analytics for growth team and executives").
- `current_kpis` (array of objects, optional): List of current KPIs with structure `{name, definition, owner_role, frequency}`. If not provided, will be extracted from dashboard_description.
- `available_data_dimensions` (array of strings, optional): Dimensions available for drill-down (e.g., ["time", "geography", "customer_segment", "product_feature"]). Defaults to common dimensions if not specified.
- `stakeholder_roles` (array of strings, optional): Roles that use the dashboard (e.g., ["executive", "product_manager", "analyst"]). Defaults to ["executive", "manager", "analyst"].
- `data_infrastructure_context` (string, optional): Current data pipeline capabilities, latency, and reliability constraints (e.g., "real-time event streaming, 1-hour batch updates, 95% data quality"). Used to validate KPI feasibility.

---

## Outputs

- `vanity_metrics_identified` (array of objects): List of metrics to remove, with structure `{metric_name, reason_vanity, current_location_in_dashboard, recommended_replacement_or_removal_action}`.
- `recommended_kpis` (array of objects): Suggested KPIs to add, with structure `{kpi_name, definition, calculation_method, target_audience, business_outcome_measured, rationale, data_feasibility_status, data_latency_requirement}`.
- `hierarchy_improvement` (object): Proposed dashboard structure with fields: `{current_hierarchy_assessment, proposed_groupings, visual_layout_suggestion, rationale}`.
- `drill_down_paths` (array of objects): Drill-down map with structure `{summary_metric, level_1_detail, level_2_detail, suggested_filters, use_case, implementation_feasibility}`.
- `metrics_interdependency_map` (object): Leading and lagging indicator relationships with structure `{metric_name, leading_indicators, lagging_indicators, causality_description}`.
- `data_quality_assessment` (array of objects): Data quality and reliability assessment for each recommended KPI with structure `{kpi_name, data_source, quality_score, latency_hours, reliability_percentage, risk_flags, mitigation_strategy}`.
- `improvement_report` (object): Executive summary with fields: `{metrics_to_remove, kpis_to_add, hierarchy_changes, drill_down_additions, experimentation_metrics_added, implementation_priority, estimated_impact, dependencies, data_infrastructure_changes_required}`.

---

## Execution Phases

### Phase 1: Parse Dashboard and Extract Metrics

**Entry Criteria:**
- `dashboard_description` is provided and contains at least 3 metrics or visualizations.
- `business_context` is provided.

**Actions:**
1. Read the dashboard description end-to-end and extract all metric names, visualization types, and current layout/grouping.
2. If `current_kpis` is not provided, infer KPIs from the description (metrics that appear to drive decisions).
3. Identify data sources, update frequency, and any filters or dimensions mentioned.
4. Create a structured representation: `{metrics: [...], visualizations: [...], hierarchy: {...}, data_sources: [...]}`.
5. Document any data quality or latency constraints mentioned in the description or `data_infrastructure_context`.

**Output:**
- `parsed_dashboard` (object): Structured representation of current dashboard.
- `extracted_kpis` (array): KPIs inferred or provided.
- `data_constraints` (object): Documented latency, quality, and infrastructure constraints.

**Quality Gate:**
- Every metric in the description appears in `parsed_dashboard.metrics`.
- At least 2 KPIs are identified (either from input or inferred).
- Data hierarchy is explicitly documented.
- Data constraints are recorded for later validation.

---

### Phase 2: Identify Vanity Metrics

**Entry Criteria:**
- `parsed_dashboard` is complete.
- `business_context` is available.

**Actions:**
1. For each metric in `parsed_dashboard.metrics`, assess: Does it drive a decision? Does it correlate with a business outcome? Can a stakeholder act on it?
2. Classify metrics as: Actionable (drives decisions), Decorative (looks good, no action), or Contextual (supporting information).
3. Vanity metrics are those classified as Decorative or those that measure activity without outcome (e.g., "total page views" without conversion context).
4. For each vanity metric, document the specific reason it is problematic and suggest a replacement or removal action.
5. Verify that at least one metric remains actionable (otherwise the dashboard has no value).

**Output:**
- `vanity_metrics_identified` (array of objects): `{metric_name, classification, reason_vanity, current_location_in_dashboard, recommended_replacement_or_removal_action}`.

**Quality Gate:**
- Every metric is classified.
- Each vanity metric has a specific, documented reason (not vague).
- At least one metric is identified as actionable.
- Each vanity metric has a concrete replacement or removal recommendation.

---

### Phase 3: Audit, Validate, and Recommend KPIs

**Entry Criteria:**
- `extracted_kpis` is available.
- `business_context` and `stakeholder_roles` are defined.
- `data_constraints` are documented.

**Actions:**
1. For each current KPI, assess: Is it actionable? Does it have a clear owner? Is it measured at the right frequency? Does it align with business outcomes?
2. Identify gaps: What decisions do stakeholders need to make that aren't supported by current KPIs?
3. Suggest replacement or new KPIs that are: outcome-focused (not activity-focused), owned by a specific role, measurable, and actionable.
4. For each recommended KPI, document: definition, calculation method, target audience, business outcome it measures, and rationale.
5. Validate each recommended KPI against `data_constraints`: Is it measurable with current data infrastructure? What is the latency requirement? Flag KPIs that require data pipeline changes.
6. Identify experimentation and testing metrics (e.g., "experiment velocity", "statistical significance of changes", "A/B test conversion lift") that are missing from the current dashboard. Add these to recommendations for product and growth teams.

**Output:**
- `recommended_kpis` (array of objects): `{kpi_name, definition, calculation_method, target_audience, business_outcome_measured, rationale, data_feasibility_status, data_latency_requirement}`.
- `experimentation_metrics_identified` (array of objects): `{metric_name, definition, use_case, target_audience, rationale}`.

**Quality Gate:**
- Each recommended KPI is outcome-focused (measures a business result, not an activity).
- Each KPI has a named owner role.
- Recommendations address gaps identified in the current KPI set.
- At least one KPI per stakeholder role is recommended.
- Data feasibility status is explicitly documented for each KPI ("feasible", "requires pipeline change", "requires data enrichment").
- Experimentation metrics are included if the dashboard supports product or growth teams.

---

### Phase 4: Analyze and Improve Data Hierarchy

**Entry Criteria:**
- `parsed_dashboard.hierarchy` is documented.
- `recommended_kpis` are finalized.
- `stakeholder_roles` are defined.

**Actions:**
1. Assess the current hierarchy: What's at the top level? What's buried? Are related metrics grouped logically?
2. For each stakeholder role, document their primary decisions and the metrics required to make those decisions. Use this decision workflow to determine metric priority:
   - Executive: Strategic outcomes (revenue, churn, growth rate)
   - Product Manager: Feature adoption, engagement, retention
   - Analyst: Operational metrics, drill-down dimensions, trends
3. Propose a new hierarchy that prioritizes metrics by decision importance and stakeholder role.
4. Suggest visual groupings: related metrics should be adjacent or in the same section. Group by business outcome (e.g., "Revenue Metrics", "Engagement Metrics", "Operational Metrics").
5. Document the rationale for each hierarchy change, referencing the decision workflows from step 2.

**Output:**
- `hierarchy_improvement` (object): `{current_hierarchy_assessment, proposed_groupings, visual_layout_suggestion, rationale, stakeholder_role_mapping}`.

**Quality Gate:**
- Proposed hierarchy aligns with stakeholder decision workflows (documented in step 2).
- Related metrics are grouped together by business outcome.
- Top-level metrics are outcome-focused, not activity-focused.
- Rationale is specific to the business context and decision workflows provided.
- Each stakeholder role has a clear path to their required metrics (top-level or one click away).

---

### Phase 5: Design Drill-Down Paths and Metrics Interdependencies

**Entry Criteria:**
- `recommended_kpis` are finalized.
- `available_data_dimensions` are defined (or defaults applied).
- `stakeholder_roles` are known.
- `data_constraints` are documented.

**Actions:**
1. For each top-level KPI, identify the questions a stakeholder will ask: "Why did this change?" "Which segment is driving this?" "What's the trend over time?" "Who is affected?"
2. Map drill-down paths: summary metric → detail level 1 (e.g., by segment, geography, or time) → detail level 2 (e.g., by sub-segment or specific cohort).
3. For each path, specify: filters available, dimensions to break down by, the use case (what question does this path answer?), and implementation feasibility (is the data available?).
4. Ensure drill-down paths are intuitive and follow a logical progression.
5. Identify metric interdependencies: For each KPI, document leading indicators (metrics that predict this KPI) and lagging indicators (metrics that result from this KPI). Example: "Feature Adoption" is a leading indicator of "Engagement", which is a leading indicator of "Retention".
6. Create a metrics interdependency map that shows causality relationships. This helps stakeholders understand which metrics to watch first and how changes propagate through the system.

**Output:**
- `drill_down_paths` (array of objects): `{summary_metric, level_1_detail, level_2_detail, suggested_filters, use_case, implementation_feasibility}`.
- `metrics_interdependency_map` (object): `{metric_name, leading_indicators, lagging_indicators, causality_description}`.

**Quality Gate:**
- Every top-level KPI has at least one drill-down path.
- Each path answers a realistic stakeholder question.
- Drill-down dimensions are available in the data (or flagged as "requires data enrichment").
- Paths are ordered by frequency of use (most common first).
- Interdependency map includes all recommended KPIs and shows clear causal relationships.
- Causality descriptions are specific and testable (e.g., "Feature adoption increases engagement by 15% within 7 days").

---

### Phase 6: Assess Data Quality and Compile Improvement Report

**Entry Criteria:**
- All previous phases are complete.
- `vanity_metrics_identified`, `recommended_kpis`, `hierarchy_improvement`, `drill_down_paths`, and `metrics_interdependency_map` are finalized.
- `data_constraints` are documented.

**Actions:**
1. For each recommended KPI, assess data quality, latency, and reliability:
   - Data source: Where does this metric come from?
   - Quality score: What percentage of records are valid and complete? (0-100%)
   - Latency: How many hours behind real-time is this metric? (0 = real-time, 24+ = batch)
   - Reliability: What percentage of the time is this metric available and accurate? (0-100%)
   - Risk flags: Are there known data quality issues, missing dimensions, or infrastructure constraints?
   - Mitigation strategy: How can data quality be improved? What infrastructure changes are needed?
2. Synthesize all recommendations into a structured report.
3. Prioritize changes by impact and effort: high-impact, low-effort changes first.
4. Suggest a phased rollout:
   - Phase 1 (Quick Wins): Remove vanity metrics, add high-impact KPIs with existing data, reorganize hierarchy.
   - Phase 2 (Medium Effort): Add KPIs that require minor data pipeline changes, implement drill-down paths.
   - Phase 3 (Strategic): Add KPIs that require significant infrastructure investment, implement advanced interdependency visualizations.
5. Estimate impact: How will these changes improve decision-making? (e.g., "reduce decision latency by 30%", "increase KPI ownership clarity by 80%", "enable 3 new decision workflows").
6. Document any dependencies or prerequisites (e.g., "requires data pipeline change", "requires new data source integration").
7. Include a summary of data infrastructure changes required to support all recommended KPIs.

**Output:**
- `data_quality_assessment` (array of objects): `{kpi_name, data_source, quality_score, latency_hours, reliability_percentage, risk_flags, mitigation_strategy}`.
- `improvement_report` (object): `{metrics_to_remove, kpis_to_add, hierarchy_changes, drill_down_additions, experimentation_metrics_added, implementation_priority, estimated_impact, dependencies, data_infrastructure_changes_required, phased_rollout}`.

**Quality Gate:**
- Report is actionable: each recommendation has a specific implementation step.
- Prioritization is justified by impact and effort.
- Dependencies are documented and linked to specific recommendations.
- Estimated impact is realistic and measurable (e.g., "reduce decision latency from 24 hours to 4 hours").
- Data quality assessment covers all recommended KPIs and identifies risk flags early.
- Phased rollout is realistic and achieves quick wins in Phase 1.
- A person unfamiliar with the original dashboard could implement these recommendations and produce a more decision-focused dashboard.

---

## Exit Criteria

The skill is DONE when:
1. All vanity metrics are identified with specific reasons and replacement actions.
2. Recommended KPIs are outcome-focused, owned by specific roles, and validated against data infrastructure constraints.
3. Experimentation and testing metrics are included in recommendations (if applicable to the business domain).
4. Data hierarchy is reorganized to match stakeholder decision workflows.
5. Drill-down paths are designed for each top-level KPI with documented use cases.
6. Metrics interdependency map shows leading and lagging indicator relationships.
7. Data quality assessment flags risks and mitigation strategies for each recommended KPI.
8. A comprehensive improvement report is compiled with prioritized, actionable recommendations and a phased rollout plan.
9. A person unfamiliar with the original dashboard could implement these recommendations and produce a more decision-focused dashboard.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dashboard description is too vague (e.g., "we have a dashboard") | **Adjust** -- Request specific metric names, visualization types, and current layout. Provide a template: "Current metrics: [...], Visualizations: [...], Primary users: [...]". |
| Phase 1 | No business context provided | **Adjust** -- Ask: "What decisions does this dashboard support?" and "Who are the primary users?" Use defaults if necessary, but note assumptions. |
| Phase 1 | Data infrastructure context is missing | **Adjust** -- Ask about current data pipeline capabilities, latency, and reliability. Use conservative assumptions (e.g., assume 24-hour batch latency, 90% data quality) and flag for validation. |
| Phase 2 | All metrics appear actionable (no vanity metrics identified) | **Adjust** -- This is valid; document that the dashboard is already well-designed. Focus recommendations on hierarchy, drill-down improvements, and experimentation metrics. |
| Phase 3 | Recommended KPIs require data not currently available | **Adjust** -- Flag as "requires data pipeline change" in dependencies. Suggest interim KPIs using available data. Prioritize data infrastructure changes in the phased rollout. |
| Phase 3 | Experimentation metrics are not applicable (e.g., operational dashboard for finance) | **Adjust** -- Skip experimentation metrics section. Document that the domain does not require A/B testing or experiment velocity metrics. |
| Phase 4 | Stakeholder roles have conflicting metric priorities | **Adjust** -- Create role-specific dashboard views or use filtering/tabs to show different hierarchies per role. Document the conflict and resolution in the hierarchy improvement section. |
| Phase 5 | Drill-down dimensions are not available in the data | **Adjust** -- Suggest alternative dimensions or flag as "requires data enrichment". Prioritize drill-downs by feasibility and mark infeasible paths as "Phase 2 or 3" in the rollout. |
| Phase 5 | Metrics interdependency map reveals circular dependencies or unclear causality | **Adjust** -- Flag these relationships as "requires validation" and suggest A/B testing or statistical analysis to confirm causality. Document assumptions explicitly. |
| Phase 6 | Recommended changes exceed the scope of a single dashboard | **Adjust** -- Suggest splitting into multiple dashboards (e.g., executive summary + detailed analytics). Link them via drill-down. Document the multi-dashboard architecture in the improvement report. |
| Phase 6 | Data quality assessment reveals that multiple recommended KPIs depend on unreliable data sources | **Adjust** -- Prioritize data infrastructure improvements in Phase 1. Suggest interim KPIs using more reliable data sources. Flag data quality as a blocker for specific recommendations. |
| Phase 6 | User rejects final output | **Targeted revision** -- ask which section fell short (vanity metric identification, a specific KPI recommendation, the hierarchy proposal, or a drill-down path) and rerun only that section. Do not regenerate the full report. |

---

## Reference Section

### Vanity Metric Indicators

A metric is likely vanity if it:
- Measures activity without outcome (e.g., "page views" without conversion context).
- Has no clear owner or decision-maker.
- Cannot be acted upon (e.g., "total users" with no segmentation).
- Trends upward but doesn't correlate with business success.
- Is not compared to a benchmark or target.
- Is not used to make a specific decision or trigger an action.

### Actionable KPI Criteria

A KPI is actionable if it:
- Measures an outcome, not an activity.
- Has a named owner (role or team).
- Has a clear target or threshold.
- Can be influenced by decisions or actions.
- Is measured at a frequency that allows timely action (e.g., daily for operational metrics, monthly for strategic metrics).
- Is compared to a benchmark, historical trend, or peer group.

### Data Hierarchy Best Practices

- **Top level:** 3-5 outcome-focused KPIs (e.g., revenue, churn, engagement).
- **Second level:** Supporting metrics that explain the top-level KPIs (e.g., revenue = ARPU × customer count).
- **Third level:** Operational metrics and drill-down dimensions (e.g., revenue by segment, by product, by geography).
- **Principle:** Stakeholders should see what matters most first; details are one click away.
- **Organization:** Group metrics by business outcome, not by data source or technical category.

### Drill-Down Design Pattern

```
Summary Metric (e.g., "Revenue")
├── Level 1: By Dimension (e.g., "Revenue by Product")
│   ├── Level 2: By Sub-Dimension (e.g., "Revenue by Product and Region")
│   └── Level 2: By Time (e.g., "Revenue by Product over Time")
├── Level 1: By Time (e.g., "Revenue Trend")
│   └── Level 2: By Segment (e.g., "Revenue Trend by Customer Segment")
└── Level 1: By Segment (e.g., "Revenue by Customer Segment")
    └── Level 2: By Product (e.g., "Revenue by Segment and Product")
```

Design drill-downs to answer: "Why?", "Which?", "When?", "Who?".

### Metrics Interdependency Pattern

```
Leading Indicators → Core Metrics → Lagging Indicators

Example:
Feature Adoption → Engagement → Retention → Revenue

Interpretation:
- Feature Adoption is a leading indicator: watch it first to predict future engagement.
- Engagement is a core metric: it's influenced by adoption and influences retention.
- Retention is a lagging indicator: it reflects the impact of engagement changes.
- Revenue is the ultimate outcome: it's driven by retention and customer lifetime value.
```

Use this pattern to help stakeholders understand which metrics to monitor and in what order.

### Experimentation Metrics for Product and Growth Teams

Consider adding these metrics if the dashboard supports product or growth decisions:
- **Experiment Velocity:** Number of experiments running, completed, or shipped per week/month.
- **Statistical Significance:** Percentage of experiments with statistically significant results (p < 0.05).
- **Conversion Lift:** Average lift in conversion rate from winning experiments.
- **Time to Significance:** Average time to reach statistical significance for an experiment.
- **Experiment ROI:** Revenue impact per dollar spent on experimentation infrastructure.
- **Feature Adoption Rate:** Percentage of users adopting new features within 7/14/30 days.
- **A/B Test Velocity:** Number of concurrent A/B tests running.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.