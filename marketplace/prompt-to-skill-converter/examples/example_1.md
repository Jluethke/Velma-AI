# Prompt-to-Skill Converter -- Converting a Code Review Prompt

## Scenario

A developer has a prompt they use for reviewing pull requests. It works well but produces inconsistent output structure -- sometimes it includes performance analysis, sometimes it doesn't. They want to convert it into a reliable, publishable skill.

## Input Prompt

```
You are a senior software engineer doing a code review.

Review the following pull request diff. Check for:
1. Correctness - does it do what the PR description says?
2. Security - any injection, auth issues, data exposure?
3. Performance - hidden O(n^2), N+1 queries, unnecessary allocations?
4. Readability - clear names, good comments, consistent style?
5. Tests - are new paths tested?

For each issue found:
- Say where it is (file and line)
- Explain why it's a problem
- Suggest a fix
- Rate it: blocking, suggestion, or nit

Give an overall approve/request-changes decision.

Be constructive, not harsh. Use "consider" instead of "you should".
```

## Phase 1: CAPTURE

### Prompt Decomposition

**Instruction blocks:**
- "Review the following pull request diff" (core task)
- "Check for: [5 categories]" (structured analysis)
- "For each issue found: [4 requirements]" (output format per finding)
- "Give an overall approve/request-changes decision" (final output)
- "Be constructive, not harsh" (constraint)

**Knowledge blocks:**
- Implicit: knows what SQL injection is, what N+1 queries are, what O(n^2) looks like
- Implicit: knows code review best practices, severity classification
- Implicit: understands what "blocking" vs "suggestion" vs "nit" means

**Format blocks:**
- Per-issue: location, explanation, fix suggestion, severity rating
- Overall: approval decision

**Constraints:**
- Tone: constructive ("consider" not "you should")
- No explicit exit criteria (when is the review "done"?)

### Quality Assessment
- **Specificity**: HIGH -- lists 5 exact categories, 4 per-issue requirements
- **Consistency**: MEDIUM -- sometimes skips performance, sometimes skips tests
- **Completeness**: MEDIUM -- no error handling, no guidance when diff is too large
- **Purpose**: Analysis (reviewing existing code)

## Phase 2: ANALYZE

### Pattern Detection

| Signal | ORPA | Phase Pipeline |
|---|---|---|
| "Review this..." (react to input) | +1 | |
| "Check for..." (scan and evaluate) | +1 | |
| 5 categories checked sequentially | | +1 |
| "For each issue" (iterate over findings) | +1 | |
| Overall decision at the end | | +1 |
| Implicit loop: issue in one file may indicate same issue elsewhere | +1 | |

**ORPA indicators: 3, Pipeline indicators: 2**

**Decision: ORPA Loop**

Justification: The prompt is reactive (reviewing existing code), the scope depends on the input (different PRs have different issues), and there's an implicit feedback loop (finding a security issue in one file should trigger checking related files).

### Phase Map

```
OBSERVE: Read the diff, understand what changed, identify PR scope
  -> Output: summary of changes, files affected, size assessment

REASON: Check each category (correctness, security, performance, readability, tests)
  -> Output: list of findings with location, explanation, severity

PLAN: Prioritize findings, decide approval
  -> Output: ordered findings list, approval decision

ACT: Write review comments with constructive tone
  -> Output: formatted review comments + approval

LOOP: If a finding suggests related issues in unchecked code, loop to OBSERVE
```

### Implicit Knowledge Inventory
1. SQL injection patterns
2. Common performance anti-patterns (O(n^2), N+1)
3. Security checklist (auth, input validation, data exposure)
4. Code review feedback patterns (observation -> impact -> suggestion)
5. Severity classification criteria
6. PR sizing guidelines

## Phase 3: STRUCTURE

### Inputs
- `diff`: string -- The code diff to review
- `pr_description`: string -- What the PR claims to do
- `codebase_context`: string -- Surrounding code and conventions
- `task_description`: string -- Specific review focus or general review

### Outputs
- `review_comments`: object -- List of comments with type, location, content
- `approval_decision`: string -- "approve", "request_changes", or "comment_only"
- `summary`: string -- One-paragraph review summary

### Quality Gates Added (missing from original prompt)
- OBSERVE gate: "Every changed file has been read. PR scope is identified."
- REASON gate: "All 5 priority categories have been evaluated. Every finding has a specific location."
- PLAN gate: "Comments are ordered by severity. Each blocking comment explains the impact."
- ACT gate: "Every blocking comment has a code suggestion. Tone is constructive throughout."

### Exit Criteria (missing from original prompt, now explicit)
- Every changed file has been reviewed
- All 5 categories evaluated
- Every blocking issue has an actionable fix
- Approval decision is made and justified
- Tone passes "would I want to receive this?" test

### Error Handling (missing from original prompt, now designed)
- Diff too large (>800 lines): escalate, recommend splitting
- Missing PR description: adjust, infer scope from diff
- Unfamiliar language: adjust, focus on logic/security, skip style nits

## Phase 4: GENERATE

### Generated manifest.json
```json
{
    "name": "code-review",
    "version": "1.0.0",
    "domain": "development",
    "tags": ["code-review", "pull-request", "security", "performance"],
    "inputs": ["diff", "pr_description", "codebase_context", "task_description"],
    "outputs": ["review_comments", "approval_decision", "summary"],
    "execution_pattern": "orpa",
    "price": "10",
    "license": "COMMERCIAL",
    "min_shadow_count": 5,
    "graduation_threshold": 0.75,
    "description": "Systematically review pull requests by reading the diff, evaluating correctness/security/performance/readability/testing, prioritizing feedback, and delivering actionable review comments with an approve/request-changes decision."
}
```

### Generated test_cases.json (2 of 5 shown)
```json
[
    {
        "input": "Review a PR that adds a user search endpoint with SQL string interpolation and N+1 queries",
        "expected_keywords": ["SQL injection", "parameterized", "N+1", "performance", "blocking", "security", "request_changes"]
    },
    {
        "input": "Review a PR that renames a variable and fixes a typo in a comment, no logic changes",
        "expected_keywords": ["approve", "nit", "readability", "no security", "no performance", "minor", "clean"]
    }
]
```

## Phase 5: VALIDATE

### Shadow Execution Results

| Test Case | Keywords Matched | Score | Pass |
|---|---|---|---|
| SQL injection PR | 7/8 (87%) | 0.87 | PASS |
| Rename-only PR | 6/7 (86%) | 0.86 | PASS |
| Auth bypass PR | 8/9 (89%) | 0.89 | PASS |
| Large PR (1200 lines) | 7/8 (87%) | 0.87 | PASS |
| PR with good tests | 6/8 (75%) | 0.75 | PASS |

**Overall consistency: 85%** (all 5 pass at >= 75%)

### Improvement Over Raw Prompt
- Raw prompt consistency: ~65% (sometimes skipped categories)
- Skill consistency: 85% (quality gates prevent skipping)
- Key improvement: explicit quality gate "All 5 priority categories have been evaluated" ensures performance and testing are always checked

### Summary

The original 15-line prompt was converted into a complete skill with:
- 4 explicit ORPA phases with quality gates
- Exit criteria that prevent incomplete reviews
- Error handling for edge cases (large PRs, missing context)
- Reference material making implicit expertise explicit (500+ lines of checklists)
- 20% consistency improvement through structured execution

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
