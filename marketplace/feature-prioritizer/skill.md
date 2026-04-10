# Feature Prioritizer

**One-line description:** Convert a product feature list into a prioritized quarterly roadmap using RICE scoring, dependency mapping, and resource estimation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `features`: array of objects (required)
  - Each object: `{ name: string, description: string, estimated_effort_days: number, owner_team: string }`
  - Minimum 1 feature; no maximum.
  - Constraint: Feature names must be unique (case-insensitive).

- `rice_parameters`: object (required)
  - Structure: `{ [feature_name]: { reach: number (>0), impact: number (1-3), confidence: number (0-1) } }`
  - If not provided, skill will request stakeholder input via explicit prompt.
  - Confidence < 0.6 triggers a discovery phase recommendation (see Phase 2).

- `planning_horizon_quarters`: number (optional, default: 4)
  - Number of quarters to plan across (minimum 1, maximum 8).

- `resource_constraints`: object (optional)
  - Structure: `{ [team_name]: { capacity_days_per_quarter: number, non_feature_allocation_percent: number } }`
  - `non_feature_allocation_percent`: percentage of capacity reserved for maintenance, bugs, technical debt (default: 20%).
  - If omitted, assumes unlimited capacity and 20% non-feature allocation.

- `output_format`: string (optional, default: "json")
  - Allowed: "json", "markdown", "csv"

- `stakeholder_approval`: boolean (optional, default: false)
  - If true, skill will validate that feature list and RICE parameters are approved by product and engineering leadership before proceeding.

---

## Outputs

- `prioritized_features`: array of objects
  - Each: `{ name, description, rice_score, rank, assigned_quarter, dependencies, resource_estimate, confidence_flag }`
  - Sorted by RICE score (descending).
  - `confidence_flag`: true if Confidence < 0.6 (indicates discovery phase needed).

- `quarterly_roadmap`: object
  - Structure: `{ Q1: [...], Q2: [...], Q3: [...], Q4: [...] }`
  - Each quarter contains assigned features with start_date, end_date, team_assignment, and effort_days.
  - Deferred features appear in a `backlog` key with reason for deferral.

- `dependency_graph`: object
  - Structure: `{ [feature_name]: { blocks: [...], blocked_by: [...], dependency_type: "hard" | "soft" } }`
  - Shows blocking relationships with type classification.

- `resource_summary`: object
  - Structure: `{ [team_name]: { total_allocated_days, capacity_days_per_quarter, non_feature_days, available_feature_days, utilization_percent, over_allocated: boolean } }`
  - Per-team capacity analysis with explicit over-allocation flag.

- `risk_register`: array of objects
  - Each: `{ feature_name, risk_type: "technical" | "dependency" | "resource" | "confidence", description, mitigation_strategy, severity: "low" | "medium" | "high" }`
  - Identifies risks and recommends mitigation (e.g., start high-risk features early, allocate senior engineers).

- `roadmap_document`: string
  - Formatted roadmap in requested output_format (JSON, markdown, or CSV).
  - Includes summary statistics and assumptions.

- `execution_state`: object
  - Structure: `{ phase_completed: number, features_processed: number, errors_encountered: array, timestamp: string }`
  - Enables resumption if skill is interrupted.

---

## Execution Phases

### Phase 0: Validate Stakeholder Alignment (Optional)

**Entry Criteria:**
- `stakeholder_approval` is true.
- `features` array is provided.
- `rice_parameters` are available or will be gathered.

**Actions:**
1. If `stakeholder_approval` is true, prompt for explicit confirmation: "Do product and engineering leadership agree that this feature list reflects current business priorities?" (yes/no).
2. If no, abort and request stakeholder alignment before proceeding.
3. If yes, prompt for RICE parameter agreement: "Do stakeholders agree on the Reach, Impact, and Confidence estimates for each feature?" (yes/no).
4. If no, request revised RICE parameters and re-confirm.
5. Document approval timestamp and approver names (if available).

**Output:**
- `stakeholder_approval_record`: object with timestamp, approvers, and confirmation status.

**Quality Gate:**
- Stakeholder approval is explicitly confirmed (yes/no answer recorded).
- If approval is not obtained, skill aborts with clear message.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Stakeholder approval not obtained | **Abort** -- request stakeholder alignment before proceeding. Provide template for stakeholder sign-off. |
| RICE parameters not agreed upon | **Adjust** -- request revised parameters and re-confirm. Document disagreement and resolution. |

---

### Phase 1: Validate and Normalize Feature List

**Entry Criteria:**
- `features` array is provided and non-empty.
- Each feature has at least `name`, `description`, and `estimated_effort_days`.
- Stakeholder approval (if required) is obtained.

**Actions:**
1. Check for duplicate feature names (case-insensitive); if found, merge or request user to rename. Merge logic: combine descriptions, use maximum effort estimate, flag for review.
2. Validate that `estimated_effort_days` is a positive number (>0); if not, reject and request correction.
3. Validate that `owner_team` is present; if missing, assign to "Unassigned" and flag for review.
4. Normalize all text fields: trim whitespace, convert names to Title Case, descriptions to sentence case.
5. Validate that all feature names referenced in dependencies (Phase 4) exist in the feature list.
6. Output validated feature list with flags for any issues.

**Output:**
- `validated_features`: array of normalized feature objects with `validation_flags` array (empty if no issues).
- `validation_report`: object with counts of duplicates merged, missing fields assigned, normalization applied.

**Quality Gate:**
- No duplicate feature names remain (merged or renamed).
- All numeric fields are positive numbers.
- All features have an owner team (assigned or specified).
- All features have non-empty descriptions.
- Validation report is complete and accurate.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Duplicate feature names | **Adjust** -- merge duplicates by combining descriptions and using maximum effort estimate. Document merge decision in validation_report. |
| Missing effort estimate | **Adjust** -- use default estimate (5 days) and flag for review. Log warning with feature name. |
| Invalid effort value (negative or zero) | **Abort** -- request correction. Provide error message: "Feature [name] has invalid effort estimate: [value]. Must be > 0." |
| Missing owner_team | **Adjust** -- assign to "Unassigned" and flag for review. |

---

### Phase 2: Gather and Validate RICE Parameters

**Entry Criteria:**
- Validated feature list from Phase 1.
- `rice_parameters` input provided or will be requested.

**Actions:**
1. If `rice_parameters` not provided, prompt user with structured form: for each feature, request Reach (number of users affected, >0), Impact (1=minimal, 2=medium, 3=major), and Confidence (0-1, where 1=certain). Provide guidance: "Reach: estimated number of users affected. Impact: magnitude of effect on each user. Confidence: certainty of estimates (0=guess, 1=certain)."
2. Validate that Reach > 0, Impact in [1, 2, 3], Confidence in [0, 1]. If invalid, reject and request correction.
3. For any missing parameters, use defaults: Reach = 100, Impact = 2, Confidence = 0.8. Log warning for each default used.
4. Identify features with Confidence < 0.6 and flag for discovery phase (see output `confidence_flag`).
5. Attach RICE parameters to each feature.

**Output:**
- `features_with_rice`: array of feature objects with R, I, C, E fields.
- `discovery_phase_candidates`: array of features with Confidence < 0.6 and recommendation to conduct discovery/spike before full development.
- `rice_validation_report`: object with counts of defaults used, confidence flags, and assumptions.

**Quality Gate:**
- All RICE parameters are numeric and within valid ranges.
- No feature lacks a complete RICE tuple.
- Confidence < 0.6 features are flagged and discovery phase is recommended.
- All defaults used are logged with feature names.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| RICE parameters not provided | **Adjust** -- prompt user with structured form. Provide examples and guidance. |
| Invalid RICE values (e.g., Confidence > 1, Impact = 0) | **Adjust** -- clamp to valid range and log warning. Example: Confidence = 1.2 becomes Confidence = 1.0. |
| Reach = 0 or negative | **Abort** -- request correction. Reach must be > 0. |
| Missing parameters for some features | **Adjust** -- use defaults (Reach=100, Impact=2, Confidence=0.8) and log warning for each. |

---

### Phase 3: Calculate RICE Scores and Rank

**Entry Criteria:**
- Features with complete RICE parameters from Phase 2.

**Actions:**
1. For each feature, calculate: `RICE_score = (Reach × Impact × Confidence) / Effort`. Ensure Effort > 0 (validated in Phase 1).
2. Sort features by RICE_score in descending order (highest priority first).
3. Assign rank (1 = highest priority). For ties (identical RICE_score), maintain original order as tiebreaker and note in output.
4. Flag any features with RICE_score < 1 (low priority) and RICE_score >= 100 (high priority) for visibility.
5. Output ranked features with RICE_score, rank, and priority flags.

**Output:**
- `ranked_features`: array sorted by RICE_score (descending) with rank field and priority_flag ("high", "medium", "low").
- `ranking_report`: object with counts of high/medium/low priority features and tiebreaker notes.

**Quality Gate:**
- All RICE scores are calculated and non-negative.
- Ranking is deterministic and reproducible (tiebreaker logic documented).
- All features are assigned a rank.
- Priority flags are accurate (RICE_score >= 100 = high, 1-99 = medium, < 1 = low).

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Division by zero (Effort = 0) | **Abort** -- should not occur (Phase 1 validates Effort > 0). If encountered, report as data integrity error. |
| Multiple features with identical RICE score | **Adjust** -- maintain original order as tiebreaker. Document tiebreaker in ranking_report. |
| RICE_score is NaN or Infinity | **Abort** -- report data integrity error. Check for invalid RICE parameters. |

---

### Phase 4: Identify and Resolve Dependencies

**Entry Criteria:**
- Ranked feature list from Phase 3.

**Actions:**
1. Request or infer dependency relationships: for each feature, identify which other features must be completed first (hard dependencies) or would benefit from prior completion (soft dependencies). Provide structured form: "Feature [name]: Does this feature depend on any other features? (hard: must complete first, soft: benefits from prior completion)"
2. For each dependency, classify as "hard" (blocking) or "soft" (beneficial but not blocking).
3. Build a dependency graph: `{ feature_name: { blocks: [...], blocked_by: [...], dependency_type: "hard" | "soft" } }`.
4. Detect circular dependencies using depth-first search; if found, report circular chain and abort (see error handling).
5. Topologically sort features to identify critical path (longest chain of hard dependencies).
6. Offer dependency resolution: for each hard dependency, ask user if dependency can be eliminated through parallel work, API contracts, or feature decomposition. If yes, update dependency graph and re-sort.
7. Output dependency graph and critical path.

**Output:**
- `dependency_graph`: object mapping features to dependencies with type classification.
- `critical_path`: array of features forming the longest hard dependency chain (ordered).
- `critical_path_length_days`: sum of effort_days for features in critical path.
- `dependency_resolution_notes`: array of user decisions to eliminate or modify dependencies.

**Quality Gate:**
- No circular dependencies exist (verified by topological sort).
- All referenced features in dependencies are in the feature list.
- All hard dependencies are documented.
- Critical path is calculated and documented.
- Dependency resolution is offered and documented.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Circular dependency detected | **Abort** -- report circular dependency chain (e.g., "A → B → C → A"). Request user to clarify or remove one dependency to break the cycle. |
| Dependency references non-existent feature | **Adjust** -- remove invalid dependency and log warning. Example: "Feature X depends on Feature Y, which does not exist. Removing dependency." |
| No dependencies provided | **Adjust** -- assume no dependencies and proceed. Log note: "No dependencies specified; assuming all features can be developed in parallel." |
| User declines dependency resolution | **Adjust** -- proceed with original dependency graph. Document user decision. |

---

### Phase 5: Estimate Resource Requirements and Identify Risks

**Entry Criteria:**
- Ranked features with dependencies from Phase 4.
- Optional `resource_constraints` input.

**Actions:**
1. For each feature, confirm `estimated_effort_days` and `owner_team` (from Phase 1).
2. If `resource_constraints` provided, extract team capacity per quarter and non-feature allocation percentage (default 20%). Calculate available feature capacity: `available_feature_days = capacity_days_per_quarter × (1 - non_feature_allocation_percent / 100)`.
3. If `resource_constraints` not provided, assume unlimited capacity and 20% non-feature allocation. Log assumption.
4. Calculate total effort per team across all features. Flag any team with total effort > available capacity × planning_horizon_quarters (over-allocation).
5. Identify risks for each feature: (a) Technical risk: features with low Confidence (< 0.6) or high effort (> 20 days); (b) Dependency risk: features with many blocking dependencies or in critical path; (c) Resource risk: features assigned to over-allocated teams; (d) Confidence risk: features with Confidence < 0.6.
6. For each risk, recommend mitigation: start high-risk features early, allocate senior engineers, conduct discovery phase for low-confidence features, parallelize dependencies where possible.
7. Attach resource estimate and risk flags to each feature.

**Output:**
- `features_with_resources`: array with effort, team assignments, and risk flags.
- `capacity_analysis`: per-team summary of total effort vs. available capacity per quarter, with over-allocation flag.
- `risk_register`: array of objects with feature_name, risk_type, description, mitigation_strategy, severity.
- `resource_planning_report`: object with team utilization summary and recommendations.

**Quality Gate:**
- All effort estimates are positive numbers.
- All teams referenced in features are in resource_constraints (or capacity is assumed unlimited and logged).
- Over-allocation is flagged and documented.
- Risk register is complete (at least one risk per high-risk feature).
- Mitigation strategies are specific and actionable.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Team capacity undefined | **Adjust** -- assume unlimited capacity and 20% non-feature allocation. Log assumption with team name. |
| Team capacity is zero or negative | **Abort** -- request correction. Capacity must be > 0. |
| Feature effort exceeds team capacity in any quarter | **Adjust** -- flag as over-allocated and note in capacity_analysis. Proceed to Phase 6 for allocation strategy. |
| No risks identified for any feature | **Adjust** -- proceed. Log note: "No significant risks identified." |

---

### Phase 6: Allocate Features to Quarters

**Entry Criteria:**
- Ranked features with dependencies and resource estimates from Phase 5.
- `planning_horizon_quarters` specified (default 4).
- Resource constraints and capacity analysis from Phase 5.

**Actions:**
1. Initialize quarterly buckets: Q1, Q2, ..., Qn (where n = planning_horizon_quarters). For each quarter, initialize team capacity tracking.
2. Iterate through ranked features in priority order (by RICE_score):
   a. Check if all hard blocking dependencies are scheduled in earlier quarters. If not, defer feature to earliest quarter where all dependencies are complete.
   b. Check if owner team has available capacity in the earliest available quarter (considering non-feature allocation). If yes, assign feature to that quarter; update team capacity.
   c. If no capacity in any quarter within planning horizon, defer feature to "backlog" with reason: "Team [team_name] capacity exhausted. Recommend extending planning horizon or re-prioritizing lower-priority features."
   d. For each assigned feature, calculate estimated start and end dates within assigned quarter (assuming linear progress).
3. For features deferred to backlog, offer re-prioritization: "Feature [name] cannot fit in planning horizon. Options: (a) extend planning horizon, (b) reduce effort estimate, (c) reassign to different team, (d) defer to backlog."
4. Resolve conflicts: if a high-priority feature (RICE_score >= 100) cannot fit due to capacity, recommend re-prioritizing lower-priority features (RICE_score < 10) or splitting effort across quarters.
5. Output quarterly roadmap with assignments, dates, and team allocations.

**Output:**
- `quarterly_roadmap`: object with Q1, Q2, ... keys, each containing assigned features with name, start_date, end_date, team_assignment, effort_days, and dependencies.
- `backlog`: array of deferred features with reason for deferral and recommendation for resolution.
- `allocation_notes`: array of decisions made (e.g., "Feature X deferred due to team capacity", "Feature Y split across Q2 and Q3").
- `capacity_utilization_by_quarter`: object with per-team utilization percentage for each quarter.

**Quality Gate:**
- All features are assigned to a quarter or explicitly deferred with documented reason.
- No feature is assigned to a quarter before its hard dependencies are complete.
- No team exceeds available capacity in any quarter (or over-allocation is documented with recommendation).
- All deferred features have a clear reason and mitigation recommendation.
- Allocation notes are complete and specific.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Feature cannot fit in any quarter (capacity exhausted) | **Adjust** -- defer feature to "backlog" with reason. Recommend: extend planning horizon, reduce effort, reassign team, or re-prioritize. Document recommendation. |
| Planning horizon too short for critical path | **Adjust** -- extend planning horizon and note recommendation. Example: "Critical path requires 6 quarters; extending planning horizon from 4 to 6." |
| High-priority feature blocked by low-priority feature | **Adjust** -- recommend re-prioritizing lower-priority feature or parallelizing work. Document recommendation. |
| Team assigned to multiple features in same quarter (context switching) | **Adjust** -- note in allocation_notes. Recommend: reduce effort estimate, extend timeline, or reassign to different team. |

---

### Phase 7: Generate Roadmap Document and Risk Summary

**Entry Criteria:**
- Quarterly roadmap from Phase 6.
- Risk register from Phase 5.
- `output_format` specified (default "json").

**Actions:**
1. Format the roadmap according to `output_format`:
   - **JSON**: Structured object with quarters, features, dependencies, resource summary, risk register, and assumptions.
   - **Markdown**: Human-readable table with quarters, features, effort, team, dependencies, and risk flags. Include summary section with statistics and assumptions.
   - **CSV**: Flat table with columns: Feature, Quarter, Team, Effort_Days, Start_Date, End_Date, Dependencies, RICE_Score, Risk_Flags.
2. Include summary statistics: total features, total effort, team utilization by quarter, critical path length, high/medium/low risk count.
3. Include assumptions section: non-feature allocation percentage, capacity constraints, default RICE parameters used, dependencies resolved, planning horizon.
4. Include risk summary: high-risk features, recommended mitigation strategies, critical path risks.
5. Validate output format: ensure JSON is parseable, markdown is valid, CSV has correct columns.

**Output:**
- `roadmap_document`: formatted string (JSON, markdown, or CSV).
- `resource_summary`: object with per-team utilization metrics for each quarter.
- `roadmap_metadata`: object with generation timestamp, input parameters, and assumptions.

**Quality Gate:**
- Output is valid in the requested format (parseable JSON, valid markdown, valid CSV).
- All features from the input appear in the output (assigned or deferred).
- Summary statistics are accurate and match the quarterly roadmap.
- Assumptions section is complete and specific.
- Risk summary is included and actionable.

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Output format not recognized | **Abort** -- request valid format (json, markdown, csv). Provide error message: "Invalid output_format: [value]. Allowed: json, markdown, csv." |
| Generated JSON is not parseable | **Abort** -- report as internal error. Check for unescaped characters or malformed structure. |
| Generated markdown has syntax errors | **Adjust** -- fix syntax and log warning. Example: "Markdown table had unescaped pipe characters; fixed." |
| Generated CSV has missing columns | **Abort** -- report as internal error. Ensure all required columns are present. |

---

## Exit Criteria

The skill is complete when:
1. All features from the input are assigned to a specific quarter with start/end dates and team assignment, OR explicitly deferred to backlog with documented reason (e.g., "Team capacity exhausted in all quarters") and specific mitigation recommendation (e.g., "Extend planning horizon to Q6").
2. No feature is scheduled to start before all its hard dependencies are complete.
3. No team exceeds available capacity (capacity_days_per_quarter × (1 - non_feature_allocation_percent / 100)) in any quarter. If over-allocation exists, it is documented with specific recommendation (e.g., "Team X over-allocated by 15 days in Q2; recommend reassigning Feature Y to Team Z").
4. A roadmap document is generated in the requested format and is valid (parseable JSON, valid markdown, valid CSV).
5. Resource summary and dependency graph are provided with accurate utilization metrics and dependency relationships.
6. Risk register is complete with at least one risk per high-risk feature (Confidence < 0.6 or effort > 20 days) and specific mitigation strategies.
7. Execution state is recorded for potential resumption.

## State Persistence

The skill maintains execution state to enable resumption if interrupted:

- `execution_state`: object with `phase_completed` (0-7), `features_processed` (count), `errors_encountered` (array), `timestamp` (ISO 8601).
- After each phase, execution_state is updated with phase number and timestamp.
- If skill is interrupted, resume from `phase_completed + 1` using outputs from previous phases.
- All intermediate outputs (validated_features, ranked_features, dependency_graph, etc.) are preserved for resumption.

---

## Error Handling Summary

| Phase | Failure Mode | Response |
|---|---|---|
| 0 | Stakeholder approval not obtained | **Abort** -- request stakeholder alignment before proceeding. |
| 1 | Duplicate feature names | **Adjust** -- merge duplicates and document merge decision. |
| 1 | Missing effort estimate | **Adjust** -- use default (5 days) and flag for review. |
| 1 | Invalid effort value (negative or zero) | **Abort** -- request correction. |
| 2 | RICE parameters not provided | **Adjust** -- prompt user with structured form. |
| 2 | Invalid RICE values | **Adjust** -- clamp to valid range and log warning. |
| 2 | Reach = 0 or negative | **Abort** -- request correction. |
| 3 | Multiple features with identical RICE score | **Adjust** -- maintain original order as tiebreaker. |
| 4 | Circular dependency detected | **Abort** -- report circular chain and request clarification. |
| 4 | Dependency references non-existent feature | **Adjust** -- remove invalid dependency and log warning. |
| 5 | Team capacity undefined | **Adjust** -- assume unlimited capacity and log assumption. |
| 5 | Team capacity is zero or negative | **Abort** -- request correction. |
| 6 | Feature cannot fit in any quarter | **Adjust** -- defer to backlog with recommendation. |
| 6 | Planning horizon too short for critical path | **Adjust** -- extend planning horizon and note recommendation. |
| 7 | Output format not recognized | **Abort** -- request valid format. |
| 7 | Generated output is invalid | **Abort** -- report as internal error. |
| 7 | User rejects final output | **Targeted revision** -- ask which feature's ranking, quarter assignment, or risk assessment fell short and rerun only that feature's Phase 2-6. Do not re-prioritize the full backlog. |

---

## Reference Section

### RICE Scoring Methodology

**RICE = (Reach × Impact × Confidence) / Effort**

- **Reach**: Number of users/customers affected (e.g., 1000, 10000). Must be > 0.
- **Impact**: Magnitude of effect on each user (1=minimal, 2=medium, 3=major).
- **Confidence**: Certainty of estimates (0.0 to 1.0; 1.0 = certain). Confidence < 0.6 indicates need for discovery phase.
- **Effort**: Estimated work in person-days. Must be > 0.

**Interpretation:**
- RICE >= 100: High priority, pursue immediately.
- RICE 1-99: Medium priority, schedule in current or next quarter.
- RICE < 1: Low priority, consider deferring or combining with other work.

### Dependency Types

- **Hard dependency**: Feature B cannot start until Feature A is complete. Hard dependencies block scheduling.
- **Soft dependency**: Feature B benefits from Feature A but can proceed in parallel with risk. Soft dependencies do not block scheduling but should be considered for optimal sequencing.
- **Resource dependency**: Feature B requires the same team as Feature A; sequence to avoid context switching and improve efficiency.

### Resource Estimation Best Practices

- Include design, development, testing, and deployment time.
- Add 20% buffer for unknowns (included in estimated_effort_days).
- Account for team context-switching costs if multiple features are in progress (consider soft dependencies).
- Review estimates with the owning team before finalizing.
- Reserve 10-20% capacity for bug fixes and urgent requests (non_feature_allocation_percent).

### Quarterly Planning Assumptions

- Each quarter = ~13 weeks = ~65 working days per full-time person.
- Adjust for holidays, planned time off, and non-project work.
- Reserve 10-20% capacity for bug fixes and urgent requests (default: 20%).
- Critical path length determines minimum planning horizon required.

### Risk Mitigation Strategies

- **High-confidence features (Confidence >= 0.8)**: Schedule normally; low risk.
- **Medium-confidence features (0.6 <= Confidence < 0.8)**: Schedule with senior engineer oversight; monitor progress.
- **Low-confidence features (Confidence < 0.6)**: Conduct discovery/spike phase (1-2 weeks) before full development; allocate senior engineers; start early to allow for learning.
- **High-effort features (> 20 days)**: Break into smaller milestones; allocate senior engineers; start early; monitor progress closely.
- **Critical path features**: Start early; allocate senior engineers; monitor dependencies closely; have contingency plan if blocked.
- **Over-allocated teams**: Recommend re-prioritizing lower-priority features, extending planning horizon, or reassigning to different team.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.