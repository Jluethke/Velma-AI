# Debugging Strategies

Systematically investigate and fix bugs by observing symptoms, hypothesizing root causes, planning investigation strategies, and executing fixes with verification.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read the error, reproduce the bug, gather context
REASON  --> Hypothesize root cause, classify bug type
PLAN    --> Choose investigation strategy (binary search, bisect, profiling)
ACT     --> Execute investigation, apply fix, verify fix, add regression test
     \                                                              /
      +--- Loop back to OBSERVE if fix doesn't hold ---------------+
```

## Inputs

- `error_description`: string -- What is going wrong (error message, unexpected behavior)
- `stack_trace`: string -- Stack trace or error output if available
- `reproduction_steps`: string -- How to trigger the bug (if known)
- `codebase_context`: string -- Relevant source code, configuration, or system context
- `task_description`: string -- Specific debugging task or general investigation request

## Outputs

- `root_cause_analysis`: object -- Identified root cause with evidence chain
- `fix_recommendation`: string -- Code change or configuration fix with explanation
- `regression_test`: string -- Test case that would catch this bug if it reappears
- `investigation_log`: object -- What was tried, what was ruled out, and why

---

## Execution

### OBSERVE: Read the Error, Reproduce, Gather Context

**Entry criteria:** A bug report, error message, or unexpected behavior is described.

**Actions:**
1. Read the exact error message and stack trace (see Reference: Reading Error Messages):
   - Python: read bottom to top, last frame is where exception was raised
   - Java: read top to bottom, look for "Caused by:" (root cause is the last one)
   - Node.js: read top to bottom, ignore internal frames (node:internal/*)
   - Find YOUR code in the trace -- the bug is at the boundary
2. Document what SHOULD happen vs what DOES happen
3. Reproduce the bug:
   - Every time? Sometimes? Only under specific conditions?
   - What are the exact steps to trigger it?
   - What environment is it in? (dev, staging, production)
4. Gather context:
   - What changed recently? (`git log --oneline -20`)
   - Check dependency updates
   - Check infrastructure changes (DNS, TLS cert, disk space)
   - Check external service status
5. Use the self-explanation template (see Reference: Rubber Duck Debugging):
   - "I'm trying to: [goal]"
   - "I expected: [expected behavior]"
   - "Instead, I see: [actual behavior]"
   - "I've already checked: [what you've ruled out]"

**Output:** Bug observation report listing: exact error, reproduction steps, environment, what changed, and initial context.

**Quality gate:** Error message is recorded exactly (not paraphrased). Reproduction steps exist (or "not yet reproducible" is noted). Recent changes are checked.

---

### REASON: Hypothesize Root Cause, Classify Bug Type

**Entry criteria:** Bug observation report is complete.

**Actions:**
1. Classify the bug type (see Reference: Common Bug Categories):
   - "It Works on My Machine" -> environment differences (OS, language version, config, data, deps)
   - Intermittent failures -> race condition, resource exhaustion, timing, external dependency
   - "Nothing Changed" -> something DID change, find it (git log, deps, infra, cron jobs)
   - Performance regression -> profile first, guess never (see Reference: Performance Regression)
   - Memory leak -> growing memory over time (see Reference: Memory Leaks)
2. Generate 2-3 hypotheses ranked by likelihood:
   - Consider the error message literally (not what you think it says)
   - Consider the most common cause for this type of error
   - Consider what changed recently
3. For each hypothesis, define:
   - What you would expect to see if this hypothesis is correct
   - What you would expect to see if this hypothesis is wrong
4. Rank hypotheses by: likelihood first, then ease of testing

**Output:** Classified bug type with 2-3 ranked hypotheses, each with expected evidence if true/false.

**Quality gate:** At least 2 hypotheses are generated. Each has a testable prediction. Bug type is classified. No hypothesis is "maybe it's the framework" without specific evidence.

---

### PLAN: Choose Investigation Strategy

**Entry criteria:** Hypotheses are ranked with testable predictions.

**Actions:**
1. Choose the primary investigation strategy:
   - **Binary search in code** (see Reference: Binary Search Debugging): when you don't know WHERE the bug is, bisect the code path with debug output at midpoints
   - **Binary search in time** (`git bisect`): when you know it used to work, find the commit that broke it
   - **Binary search in systems**: when the bug spans services, check each layer boundary
   - **Profiling**: when the bug is a performance regression, profile before guessing
   - **Log analysis**: when the bug is in production, trace the request through logs using correlation IDs
2. Follow the escalation path (see Reference: Debugging Escalation Path):
   - 0-15 min: read errors, check logs, form hypothesis
   - 15-30 min: binary search, add logging, test hypothesis
   - 30-60 min: step back, re-examine assumptions
   - 1-2 hours: pair with someone
   - 2+ hours: write up everything you know
3. Determine what tools to use (see Reference: Debugging Tools by Ecosystem)
4. Plan the investigation steps: which hypothesis to test first, what to change, what to measure
5. Commit to changing ONE variable at a time (the cardinal rule)

**Output:** Investigation plan with strategy, tools, steps, and timeline.

**Quality gate:** Strategy is chosen with justification. Investigation steps test one variable at a time. Escalation triggers are defined (when to step back, when to pair).

---

### ACT: Execute Investigation, Apply Fix, Verify

**Entry criteria:** Investigation plan is ready.

**Actions:**
1. Execute the investigation following the plan:
   - Test the top-ranked hypothesis first
   - Change one variable at a time
   - Record what was tried and what was observed
2. If hypothesis is confirmed:
   - Identify the exact root cause
   - Write the fix
   - Verify the fix resolves the issue AND doesn't break anything else
   - Write a regression test that fails without the fix and passes with it
3. If hypothesis is rejected:
   - Document why (what evidence disproved it)
   - Move to the next hypothesis
4. Apply the 30-minute rule (see Reference: When to Step Back):
   - If stuck for 30 min on the same hypothesis, stop and re-examine assumptions
   - List every assumption you're making
   - Question the ones you're most certain about
   - Re-read the error message literally
   - Check if you're looking at the right code (right branch, right deploy, right file)
5. For production debugging, follow safe practices (see Reference: Safe Production Debugging)
6. Use structured logging for investigation (see Reference: Log-Based Debugging)

**Output:** Root cause analysis with evidence, fix (code change or configuration), regression test, and investigation log.

**Quality gate:** Root cause is identified with evidence (not just "it works now"). Fix is verified to resolve the issue. Regression test catches the bug. Investigation log documents what was tried and ruled out.

---

**Loop condition:** After ACT, if the fix doesn't hold (bug reappears under different conditions, or fix introduces a new bug), loop back to OBSERVE with the new symptoms. If the investigation reaches the 2-hour escalation point without progress, escalate.

## Exit Criteria

The skill is DONE when:
- Root cause is identified with supporting evidence
- Fix is applied and verified
- Regression test exists that catches this bug type
- Investigation log documents the full path from symptom to fix
- The fix doesn't introduce new issues

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Cannot reproduce the bug | **Adjust** -- add logging/instrumentation to capture the next occurrence, check if it's environment-specific |
| OBSERVE | No error message or stack trace | **Adjust** -- add error handling and logging to the suspected area, then reproduce |
| REASON | No plausible hypothesis | **Escalate** -- write up everything known, share with team, request fresh eyes |
| REASON | Too many equally likely hypotheses | **Adjust** -- add more logging to narrow down, focus on the cheapest to test first |
| PLAN | Investigation requires production access | **Adjust** -- use observability stack (metrics -> traces -> logs), avoid direct production debugging |
| ACT | Fix works but root cause is still unclear | **Adjust** -- document the fix, add monitoring, schedule follow-up investigation |
| ACT | Stuck for 30+ minutes on same hypothesis | **Retry** -- step back, re-examine assumptions, try a fundamentally different approach |
| ACT | 2+ hours without progress | **Escalate** -- pair with someone, write up and share |

## State Persistence

Between runs, this skill saves:
- **Investigation log**: what was tried, what was ruled out, and what the root cause was
- **Bug pattern catalog**: recurring bug types in this codebase (for faster future diagnosis)
- **Environment baseline**: known-good configuration for comparison
- **Regression tests**: tests added for previously fixed bugs

---

## Reference

### The Scientific Method for Bugs

```
1. OBSERVE    What exactly is happening? (not what you think is happening)
              - Exact error message, stack trace, log output
              - Steps to reproduce (every time? sometimes? only on Tuesdays?)
              - What SHOULD happen vs what DOES happen

2. HYPOTHESIZE  What could cause this?
              - List 2-3 plausible explanations
              - Rank by likelihood
              - Start with the most likely

3. TEST       Design an experiment that proves or disproves the hypothesis
              - Change ONE variable at a time
              - If the hypothesis is right, what would you expect to see?
              - If it's wrong, what would you see instead?

4. CONCLUDE   What did the test tell you?
              - Hypothesis confirmed -> fix the bug
              - Hypothesis rejected -> move to the next one
              - Inconclusive -> design a better test
```

#### The Cardinal Rule

**Change one thing at a time.** If you change three things and the bug goes away, you don't know which change fixed it. You might have introduced a new bug and masked the old one.

---

### Binary Search Debugging

#### In Code

```python
# Bug: process(data) returns wrong result

# Step 1: Check the midpoint
def process(data):
    parsed = parse(data)
    print(f"DEBUG: parsed = {parsed}")  # <-- Is parsed correct?
    transformed = transform(parsed)
    validated = validate(transformed)
    return format_output(validated)

# If parsed is correct -> bug is in transform/validate/format
# If parsed is wrong -> bug is in parse
# Repeat: bisect the remaining half
```

#### In Time (git bisect)

```bash
# Find which commit introduced the bug
git bisect start
git bisect bad                    # Current commit is broken
git bisect good v1.2.0            # This tag worked fine

# Git checks out the midpoint. Test it.
python -m pytest tests/test_checkout.py
git bisect good                   # This commit works -> bug is newer
# or
git bisect bad                    # This commit is broken -> bug is older

# Repeat until git finds the exact commit (log2(n) steps)

# Automated version:
git bisect start HEAD v1.2.0
git bisect run pytest tests/test_checkout.py -x
# Git runs the test automatically and finds the first bad commit
```

#### In Systems

```
Bug: "The API returns 500"

Step 1: Is the request reaching the server?       (check nginx access log)
Step 2: Is the server processing it?               (check application log)
Step 3: Is the database query succeeding?           (check slow query log)
Step 4: Is the response correct before serialization? (add logging)

Each step halves the search space.
```

---

### Rubber Duck Debugging

Explain the problem out loud (to a rubber duck, a colleague, or a text file). The act of articulating the problem forces you to:

1. State your assumptions explicitly (often reveals the wrong one)
2. Walk through the code path step by step (often reveals the skipped step)
3. Notice the gap between "what I think happens" and "what actually happens"

#### Template for Self-Explanation

```
I'm trying to: [goal]
I expected: [expected behavior]
Instead, I see: [actual behavior]
I've already checked: [what you've ruled out]
My current hypothesis is: [best guess]
The thing I haven't checked yet is: [blind spot]
```

Most of the time, writing the last line reveals the answer.

---

### Reading Error Messages

#### Stack Traces

```
Python: Read BOTTOM to TOP. The last frame is where the exception was raised.
Java:   Read TOP to BOTTOM. First line is the exception, then the call chain.
         Look for "Caused by:" -- the root cause is usually the LAST "Caused by:"
Node.js: Read TOP to BOTTOM. Ignore internal frames (node:internal/*)

For all: Find YOUR code in the trace. The bug is at the boundary between
your code and the thing that threw the error.
```

#### Example: Reading a Python Traceback

```
Traceback (most recent call last):
  File "main.py", line 45, in handle_request        # Your code called process_order
    result = process_order(order_data)
  File "orders.py", line 112, in process_order       # process_order called calculate_total
    total = calculate_total(items)
  File "pricing.py", line 78, in calculate_total     # Bug is HERE
    return sum(item.price * item.quantity for item in items)
TypeError: unsupported operand type(s) for *: 'NoneType' and 'int'

# Translation: item.price is None for some item.
# Question: Which item? Add: print([i.price for i in items]) before line 78
```

#### Error Code Patterns

```
HTTP 4xx: Client's fault. Check the request (headers, body, auth, URL)
HTTP 5xx: Server's fault. Check the server logs.
ECONNREFUSED: Server isn't running or wrong port.
ETIMEDOUT: Server is running but not responding (firewall, overloaded).
ENOENT: File or directory doesn't exist. Check the path.
EPERM/EACCES: Permission denied. Check file permissions or run context.
ENOMEM: Out of memory. Check for leaks or increase limits.
```

---

### Common Bug Categories

#### "It Works on My Machine"

```
Investigation:
1. Environment: OS, language version, installed packages
   -> Compare with: pip freeze / npm ls / cargo tree
2. Configuration: env vars, config files, feature flags
   -> Compare with: env | sort
3. Data: local DB has different data than staging
   -> Compare with: key record counts, schema versions
4. Dependencies: different versions in lockfile vs installed
   -> Compare with: diff package-lock.json
5. File system: case sensitivity (macOS is case-insensitive, Linux is not)

Fix: Docker. If it works in the same container, it's an env issue.
```

#### Intermittent Failures

```
Investigation:
1. Race condition: Two threads/requests accessing shared state
   -> Test: Add artificial delays (sleep) at suspected points
   -> Fix: Locks, atomic operations, or eliminate shared state

2. Resource exhaustion: Running out of connections, memory, file handles
   -> Test: Monitor resource usage during failure window
   -> Fix: Connection pooling, resource limits, cleanup on error paths

3. Timing: Test depends on wall clock time, time zones, DST
   -> Test: Run with different system clocks, mock time
   -> Fix: Use monotonic clock, inject time dependency

4. External dependencies: Flaky network, rate limiting, DNS resolution
   -> Test: Check correlation with external service status
   -> Fix: Circuit breaker, retry with backoff, local fallback
```

#### "Nothing Changed"

```
Investigation:
1. git log --oneline -20     # Something DID change. Find it.
2. git diff HEAD~5           # Check recent commits
3. Check dependency updates  # npm audit, pip list --outdated
4. Check infrastructure      # DNS, TLS cert expiry, disk space, OOM kills
5. Check external services   # API provider changed, rate limits, deprecations
6. Check cron jobs            # Did a scheduled task modify data?

The answer is NEVER "nothing changed." Something always changed.
```

#### Performance Regression

```
Investigation:
1. Profile first, guess never
   Python: cProfile, py-spy, line_profiler
   Node.js: --prof flag, clinic.js, 0x
   Java: VisualVM, async-profiler, JFR
   Go: pprof (CPU, memory, goroutine profiles)

2. Flame graphs: visual stack trace over time
   -> Look for wide bars (functions that take the most time)
   -> Look for tall spikes (deep call stacks, possible recursion)

3. Before/after benchmarks
   -> Run the same workload on the old code and new code
   -> Compare: latency p50/p99, throughput, memory usage

4. Common culprits:
   - New O(n^2) loop where O(n) existed before
   - Logging in a hot path (I/O in tight loops)
   - Missing database index after schema change
   - Serialization/deserialization overhead (JSON.parse in a loop)
```

#### Memory Leaks

```
Investigation:
1. Confirm it's a leak: monitor memory over time
   -> If memory grows linearly with requests -> leak
   -> If memory grows then stabilizes -> just caching, probably fine

2. Heap snapshots: take snapshot A, run workload, take snapshot B
   -> Compare: what objects were allocated between A and B?
   -> Look for: growing arrays, maps, caches without eviction

3. Common causes:
   - Event listeners added but never removed
   - Closures capturing large objects
   - Caches without size limits or TTLs
   - Circular references preventing GC (rare in modern runtimes)
   - Global variables accumulating state

4. Tools:
   Python: tracemalloc, objgraph, memray
   Node.js: --inspect + Chrome DevTools Memory tab
   Java: jmap, Eclipse MAT, JFR
   Go: pprof heap profile
```

---

### Debugging Tools by Ecosystem

#### Python
```
pdb/ipdb:         Interactive debugger. breakpoint() in code.
py-spy:           Sampling profiler. No code changes needed.
tracemalloc:      Memory allocation tracker.
logging:          Built-in. Use structured logging (structlog).
rich.traceback:   Pretty tracebacks with local variables.
pytest --pdb:     Drop into debugger on test failure.
```

#### JavaScript/TypeScript
```
Chrome DevTools:  Debugger, profiler, memory, network.
console.table():  Format arrays/objects as tables.
debugger;         Breakpoint in code (works in Chrome + Node --inspect).
node --inspect:   Attach Chrome DevTools to Node process.
ndb:              Improved Node.js debugging experience.
```

#### General
```
strace/dtrace:    Trace system calls (file, network, process).
tcpdump/wireshark: Network packet capture and analysis.
curl -v:          Verbose HTTP request/response (see headers, timing).
jq:               Parse and filter JSON on the command line.
diff:             Compare outputs, configs, logs side-by-side.
```

---

### Log-Based Debugging

#### Structured Logging

```python
# BAD: Unstructured
logger.info(f"User {user_id} placed order {order_id} for ${total}")

# GOOD: Structured (machine-parseable, filterable)
logger.info("order_placed", extra={
    "user_id": user_id,
    "order_id": order_id,
    "total": total,
    "items": len(items),
    "payment_method": method,
})
```

#### Correlation IDs

```
Assign a unique ID to each request. Pass it through every service.
When debugging, filter ALL logs by that correlation ID to see
the complete journey of a single request across all services.

Request -> API (corr_id=abc) -> Auth (corr_id=abc) -> DB (corr_id=abc)
Filter: grep "abc" across all service logs -> complete picture
```

#### Log Levels

```
DEBUG:   Detailed info for debugging. Disabled in production.
INFO:    Normal operations. "Server started", "Request processed."
WARNING: Unexpected but recoverable. "Retry attempt 2 of 3."
ERROR:   Something failed. "Database connection refused."
CRITICAL: System is unusable. "Out of disk space."

In production: INFO and above.
When debugging: temporarily enable DEBUG for the affected module.
```

---

### Production Debugging

#### Observability Stack

```
Metrics -> "Something is wrong" (CPU spike, error rate increase)
Traces  -> "Where is it wrong?" (which service, which endpoint)
Logs    -> "Why is it wrong?" (the actual error message and context)

Always go: Metrics -> Traces -> Logs (wide to narrow)
Never start with logs (too much noise, no direction)
```

#### Safe Production Debugging

```
1. Feature flags: Disable the suspected feature without deploying
2. Canary deploys: Route 1% of traffic to a debug build
3. Dynamic log levels: Increase verbosity without restart
4. Read-only queries: Investigate data without modifying it
5. Profiling with sampling: py-spy, async-profiler (low overhead)

NEVER in production:
- Attach a debugger (blocks the process)
- Add print statements (requires deploy)
- Modify data to "test" (now you have two bugs)
```

---

### When to Step Back

#### The 30-Minute Rule

```
If you've been testing the SAME hypothesis for more than 30 minutes
without progress, you're probably wrong about something fundamental.

STOP and:
1. List every assumption you're making
2. Question the ones you're most certain about (those are the dangerous ones)
3. Re-read the error message literally (not what you think it says)
4. Check if you're looking at the right code (right branch, right deploy, right file)
5. Take a 10-minute break (your subconscious will keep working)
```

#### Debugging Escalation Path

```
0-15 min:  Read error messages, check logs, form hypothesis
15-30 min: Binary search, add logging, test hypothesis
30-60 min: Step back, re-examine assumptions, try different approach
1-2 hours: Pair with someone. Fresh eyes find bugs faster.
2+ hours:  Write up everything you know. Post in team chat.
           The act of writing often reveals the answer.
           If not, someone else might spot it.
```

#### Signs You're On the Wrong Track

```
- "This is impossible" -> You're missing a piece of information
- "I've checked everything" -> You haven't. List what you checked.
- "The bug is random" -> It's not. You haven't found the pattern.
- "It must be a framework/library bug" -> It's almost never the framework.
  (But sometimes it is. Check the issue tracker.)
```
