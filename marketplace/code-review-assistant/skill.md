# Code Review Assistant

**One-line description:** Analyze a git diff and generate a structured code review with severity levels, specific improvement suggestions, and recognition of good patterns.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `git_diff`: string (required) -- The git diff output in unified format (e.g., output of `git diff` or `git show`). Can include multiple files.
- `language_context`: string (optional, default: "auto-detect") -- Programming language or framework (e.g., "Python", "JavaScript/React", "Go"). Used to apply language-specific best practices.
- `project_conventions`: string (optional) -- Project-specific coding standards, naming conventions, or architectural patterns to evaluate against.
- `context_lines`: integer (optional, default: 3) -- Number of lines of context to include before and after each hunk for analysis. Helps identify issues dependent on surrounding code. Valid range: 0-10.
- `review_scope`: string (optional, default: "comprehensive") -- Scope of review: "comprehensive" (all categories), "security-focused", "performance-focused", or "style-only".
- `reviewer_expertise`: string (optional, default: "general") -- Reviewer expertise level: "general", "senior", or "expert" (affects depth and rigor of analysis).
- `previous_review_feedback`: array of objects (optional) -- Prior review comments from previous iterations. Each object contains: `issue_id` (string), `issue_description` (string), `status` ("addressed", "pending", "dismissed"). Enables tracking of progressive improvement.

---

## Outputs

- `code_review`: object -- Structured code review document with the following fields:
  - `summary`: string -- High-level overview of the changes and overall assessment.
  - `recommendation`: string -- One of: "approve", "approve-with-changes", "request-changes", "reject".
  - `critical_issues`: array of objects -- Issues that block merge. Each object contains: `issue_id` (string), `issue` (string), `severity` ("critical"), `description` (string), `location` (object with `file` and `line_range`), `suggestion` (string), `code_example` (string), `confidence_level` ("high", "medium", "low"), `related_issues` (array of issue_ids).
  - `major_issues`: array of objects -- Issues that should be addressed. Fields: `issue_id`, `issue`, `severity` ("major"), `description`, `location`, `suggestion`, `code_example`, `confidence_level`, `related_issues`.
  - `minor_suggestions`: array of objects -- Nice-to-have improvements. Fields: `issue_id`, `issue`, `severity` ("minor"), `description`, `location`, `suggestion`, `code_example` (optional), `confidence_level`, `related_issues`.
  - `praise`: array of objects -- Recognition of good patterns and practices. Fields: `pattern` (string), `description` (string), `location` (object with `file` and `line_range`), `why_it_matters` (string).
  - `files_changed`: array of strings -- List of files modified in the diff.
  - `stats`: object -- Change statistics: `files_modified` (number), `lines_added` (number), `lines_removed` (number).
  - `prior_feedback_status`: object (optional) -- Summary of prior review feedback addressed in this diff. Fields: `total_prior_issues` (number), `addressed_count` (number), `pending_count` (number), `dismissed_count` (number).
- `review_metadata`: object -- Metadata about the review: `review_timestamp` (ISO 8601 string), `language_detected` (string), `scope_applied` (string), `total_findings` (number), `critical_count` (number), `major_count` (number), `minor_count` (number), `praise_count` (number), `automated_checks_run` (boolean).

---

## Execution Phases

### Phase 1: Parse and Validate Diff

**Entry Criteria:**
- `git_diff` input is provided and non-empty.
- Diff is in unified format (contains `@@` line markers).

**Actions:**
1. Parse the git diff to extract: file names, file status (added/modified/deleted), line numbers, before/after code blocks, and context lines (number specified by `context_lines` input).
2. Validate that the diff is well-formed. If malformed, raise an error with the specific parsing failure and the line number where parsing failed.
3. Detect the programming language(s) from file extensions. If `language_context` is provided, use it; otherwise use auto-detected language. If language cannot be detected, note as "unknown" and apply generic analysis.
4. Extract metadata: total files changed, total lines added, total lines removed.
5. Organize the diff into a structured format: `{file: string, status: string, language: string, hunks: [{old_start, old_end, new_start, new_end, before_code, after_code, context_before, context_after}]}`.
6. Assign unique identifiers to each hunk for reference in later phases.

**Output:**
- `parsed_diff`: object with file-level and hunk-level structure, including context lines.
- `language_detected`: string (e.g., "Python", "JavaScript", "unknown").
- `files_changed`: array of file names with status (added/modified/deleted).
- `change_stats`: object with `files_modified`, `lines_added`, `lines_removed`.

**Quality Gate:**
- Every file in the diff is represented with at least one hunk.
- Every hunk has before and after code blocks.
- Context lines are included if `context_lines` > 0.
- No parsing errors. If the diff cannot be parsed, the phase fails and returns an error message with the specific parsing failure location.
- Every hunk has a unique identifier assigned.

---

### Phase 2: Analyze Code Changes

**Entry Criteria:**
- `parsed_diff` is complete and valid.
- `language_detected` is known (or `language_context` was provided).

**Actions:**
1. For each hunk, compare before and after code:
   - Identify logic changes: conditionals, loops, function calls, data structures, control flow modifications.
   - Identify style changes: naming conventions, formatting, comments, documentation.
   - Identify performance implications: algorithmic complexity changes, resource usage, caching, database queries.
   - Identify security implications: input validation, authentication, authorization, data exposure, injection vulnerabilities.
   - Identify testing changes: test coverage changes, test quality, edge case coverage, test maintainability.
2. Apply language-specific best practices from the Reference section (e.g., PEP 8 for Python, ESLint rules for JavaScript).
3. Apply project conventions if provided.
4. Use context lines (from Phase 1) to identify issues that depend on surrounding code. For example, a function call may only be problematic if the surrounding code doesn't validate inputs.
5. Identify positive patterns: good naming, clear logic, appropriate abstractions, comprehensive error handling, good test coverage, security best practices.
6. Compile a raw findings list with: `{hunk_id, category, finding_type, severity_candidate, description, location, code_snippet, suggestion, confidence_candidate}`.
7. For each finding, note if it is related to other findings (e.g., same naming issue appears in multiple hunks).

**Output:**
- `raw_findings`: array of finding objects (before severity assignment), each with hunk_id, category, description, location, code_snippet, suggestion, confidence_candidate, and related_hunk_ids.
- `positive_patterns`: array of pattern objects with descriptions, locations, and explanations of why they are good.
- `related_findings_map`: object mapping finding_ids to arrays of related finding_ids for grouping similar issues.

**Quality Gate:**
- Every changed line (in the diff) is evaluated for at least one applicable category (logic, style, performance, security, or testing). A line is considered "evaluated" if it is examined for categories relevant to its context (e.g., a new function definition is evaluated for logic, style, and testing; a formatting change is evaluated for style).
- Findings are specific to the code change, not generic. Each finding references the specific code, line number, and context.
- Positive patterns are explicitly noted and explained (not just implied by absence of issues).
- Related findings are identified and linked by hunk_id.

---

### Phase 3: Assign Severity and Categorize

**Entry Criteria:**
- `raw_findings` list is complete.
- `review_scope` is specified (default: "comprehensive").
- `previous_review_feedback` is provided (optional).

**Actions:**
1. For each finding, assign a severity level based on impact:
   - **Critical:** Breaks functionality, introduces security vulnerability, causes data loss, or violates architectural constraints. Blocks merge. Examples: SQL injection, authentication bypass, logic error causing data loss, architectural violation.
   - **Major:** Reduces code quality, introduces technical debt, impacts performance significantly, or violates project conventions. Should be fixed before merge. Examples: missing error handling, performance regression, naming inconsistency with project standards, incomplete test coverage.
   - **Minor:** Style inconsistencies, minor optimizations, or suggestions for clarity. Nice to have. Examples: formatting, variable naming suggestions, documentation improvements, minor optimization opportunities.
2. Assign a confidence level to each finding: "high" (certain the issue exists), "medium" (likely issue, but context-dependent), "low" (possible issue, but requires developer judgment).
3. Filter findings based on `review_scope`:
   - If "security-focused", prioritize and emphasize security findings; deprioritize style. Include all critical and major security issues; include major non-security issues; exclude minor non-security issues.
   - If "performance-focused", prioritize performance findings. Include all critical and major performance issues; include major non-performance issues; exclude minor non-performance issues.
   - If "style-only", exclude logic and security findings. Include only style and minor issues.
   - If "comprehensive", include all findings.
4. For each finding, assign a unique `issue_id` (e.g., "CRIT-001", "MAJ-005", "MIN-012").
5. Link related findings by populating the `related_issues` array in each finding object.
6. If `previous_review_feedback` is provided, check if any current findings match prior issues. Mark as "re-raised" if the same issue appears again. Count addressed, pending, and dismissed prior issues.
7. Group findings by severity: critical, major, minor.
8. Determine overall recommendation:
   - If any critical issues: "request-changes" (if 1-2 critical) or "reject" (if 3+ critical or critical issues are architectural).
   - If major issues and no critical: "approve-with-changes".
   - If only minor issues or praise: "approve".
9. Organize praise items separately.

**Output:**
- `critical_issues`: array of finding objects with issue_id, severity, confidence_level, related_issues.
- `major_issues`: array of finding objects with issue_id, severity, confidence_level, related_issues.
- `minor_suggestions`: array of finding objects with issue_id, severity, confidence_level, related_issues.
- `praise`: array of pattern objects.
- `recommendation`: string ("approve", "approve-with-changes", "request-changes", or "reject").
- `prior_feedback_status`: object with counts of addressed, pending, dismissed prior issues (if applicable).

**Quality Gate:**
- Every finding has a severity assigned (critical, major, or minor).
- Every finding has a confidence_level assigned (high, medium, or low).
- Severity assignments are consistent: all security vulnerabilities are at least "major"; all logic errors affecting functionality are at least "major"; all architectural violations are "critical".
- Recommendation matches the highest severity issue present and the count of critical issues.
- If prior feedback is provided, all prior issues are accounted for in the status summary.
- Related findings are correctly linked (if issue A is related to issue B, then issue B lists issue A in its related_issues array).

---

### Phase 4: Generate Specific Improvement Suggestions

**Entry Criteria:**
- Findings are categorized by severity.
- Code context (before/after snippets and surrounding context) is available for each finding.

**Actions:**
1. For each critical and major issue, generate a specific improvement suggestion:
   - Describe the issue in plain language, referencing the specific code and line number.
   - Explain why it matters: impact on functionality, maintainability, security, performance, or user experience.
   - Provide a concrete code example showing the fix. The code example must be syntactically correct and directly applicable to the code in the diff.
   - If applicable, suggest alternative approaches or trade-offs (e.g., "Option A: Use caching (faster but adds complexity). Option B: Optimize the query (simpler but requires database changes).").
   - Reference best practices, documentation, or standards where applicable (e.g., "See OWASP Top 10 - A03:2021 Injection", "PEP 8 style guide section 2.1").
2. For minor suggestions, provide a brief suggestion (1-2 sentences) and optional code example.
3. Ensure suggestions are actionable: a developer should be able to implement them without additional clarification. A suggestion is actionable if it includes: (a) what to change, (b) how to change it (code example or steps), and (c) why it matters.
4. For praise items, explain why the pattern is good and how it benefits the codebase (e.g., "This error handling pattern is excellent because it provides clear recovery paths and logs failures for debugging.").
5. For findings with related issues, note the relationship in the suggestion (e.g., "This is one of 3 similar naming inconsistencies in this diff; see related issues MAJ-005 and MAJ-008.").
6. Include references to best practices, documentation, or standards where applicable.

**Output:**
- `critical_issues`: updated with `suggestion` (string, 2-5 sentences), `code_example` (string, syntactically correct code), and `references` (array of strings with links or citations).
- `major_issues`: updated with `suggestion`, `code_example`, and `references`.
- `minor_suggestions`: updated with `suggestion` (1-2 sentences) and optional `code_example`.
- `praise`: updated with `why_it_matters` field (1-3 sentences explaining the benefit).

**Quality Gate:**
- Every critical and major issue has a concrete suggestion (not generic advice like "improve error handling").
- Every suggestion includes a code example or clear implementation steps (minimum 3 steps if no code example).
- Every code example is syntactically correct for the detected language and directly applicable to the code in the diff.
- Suggestions are specific to the code change and context, not generic.
- Praise items explain the concrete benefit, not just state "good job".
- All related issues are noted in suggestions where applicable.
- No suggestion uses vague language like "consider", "might", or "could" without providing a specific recommendation.

---

### Phase 5: Compile Structured Review

**Entry Criteria:**
- All findings are categorized, severity-assigned, and have suggestions.
- Praise items are documented.
- Recommendation is determined.
- Prior feedback status is calculated (if applicable).

**Actions:**
1. Write a summary of the changes:
   - What does this diff accomplish? (1-2 sentences describing the main purpose.)
   - What are the main areas of change? (e.g., "refactored authentication logic", "added caching layer", "fixed race condition in concurrent access").
   - Overall assessment: is this a solid change, or does it need work? Reference the recommendation and key findings.
   - If prior feedback is provided, note whether prior issues have been addressed (e.g., "The developer has addressed 3 of 5 prior review comments; 2 remain pending.").
2. Organize the review document:
   - **Summary:** High-level overview (3-5 sentences).
   - **Recommendation:** Approve / Approve with Changes / Request Changes / Reject (with 1-2 sentence justification).
   - **Critical Issues:** (if any) List with descriptions, locations, and suggestions. If 3+ critical issues, group by category (e.g., "Security Issues", "Logic Errors").
   - **Major Issues:** (if any) List with descriptions, locations, and suggestions. If 5+ major issues, group by category.
   - **Minor Suggestions:** (if any) List with descriptions and suggestions. If 10+ minor issues, summarize into a "Style and Minor Improvements" section with a note that detailed feedback is available on request.
   - **Praise:** Recognition of good patterns and practices (if any).
   - **Prior Feedback Status:** (if applicable) Summary of addressed, pending, and dismissed prior issues.
   - **Files Changed:** List of modified files with status (added/modified/deleted).
   - **Statistics:** Files modified, lines added/removed, total findings by severity.
3. Ensure the review is balanced: acknowledge good work alongside areas for improvement. If there are 3+ praise items, include a "Strengths" section.
4. Format the review for readability: use clear headings, code blocks for examples, and concise language. Keep the review under 5000 characters; if longer, summarize minor issues.

**Output:**
- `code_review`: object with all sections populated (see Outputs section above).

**Quality Gate:**
- Every finding from Phase 3 appears in the review (either in critical, major, minor, or praise sections).
- Every critical and major issue has a suggestion and code example.
- The summary accurately reflects the changes, assessment, and recommendation.
- The recommendation is justified by the findings (e.g., if recommendation is "request-changes", at least one critical issue is described).
- Prior feedback status is included if prior feedback was provided.
- The review is balanced (includes praise if applicable).
- The review is under 5000 characters or minor issues are summarized.

---

### Phase 6: Validate and Finalize

**Entry Criteria:**
- `code_review` object is complete.
- All sections are populated.

**Actions:**
1. Validate completeness:
   - Does every critical issue have a suggestion and code example?
   - Does every major issue have a suggestion and code example?
   - Are all files from the diff mentioned in the review?
   - Is the recommendation justified by the findings? (e.g., if recommendation is "approve", there are no critical or major issues).
   - If prior feedback was provided, is the prior feedback status included?
2. Validate clarity:
   - Can a developer understand each issue without additional context? Test by checking: (a) issue description is specific to the code, (b) location is precise (file and line range), (c) suggestion is actionable (includes what, how, and why).
   - Are code examples clear and correct? (Syntax is valid, indentation is correct, example is directly applicable.)
   - Is the language professional and constructive? (No accusatory language, no vague criticism.)
3. Check for consistency:
   - Are severity levels consistent across similar issues? (e.g., all missing error handling is at least "major"; all naming inconsistencies are "minor" or "major" depending on impact).
   - Does the recommendation match the severity distribution? (e.g., if recommendation is "approve-with-changes", there are major but no critical issues).
   - Are confidence levels assigned consistently? (e.g., all high-confidence findings are issues the reviewer is certain about; all low-confidence findings are issues requiring developer judgment).
4. Check for completeness of metadata:
   - Is `review_timestamp` in ISO 8601 format?
   - Is `language_detected` populated?
   - Is `scope_applied` populated?
   - Are finding counts (`critical_count`, `major_count`, `minor_count`, `praise_count`) accurate?
5. Perform a final read-through:
   - Is the review ready for delivery to the developer?
   - Are there any placeholder text, "TODO" items, or incomplete sections?
   - Is the tone professional and constructive?
6. Return the final review and metadata.

**Output:**
- `code_review`: final, validated review object.
- `review_metadata`: object with `review_timestamp`, `language_detected`, `scope_applied`, `total_findings`, `critical_count`, `major_count`, `minor_count`, `praise_count`, `automated_checks_run`.

**Quality Gate:**
- All sections are populated and consistent.
- Every finding is actionable (includes what, how, and why).
- Every code example is syntactically correct and directly applicable.
- The review is ready for delivery to the developer (no placeholder text, no "TODO" items).
- Metadata is complete and accurate.
- Severity levels and recommendations are consistent.
- The review is professional and constructive in tone.

---

## Exit Criteria

The skill is DONE when:
1. The git diff has been fully parsed and validated. Every file and hunk is represented in the parsed structure.
2. All code changes have been analyzed across applicable categories (logic, style, performance, security, testing). Every changed line is evaluated for at least one applicable category.
3. Findings are categorized by severity (critical, major, minor) and organized by category. Each finding has a unique issue_id and confidence_level.
4. Every critical and major issue has a specific, actionable suggestion with a syntactically correct code example that is directly applicable to the code in the diff.
5. Positive patterns are recognized and explained with concrete benefits (not just "good job").
6. A structured code review document is produced with sections: summary, recommendation, critical issues, major issues, minor suggestions, praise, prior feedback status (if applicable), files changed, and statistics.
7. The review is clear enough that a developer can understand and act on every suggestion without additional clarification. Each suggestion includes: what to change, how to change it (code example or steps), and why it matters.
8. Metadata is attached with: timestamp (ISO 8601), language detected, scope applied, finding counts by severity, and praise count.
9. The review is professional, constructive, and balanced (acknowledges good work alongside areas for improvement).
10. The review is under 5000 characters, or minor issues are summarized into a single section.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Diff is malformed or not in unified format | **Abort** -- Return error message: "Diff is not in valid unified format. Please provide output from `git diff` or `git show`. Parsing failed at line X: [specific error]." |
| Phase 1 | Diff is empty (no changes) | **Adjust** -- Return a review with summary "No changes detected in the provided diff." and recommendation "approve". Set total_findings to 0. |
| Phase 1 | Language cannot be detected from file extensions | **Adjust** -- Set language_detected to "unknown" and note in metadata: "Language not recognized; generic analysis applied." Proceed with generic code analysis (logic, style, security) without language-specific rules. |
| Phase 2 | Code snippet is too large to analyze (>500 lines per hunk) | **Adjust** -- Analyze at a higher level (function/module level) rather than line-by-line. Note in metadata: "Large hunks analyzed at module level." Reduce confidence_level for findings in large hunks to "medium" or "low". |
| Phase 2 | No findings detected (diff is trivial, e.g., only whitespace or comments) | **Adjust** -- Return a review with summary "Minor changes detected (whitespace, comments, or formatting only)." and recommendation "approve". Include praise if any good patterns are evident (e.g., "Good documentation added"). |
| Phase 3 | No findings detected after filtering by review_scope | **Adjust** -- Return a review with summary "No issues found in the specified scope ([scope])." and recommendation "approve". Include praise if applicable. |
| Phase 4 | Suggestion is too complex to express in code example (e.g., architectural refactoring) | **Adjust** -- Provide a detailed text description with pseudocode or a link to documentation. Format: "See [reference] for implementation details. Key steps: (1) [step], (2) [step], (3) [step]." |
| Phase 5 | Review exceeds 5000 characters | **Adjust** -- Summarize minor suggestions into a single "Style and Minor Improvements" section with a note: "[N] minor suggestions grouped for brevity. Detailed feedback available on request." Keep critical and major issues detailed. |
| Phase 6 | Recommendation does not match findings (e.g., recommendation is "approve" but critical issues exist) | **Abort** -- Flag as internal error. Do not return the review. Log: "Recommendation mismatch: [recommendation] does not match [critical_count] critical issues." |
| Phase 6 | Code example is syntactically incorrect or not applicable to the diff | **Abort** -- Flag the issue and do not return the review. Log: "Code example for issue [issue_id] is syntactically incorrect or not applicable to the code in the diff." |

---

## Reference Section

### Severity Assignment Criteria

**Critical:**
- Security vulnerabilities (SQL injection, XSS, authentication bypass, data exposure, insecure deserialization).
- Logic errors that break functionality or cause data loss (e.g., off-by-one error in critical loop, incorrect conditional logic).
- Violations of architectural constraints or system design (e.g., breaking a layered architecture, introducing circular dependencies).
- Performance regressions that impact user experience significantly (e.g., O(n²) algorithm where O(n) was used before).
- Missing critical error handling that could cause system crashes or data corruption.

**Major:**
- Code that violates project conventions or best practices (naming, formatting, structure).
- Technical debt that will compound over time (e.g., code duplication, overly complex functions).
- Missing error handling or incomplete edge case coverage (e.g., no null checks, missing exception handlers).
- Performance issues that could impact scalability (e.g., N+1 query problem, inefficient algorithm).
- Incomplete or inadequate test coverage for new functionality (e.g., happy path only, no edge cases).
- Security issues that are not immediate vulnerabilities but increase risk (e.g., hardcoded secrets, overly permissive access).

**Minor:**
- Style inconsistencies (naming, formatting, comments).
- Opportunities for code simplification or clarity (e.g., using a built-in function instead of custom logic).
- Suggestions for optimization that don't impact current performance (e.g., caching that would help at scale).
- Documentation improvements (e.g., missing docstrings, unclear comments).
- Suggestions for better testing (e.g., adding assertions, improving test names).

### Analysis Categories

1. **Logic:** Correctness of algorithms, control flow, data transformations, business logic, and edge case handling.
2. **Style:** Naming conventions, code formatting, comments, documentation, and readability.
3. **Performance:** Algorithmic complexity, resource usage, caching, database queries, and optimization opportunities.
4. **Security:** Input validation, authentication, authorization, data protection, injection prevention, and vulnerability prevention.
5. **Testing:** Test coverage, test quality, edge case handling, test maintainability, and assertion quality.

### Best Practices by Language

**Python:**
- PEP 8 style guide (naming, formatting, line length).
- Type hints for function signatures.
- Docstrings for modules, classes, and functions.
- Exception handling with specific exception types (not bare `except`).
- Context managers for resource management (`with` statements).

**JavaScript/TypeScript:**
- ESLint rules and Prettier formatting.
- Async/await patterns (prefer over callbacks and promise chains).
- Null safety (optional chaining `?.`, nullish coalescing `??`).
- Error boundaries for React components.
- Proper error handling in async functions (try/catch).

**Go:**
- Idiomatic Go: error handling with explicit `if err != nil` checks.
- Interface design: small, focused interfaces.
- Concurrency patterns: goroutines and channels.
- Defer for cleanup and resource management.
- Package organization and naming conventions.

**Java:**
- SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion).
- Exception handling with specific exception types.
- Null safety (Optional, @Nullable annotations).
- Design patterns (Factory, Strategy, Observer, etc.).
- Proper use of generics and type safety.

**SQL:**
- Query optimization (indexes, query plans, avoiding N+1 queries).
- Parameterized queries to prevent SQL injection.
- Transaction handling (ACID properties, isolation levels).
- Proper use of constraints (primary keys, foreign keys, unique constraints).
- Avoiding SELECT * and specifying needed columns.

### Decision Criteria for Recommendations

- **Approve:** No critical or major issues. Review is positive or neutral. Developer can merge immediately.
- **Approve with Changes:** Major issues present but not blocking. Developer should address before merge. Reviewer will re-check after changes.
- **Request Changes:** Critical issues present (1-2 critical). Developer must address and re-submit for review before merge.
- **Reject:** Multiple critical issues (3+) or critical issues that fundamentally undermine the change, indicating the approach is flawed. Recommend redesign or significant refactoring.

### Confidence Level Guidance

- **High:** The reviewer is certain the issue exists. The code is clearly incorrect, violates a standard, or introduces a known vulnerability. No developer judgment needed.
- **Medium:** The issue likely exists, but context-dependent. The code may be correct in some contexts but problematic in others. Requires developer judgment or additional context.
- **Low:** The issue is possible but uncertain. The code might be correct depending on requirements, design decisions, or context not visible in the diff. Requires developer judgment and discussion.

### Checklist for Domain-Specific Reviews

**Security Checklist for Web Applications:**
- [ ] Input validation: All user inputs are validated (type, length, format, whitelist).
- [ ] Output encoding: All outputs are properly encoded (HTML, URL, JavaScript, SQL).
- [ ] Authentication: Credentials are handled securely (hashed, salted, never logged).
- [ ] Authorization: Access control is enforced (role-based, attribute-based).
- [ ] HTTPS: All sensitive data is transmitted over HTTPS.
- [ ] CSRF protection: State-changing requests are protected against CSRF.
- [ ] SQL injection prevention: Parameterized queries are used.
- [ ] XSS prevention: User-generated content is escaped or sanitized.
- [ ] Secrets management: No hardcoded secrets (API keys, passwords, tokens).
- [ ] Dependency security: Dependencies are up-to-date and free of known vulnerabilities.

**Performance Checklist for Data Processing:**
- [ ] Algorithmic complexity: Algorithms are O(n) or better for the expected data size.
- [ ] Memory usage: No memory leaks; appropriate data structures for the use case.
- [ ] Database queries: Queries are optimized (indexes, query plans, avoiding N+1).
- [ ] Caching: Frequently accessed data is cached appropriately.
- [ ] Batch processing: Large operations are batched to avoid timeouts.
- [ ] Parallelization: CPU-bound operations use parallelization where applicable.
- [ ] I/O efficiency: I/O operations are minimized and batched.
- [ ] Monitoring: Performance metrics are logged for debugging and optimization.

**Testing Checklist:**
- [ ] Coverage: New code has test coverage (target: 80%+).
- [ ] Happy path: Happy path is tested.
- [ ] Edge cases: Edge cases are tested (empty input, null, boundary values).
- [ ] Error cases: Error conditions are tested (exceptions, invalid input).
- [ ] Assertions: Tests have clear assertions (not just "no exception").
- [ ] Isolation: Tests are isolated and don't depend on other tests.
- [ ] Performance: Tests run quickly (< 1 second per test).
- [ ] Maintainability: Tests are clear and maintainable (good names, no duplication).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.