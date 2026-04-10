# Data Question Solver

**One-line description:** Transform a business question into a complete, validated data solution including SQL queries, data pipeline design, quality checks, and visualization specifications.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `business_question` (string, required): The business question to answer. Should include context on who is asking, what decision it informs, and any known constraints.
- `data_catalog` (object, optional): Reference documentation of available data sources, schemas, and lineage. If not provided, assume standard enterprise data warehouse structure.
- `audience_context` (string, optional): Who will use this solution? (e.g., "executive dashboard," "data analyst," "automated report"). Defaults to "general analyst."
- `sla_requirements` (object, optional): Service level agreements including refresh frequency, acceptable latency, and uptime requirements.
- `known_constraints` (string[], optional): Data limitations, access restrictions, or technical constraints (e.g., "no PII allowed," "real-time data unavailable").

---

## Outputs

- `clarified_question` (object): Parsed business question with explicit metrics, dimensions, filters, and success criteria.
- `governance_assessment` (object): Data governance and compliance requirements including PII handling, access controls, and regulatory constraints.
- `data_sources_identified` (object[]): List of required tables, columns, join keys, and data lineage.
- `quality_checks_spec` (object[]): Data quality check specifications with thresholds and failure responses.
- `pipeline_design` (object): Pipeline architecture with extract, transform, load steps and dependencies.
- `sql_queries` (object[]): Validated SQL queries with execution plans, expected row counts, and test cases.
- `visualization_spec` (object): Visualization design including chart type, dimensions, measures, filters, and interactivity.
- `solution_documentation` (string): Complete solution summary with assumptions, lineage, maintenance schedule, and cost estimate.

---

## Execution Phases

### Phase 1: Question Clarification

**Entry Criteria:**
- Business question is provided in natural language.
- Audience context is known or can be inferred.

**Actions:**
1. Parse the business question to extract: primary metric(s), dimensions (how to slice the data), filters (constraints), and time period.
2. Identify the business decision this question informs. Clarify success criteria: what answer would be "good enough"? What precision is required?
3. Check for ambiguity: does "revenue" mean gross or net? Does "customer" mean unique individuals or accounts? Document assumptions.
4. Determine if the question requires predictive analysis, trend analysis, or snapshot analysis.
5. Validate that the question is answerable with available data (or flag data gaps for Phase 2).

**Output:**
- `clarified_question` object with fields: primary_metric, dimensions, filters, time_period, business_context, success_criteria, analysis_type, assumptions.

**Quality Gate:**
- The clarified question is unambiguous and could be handed to a SQL developer without further clarification.
- All assumptions are documented with explicit values (e.g., "null revenue treated as 0" not "nulls handled").
- Success criteria are testable and measurable (e.g., "accuracy within 5%" not "accurate").
- Verified by: stakeholder review or written confirmation of interpretation.

---

### Phase 1.5: Stakeholder Alignment Checkpoint

**Entry Criteria:**
- Clarified question is complete.
- Success criteria are documented.

**Actions:**
1. Schedule a brief alignment meeting or async review with key stakeholders (question originator, data owner, business analyst).
2. Present the clarified question, metrics, dimensions, filters, and success criteria.
3. Confirm that the interpretation matches stakeholder intent. Document any corrections or refinements.
4. Obtain explicit sign-off (written or recorded) that the clarified question is correct before proceeding to Phase 2.
5. If stakeholders request changes, iterate on the clarified question and re-present until alignment is achieved.

**Output:**
- `stakeholder_sign_off` (string): Confirmation that clarified question has been reviewed and approved. Include date, stakeholder names, and any conditions or caveats.

**Quality Gate:**
- Stakeholder sign-off is documented and dated.
- No ambiguity remains about what the solution should deliver.
- Verified by: written confirmation (email, document, or meeting notes).

---

### Phase 2: Data Governance and Compliance Assessment

**Entry Criteria:**
- Clarified question has stakeholder sign-off.
- Known constraints are documented.

**Actions:**
1. Identify PII (personally identifiable information) in the data: which columns contain sensitive data (names, emails, phone numbers, SSNs, etc.)? Document handling requirements (anonymization, encryption, access restrictions).
2. Determine regulatory compliance requirements: does the data fall under GDPR, HIPAA, CCPA, or other regulations? Document specific requirements (e.g., data retention, consent, audit trails).
3. Identify access controls: who is allowed to see the data? Are there role-based restrictions? Document approval process for data access.
4. Check for data residency requirements: must data stay in specific geographic regions? Are there cloud vs. on-premises constraints?
5. Document data ownership and stewardship: who is responsible for data quality, updates, and compliance? Who approves the solution?
6. Identify any contractual or licensing constraints on data use (e.g., third-party data with usage restrictions).
7. Plan for audit and logging: what actions should be logged for compliance? How long should logs be retained?

**Output:**
- `governance_assessment` object with fields: pii_columns, pii_handling_strategy, regulatory_requirements, access_controls, data_residency, data_owner, stewardship_plan, licensing_constraints, audit_logging_plan.

**Quality Gate:**
- All PII is identified and handling strategy is documented.
- Regulatory requirements are mapped to specific data handling practices.
- Access controls are defined and approved by data owner.
- No compliance violations are introduced by the solution.
- Verified by: data governance team review or compliance officer sign-off.

---

### Phase 3: Data Source Identification

**Entry Criteria:**
- Governance assessment is complete.
- Data catalog or schema documentation is available (or assumed).

**Actions:**
1. Map each metric and dimension in the clarified question to source tables and columns.
2. Identify join keys and relationships between tables. Document any many-to-many relationships or slowly changing dimensions.
3. Check for data gaps: are all required fields available? Do any fields need to be derived or calculated?
4. Identify the source system for each table (e.g., ERP, CRM, data warehouse). Note any known data quality issues.
5. Determine the freshness requirement: when was each source last updated? Does the pipeline need real-time or batch data?
6. Validate that data sources comply with governance requirements: are PII fields encrypted? Are access controls in place? Are audit logs available?
7. Document any access restrictions or licensing constraints that affect data handling.

**Output:**
- `data_sources_identified` array with objects: table_name, columns_needed, join_keys, source_system, last_updated, freshness_requirement, access_restrictions, data_quality_notes, governance_compliance.

**Quality Gate:**
- Every metric and dimension from the clarified question maps to at least one source field.
- Join logic is documented and validated (no circular dependencies).
- Data gaps are flagged; if critical gaps exist, escalate to stakeholder for alternative question or data acquisition.
- All data sources comply with governance requirements (PII handling, access controls, regulatory constraints).
- Verified by: data owner confirmation and governance team review.

---

### Phase 4: Data Quality Check Design

**Entry Criteria:**
- Data sources are identified.
- SLA requirements and known constraints are documented.
- Governance requirements are understood.

**Actions:**
1. For each source table, define quality checks: null checks (which columns must be non-null?), range checks (valid value ranges), uniqueness checks (primary keys, natural keys), and referential integrity checks (foreign keys).
2. Define thresholds: what percentage of records can fail a check before the pipeline halts? (e.g., "if >5% of rows are null, abort"). Document rationale for each threshold.
3. Identify business rule checks: domain-specific validations (e.g., "end_date must be >= start_date", "revenue must be positive").
4. Design checks for derived fields: if the pipeline creates new columns, validate their correctness (e.g., "total = sum of line items").
5. Document the response to each check failure: retry, adjust (e.g., impute nulls), or abort. Include specific recovery steps.
6. Plan for data quality monitoring: which checks should be logged and tracked over time? Define alerting thresholds for anomalies.
7. Design automated test cases for quality checks: create sample data sets that should pass and fail each check. Document expected behavior.

**Output:**
- `quality_checks_spec` array with objects: table_name, check_type (null, range, uniqueness, referential, business_rule), check_definition, threshold, failure_response, monitoring_flag, test_cases.

**Quality Gate:**
- Every source table has at least 2-3 quality checks.
- Thresholds are realistic and documented with rationale (e.g., "based on historical data quality: 2% nulls observed, threshold set to 5%").
- Failure responses are actionable and specific (e.g., "if >5% nulls: log error, pause pipeline, notify data owner" not "investigate").
- Test cases are defined for each check and can be executed automatically.
- Verified by: data quality team review and test case execution.

---

### Phase 5: Data Pipeline Design

**Entry Criteria:**
- Data sources are identified.
- Quality checks are defined.
- Freshness and SLA requirements are known.
- Governance requirements are documented.

**Actions:**
1. Design the Extract phase: how will data be pulled from source systems? (e.g., full load, incremental, CDC). Document frequency and timing. Ensure extraction respects access controls and audit logging.
2. Design the Transform phase: what calculations, aggregations, joins, and derivations are needed? Group transformations into logical steps (e.g., "clean customer data," "calculate metrics," "apply business rules"). Include PII masking or encryption steps if required.
3. Integrate quality checks into the pipeline: where should checks run? (e.g., after extract, after transform, before load). Define check order and dependencies. Document what happens if a check fails (halt, log, continue).
4. Design the Load phase: where will the final data land? (e.g., data warehouse table, data mart, cache). Define incremental vs. full refresh strategy. Ensure loaded data respects access controls.
5. Document dependencies: which steps must run before others? Are any steps parallelizable? Create a dependency graph.
6. Define error handling and retry logic: if a step fails, what happens? Should the entire pipeline retry or just the failed step? How many retries before abort?
7. Plan for monitoring and alerting: define metrics to track (row counts, execution time, quality check results, data freshness). Set up alerts for anomalies (e.g., "row count drops >20%", "execution time exceeds SLA", "quality check fails"). Document alert recipients and escalation paths.
8. Estimate costs: calculate compute (CPU, memory), storage (data volume, retention), and licensing costs for the pipeline and visualization. Document assumptions and provide cost breakdown by component.

**Output:**
- `pipeline_design` object with fields: extract_strategy, transform_steps (array of step objects with name, input, output, logic, governance_controls), quality_check_integration, load_strategy, dependencies, dependency_graph, error_handling, monitoring_plan, alerting_thresholds, cost_estimate.

**Quality Gate:**
- The pipeline is acyclic (no circular dependencies).
- Every transform step has a clear input and output.
- Quality checks are integrated at appropriate points with defined failure responses.
- Error handling is defined for each step (retry count, abort conditions).
- Monitoring metrics are specific and measurable (e.g., "row count should be within 5% of previous run").
- Alerting thresholds are documented with rationale.
- Cost estimate is provided with assumptions and breakdown.
- The pipeline can be executed by an automated scheduler or manually by a data engineer.
- Governance controls (PII masking, access logging, audit trails) are integrated.
- Verified by: data engineer review, cost review by finance, governance team sign-off.

---

### Phase 6: SQL Query Development and Validation

**Entry Criteria:**
- Pipeline design is complete.
- Data sources and transformations are defined.

**Actions:**
1. Write SQL for each transform step in the pipeline. Start with the simplest queries (e.g., table scans, filters) and build up to complex aggregations and joins.
2. For each query, document: purpose, input tables, output columns, filters, aggregations, and any assumptions (e.g., "assumes no duplicate customer IDs").
3. Create automated test cases for each query: define sample input data, expected output, and edge cases. Document test results.
4. Test each query against sample data: verify row counts, check for nulls, validate calculations. Document expected results and actual results.
5. Optimize queries: review execution plans, add indexes if needed, refactor subqueries into CTEs for readability. Document optimization steps and performance improvements.
6. Handle edge cases: what happens if a join returns no matches? If a metric is null? If a dimension has unexpected values? Add COALESCE, CASE statements, or error handling as needed. Document edge case handling for each query.
7. Write the final aggregation query that answers the business question. Validate against the clarified question: does it produce the right metric, dimensions, and filters?
8. Document query dependencies: which queries must run before others? Create a dependency graph.
9. Set up automated regression testing: create a test suite that runs each query against known inputs and validates outputs. This catches regressions when source data or business rules change.

**Output:**
- `sql_queries` array with objects: query_name, purpose, input_tables, output_columns, sql_code, execution_plan, expected_row_count, edge_cases_handled, test_cases, test_results, optimization_notes, dependencies.

**Quality Gate:**
- Every query has been tested and produces expected results.
- Queries are readable and maintainable (use CTEs, meaningful aliases, comments).
- Edge cases are handled and documented (nulls, missing joins, unexpected values).
- The final query directly answers the business question and matches clarified question specification.
- Query performance is acceptable (execution time within SLA, resource usage reasonable).
- Automated test suite is created and all tests pass.
- Regression testing is set up and documented.
- Verified by: SQL code review, test execution, performance validation.

---

### Phase 7: Visualization and Metrics Design

**Entry Criteria:**
- SQL queries are validated and produce final results.
- Audience context is known.
- Governance requirements are understood.

**Actions:**
1. Review the query results: what patterns emerge? What is the shape of the data (e.g., time series, categorical distribution, correlation)?
2. Select visualization type(s) based on the data shape and business question: time series → line chart, comparison → bar chart, distribution → histogram, relationships → scatter plot, composition → pie/stacked bar, etc.
3. Define dimensions and measures for the visualization: which columns go on axes? Which are filtered or colored? Which are interactive?
4. Design interactivity: should users be able to filter by date range, category, or other dimensions? Should they drill down into detail? Document interaction flows.
5. Define metrics and KPIs: what summary numbers should be displayed? (e.g., total revenue, YoY growth, top 5 customers). Include context (benchmarks, targets, historical comparisons).
6. Consider the audience: what context or annotations do they need? (e.g., trend lines, benchmarks, explanatory text). Document audience-specific requirements.
7. Apply governance controls: ensure PII is masked or hidden. Implement row-level security if needed. Document access controls for the visualization.
8. Plan for refresh: how often should the visualization update? Should it be real-time, daily, or on-demand? Document refresh frequency and SLA.

**Output:**
- `visualization_spec` object with fields: visualization_type, dimensions, measures, filters, interactivity, metrics_kpis, annotations, refresh_frequency, audience_notes, governance_controls, access_restrictions.

**Quality Gate:**
- The visualization directly answers the business question.
- Visualization type is justified by data shape and analysis type (e.g., "line chart chosen for time series trend analysis").
- Interactivity is intuitive and doesn't overwhelm the user (no more than 5-7 filters).
- Metrics are clearly labeled and contextualized (include units, definitions, calculation method).
- Audience-specific requirements are met (e.g., executive dashboard is high-level with KPIs; analyst dashboard is detailed with drill-down).
- Governance controls are implemented (PII masked, access restricted, audit logging enabled).
- Refresh frequency meets SLA requirements.
- Verified by: audience review, governance team sign-off, usability testing if applicable.

---

### Phase 8: Documentation and Validation

**Entry Criteria:**
- All previous phases are complete.
- Solution artifacts (clarified question, pipeline design, SQL queries, visualization spec) are ready.
- Stakeholder sign-off has been obtained.

**Actions:**
1. Create a data lineage diagram or document: show how data flows from source systems through transforms to final visualization. Include quality checks at each step. Document data ownership and stewardship at each stage.
2. Document all assumptions made during the solution design: data freshness, null handling, business rule interpretations, etc. Include rationale for each assumption.
3. Write a maintenance guide: who owns the pipeline? How often should it be reviewed? What should be monitored? Include escalation contacts and procedures.
4. Define the refresh schedule: when does the pipeline run? When is the visualization updated? What is the SLA? Include backup and disaster recovery procedures.
5. Create a runbook for troubleshooting: if the pipeline fails, what are the common issues and how to resolve them? Include step-by-step recovery procedures.
6. Document the cost estimate: break down compute, storage, and licensing costs. Include assumptions and provide ROI analysis if applicable.
7. Record the "as-built" solution: document any deviations from the design (e.g., performance optimizations, workarounds). This becomes the source of truth for future maintenance.
8. Validate the complete solution with stakeholders: does it answer the business question? Are there any missing pieces? Obtain final sign-off.
9. Document limitations and caveats: what the solution does and does not cover. Include known data quality issues and their impact on results.

**Output:**
- `solution_documentation` string containing: executive summary, data lineage diagram, assumptions with rationale, maintenance guide, refresh schedule, troubleshooting runbook, cost estimate with ROI, as-built deviations, limitations and caveats, stakeholder sign-off.

**Quality Gate:**
- A new team member could understand and maintain the solution from the documentation alone.
- All assumptions are explicit and justified with rationale.
- Maintenance guide includes specific contacts, escalation procedures, and review frequency.
- Troubleshooting runbook includes at least 5 common failure scenarios with recovery steps.
- Cost estimate is detailed with assumptions and breakdown by component.
- As-built deviations are documented with dates and reasons.
- Stakeholders have reviewed and approved the solution (documented sign-off).
- The solution is maintainable and scalable (documented scaling considerations).
- Verified by: stakeholder review, data governance team review, technical review by data engineer.

---

## Exit Criteria

The skill is complete when:
1. The business question has been clarified and documented with explicit metrics, dimensions, and success criteria.
2. Stakeholder sign-off has been obtained on the clarified question and success criteria.
3. Data governance and compliance requirements have been assessed and documented.
4. All required data sources have been identified and validated for availability, quality, and governance compliance.
5. Data quality checks are designed and integrated into the pipeline with automated test cases.
6. The data pipeline is fully designed with extract, transform, and load steps, including error handling, monitoring, alerting, and cost estimation.
7. SQL queries are written, tested, optimized, and validated to answer the business question. Automated regression testing is set up.
8. Visualization specifications are designed for the target audience with governance controls implemented.
9. Complete solution documentation is provided, including data lineage, assumptions, maintenance guide, troubleshooting runbook, cost estimate, as-built deviations, and limitations.
10. Stakeholders have reviewed and approved the complete solution (documented sign-off).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Business question is ambiguous or unanswerable | **Adjust** -- Schedule clarification session with stakeholder. Document assumptions and proceed with best interpretation. |
| Phase 1 | Success criteria are subjective (e.g., "accurate") | **Adjust** -- Work with stakeholder to define measurable criteria (e.g., "within 5% of source system"). |
| Phase 1.5 | Stakeholder cannot be reached for sign-off | **Adjust** -- Document stakeholder contact attempts and proceed with documented assumptions. Flag for follow-up after Phase 2. |
| Phase 2 | PII or compliance requirements are unclear | **Adjust** -- Consult data governance team or compliance officer. Document guidance and apply conservatively (assume stricter requirements). |
| Phase 3 | Required data is not available | **Adjust** -- Identify alternative data sources or derived calculations. If no alternative exists, escalate to stakeholder for decision (proceed with proxy data or reframe question). |
| Phase 3 | Data sources have poor quality or unknown freshness | **Adjust** -- Add extra quality checks in Phase 4. Document data quality issues and their impact on results. |
| Phase 4 | Quality check thresholds are too strict (pipeline always fails) | **Adjust** -- Relax thresholds based on historical data quality. Document rationale and obtain stakeholder approval. |
| Phase 4 | Cost estimate exceeds budget | **Adjust** -- Optimize pipeline design (reduce refresh frequency, sample data instead of full load, use cheaper storage). Recalculate cost and present options to stakeholder. |
| Phase 5 | Pipeline design is too complex (>10 steps) | **Adjust** -- Break into sub-pipelines or simplify transforms. Consider whether all steps are necessary. Document simplifications. |
| Phase 6 | SQL query is too slow (execution time > SLA) | **Adjust** -- Optimize query (add indexes, refactor joins, use materialized views). If optimization fails, consider incremental refresh or sampling. |
| Phase 6 | Query produces unexpected results | **Retry** -- Debug query logic, validate assumptions, check data quality. Re-test against sample data. |
| Phase 6 | Automated test suite fails | **Retry** -- Review test cases and query logic. Determine if test is incorrect or query is incorrect. Fix and re-run. |
| Phase 7 | Visualization does not fit the data shape | **Adjust** -- Select alternative visualization type or break into multiple visualizations. |
| Phase 7 | Governance controls cannot be implemented in visualization tool | **Adjust** -- Implement controls at pipeline level (mask PII before loading to visualization tool) or use alternative tool. Document workaround. |
| Phase 8 | Stakeholder rejects solution | **Adjust** -- Gather specific feedback. Determine which phase needs revision (e.g., clarified question, pipeline design, visualization). Return to appropriate phase and iterate. Document feedback and changes. |
| Phase 8 | User rejects final output | **Targeted revision** -- ask which section fell short (question clarification, pipeline design, SQL query, visualization spec, or documentation) and rerun only that section. Do not restart the full solution. |

---

## Reference Section

### Domain Knowledge: Data Solution Design Principles

**Question Clarification Checklist:**
- What is the primary metric? (revenue, count, average, etc.)
- How should the metric be sliced? (by date, region, product, customer segment, etc.)
- What filters apply? (date range, specific categories, threshold values, etc.)
- What is the time period? (last 30 days, fiscal year, all time, etc.)
- What decision does this answer inform?
- What precision is required? (exact, approximate, order of magnitude)

**Data Governance Considerations:**
- **PII Identification:** Names, emails, phone numbers, SSNs, IP addresses, device IDs, location data, financial account numbers.
- **Handling Strategies:** Anonymization (remove identifiers), pseudonymization (replace with tokens), encryption (at rest and in transit), masking (show only last 4 digits), access restrictions (role-based).
- **Regulatory Compliance:** GDPR (EU), HIPAA (healthcare), CCPA (California), SOX (financial), PCI-DSS (payment cards). Document specific requirements for each regulation.
- **Data Residency:** Some regulations require data to stay in specific geographic regions. Document constraints.
- **Audit Logging:** Track who accessed what data, when, and for what purpose. Retain logs per regulatory requirements (typically 1-7 years).

**Data Quality Check Types:**
- **Null checks:** Identify missing values in critical columns.
- **Range checks:** Validate that numeric values fall within expected ranges (e.g., revenue > 0, age between 0 and 150).
- **Uniqueness checks:** Ensure primary keys and natural keys are unique.
- **Referential integrity checks:** Validate that foreign keys reference valid parent records.
- **Business rule checks:** Domain-specific validations (e.g., end_date >= start_date, status transitions are valid).
- **Consistency checks:** Validate that derived fields match calculations (e.g., total = sum of line items).
- **Freshness checks:** Ensure data is current (e.g., last update within 24 hours).
- **Format checks:** Validate data format (e.g., email matches pattern, phone number has correct length).

**Pipeline Design Patterns:**
- **Batch processing:** Scheduled runs (e.g., daily, hourly). Good for large volumes, lower cost. Latency is acceptable.
- **Incremental refresh:** Only process new/changed data since last run. Reduces processing time and cost.
- **Full refresh:** Reprocess all data each run. Simpler logic, higher cost, useful for small datasets or when incremental is complex.
- **Real-time streaming:** Continuous data ingestion and processing. High cost, low latency, needed for operational dashboards.
- **Hybrid:** Combine batch and streaming (e.g., batch for historical data, streaming for recent data).

**Visualization Best Practices:**
- **Time series:** Line chart (trends), area chart (composition over time).
- **Comparison:** Bar chart (categorical), bullet chart (vs. target).
- **Distribution:** Histogram, box plot, violin plot.
- **Relationships:** Scatter plot, bubble chart.
- **Composition:** Pie chart (parts of a whole), stacked bar (composition over time).
- **Geospatial:** Map with color coding or bubble size.
- **Interactivity:** Filters, drill-down, tooltips. Avoid overwhelming users with too many options (max 5-7 filters).
- **Accessibility:** Use colorblind-friendly palettes, include alt text, ensure readability at different zoom levels.

**Common Edge Cases:**
- **Null values:** Decide whether to exclude, impute, or flag. Document the choice and rationale.
- **Duplicate records:** Identify the cause (data quality issue or legitimate duplicates?) and handle accordingly.
- **Missing joins:** If a join returns no matches, should the record be excluded or included with nulls? Document decision.
- **Unexpected values:** Define how to handle values outside the expected range (e.g., negative revenue). Use CASE statements or error handling.
- **Slowly changing dimensions:** If a dimension (e.g., customer region) changes over time, which version should be used? Document versioning strategy.
- **Aggregation edge cases:** What happens if all values in a group are null? Return null or 0? Document decision.
- **Division by zero:** Handle in calculations (e.g., CASE WHEN denominator = 0 THEN NULL ELSE numerator / denominator END).
- **Timezone handling:** If data spans timezones, standardize to UTC and document conversion logic.

**Cost Estimation Framework:**
- **Compute costs:** CPU hours, memory usage, number of concurrent jobs. Estimate based on data volume and query complexity.
- **Storage costs:** Data volume (GB/TB), retention period, storage tier (hot, warm, cold). Include backup and disaster recovery storage.
- **Licensing costs:** Database licenses, visualization tool licenses, third-party data costs.
- **Labor costs:** Data engineer time for development and maintenance. Estimate hours per month.
- **Infrastructure costs:** Network bandwidth, cloud service fees, on-premises hardware depreciation.
- **ROI analysis:** Compare total cost to business value (e.g., revenue impact, cost savings, time saved).

**Automated Testing for SQL Queries:**
- **Unit tests:** Test individual query logic (e.g., filter, join, aggregation) with sample data.
- **Integration tests:** Test complete query pipeline with realistic data volumes.
- **Regression tests:** Run queries against known inputs and validate outputs. Catch regressions when source data or business rules change.
- **Performance tests:** Validate query execution time and resource usage meet SLA.
- **Edge case tests:** Test with null values, missing joins, unexpected values, boundary conditions.
- **Test framework:** Use tools like dbt, Great Expectations, or custom SQL test harnesses.

**Monitoring and Alerting:**
- **Metrics to track:** Row counts (should be stable or grow predictably), execution time (should be consistent), quality check results (pass/fail), data freshness (last update time).
- **Alerting thresholds:** Set based on historical baselines. Example: "alert if row count drops >20% from average" or "alert if execution time exceeds 2x average".
- **Alert recipients:** Data engineer (first responder), data owner (escalation), business stakeholder (if critical).
- **Escalation procedures:** Define response time (e.g., 1 hour for critical, 4 hours for warning) and escalation path.
- **Alert fatigue:** Avoid too many alerts. Focus on actionable alerts that indicate real problems.

---

## State Persistence (Optional)

If this solution is run repeatedly, consider tracking:
- **Historical quality metrics:** How has data quality trended over time? Are there patterns in failures?
- **Query performance:** How have execution times changed? Are there opportunities for optimization?
- **Stakeholder feedback:** What changes have been requested? What aspects of the solution are most valuable?
- **Data lineage changes:** When did source systems or schemas change? How did that impact the solution?
- **Cost trends:** How have compute, storage, and licensing costs changed? Are there cost optimization opportunities?
- **Reusable components:** Which transforms, quality checks, and queries can be reused for similar questions? Document for future solutions.

This information can inform future iterations and help identify systemic issues.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.