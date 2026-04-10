# Code Review

Systematically review pull requests by reading the diff, evaluating correctness/security/performance/readability, prioritizing feedback, and delivering actionable review comments with an approve/request-changes decision.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read the diff, understand what changed, check PR description
REASON  --> Evaluate: correctness, security, performance, readability, tests
PLAN    --> Prioritize feedback (blocking issues first, then suggestions)
ACT     --> Write review comments, make approve/request-changes decision
     \                                                              /
      +--- Act may reveal new context --- loop back to OBSERVE ----+
```

## Inputs

- `diff`: string -- The code diff (unified diff format or file-by-file changes)
- `pr_description`: string -- What the PR claims to do, linked issues, context
- `codebase_context`: string -- Surrounding code, architecture, conventions
- `task_description`: string -- Specific review focus or general review request

## Outputs

- `review_comments`: object -- List of comments with type (blocking/suggestion/nit/question/praise), location, and content
- `approval_decision`: string -- "approve", "request_changes", or "comment_only" with justification
- `summary`: string -- One-paragraph summary of the review findings

---

## Execution

### OBSERVE: Read the Diff

**Entry criteria:** A diff or set of changed files is provided.

**Actions:**
1. Read the PR description: what does the author say this PR does?
2. Read the full diff file by file, noting:
   - What files were added, modified, or deleted
   - What functions/classes were changed
   - What the net line count change is (size assessment)
3. Identify the PR scope: is this a bug fix, feature, refactor, test addition, or config change?
4. Check PR size against guidelines (see Reference: PR Sizing):
   - < 400 lines: good
   - 400-800 lines: consider if it should be split
   - > 800 lines: flag as too large
5. Identify which code paths are new vs modified
6. Note any test files changed or added
7. Check for unrelated changes mixed into the PR

**Output:** A structured summary of what changed: files affected, scope, size assessment, and any red flags (mixed concerns, missing tests, oversized PR).

**Quality gate:** Every changed file has been read. PR scope is identified. Size is assessed.

---

### REASON: Evaluate Against Review Checklist

**Entry criteria:** Diff summary is complete.

**Actions:**

Evaluate the changes against each priority level, stopping at the first BLOCKING issue found (see Reference: The Review Checklist):

1. **Priority 1 -- CORRECTNESS** (see Reference: Bug Patterns by Language):
   - Does it do what the PR description claims?
   - Are edge cases handled (null, empty, zero, negative, max values)?
   - Are error paths handled (network failures, invalid input, timeouts)?
   - Are return values checked?
   - Is state managed correctly?
   - Check for language-specific bugs (mutable defaults in Python, == vs === in JS, etc.)

2. **Priority 2 -- SECURITY** (see Reference: Security Review Checklist):
   - Input validation on all external data?
   - No SQL/command/template injection?
   - Auth and authz on every endpoint?
   - Sensitive data not logged or in URLs?
   - No hardcoded secrets?
   - Dependency vulnerabilities?

3. **Priority 3 -- PERFORMANCE** (see Reference: Performance Review Patterns):
   - No hidden O(n^2) complexity?
   - No N+1 query patterns?
   - No unnecessary allocations in hot paths?
   - Database queries have appropriate indexes?
   - No unbounded growth?

4. **Priority 4 -- READABILITY**:
   - Would you understand this code in 6 months?
   - Are names descriptive?
   - Are complex sections commented (WHY, not WHAT)?
   - Is it consistent with project style?

5. **Priority 5 -- MAINTAINABILITY** (see Reference: Architecture Review):
   - Single Responsibility maintained?
   - No copy-paste code that should be a function?
   - Dependencies flow in one direction?
   - Is it testable?

6. **Priority 6 -- TESTING** (see Reference: Testing Review):
   - Are new code paths tested?
   - Do tests cover edge cases and error paths?
   - Are tests deterministic?
   - Are tests isolated?

**Output:** A list of findings, each with: priority level, category, file location, description, and severity (blocking/suggestion/nit).

**Quality gate:** All 6 priority levels have been evaluated. Every finding has a specific location (file + line range). No findings are vague ("code could be better").

---

### PLAN: Prioritize Feedback

**Entry criteria:** Findings list is complete.

**Actions:**
1. Sort findings by severity:
   - **[blocking]**: Security, correctness, data loss risk -- must fix before merge
   - **[suggestion]**: Performance, readability, maintainability -- should fix
   - **[nit]**: Style, naming, minor improvements -- nice to fix
   - **[question]**: Seeking understanding -- no fix needed
   - **[praise]**: Highlight good work -- builds team morale
2. If > 10 comments: group related findings and consolidate
3. Determine approval decision (see Reference: Approval Criteria):
   - Any blocking issues -> Request Changes
   - Only suggestions and nits -> Approve (with optional comments)
   - Questions only -> Comment Only
4. Draft the review summary: 1-2 sentences on overall assessment
5. For each comment, structure as: Observation -> Impact -> Suggestion (see Reference: How to Give Feedback)

**Output:** Ordered list of review comments ready to post, plus approval decision and summary.

**Quality gate:** Comments are ordered by severity (blocking first). Each blocking comment explains the impact. Tone follows the "DO" guidelines (constructive, not dismissive).

---

### ACT: Write Review Comments and Decision

**Entry criteria:** Prioritized comments and approval decision are ready.

**Actions:**
1. Write each review comment following the Observation -> Impact -> Suggestion pattern:
   ```
   [blocking] This query interpolates user input directly (observation),
   which allows SQL injection attacks (impact).
   Consider using parameterized queries instead (suggestion):
   `db.execute(text('SELECT * FROM users WHERE id = :id'), {'id': user_id})`
   ```
2. Tag each comment with its type: [blocking], [suggestion], [nit], [question], [praise]
3. Include code suggestions for blocking and suggestion comments where possible
4. Write the approval decision with justification
5. Write the summary paragraph
6. Check tone: every comment should pass the "would I want to receive this?" test (see Reference: Tone Rules)

**Output:** Complete review with all comments, approval decision, and summary.

**Quality gate:** Every blocking comment has a code suggestion or clear fix path. Tone is constructive throughout. Approval decision matches the findings (no approving with unaddressed blocking issues).

---

**Loop condition:** After ACT, if writing a comment reveals that a related code path needs examination (e.g., a security issue in one file suggests the same pattern in another), loop back to OBSERVE to check the related code.

## Exit Criteria

The skill is DONE when:
- Every changed file has been reviewed
- All 6 priority levels (correctness, security, performance, readability, maintainability, testing) have been evaluated
- Every blocking issue has a specific, actionable fix suggestion
- Approval decision is made and justified
- Review tone passes the "would I want to receive this?" test

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Diff is too large to review effectively (> 800 lines) | **Escalate** -- recommend splitting the PR, review only the highest-risk files |
| OBSERVE | No PR description provided | **Adjust** -- infer scope from the diff, note that description is missing as a meta-comment |
| OBSERVE | Cannot access linked issue or context | **Adjust** -- review based on diff alone, note context gap |
| REASON | Unfamiliar with the language or framework | **Adjust** -- focus on architecture, logic, and security; skip language-specific nits |
| REASON | Cannot determine if a pattern is intentional or a bug | **Adjust** -- ask a [question] instead of flagging as blocking |
| PLAN | Too many findings (> 20) | **Adjust** -- group related findings, focus on top 10 most impactful |
| ACT | Cannot suggest a fix for a blocking issue | **Escalate** -- flag the issue with "I believe this is a problem but I'm not sure of the best fix -- let's discuss" |
| ACT | Author rejects a blocking comment or disputes the finding | **Adjust** -- engage with the specific technical objection, re-evaluate the finding with the author's context in mind, and either confirm with additional evidence or downgrade from blocking to suggestion if the concern is not confirmed; do not change the approval decision without resolving the underlying concern |
| ACT | User rejects final output | **Targeted revision** -- ask which finding category, specific comment, or severity rating fell short and rerun only that review section. Do not re-review the full diff. |

## State Persistence

Between runs, this skill saves:
- **Review history**: previous reviews for the same codebase (to check for recurring issues)
- **Project conventions**: naming, style, and architecture patterns observed
- **Known bug patterns**: language-specific bugs seen in this codebase before
- **Author context**: patterns the author tends to miss (for targeted attention)

---

## Reference

### The Review Checklist

Run through these in order. Stop at the first BLOCKING issue -- there's no point reviewing readability if the code has a security hole.

```
Priority 1: CORRECTNESS
  [ ] Does it do what the PR description claims?
  [ ] Are edge cases handled? (null, empty, zero, negative, max values)
  [ ] Are error paths handled? (network failures, invalid input, timeouts)
  [ ] Are return values checked?
  [ ] Is state managed correctly? (initialization, cleanup, transitions)

Priority 2: SECURITY
  [ ] Input validation on all external data?
  [ ] No SQL/command/template injection?
  [ ] Authentication and authorization on every endpoint?
  [ ] Sensitive data not logged, not in URLs, not in error messages?
  [ ] No hardcoded secrets, tokens, or passwords?
  [ ] Dependencies: any known vulnerabilities?

Priority 3: PERFORMANCE
  [ ] No O(n^2) or worse hidden in nested loops?
  [ ] No N+1 query patterns?
  [ ] No unnecessary allocations in hot paths?
  [ ] Database queries have appropriate indexes?
  [ ] No unbounded growth (lists, caches, queues)?

Priority 4: READABILITY
  [ ] Would you understand this code in 6 months?
  [ ] Are names descriptive? (no single-letter vars except loop indices)
  [ ] Are complex sections commented (WHY, not WHAT)?
  [ ] Is the code consistent with the project's style?

Priority 5: MAINTAINABILITY
  [ ] Single Responsibility: each function/class does one thing?
  [ ] DRY: no copy-paste code that should be a function?
  [ ] Dependencies flow in one direction? (no circular imports)
  [ ] Is it testable? (no hidden dependencies, injectable)

Priority 6: TESTING
  [ ] Are new code paths tested?
  [ ] Do tests cover edge cases and error paths?
  [ ] Are tests deterministic? (no timing dependencies, no random without seed)
  [ ] Are tests isolated? (no shared state between tests)
```

---

### Bug Patterns by Language

#### Python
```python
# Mutable default arguments
def add_item(item, items=[]):  # BUG: shared across calls
    items.append(item)
    return items
# Fix: def add_item(item, items=None): items = items or []

# Late binding closures
funcs = [lambda: i for i in range(5)]  # All return 4
# Fix: funcs = [lambda i=i: i for i in range(5)]

# Bare except
try:
    do_thing()
except:  # Catches SystemExit, KeyboardInterrupt
    pass
# Fix: except Exception as e:

# String concatenation in loop
result = ""
for s in strings:
    result += s  # O(n^2) -- creates new string each time
# Fix: result = "".join(strings)
```

#### JavaScript/TypeScript
```javascript
// == vs ===
if (x == null)     // Matches null AND undefined (sometimes intended)
if (x === null)    // Only matches null

// Floating point
0.1 + 0.2 === 0.3  // false
// Fix: Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON

// for...in on arrays
for (let i in [1, 2, 3])  // i is "0", "1", "2" (strings, not numbers)
// Fix: for (let x of [1, 2, 3]) or arr.forEach()

// async/await in forEach
items.forEach(async (item) => {  // Fires all at once, doesn't await
    await process(item);
});
// Fix: for (const item of items) { await process(item); }
// Or: await Promise.all(items.map(item => process(item)))
```

#### General (Any Language)
```
Off-by-one errors:
  - Array bounds: index from 0 to length-1, not 1 to length
  - Fence-post: n items need n-1 separators
  - Range: "up to 10" vs "up to and including 10"

Race conditions:
  - Check-then-act without locks
  - Read-modify-write without atomicity
  - Shared mutable state across threads/goroutines/async tasks

Resource leaks:
  - File handles not closed in error paths
  - Database connections not returned to pool
  - Event listeners not removed
  - Timers/intervals not cleared

Integer overflow:
  - Multiplying two int32s can exceed int32 range
  - Summing large lists can overflow
  - Timestamp arithmetic near epoch boundaries
```

---

### Security Review Checklist

#### Injection Attacks
```
SQL:     String interpolation in queries -> parameterized queries
XSS:     User input rendered as HTML -> escape/sanitize output
Command: User input in shell commands -> avoid shell, use arrays
Path:    User input in file paths -> validate, no ".." traversal
SSRF:    User-supplied URLs fetched server-side -> allowlist domains
Template: User input in template strings -> sandbox or escape
```

#### Authentication & Authorization
```
- Is auth checked on EVERY endpoint? (not just the frontend)
- Are admin endpoints protected server-side? (not just hidden in UI)
- Are JWTs validated? (signature, expiry, issuer, audience)
- Is session fixation prevented? (regenerate session ID on login)
- Are passwords hashed with bcrypt/argon2? (not MD5/SHA1)
- Is rate limiting applied to login endpoints?
```

#### Data Exposure
```
- Are API responses filtered? (don't return full DB row to client)
- Are error messages generic? (no stack traces in production)
- Are logs clean? (no passwords, tokens, PII in logs)
- Is HTTPS enforced? (HSTS header, redirect HTTP to HTTPS)
- Are CORS headers restrictive? (not Access-Control-Allow-Origin: *)
```

---

### Performance Review Patterns

#### Hidden Quadratic Complexity
```python
# Looks O(n), is O(n^2)
def has_duplicates(items):
    for item in items:
        if items.count(item) > 1:  # .count() is O(n) inside O(n) loop
            return True

# Fix: use a set
def has_duplicates(items):
    return len(items) != len(set(items))
```

#### N+1 Queries
```python
# 1 query to get users + N queries to get orders
users = db.query(User).all()
for user in users:
    orders = db.query(Order).filter_by(user_id=user.id).all()  # N+1!

# Fix: eager loading
users = db.query(User).options(joinedload(User.orders)).all()
```

#### Unnecessary Allocations
```python
# Creates intermediate list
total = sum([x * 2 for x in range(1_000_000)])  # List in memory

# Fix: generator expression
total = sum(x * 2 for x in range(1_000_000))    # Streams values
```

#### Missing Database Indexes
```
Red flags in queries:
- WHERE clause on a column without an index
- JOIN on a column without an index
- ORDER BY on a non-indexed column with LIMIT
- LIKE '%search%' (can't use index -- consider full-text search)
```

---

### Architecture Review

#### Coupling and Cohesion

```
HIGH COUPLING (bad):
  ModuleA directly instantiates ModuleB
  ModuleA knows about ModuleB's internal data structures
  Changing ModuleB requires changing ModuleA

LOW COUPLING (good):
  ModuleA depends on an interface/protocol
  ModuleA receives dependencies via injection
  Changing ModuleB's internals doesn't affect ModuleA

LOW COHESION (bad):
  UserService handles auth, profiles, billing, and email
  A class with 30 methods doing unrelated things

HIGH COHESION (good):
  AuthService handles only authentication
  Each class has a single, clear responsibility
```

#### Dependency Direction

```
GOOD: Dependencies point inward (Clean Architecture)
  Controllers -> Services -> Repositories -> Domain
  (outer layers depend on inner, never reversed)

BAD: Circular dependencies
  A imports B, B imports A
  Fix: Extract shared interface, or merge, or use events

BAD: Upward dependencies
  Domain model imports HTTP framework classes
  Fix: Domain should be framework-agnostic
```

---

### Testing Review

#### What to Check
```
Coverage gaps:
  - Happy path tested but error paths missing
  - Normal inputs tested but edge cases missing (empty, null, max)
  - New code paths not covered by any test

Brittle tests:
  - Tests that depend on execution order
  - Tests that depend on current time/date
  - Tests that compare floating point with ==
  - Tests that assert on the entire output string (breaks on any format change)

Missing assertions:
  - Test runs code but never asserts the result
  - Test only checks return value, not side effects (DB writes, events)
  - Test doesn't verify error type/message

Flaky tests:
  - Tests with sleep() for timing
  - Tests that depend on network calls
  - Tests with race conditions in setup/teardown
```

---

### How to Give Feedback

#### The Good Review Comment

```
Structure: Observation -> Impact -> Suggestion

"This query interpolates user input directly (observation),
which allows SQL injection attacks (impact).
Consider using parameterized queries instead (suggestion):
`db.execute(text('SELECT * FROM users WHERE id = :id'), {'id': user_id})`"
```

#### Comment Types

```
[blocking]     Must fix before merge. Security, correctness, data loss.
[suggestion]   Should fix. Performance, readability, maintainability.
[nit]          Nice to fix. Style, naming, minor improvements.
[question]     Seeking understanding. "Why did you choose X over Y?"
[praise]       Highlight good work. "Great use of the builder pattern here!"
```

#### Tone Rules

```
DO:
  "Consider using X because Y"
  "What do you think about X?"
  "Nice approach! One thought: ..."
  "I wonder if X could cause Y in production"

DON'T:
  "This is wrong"
  "Why would you do it this way?"
  "Obviously you should use X"
  "This code is a mess"
```

---

### PR Sizing

#### Ideal PR Size

```
< 100 lines:  Easy to review, fast turnaround
100-400 lines: Good size for most features
400-800 lines: Getting large, consider splitting
> 800 lines:   Too large. Split it.
```

#### How to Split Large PRs

```
Strategy 1: Layer by layer
  PR 1: Database migration + models
  PR 2: Service/business logic
  PR 3: API endpoints
  PR 4: Frontend integration

Strategy 2: Feature flags
  PR 1: Add feature behind flag (disabled)
  PR 2: Implement core logic
  PR 3: Add tests
  PR 4: Enable flag

Strategy 3: Extract refactoring
  PR 1: Refactor existing code (no behavior change)
  PR 2: Add new feature on clean foundation
```

---

### Approval Criteria

#### Decision Matrix

```
Approve:
  - No security issues
  - No correctness bugs
  - Tests pass and cover new code
  - Code is readable
  - Minor style nits only

Request Changes:
  - Security vulnerability found
  - Logic bug that would reach production
  - Missing tests for critical paths
  - Performance issue that would cause incidents
  - Architecture concern that's hard to fix later

Block (with explanation):
  - Data loss risk
  - Authentication/authorization bypass
  - Breaking change without migration path
  - Violates compliance requirements
```

---

### Automated Tooling

#### Complement Manual Review With

```
Linters:          ESLint, Ruff, clippy, golangci-lint
Formatters:       Prettier, Ruff format, rustfmt, gofmt
Type checkers:    TypeScript, mypy, pyright
SAST:             Semgrep, CodeQL, Bandit (Python), Brakeman (Ruby)
Dependency audit: npm audit, pip-audit, cargo audit
Test coverage:    Istanbul, coverage.py, tarpaulin
CI integration:   Run all of the above on every PR automatically
```

#### What Humans Do Better Than Tools

```
- "Does this design make sense?"
- "Will this scale to 10x traffic?"
- "Is this the right abstraction?"
- "Are we solving the right problem?"
- "Will the next developer understand this?"
```

Tools catch syntax and patterns. Humans catch design and intent.
