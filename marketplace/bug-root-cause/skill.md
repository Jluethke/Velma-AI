# Bug Root Cause

Systematically trace a software bug from symptom to root cause using fault tree analysis, the 5 Whys method adapted for code, change correlation via git history, and bug pattern classification. Track findings over time to detect recurring failure patterns.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read error message, stack trace, logs, recent changes, environment info
REASON  --> Classify bug type, trace causal chain, identify contributing factors
PLAN    --> Narrow to most likely root cause, design verification test
ACT     --> Output: root cause analysis, fix recommendation, regression test, prevention
     \                                                              /
      +--- Fix attempt may reveal deeper cause --- loop to OBSERVE +
```

## Inputs

- `error_message`: string -- The error message or symptom description
- `stack_trace`: string (optional) -- Full stack trace if available
- `logs`: string (optional) -- Relevant log output around the time of the failure
- `recent_changes`: string (optional) -- Recent commits, deploys, config changes
- `environment_info`: string (optional) -- OS, runtime version, dependencies, infra
- `bug_history`: object (optional) -- Previous bug analyses from this skill for pattern matching

## Outputs

- `root_cause_analysis`: object -- Fault tree, 5 Whys chain, contributing factors, confidence level
- `fix_recommendation`: object -- Primary fix, alternative fixes, implementation notes
- `regression_test`: object -- Test case(s) that would have caught this bug
- `prevention_measures`: object -- Systemic changes to prevent this class of bug
- `pattern_report`: object -- Similar bugs seen before, recurring pattern detection

---

## Execution

### OBSERVE: Gather Evidence

**Entry criteria:** At least an error message or symptom description is provided.

**Actions:**

1. **Parse the error signal:**
   - Extract error type/class (e.g., NullPointerException, TypeError, ConnectionRefused, HTTP 500)
   - Extract error message text
   - Extract error location (file, line, function) from stack trace
   - Identify the failing operation (what was the code trying to do?)

2. **Build the timeline:**
   - When did the bug first appear? (first error in logs)
   - When was the last known working state? (last successful operation)
   - What changed between working and broken? (commits, deploys, config, infra)
   - Is the failure consistent or intermittent? (every time vs. sometimes)
   - Is it environment-specific? (prod only, staging only, local only)

3. **Collect context:**
   - Read the failing code path (follow the stack trace)
   - Read recent changes to files in the stack trace (`git log --follow` for each file)
   - Check for related errors in surrounding log lines
   - Check external dependencies: database status, API health, resource utilization
   - Check for environment differences between working and broken contexts

4. **Classify the symptom:**
   - **Crash**: process terminates (segfault, uncaught exception, OOM)
   - **Wrong result**: code runs but produces incorrect output
   - **Performance**: code is slow, times out, or exhausts resources
   - **Data corruption**: stored data is incorrect or inconsistent
   - **Intermittent failure**: works sometimes, fails sometimes
   - **Silent failure**: code appears to succeed but doesn't do what it should

**Output:** Structured evidence package: error signal, timeline, recent changes, code context, symptom classification.

**Quality gate:** Error type and location are identified. Timeline has at least two data points (broken state and last known working state or change event). Symptom is classified.

---

### REASON: Trace the Causal Chain

**Entry criteria:** Evidence package is complete.

**Actions:**

1. **Apply the 5 Whys for Code:**
   - **Why 1**: Why did the error occur? (immediate cause -- the line that threw)
   - **Why 2**: Why was the state wrong at that point? (upstream data flow)
   - **Why 3**: Why wasn't the upstream state validated? (missing guard / check)
   - **Why 4**: Why was the invalid state possible? (design gap / assumption violation)
   - **Why 5**: Why wasn't this caught earlier? (testing / monitoring gap)
   - Continue asking "why" until you reach a systemic cause (not just a code line)

2. **Build a fault tree:**
   - Top event: the observed symptom
   - Intermediate events: each step in the causal chain (connected by AND/OR gates)
   - Basic events: the fundamental causes (leaf nodes)
   - AND gate: all child events must occur for the parent to occur
   - OR gate: any child event can cause the parent
   - Mark each basic event with: probability estimate, detectability, existing mitigations

3. **Change correlation:**
   - For each file in the stack trace, run `git log --oneline -10` to find recent changes
   - For each recent commit touching the failure path, assess:
     - Did this commit change the failing logic directly?
     - Did this commit change an input to the failing logic?
     - Did this commit change a dependency of the failing logic?
   - Use `git bisect` logic: identify the narrowest commit range between "last working" and "first broken"
   - If no code changed: check config changes, dependency updates, infrastructure changes, data changes

4. **Pattern matching against common root causes:**
   (See Reference: Root Cause Taxonomy)
   - Match the bug against known patterns for its symptom class
   - Check for environmental causes (see Reference: Environment Diff Analysis)
   - Check for concurrency causes if intermittent (see Reference: Concurrency Bug Patterns)

5. **Rank hypotheses:**
   - List all candidate root causes
   - Score each by: evidence strength (0-1), change correlation (0-1), pattern match (0-1)
   - Composite score = (evidence * 0.5) + (correlation * 0.3) + (pattern * 0.2)
   - Rank by composite score, flag ties

**Output:** Ranked list of root cause hypotheses with 5 Whys chain, fault tree, change correlation evidence, and confidence scores.

**Quality gate:** At least one hypothesis has confidence > 0.6. The 5 Whys chain reaches a systemic cause (not just "the code was wrong"). Change correlation was attempted (even if no relevant changes found). Fault tree has at least 3 levels.

---

### PLAN: Design Verification and Fix

**Entry criteria:** Ranked hypotheses with confidence scores are available.

**Actions:**

1. **Design verification test for top hypothesis:**
   - If the root cause is correct, what specific test would prove it?
   - Can you reproduce the bug in isolation? Design a minimal reproduction case.
   - What would you observe if the hypothesis is wrong? (falsification criteria)
   - Estimate effort to verify: quick (< 15 min), medium (1 hour), long (> 1 hour)

2. **Design the primary fix:**
   - What code change addresses the root cause (not just the symptom)?
   - Is the fix minimal? (smallest change that resolves the issue)
   - Does the fix introduce new risks? (regression potential)
   - Does the fix require a migration, deploy, or data backfill?
   - What's the rollback plan if the fix makes things worse?

3. **Design alternative fixes (if primary fix is risky):**
   - Hotfix: temporary mitigation (add a guard, retry, fallback)
   - Refactor fix: deeper structural change that removes the bug class entirely
   - Config fix: adjust settings without code change (timeouts, limits, feature flags)

4. **Design regression test:**
   - Write a test case that reproduces the exact failure mode
   - The test must: fail before the fix, pass after the fix
   - Include edge cases around the failure boundary
   - Specify: test type (unit/integration), setup requirements, assertions

5. **Design prevention measures:**
   - What systemic change would prevent this class of bug?
   - Options: linting rule, type annotation, input validation, monitoring alert, code review checklist item, architectural change
   - Estimate effort and impact for each prevention measure

**Output:** Verification plan, primary fix with rollback plan, alternative fixes, regression test specification, prevention measures ranked by effort/impact.

**Quality gate:** Primary fix addresses root cause (not symptom). Regression test would have caught the original bug. At least one prevention measure is systemic (not just "be more careful").

---

### ACT: Deliver Root Cause Analysis

**Entry criteria:** Fix plan and verification approach are designed.

**Actions:**

1. **Write the root cause analysis document:**
   ```
   SYMPTOM:     [What was observed]
   TIMELINE:    [When it started, what changed]
   ROOT CAUSE:  [Why it happened -- the systemic reason]
   EVIDENCE:    [What proves this is the root cause]
   CONFIDENCE:  [HIGH/MEDIUM/LOW with justification]
   ```

2. **Write the fix recommendation:**
   ```
   PRIMARY FIX:     [Code change with before/after]
   ROLLBACK PLAN:   [How to revert if fix causes issues]
   ALTERNATIVE FIX: [Safer option if primary is too risky]
   DEPLOYMENT:      [Any special deploy steps needed]
   ```

3. **Write the regression test:**
   ```
   TEST NAME:    test_[bug_description]
   SETUP:        [What state to create]
   ACTION:       [What operation to perform]
   ASSERTION:    [What to verify]
   EDGE CASES:   [Boundary conditions to also test]
   ```

4. **Write prevention measures:**
   - Immediate: what to do this sprint
   - Short-term: what to do this quarter
   - Long-term: what architectural change prevents this class of bug

5. **Update pattern database:**
   - Record this bug: symptom, root cause, fix, contributing factors
   - Check for recurring patterns: same root cause, same file, same developer, same system
   - If pattern detected: escalate to architectural review

**Output:** Complete root cause analysis with fix, regression test, prevention measures, and pattern update.

**Quality gate:** Root cause analysis explains WHY, not just WHAT. Fix has a rollback plan. Regression test is specific and deterministic. Prevention measures include at least one systemic change.

---

**Loop condition:** After ACT, if the verification test disproves the top hypothesis (evidence doesn't support it), loop back to OBSERVE with the new evidence and re-rank hypotheses.

## Exit Criteria

The skill is DONE when:
- Root cause is identified with confidence > 0.6 and supporting evidence
- The 5 Whys chain reaches a systemic cause
- A primary fix addresses the root cause (not just the symptom)
- A regression test would catch this bug if it recurred
- At least one prevention measure is systemic
- The bug pattern database is updated

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No stack trace available (e.g., silent failure) | **Adjust** -- use logs and code inspection to reconstruct the failure path; add logging recommendations |
| OBSERVE | Cannot access git history (no repo access) | **Adjust** -- skip change correlation, increase weight on pattern matching |
| OBSERVE | Bug is intermittent and cannot be reproduced on demand | **Adjust** -- collect multiple occurrence timestamps, look for correlating events (load spikes, cron jobs, cache expiry) |
| REASON | All hypotheses have confidence < 0.4 | **Escalate** -- report what's known, recommend additional data collection (more logging, tracing, monitoring) |
| REASON | Multiple hypotheses have equal confidence | **Adjust** -- design a discriminating test that would confirm one and reject others |
| PLAN | Fix requires changes to a system you don't own | **Escalate** -- document the root cause and recommended fix for the owning team |
| PLAN | Fix has high regression risk | **Adjust** -- recommend the hotfix (temporary mitigation) first, then the structural fix as a follow-up |
| ACT | Bug is a known issue in a third-party dependency | **Adjust** -- recommend workaround, file/find upstream issue, pin dependency version |

## State Persistence

Between runs, this skill saves:
- **Bug database**: every analyzed bug with symptom, root cause, fix, and contributing factors
- **Pattern index**: recurring root causes grouped by category (e.g., "null handling", "race condition", "config mismatch")
- **File hotspot map**: files that appear most frequently in bug stack traces
- **Recurrence tracker**: bugs that re-appear after being "fixed" (indicates inadequate fix or systemic issue)

---

## Reference

### Root Cause Taxonomy

#### Category 1: Logic Errors
```
Off-by-one:       Loop bounds, array indexing, fence-post problems
Wrong condition:   Inverted boolean, missing negation, wrong comparison operator
Missing case:      Unhandled enum value, missing else branch, default fallthrough
Type confusion:    String vs number, null vs undefined vs empty, int vs float
State corruption:  Wrong initialization, missing reset, stale cache
```

#### Category 2: Integration Errors
```
Contract mismatch:  Caller and callee disagree on types, order, or semantics
Version skew:       Different components running different versions
Protocol error:     Wrong HTTP method, missing headers, wrong content type
Encoding:           UTF-8 vs Latin-1, timezone-naive vs timezone-aware, big vs little endian
Serialization:      JSON null vs missing key, date format mismatch, numeric precision loss
```

#### Category 3: Concurrency Errors
```
Race condition:     Check-then-act without synchronization
Deadlock:           Two threads each holding a lock the other needs
Starvation:         One thread monopolizes a shared resource
Lost update:        Two concurrent writes, last one wins silently
Visibility:         Thread A writes, Thread B reads stale value (missing volatile/barrier)
```

#### Category 4: Resource Errors
```
Exhaustion:         OOM, disk full, file descriptor limit, connection pool empty
Leak:               Open handles not closed, growing memory without release
Timeout:            Network call exceeds deadline, database query too slow
Quota:              Rate limit hit, API quota exceeded, storage quota reached
Contention:         Lock held too long, hot partition, thundering herd
```

#### Category 5: Configuration Errors
```
Wrong value:        Typo in config, wrong URL, wrong port, wrong credentials
Missing value:      Required config not set, env var not exported
Environment mismatch: Dev config in prod, staging URL in production
Feature flag:       Flag in wrong state, stale flag, flag dependency not met
Secret rotation:    Key expired, certificate expired, token revoked
```

#### Category 6: Data Errors
```
Schema drift:       Code expects column/field that no longer exists
Constraint violation: Null in non-null column, unique constraint, foreign key
Encoding corruption: Mojibake, binary data in text field, truncated multibyte char
Volume:             Query returns 10M rows when code expected 100
Migration:          Incomplete migration, migration order dependency, rollback corruption
```

### Environment Diff Analysis

When a bug appears in one environment but not another:

```
1. Runtime version:     Python 3.11 vs 3.12, Node 18 vs 20, JDK 17 vs 21
2. OS differences:      Linux vs macOS vs Windows (path separators, line endings, case sensitivity)
3. Memory/CPU:          Local machine 32GB RAM vs container with 512MB limit
4. Network:             Direct connection vs proxy vs VPN vs firewall rules
5. Dependencies:        Locked versions vs floating versions, native extensions compiled differently
6. Configuration:       Different .env files, different config maps, different secrets
7. Data:                Different database state, different seed data, different data volume
8. Time:                Different timezone, different system clock, different NTP sync
9. Permissions:         Different filesystem permissions, different IAM roles, different network policies
10. Concurrency:        Single-threaded local vs multi-instance prod, different worker counts
```

### Concurrency Bug Patterns

```
Pattern: Time-of-check-to-time-of-use (TOCTOU)
  Symptom:  Intermittent failures, "impossible" states
  Example:  if file.exists(): file.read()  # file deleted between check and read
  Fix:      Use atomic operations, handle the error at use-time instead of checking first

Pattern: Stale read
  Symptom:  Code uses outdated data, "already processed" errors
  Example:  Read record, do work, update record -- but another worker updated it in between
  Fix:      Optimistic locking (version column), compare-and-swap, SELECT FOR UPDATE

Pattern: Connection pool exhaustion
  Symptom:  Periodic timeouts, "cannot acquire connection" errors
  Example:  Long-running transaction holds connection, pool drains under load
  Fix:      Set statement_timeout, use connection pool monitoring, release connections in finally blocks

Pattern: Deadlock
  Symptom:  Process hangs indefinitely, no error message
  Example:  Thread A locks table X then tries table Y; Thread B locks Y then tries X
  Fix:      Always acquire locks in the same global order, use lock timeouts, reduce lock scope
```

### The 5 Whys for Code -- Worked Example

```
Bug: Users see "500 Internal Server Error" on the order page

Why 1: Why does the order page return 500?
  → The order_service.get_order() raises a TypeError: "NoneType has no attribute 'price'"

Why 2: Why is the price attribute None?
  → The order has a product_id that references a product that was deleted from the database

Why 3: Why wasn't the missing product handled?
  → The code does product = db.get(Product, order.product_id) and immediately accesses
    product.price without checking if product is None

Why 4: Why is it possible to delete a product that has active orders?
  → The product deletion endpoint doesn't check for existing order references.
    There's no foreign key constraint (soft-delete was planned but never implemented)

Why 5: Why wasn't this caught in testing?
  → Tests always create fresh products and never test the deletion + order interaction.
    No integration test covers the cross-service dependency.

ROOT CAUSE: Missing referential integrity -- products can be deleted while orders
reference them, and the order code path assumes products always exist.

FIX: Add null check in order_service (immediate), add foreign key constraint (structural),
add integration test for delete-then-access (regression).
```

### Fault Tree Notation

```
       [TOP EVENT]
      /     |     \
   [AND]  [OR]   [OR]
   / \     |     / \
 [A] [B]  [C]  [D] [E]     ← Basic events (leaf nodes)

AND gate (∧): ALL children must occur for parent to occur
  Use when multiple conditions must coincide (race condition: timing AND state AND load)

OR gate (∨): ANY child can cause parent to occur
  Use when multiple independent paths lead to the same failure

Basic events: Assign each a probability estimate
  Certain:  > 0.9  (proven by evidence)
  Likely:   0.6-0.9 (strong evidence, not conclusive)
  Possible: 0.3-0.6 (some evidence, other explanations exist)
  Unlikely: < 0.3  (weak evidence, mostly speculation)
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
