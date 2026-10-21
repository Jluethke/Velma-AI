# Resilience Verification Report

**One-line description:** Verifies that every resilience control is configured as planned and proven live: a plan-versus-code conformance table, an evidence matrix that requires a passing test and a fault-run observation per control, a retry amplification measurement from metrics, and a k6 threshold run whose exit code gates the verdict.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.
- `retry_policy` (object[], required): Output of `res-retry-policy`.
- `breaker_policy` (object[], required): Output of `res-breaker-policy`.
- `fault_results` (object[], required): Output of `res-toxiproxy-faults`.
- `chaos_journal` (object, optional): Output of `res-chaos-experiment`, when one was run.
- `request_deadline_ms` (number, required): Inbound request deadline.

---

## Outputs

- `verification_report` (object): `conformance` table (plan value, code value, file:line, match), `evidence_matrix` (control x dependency with test result and fault observation), `amplification` per dependency, `k6_gate` (command, thresholds, exit code), `verdict` (PASS only if every row passes), `open_questions` collected from all inputs, and `failures` each routed to its owning flow.

---

## Phase 1: Plan Versus Code Conformance

### Entry Criteria
- All plan inputs present.

### Actions
1. For each dependency and each planned value (per-try timeout, connect timeout, max attempts, backoff base and cap, breaker thresholds, bulkhead limit), find the value in code or config with `rg -n` on the key or constructor recorded in the earlier flows' change lists, and copy the line.
2. Normalize units before comparing (seconds versus milliseconds; `750ms` in YAML versus `0.75` in Python; cockatiel `maxAttempts` counts retries, resilience4j `max-attempts` counts calls). Write the conversion.
3. Mark `match` true only when the normalized values are equal. A value only in a default (not written) is a mismatch unless the plan said "library default".
4. Do NOT accept "similar" values. 700 ms in code against 750 ms in the plan is a mismatch.

### Output
`conformance` table.

### Quality Gate
- Every planned value has a row with a file:line or "not found".
- Unit conversions are written for every row that needed one.

---

## Phase 2: Evidence Matrix and Amplification

### Entry Criteria
- Conformance table complete.

### Actions
1. Build the matrix: rows are dependencies, columns are controls (timeout, retry, budget, breaker, bulkhead, fallback, rate limit, idempotency, health probes). Each cell needs two items: a passing automated test name from the stack flow's change list, and a PASS row in `fault_results` (or a `chaos_journal` conclusion) for the related fault. A cell with either item missing is FAIL. A control not applicable to a dependency is marked "n/a" with the reason from the plan.
2. Re-run the automated tests named in the matrix with the project's test command and record the summary line; do not rely on earlier results.
3. Retry amplification during the "slow beyond timeout" fault: from Prometheus, `sum(rate(<client request count metric>{peer="<dep>"}[5m])) / sum(rate(<server request count metric>{route=~"<routes that call dep>"}[5m]))` over the fault window. The ratio must be at most `max_attempts` from `retry_policy`, and with a budget it must settle near `1 + budget ratio` once the budget drains. Record both numbers.
4. If amplification exceeds `max_attempts`, another retry layer still exists; record a FAIL routed to `res-retry-policy` with the `layers_to_disable` check.

### Output
`evidence_matrix` and `amplification`.

### Quality Gate
- Every matrix cell is PASS, FAIL, or n/a with a reason.
- Every amplification ratio is computed from a saved PromQL result.

---

## Phase 3: k6 Threshold Gate and Verdict

### Entry Criteria
- Matrix built.

### Actions
1. Write `gate.js` with thresholds taken from inputs, not invented:
   ```js
   import http from 'k6/http';
   export const options = {
     scenarios: { s: { executor: 'constant-arrival-rate', rate: Number(__ENV.RATE), timeUnit: '1s', duration: '10m', preAllocatedVUs: 200 } },
     thresholds: {
       http_req_duration: [`p(99)<=${__ENV.DEADLINE_MS}`],
       http_req_failed: [`rate<=${__ENV.MAX_ERROR_RATIO}`],
     },
   };
   export default function () { http.get(__ENV.TARGET); }
   ```
   `RATE` is the measured normal rate, `DEADLINE_MS` is `request_deadline_ms`, `MAX_ERROR_RATIO` is the SLO error budget value from the user (the same `max_value` as the chaos steady state when one exists).
2. Run it twice in the test environment: no faults, and with the most severe passing fault from `fault_results` applied (for example the blackhole toxic on the most critical dependency with a fallback). Command: `k6 run -e RATE=<r> -e DEADLINE_MS=<ms> -e MAX_ERROR_RATIO=<x> -e TARGET=<url> gate.js; echo "exit=$?"`.
3. k6 exits with code 99 when a threshold fails and 0 when all pass. Record the exit codes.
4. Verdict: PASS only when every conformance row matches, every matrix cell is PASS or n/a, amplification is within limits, and both k6 runs exit 0. Otherwise FAIL with each failing item routed to its owning flow.
5. Collect every `open_questions` entry from all inputs into the report; an open question is not a failure but must be listed.
6. Do NOT write PASS when any check was skipped. A skipped check is a FAIL with reason "not run".

### Output
`verification_report`.

### Quality Gate
- Both k6 exit codes are recorded as numbers.
- The verdict is consistent with the rows: grep the report for "FAIL"; if any exists, the verdict is FAIL.

---

## Worked Example

Illustrative. Service `checkout`, dependencies `payments`, `fraud-score`, `redis`.

Phase 1: 14 planned values; 13 match. `fraud-score` per-try plan 930 ms, code `httpx.Timeout(0.9)` at `clients/fraud.py:12`: mismatch.

Phase 2: matrix cell `redis` x bulkhead: test `test_redis_bulkhead_isolation` passed, but no fault row: FAIL ("not run"). Amplification for `payments` during blackhole: `1.98` (max 2) in the first minute, then `1.19` after the budget drained (ratio 0.2): PASS.

Phase 3: no-fault run `exit=0`; blackhole on payments `exit=99` because `http_req_failed` reached 0.31 (payments is fail_fast, every order fails during the fault). Verdict FAIL, with three items: fraud timeout mismatch to `res-py-timeouts`, redis bulkhead fault run to `res-toxiproxy-faults`, and the fault-time error ratio as an open question for the owner (fail_fast on payments makes the SLO unreachable during a payments outage by design).

---

## Exit Criteria

DONE when the report contains a conformance table, a fully filled evidence matrix, measured amplification, two k6 exit codes, all collected open questions, and a verdict that follows mechanically from those rows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Planned value not found in code | **Return**: FAIL row routed to the stack flow that should have written it. |
| Phase 2 | Named test no longer exists | **Return**: FAIL; a deleted test is missing evidence. |
| Phase 2 | No client request metric per dependency | **Adjust**: count calls at Toxiproxy or the mesh (`upstream_rq_total`) for the same window. |
| Phase 3 | k6 exit code other than 0 or 99 | **Retry**: the script or environment failed; fix and rerun before judging. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
