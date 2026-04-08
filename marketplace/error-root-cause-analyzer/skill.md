# Error Root Cause Analyzer

**One-line description:** Analyze error logs and stack traces to identify root cause patterns, suggest fixes ranked by likelihood, and generate monitoring alerts.

**Execution Pattern:** Phase Pipeline with conditional branching

---

## Inputs

- `error_logs` (string or array of strings, required) -- Raw error log file path(s), log stream, or log content as text. Supports JSON, syslog, plain text, or structured formats. Also accepts log aggregation platform URLs (Datadog, Splunk, ELK Stack) with authentication credentials.
- `log_format` (string, optional, default: "auto") -- Expected log format: "json", "syslog", "plain", "datadog", "splunk", "elk", or "auto" for automatic detection.
- `time_window` (string, optional, default: "24h") -- Time range to analyze (e.g., "24h", "7d", "1h"). Logs outside this window are excluded.
- `clustering_threshold` (number, optional, default: 0.85) -- Similarity threshold (0-1) for grouping errors into clusters. Higher = stricter grouping. Recommended range: 0.75-0.95.
- `min_error_frequency` (number, optional, default: 2) -- Minimum error occurrence count to include in analysis. Filters out one-off errors. Must be >= 1.
- `domain_context` (string, optional) -- Domain-specific knowledge (e.g., "microservices", "database", "frontend", "api_gateway", "message_queue") to guide root cause inference. If provided, domain-specific heuristics are applied.
- `known_issues` (array of objects, optional) -- Previously identified issues with structure: [{error_signature (string), root_cause (string), fix_applied (string), resolution_verified (boolean)}]. Used to accelerate pattern matching and validate fix effectiveness.

---

## Outputs

- `root_causes` (array of objects) -- Identified root cause patterns, each with: {id (string), description (string), error_signatures (array of strings), frequency (number), likelihood (0-1), affected_services (array of strings), first_occurrence (ISO 8601 timestamp), last_occurrence (ISO 8601 timestamp), confidence_level ("high"|"medium"|"low"), evidence (array of strings), requires_manual_review (boolean)}
- `fix_suggestions` (array of objects) -- Ranked fixes, each with: {root_cause_id (string), fix_description (string), likelihood_of_resolution (0-1), estimated_effort ("low"|"medium"|"high"), risk_level ("low"|"medium"|"high"), affected_error_count (number), priority_rank (number), mitigation_notes (string, present if risk_level is "high"), implementation_steps (array of strings)}
- `alert_definitions` (array of objects) -- Alert configurations, each with: {root_cause_id (string), alert_name (string), trigger_condition (string), severity ("info"|"warning"|"critical"), frequency_threshold (number), time_window (string), notification_channels (array of strings), runbook_url (string), alert_description (string), false_positive_rate_estimate (number, 0-1)}
- `analysis_report` (string) -- Human-readable summary report in markdown format with: executive summary, root cause findings with evidence, fix recommendations ranked by priority, alert configuration, confidence assessment, next steps, and caveats.
- `analysis_metadata` (object) -- {total_errors_analyzed (number), unique_error_types (number), clusters_identified (number), root_causes_identified (number), fixes_suggested (number), alerts_defined (number), analysis_duration_seconds (number), logs_processed_count (number), confidence_assessment ("high"|"medium"|"low"), high_confidence_root_causes (number), medium_confidence_root_causes (number), low_confidence_root_causes (number)}

---

## Execution Phases

### Phase 1: Collect and Parse Logs

**Entry Criteria:**
- `error_logs` input is provided and accessible (file path, stream, or API endpoint)
- `log_format` is specified or set to "auto"
- If using log aggregation platform, authentication credentials are valid

**Actions:**
1. Determine input type: file path, stream, or log aggregation platform URL
2. If log aggregation platform (Datadog/Splunk/ELK), authenticate and query logs for `time_window`; if file/stream, read content
3. Detect log format if `log_format` is "auto"; validate against known formats (JSON, syslog, plain text, Datadog JSON, Splunk JSON, ELK JSON)
4. Parse each log entry into structured fields: timestamp (ISO 8601), severity (DEBUG|INFO|WARN|ERROR|CRITICAL), error_type (exception class or error code), message (error description), stack_trace (if present), service (service name or application), environment (prod|staging|dev), request_id (correlation ID if present), user_id (if present), version (service version if present)
5. Filter logs by `time_window`: discard entries outside the specified range; validate timestamp format
6. Validate parsed entries: check that timestamp, error_type, and message are non-empty; flag malformed entries and count them
7. Output structured log entries with metadata (total count, format detected, malformed count, time range actual)

**Output:**
- `parsed_logs` (array of objects) -- Structured log entries with normalized fields
- `parse_metadata` (object) -- {format_detected (string), total_entries (number), valid_entries (number), malformed_entries (number), time_range_actual (string), source_type ("file"|"stream"|"api")}

**Quality Gate:**
- At least 80% of log entries parsed successfully; if <80%, phase continues but output is flagged as "partial_data"
- All parsed entries have non-empty timestamp, error_type, and message fields
- Timestamp values are valid ISO 8601 format and within `time_window`
- Malformed entry count is logged and reported

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Log file not found or unreadable | **Abort** -- return error message with file path; ask user to verify path and permissions; suggest checking file encoding (UTF-8 expected) |
| Log aggregation API authentication fails | **Abort** -- return error message with API endpoint; ask user to verify credentials and API access |
| Unrecognized log format | **Adjust** -- attempt plain-text line-by-line parsing; flag entries that could not be structured; continue with partial data; note format in output |
| Malformed timestamps | **Adjust** -- skip entries with invalid timestamps; log count of skipped entries; continue with remaining data |
| Empty log input | **Abort** -- return error; no logs to analyze |
| Log file exceeds size limit (>1GB) | **Adjust** -- process in chunks; analyze most recent chunk first; note in output |

---

### Phase 2: Extract and Normalize Stack Traces

**Entry Criteria:**
- `parsed_logs` from Phase 1 contains at least one entry with a stack trace
- Log entries have been validated and contain at least 80% valid data

**Actions:**
1. Identify entries containing stack traces: multi-line text, contains file paths and line numbers, contains function/method names
2. Detect programming language from stack trace format: Python (traceback, .py files), Java (Exception at, .java files), JavaScript (at function, .js files), Go (goroutine, .go files), C# (.NET, .cs files), Ruby (.rb files), PHP (.php files), or other
3. For each stack trace, parse into normalized structure: [{frame_number (integer), file_path (string), function_name (string), line_number (integer), code_context (string, if available)}]
4. Extract call hierarchy: order functions from outermost (frame 0) to innermost (last frame)
5. Normalize file paths: remove absolute paths, extract relative paths or module names; convert to forward slashes for consistency
6. Handle truncated or incomplete stack traces: mark confidence level as "partial" if fewer than 3 frames; include available frames
7. Handle language-specific variations: Java nested exceptions, Python exception chains, JavaScript async stack traces
8. Link stack traces back to their parent log entries by log entry ID

**Output:**
- `normalized_traces` (array of objects) -- Normalized stack traces with structure: {log_entry_id (string), language_detected (string), frames (array of frame objects), call_hierarchy (array of function names), confidence_level ("complete"|"partial"), frame_count (number)}
- `trace_metadata` (object) -- {languages_detected (array of strings), total_traces (number), complete_traces (number), partial_traces (number), languages_by_frequency (object)}

**Quality Gate:**
- All stack traces are parsed into at least 2 frames (function + file); if <2 frames, mark as "unparseable"
- Call hierarchy is correctly ordered (outermost to innermost); verified by frame numbers
- File paths are normalized and comparable across entries (no absolute paths)
- Language detection is accurate (verified by file extension and syntax patterns)

**Error Handling:**
| Failure Mode | Response |
|---|---|
| No stack traces found in logs | **Adjust** -- continue analysis using error messages and error types only; note that root cause inference will be less precise; flag in output as "stack_trace_unavailable" |
| Unrecognized stack trace format (new language or custom format) | **Adjust** -- attempt generic line-by-line parsing; mark confidence as "low"; include partial frames; suggest manual review |
| Truncated stack traces (incomplete due to log truncation) | **Adjust** -- include partial traces with confidence flag "partial"; note in output; use available frames for analysis |
| Nested or chained exceptions (Java, Python) | **Adjust** -- parse all exception frames; link them in call hierarchy; treat as single logical stack trace |
| Async stack traces (JavaScript, Go) | **Adjust** -- parse all async frames; mark as "async_trace"; note in output |

---

### Phase 3: Cluster Similar Errors

**Entry Criteria:**
- `parsed_logs` and `normalized_traces` are available
- `clustering_threshold` and `min_error_frequency` are set and valid (0 < threshold <= 1, frequency >= 1)

**Actions:**
1. Extract error signature from each log entry: tuple of (error_type, top 3 stack frames if available, affected service, affected environment)
2. For entries without stack traces, use: (error_type, error message prefix [first 50 chars], affected service, affected environment)
3. Calculate similarity between error signatures using: if stack traces available, use frame-by-frame comparison (Levenshtein distance on frame strings); if no stack traces, use string similarity on error messages (Levenshtein distance or semantic similarity via embeddings if available)
4. Build similarity matrix: for each pair of signatures, compute similarity score (0-1)
5. Group errors into clusters where similarity >= `clustering_threshold` using hierarchical clustering or DBSCAN
6. Filter clusters: exclude clusters with fewer than `min_error_frequency` errors
7. For each cluster, compute: frequency (error count), temporal distribution (first/last occurrence, trend over time), affected services/components (array), affected versions/environments (array), sample errors (2-3 representative entries)
8. Assign cluster IDs (e.g., "CLUSTER_001") and rank by frequency (descending)
9. If clustering produces >100 clusters, increase `clustering_threshold` by 0.05 and re-cluster; note adjustment in output

**Output:**
- `error_clusters` (array of objects) -- Clustered errors, each with: {cluster_id (string), error_signature (string), frequency (number), first_occurrence (ISO 8601 timestamp), last_occurrence (ISO 8601 timestamp), trend ("increasing"|"decreasing"|"stable"), trend_percentage (number, % change over time), affected_services (array of strings), affected_versions (array of strings), affected_environments (array of strings), sample_errors (array of 2-3 log entry objects), cluster_confidence ("high"|"medium"|"low")}
- `clustering_metadata` (object) -- {total_clusters (number), errors_clustered (number), errors_excluded_by_frequency (number), clustering_threshold_used (number), clustering_algorithm (string), threshold_adjustments (number)}

**Quality Gate:**
- Each cluster contains at least `min_error_frequency` errors; verified by frequency count
- Cluster signatures are distinct: no two clusters have identical signatures; verified by signature comparison
- Temporal data (first/last occurrence) is accurate and within `time_window`; verified by timestamp validation
- Cluster confidence is justified: "high" if >10 errors and consistent signature, "medium" if 5-10 errors, "low" if exactly `min_error_frequency` errors

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Clustering produces too many clusters (>100) | **Adjust** -- increase `clustering_threshold` by 0.05 and re-cluster; repeat until clusters <= 100; note all adjustments in output |
| All errors are unique (no clusters formed) | **Adjust** -- lower `clustering_threshold` by 0.1 and re-cluster; if still no clusters, treat each error as a singleton cluster; note in output |
| Insufficient data for clustering (<10 errors) | **Adjust** -- proceed with individual error analysis; note that pattern detection will be limited; flag in output |
| Clustering algorithm fails to converge | **Adjust** -- use simpler algorithm (e.g., single-linkage clustering); note in output |

---

### Phase 4: Identify Root Cause Patterns

**Entry Criteria:**
- `error_clusters` are available with frequency and temporal data
- `domain_context` (if provided) and `known_issues` (if provided) are available

**Actions:**
1. For each cluster, analyze error message and stack trace to infer root cause category: map to predefined categories (Null/Undefined Reference, Timeout, Resource Exhaustion, Permission Denied, Version Mismatch, Cascading Failure, External Dependency Failure, Configuration Error, Data Corruption, Race Condition, or Other)
2. Extract evidence for each category: error message keywords, stack frame patterns, temporal patterns, affected services
3. Cross-reference cluster signatures against `known_issues` (if provided): if match found (signature similarity >= 0.8), use previously identified root cause and resolution_verified status
4. Apply domain-specific heuristics based on `domain_context`: if "microservices", check for cascading failures (errors in service A correlate with errors in service B), network timeouts (error message contains "timeout", "deadline"), version mismatches (errors started after deployment); if "database", check for connection pool exhaustion (frequency increases over time), deadlocks (intermittent errors), slow queries (latency correlation); if "frontend", check for browser compatibility (errors affect specific browsers), resource loading failures (network errors), state management issues (intermittent, user-specific)
5. Analyze temporal patterns: errors increasing over time suggest resource leaks or accumulating load; sudden spikes suggest external events or deployments; cyclical patterns suggest scheduled jobs or batch processes
6. Analyze affected services/components: errors isolated to one service suggest local issue; errors across services suggest shared dependency or infrastructure issue
7. Assign likelihood score (0-1) to each root cause hypothesis based on evidence strength: frequency (higher frequency = higher likelihood), consistency (consistent error signature = higher likelihood), temporal pattern (clear pattern = higher likelihood), domain knowledge match (matches known pattern = higher likelihood)
8. Calculate confidence level: "high" if likelihood >= 0.8, "medium" if 0.5-0.79, "low" if <0.5
9. Flag root causes with low confidence (<0.6) for manual review; include all available evidence

**Output:**
- `root_causes` (array of objects) -- Root cause hypotheses, each with: {id (string), description (string), category (string), error_signatures (array of cluster_ids), frequency (number), likelihood (0-1), affected_services (array of strings), first_occurrence (ISO 8601 timestamp), last_occurrence (ISO 8601 timestamp), confidence_level ("high"|"medium"|"low"), evidence (array of strings), requires_manual_review (boolean), matched_known_issue (boolean, true if matched against known_issues), resolution_verified (boolean, true if matched known_issue has resolution_verified=true)}
- `root_cause_metadata` (object) -- {total_root_causes (number), high_confidence_count (number), medium_confidence_count (number), low_confidence_count (number), requires_manual_review_count (number), matched_known_issues_count (number), verified_resolutions_count (number)}

**Quality Gate:**
- Each root cause is linked to at least one error cluster; verified by cluster_id presence
- Likelihood scores are justified by evidence: each score has at least 2 pieces of evidence
- Root causes are distinct: no two root causes describe the same underlying issue; verified by description and affected_services comparison
- Confidence levels are accurate: high confidence has likelihood >= 0.8, medium 0.5-0.79, low <0.5

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Cannot infer root cause from available data | **Adjust** -- assign likelihood 0.3-0.5 and mark as "requires_manual_review"; include all available evidence; suggest additional data collection (e.g., request logs, metrics) |
| Multiple plausible root causes for one cluster | **Adjust** -- list all hypotheses with separate likelihood scores; rank by likelihood; note that cluster may have multiple root causes |
| Domain context is too vague to apply heuristics | **Adjust** -- proceed with generic analysis; note that domain-specific insights are unavailable; suggest providing more specific domain context |
| Temporal pattern is ambiguous (no clear trend) | **Adjust** -- assign "stable" trend; note in evidence that pattern is unclear |
| Matched known_issue has resolution_verified=false | **Adjust** -- use matched root cause but mark resolution_verified=false; note that fix effectiveness is unconfirmed |

---

### Phase 5: Generate Ranked Fix Suggestions

**Entry Criteria:**
- `root_causes` are identified with likelihood scores and confidence levels
- Root causes are ranked by likelihood

**Actions:**
1. For each root cause, generate 1-3 fix suggestions based on the root cause description, category, and domain knowledge
2. For each fix, estimate: likelihood_of_resolution (0-1, how directly the fix addresses the root cause; 1.0 if matched known_issue with resolution_verified=true), estimated_effort ("low" = <1 day, "medium" = 1-3 days, "high" = >3 days), risk_level ("low" = no risk of breaking other systems, "medium" = potential side effects, "high" = significant risk or requires coordination)
3. Calculate priority score: (root_cause_likelihood × fix_likelihood × affected_error_count) / effort_multiplier, where effort_multiplier is 1 for low, 2 for medium, 4 for high; multiply by risk_multiplier (1.0 for low risk, 0.8 for medium risk, 0.5 for high risk)
4. Rank fixes by priority score (descending)
5. For high-risk fixes, add mitigation notes: test in staging first, requires rollback plan, requires coordination with team X, requires customer notification, etc.
6. For each fix, include implementation_steps (array of 3-5 concrete steps)
7. Include affected_error_count for each fix (how many errors would be resolved if fix is applied)
8. If matched known_issue with resolution_verified=true, mark likelihood_of_resolution=1.0 and add note "Fix verified in production"

**Output:**
- `fix_suggestions` (array of objects) -- Ranked fixes, each with: {root_cause_id (string), fix_description (string), likelihood_of_resolution (0-1), estimated_effort ("low"|"medium"|"high"), risk_level ("low"|"medium"|"high"), affected_error_count (number), priority_rank (number), priority_score (number), mitigation_notes (string, present if risk_level is "high"), implementation_steps (array of strings), verified_in_production (boolean)}
- `fix_metadata` (object) -- {total_fixes (number), low_effort_count (number), medium_effort_count (number), high_effort_count (number), high_risk_count (number), verified_fixes_count (number)}

**Quality Gate:**
- Each fix is linked to a root cause; verified by root_cause_id presence
- Fixes are ranked by priority score in descending order
- High-risk fixes have mitigation notes; verified by presence of mitigation_notes when risk_level="high"
- Affected error count is accurate and matches root cause frequency
- Implementation steps are concrete and actionable (not vague like "implement the fix")

**Error Handling:**
| Failure Mode | Response |
|---|---|
| No plausible fixes for a root cause | **Adjust** -- mark as "requires_investigation"; suggest manual review or escalation; include note "No standard fix available; recommend consulting domain expert" |
| Fix suggestions are too generic | **Adjust** -- include more specific implementation details; reference documentation or code examples if available; suggest consulting team with domain expertise |
| Effort or risk estimates are uncertain | **Adjust** -- provide ranges (e.g., "low-medium") and note assumptions; suggest consulting team that would implement fix |
| Multiple fixes have same priority score | **Adjust** -- rank by effort (lower effort first) as tiebreaker; note in output |

---

### Phase 6: Design Monitoring Alerts

**Entry Criteria:**
- `root_causes` and `fix_suggestions` are available
- Root causes are ranked by likelihood and frequency

**Actions:**
1. For each root cause, design an alert that detects the error pattern early
2. Define trigger condition: error_signature + frequency_threshold (e.g., "5 errors in 5 minutes") + time_window; use formula: "Alert if error_count >= frequency_threshold within time_window"
3. Determine severity level based on: affected_error_count (high count = critical), likelihood (high likelihood = warning), and business impact (if known from domain context): critical if >100 errors/hour or affects core service, warning if 10-100 errors/hour, info if <10 errors/hour
4. Assign notification channels based on severity: critical → PagerDuty + Slack + email; warning → Slack + email; info → Slack only
5. Link each alert to the corresponding fix suggestion (runbook URL)
6. Set alert sensitivity to minimize false positives: use adaptive thresholds if error frequency is normally high; add additional conditions (e.g., "only if service is healthy", "only if error rate > baseline")
7. Estimate false_positive_rate (0-1): based on error frequency variance and threshold; higher variance = higher false positive risk
8. Include alert_description with: what the alert detects, why it matters, what to do when triggered, link to runbook

**Output:**
- `alert_definitions` (array of objects) -- Alert configurations, each with: {root_cause_id (string), alert_name (string), trigger_condition (string), severity ("info"|"warning"|"critical"), frequency_threshold (number), time_window (string), notification_channels (array of strings), runbook_url (string), alert_description (string), false_positive_rate_estimate (number, 0-1), additional_conditions (array of strings)}
- `alert_metadata` (object) -- {total_alerts (number), critical_alerts (number), warning_alerts (number), info_alerts (number), high_false_positive_risk_count (number)}

**Quality Gate:**
- Each alert has a clear, testable trigger condition; verified by presence of frequency_threshold and time_window
- Severity levels are appropriate to impact; verified by comparison with error frequency and business context
- Notification channels are specified; verified by presence of non-empty array
- Runbook links are provided or marked as "to be created"
- False positive rate estimate is reasonable (0-1 range)

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Alert trigger condition is too sensitive (high false positive rate >0.3) | **Adjust** -- increase frequency_threshold by 50% or time_window by 1 unit; add additional conditions (e.g., "only if service is healthy"); note adjustment in output |
| Alert trigger condition is too loose (misses real errors) | **Adjust** -- decrease frequency_threshold by 50% or time_window by 1 unit; add context conditions (e.g., "only if error rate > baseline"); note adjustment in output |
| No runbook available for a fix | **Adjust** -- mark as "runbook_to_be_created"; suggest creating one with template from Reference section |
| Alert would fire constantly (baseline error rate is very high) | **Adjust** -- use relative threshold (e.g., "alert if error rate > 2x baseline") instead of absolute threshold; note in output |

---

### Phase 7: Validate and Document Findings

**Entry Criteria:**
- All previous phases are complete
- `root_causes`, `fix_suggestions`, and `alert_definitions` are available

**Actions:**
1. Review root causes for consistency: check for overlaps (two root causes with >80% shared error signatures should be merged); check for contradictions (conflicting evidence)
2. Validate fix suggestions: ensure each fix is actionable (has implementation_steps), linked to a root cause, and has realistic effort/risk estimates
3. Validate alerts: ensure each alert is linked to a root cause, has a runbook (or marked as "to be created"), and has reasonable false positive rate estimate
4. Assess overall confidence: count high/medium/low confidence root causes; calculate confidence_assessment: "high" if >70% high confidence, "medium" if 40-70% high confidence, "low" if <40% high confidence
5. Flag if >30% of root causes are low confidence; suggest additional data collection or manual review
6. Generate analysis report with: executive summary (1-2 paragraphs), detailed findings (root causes with evidence, ranked by frequency), fix recommendations (ranked by priority), alert configuration (summary table), confidence assessment with caveats, next steps (prioritized), and appendix (detailed root cause analysis, clustering details, alert tuning guide)
7. Include metadata: total errors analyzed, unique error types, clusters identified, analysis duration, logs processed count, confidence assessment
8. Identify gaps: errors that could not be clustered or analyzed; suggest additional data (request logs, metrics, traces) or investigation
9. Format report as markdown with clear sections, tables, and code blocks

**Output:**
- `analysis_report` (string) -- Human-readable report in markdown format with all findings, formatted for both technical and non-technical readers
- `analysis_metadata` (object) -- {total_errors_analyzed (number), unique_error_types (number), clusters_identified (number), root_causes_identified (number), fixes_suggested (number), alerts_defined (number), analysis_duration_seconds (number), logs_processed_count (number), confidence_assessment ("high"|"medium"|"low"), high_confidence_root_causes (number), medium_confidence_root_causes (number), low_confidence_root_causes (number), requires_manual_review_count (number)}

**Quality Gate:**
- Report is clear and actionable for both technical and non-technical readers; verified by presence of executive summary and clear sections
- All root causes, fixes, and alerts are mentioned in the report; verified by count comparison
- Confidence assessment is accurate; verified by calculation from root cause confidence levels
- Next steps are specific and prioritized; verified by presence of numbered list with action items
- Report length is reasonable (1000-5000 words); if >5000 words, move detailed findings to appendix

**Error Handling:**
| Failure Mode | Response |
|---|---|
| Analysis confidence is very low (<50% high confidence) | **Adjust** -- flag prominently in report with "⚠️ LOW CONFIDENCE" banner; recommend manual review or additional data collection; suggest specific data to collect |
| Report is too long (>5000 words) | **Adjust** -- move detailed findings to appendix; keep executive summary and recommendations concise; add table of contents |
| Conflicting findings (two root causes seem to describe the same issue) | **Adjust** -- merge root causes; update linked fixes and alerts; note merge in change log |
| No root causes identified (all clusters are unique) | **Adjust** -- note in report that errors are diverse; recommend collecting additional context (request logs, metrics); suggest manual investigation |

---

## Exit Criteria

The skill is DONE when:
1. All error logs have been parsed and structured (Phase 1 complete; ≥80% valid entries)
2. Stack traces have been extracted and normalized (Phase 2 complete; all traces parsed into ≥2 frames)
3. Errors have been clustered by similarity (Phase 3 complete; all clusters have ≥min_error_frequency errors)
4. Root cause patterns have been identified with likelihood scores (Phase 4 complete; all root causes have 0-1 likelihood and confidence level)
5. Fix suggestions have been ranked by priority (Phase 5 complete; all fixes have priority_score and implementation_steps)
6. Monitoring alerts have been designed with trigger conditions and severity levels (Phase 6 complete; all alerts have trigger_condition and severity)
7. A comprehensive analysis report has been generated (Phase 7 complete; report is in markdown format with all sections)
8. All outputs are populated and validated: root_causes array is non-empty, fix_suggestions array is non-empty, alert_definitions array is non-empty, analysis_report is non-empty string, analysis_metadata is complete object
9. Confidence assessment is documented in analysis_metadata (confidence_assessment is "high", "medium", or "low")
10. Next steps are specified in analysis_report (report contains "Next Steps" section with prioritized action items)

---

## Error Handling Summary

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Log file not found | **Abort** -- verify file path and permissions; suggest checking file encoding |
| Phase 1 | Log aggregation API auth fails | **Abort** -- verify credentials and API access |
| Phase 1 | Unrecognized log format | **Adjust** -- attempt plain-text parsing; continue with partial data |
| Phase 1 | Malformed timestamps | **Adjust** -- skip entries with invalid timestamps; continue with remaining data |
| Phase 1 | Empty log input | **Abort** -- no logs to analyze |
| Phase 1 | Log file exceeds size limit | **Adjust** -- process in chunks; analyze most recent chunk first |
| Phase 2 | No stack traces found | **Adjust** -- continue with error messages only; note reduced precision |
| Phase 2 | Unrecognized stack trace format | **Adjust** -- attempt generic line-by-line parsing; mark confidence as "low" |
| Phase 2 | Truncated stack traces | **Adjust** -- include partial traces with confidence flag; note in output |
| Phase 3 | Too many clusters (>100) | **Adjust** -- increase clustering threshold by 0.05 and re-cluster |
| Phase 3 | No clusters formed | **Adjust** -- lower clustering threshold by 0.1 or treat errors as singletons |
| Phase 3 | Insufficient data for clustering | **Adjust** -- proceed with individual error analysis; note limited pattern detection |
| Phase 4 | Cannot infer root cause | **Adjust** -- assign low likelihood; mark for manual review; suggest additional data |
| Phase 4 | Multiple plausible root causes | **Adjust** -- list all hypotheses with separate likelihood scores |
| Phase 4 | Domain context too vague | **Adjust** -- proceed with generic analysis; note unavailable domain-specific insights |
| Phase 5 | No plausible fixes | **Adjust** -- mark as "requires_investigation"; suggest manual review |
| Phase 5 | Fix suggestions too generic | **Adjust** -- include specific implementation details; reference documentation |
| Phase 5 | Effort/risk estimates uncertain | **Adjust** -- provide ranges and note assumptions |
| Phase 6 | Alert too sensitive | **Adjust** -- increase frequency threshold or time_window; add additional conditions |
| Phase 6 | Alert too loose | **Adjust** -- decrease frequency threshold or time_window; add context conditions |
| Phase 6 | No runbook available | **Adjust** -- mark as "runbook_to_be_created"; suggest creating one |
| Phase 6 | Baseline error rate very high | **Adjust** -- use relative threshold (e.g., "2x baseline") instead of absolute |
| Phase 7 | Low overall confidence | **Adjust** -- flag prominently in report; recommend manual review |
| Phase 7 | Report too long | **Adjust** -- move detailed findings to appendix; keep summary concise |
| Phase 7 | Conflicting findings | **Adjust** -- merge root causes; update linked fixes and alerts |

---

## Reference Section

### Root Cause Categories

Common root cause patterns to look for:
- **Null/Undefined Reference:** Stack trace points to null dereference; error message contains "null", "undefined", "NoneType", "NullPointerException"
- **Timeout:** Error message contains "timeout", "deadline exceeded", "timed out"; temporal pattern shows increasing latency; affected service is downstream dependency
- **Resource Exhaustion:** Error message contains "out of memory", "connection pool exhausted", "file descriptor limit", "too many open files"; frequency increases over time; trend is "increasing"
- **Permission Denied:** Error message contains "permission", "unauthorized", "forbidden", "access denied"; affects specific users or services; may be environment-specific
- **Version Mismatch:** Error occurs after deployment; affects specific service version; stack trace points to API or schema change; first_occurrence correlates with deployment time
- **Cascading Failure:** Errors in service A trigger errors in service B; temporal pattern shows propagation from one service to another; affected_services includes multiple services
- **External Dependency Failure:** Errors correlate with third-party service outages; error message references external API or service; may be time-correlated with external events
- **Configuration Error:** Errors occur in specific environment (prod/staging/dev); error message references missing or invalid configuration; may be environment-specific
- **Data Corruption:** Errors reference invalid data state; temporal pattern shows sudden onset; may affect specific data ranges or users
- **Race Condition:** Errors are intermittent; stack trace points to concurrent access; temporal pattern is random; frequency is low but consistent

### Domain-Specific Heuristics

**Microservices:**
- Check for cascading failures: if service A fails, do downstream services fail? Look for temporal correlation.
- Check for network timeouts: are errors correlated with latency spikes? Look for "timeout" in error messages.
- Check for version mismatches: did errors start after a deployment? Correlate first_occurrence with deployment timestamps.
- Check for circuit breaker trips: are errors from one service affecting others? Look for "circuit breaker" or "service unavailable".

**Databases:**
- Check for connection pool exhaustion: are errors increasing over time? Look for "connection pool", "too many connections".
- Check for deadlocks: are errors intermittent and involve multiple services? Look for "deadlock", "lock timeout".
- Check for slow queries: are errors correlated with high query latency? Look for "query timeout", "slow query".
- Check for disk space: are errors increasing over time? Look for "disk full", "no space left".

**Frontend:**
- Check for browser compatibility: do errors affect specific browsers? Look for browser-specific error patterns.
- Check for resource loading failures: are errors correlated with network issues? Look for "failed to load", "network error".
- Check for state management issues: are errors intermittent and user-specific? Look for "state", "undefined", "cannot read property".
- Check for memory leaks: do errors increase over time on same user session? Look for "out of memory", "heap size exceeded".

**API Gateway:**
- Check for rate limiting: are errors correlated with traffic spikes? Look for "rate limit", "too many requests".
- Check for authentication failures: are errors user-specific? Look for "unauthorized", "invalid token".
- Check for routing errors: do errors affect specific endpoints? Look for "route not found", "404".

**Message Queue:**
- Check for queue overflow: are errors increasing over time? Look for "queue full", "message dropped".
- Check for consumer lag: are errors correlated with high lag? Look for "consumer lag", "offset out of range".
- Check for message format errors: are errors intermittent? Look for "invalid message", "parse error".

### Alert Sensitivity Guidelines

- **Critical:** Affects >100 errors/hour or >100 users; requires immediate response (page on-call engineer); notification channels: PagerDuty + Slack + email
- **Warning:** Affects 10-100 errors/hour or 10-100 users; requires response within 1 hour; notification channels: Slack + email
- **Info:** Affects <10 errors/hour or <10 users; monitor and investigate when convenient; notification channels: Slack only

### Alert Tuning Guide

**Reducing False Positives:**
1. Increase frequency_threshold: if alert fires >5 times per day, increase threshold by 50%
2. Increase time_window: if alert fires for brief spikes, increase window (e.g., from 5m to 10m)
3. Add additional conditions: "only if service is healthy", "only if error rate > 2x baseline", "only if >3 consecutive errors"
4. Use adaptive thresholds: set threshold based on time-of-day or day-of-week patterns

**Reducing False Negatives:**
1. Decrease frequency_threshold: if alert misses real issues, decrease threshold by 50%
2. Decrease time_window: if alert misses rapid spikes, decrease window (e.g., from 10m to 5m)
3. Remove additional conditions: if conditions are too restrictive, remove or relax them
4. Add new error signatures: if alert misses related errors, add them to trigger condition

### Runbook Template

Each alert should link to a runbook with:

**1. Alert Description**
- What the alert detects: [error signature, frequency threshold, time window]
- Why it matters: [business impact, affected users/services]
- Severity: [critical/warning/info]

**2. Diagnosis**
- How to confirm the root cause: [steps to investigate]
- What to look for: [error messages, affected services, temporal patterns]
- Tools to use: [logs, metrics, traces, dashboards]

**3. Immediate Action**
- Quick fix or workaround: [steps to mitigate immediately]
- Rollback procedure: [if applicable]
- Communication: [who to notify, what to say]

**4. Long-term Fix**
- Permanent solution: [linked to fix suggestion]
- Implementation steps: [from fix_suggestions]
- Testing: [how to verify fix]
- Deployment: [how to roll out safely]

**5. Escalation**
- Who to contact: [team, on-call engineer, manager]
- When to escalate: [if issue persists >X minutes, if affecting >X users]
- Escalation procedure: [how to contact, what information to provide]

**6. Prevention**
- How to prevent recurrence: [monitoring, testing, code review]
- Related alerts: [other alerts that may fire together]
- Documentation: [links to relevant docs, architecture diagrams]

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.