# Incident Hypothesis Table With Falsifying Tests

**One-line description:** Turns metric, log, trace and change evidence into a table of competing hypotheses, each with a prediction that would be true if it holds and a read-only test that could prove it false, so diagnosis proceeds by elimination instead of by the loudest guess.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `metric_findings` (object, required): From `inc-promql-red-triage`.
- `change_correlation` (object[], required): From `inc-change-correlation`.
- `loki_log_findings` (object, optional): From `inc-loki-logql-slice`.
- `cloudwatch_log_findings` (object, optional): From `inc-cloudwatch-insights-slice`.
- `trace_findings` (object, optional): From `inc-trace-tempo-traceql`.
- `stabilization_status` (object, required): From `inc-confirm-stabilization`; tells whether the system is still failing (tests can run against live failure) or mitigated (tests must use recorded evidence or a reproduction).

---

## Outputs

- `hypothesis_table` (object[]): Rows {id, statement, mechanism, supporting_evidence, prediction_if_true, falsifying_test (exact command or query), test_risk (read_only or changes_state), runtime_or_db_flow_needed, status ("open")}.

---

## Phase 1: List the Facts

### Entry Criteria
- `metric_findings` and `change_correlation` exist.

### Actions
1. Write a fact list. A fact has a value, a time, and a source. Pull them only from the inputs: onset times, first mover, new log messages, fault span, top-ranked change, saturation series, mitigation effect.
2. Write the mitigation result as a fact too. "Rollback of revision 42 restored error ratio" is strong evidence; "scale out did not help" rules out pure capacity.
3. Do NOT add anything you did not read in an input. "Probably a memory leak" is not a fact.

### Output
Numbered fact list.

### Quality Gate
- Every fact cites the input and field it came from.

---

## Phase 2: Generate Competing Hypotheses

### Entry Criteria
- Fact list exists.

### Actions
1. Write at least three hypotheses that each explain the onset time AND the first mover. Use these failure classes as prompts so you do not stop at the first idea:

| Class | Typical evidence | Test lives in |
|---|---|---|
| Bad code or config in a change | Onset follows a change on the first mover; new log message or new span | diff review, `inc-change-correlation` |
| Dependency slow or failing | Fault span in another service; its latency rose first | `inc-trace-tempo-traceql`, that service's metrics |
| Resource exhaustion in the process (threads, goroutines, event loop, heap) | Latency rises, CPU flat or throttled, stuck requests | `inc-py-spy-dump`, `inc-node-diagnostic-report`, `inc-go-pprof-capture`, `inc-jvm-jcmd-capture` |
| Database lock or connection exhaustion | Many waiting queries, pool timeouts in logs | `inc-pg-blocking-queries`, `inc-mysql-lock-waits` |
| Load or traffic shape change | Request rate or payload mix changed at onset | PromQL by route or client |
| Data-dependent bug | Errors only for some customers or inputs | log grouping by tenant or input field |
| Expired certificate, credential or quota | Sudden total failure at a clock time; TLS or 401/429 errors | `openssl s_client -connect <host>:443 -servername <host> </dev/null 2>/dev/null \| openssl x509 -noout -dates`, provider quota page |

2. For each hypothesis write the mechanism: the chain of cause and effect from the trigger to the customer symptom, in at most three steps.
3. Write prediction_if_true: something observable that MUST be true if the hypothesis holds, and that has not been checked yet.
4. Write the falsifying_test: an exact command or query whose result would make the prediction false. Prefer tests that would kill the hypothesis over tests that would only add support.

### Output
Draft hypothesis rows.

### Quality Gate
- At least three rows exist, from at least two different classes.
- Every row's falsifying_test is a literal command, query or diff to read.

---

## Phase 3: Classify Test Risk and Order

### Entry Criteria
- Draft rows exist.

### Actions
1. Mark each test read_only (queries, dumps that do not pause the process for long, reading code) or changes_state (restarts, config changes, killing queries, heap dumps that pause the process).
2. A changes_state test needs IC approval and, if the system is still failing, must not make customer impact worse. Note this in the row.
3. Order rows: read_only before changes_state; within each, the test that could eliminate the most hypotheses at once goes first.
4. Fill runtime_or_db_flow_needed with the flow name from the class table, so the chain conditions route to the right stack.

### Output
`hypothesis_table`.

### Quality Gate
- Every row has test_risk set.
- Rows are ordered with all read_only tests first.

---

## Worked Example

Illustrative only. Facts: onset 13:59:30Z; first mover checkout; revision 42 at 13:58:02Z; new log "context deadline exceeded calling pricing-v2"; fault span `GET /v2/price` 504 at 5000 ms; rollback restored error ratio.

- H1 (bad change): revision 42 switched checkout to pricing-v2, which times out. Prediction: revision 42 diff contains the pricing-v2 client and a 5 s timeout. Test: `git diff v1.17.3 v1.18.0 -- internal/pricing/`. read_only.
- H2 (dependency failing): pricing-v2 is overloaded. Prediction: pricing-v2's own p99 rose at 13:59. Test: PromQL latency query on `service_name="pricing-v2"`. read_only.
- H3 (thread or goroutine exhaustion in checkout): Prediction: goroutine count in checkout rose at onset. Test: `go_goroutines{service="checkout"}` query, then `inc-go-pprof-capture`. read_only.
- Order: H1, H2, H3.

---

## Exit Criteria

DONE when `hypothesis_table` has at least three ordered rows with mechanism, prediction, literal falsifying test, test risk and the flow needed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fewer than two facts available | **Return**: run the missing evidence flows (logs, traces) first. |
| Phase 2 | Only one hypothesis comes to mind | **Adjust**: walk the class table row by row and write one for each class the facts do not rule out. |
| Phase 2 | A test cannot be written as a command | **Adjust**: rewrite the prediction until it names something measurable. |
| Phase 3 | Every test changes state | **Stop**: get IC approval for the least risky one before running anything. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
