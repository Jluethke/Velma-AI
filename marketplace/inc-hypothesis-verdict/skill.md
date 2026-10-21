# Incident Hypothesis Verdict

**One-line description:** Runs or collects the result of each falsifying test in the hypothesis table, marks each hypothesis refuted, supported or untested by fixed rules, and accepts a cause only when it explains every fact, survived its test, and its removal ended the symptom.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`.
- `python_runtime_evidence` (object, optional): From `inc-py-spy-dump`.
- `node_runtime_evidence` (object, optional): From `inc-node-diagnostic-report`.
- `go_runtime_evidence` (object, optional): From `inc-go-pprof-capture`.
- `jvm_runtime_evidence` (object, optional): From `inc-jvm-jcmd-capture`.
- `postgres_evidence` (object, optional): From `inc-pg-blocking-queries`.
- `mysql_evidence` (object, optional): From `inc-mysql-lock-waits`.
- `timeline_log` (object[], required): From `inc-timeline-capture`; the facts and their times.

---

## Outputs

- `confirmed_cause` (object): {trigger, mechanism, contributing_conditions, evidence_for (quoted), hypotheses_refuted, confidence ("confirmed" or "probable"), remaining_unknowns}.

---

## Phase 1: Record Every Test Result

### Entry Criteria
- `hypothesis_table` has rows with falsifying tests.

### Actions
1. For each row in order, find its result: in a runtime or database evidence input (`hypotheses_affected` field), or by running its read_only test now and pasting the output.
2. Mark status with this rule:

| Test result | Status |
|---|---|
| The prediction was false | refuted |
| The prediction was true and the test could have shown it false | supported |
| The test was not run, or could not have failed | untested |

3. Do NOT mark a row supported because it "fits the story". Only a test that could have failed counts.
4. Add each result to the timeline as an `observation` with the hypothesis id.

### Output
Status per hypothesis.

### Quality Gate
- Every row has a status and a pasted output or a quoted evidence field.

---

## Phase 2: Check the Survivor Against All Facts

### Entry Criteria
- At least one row is supported.

### Actions
1. For each supported hypothesis, go through every fact in `timeline_log` of type observation, detected, mitigated and impact_start. For each, write whether the hypothesis explains it (yes, no, irrelevant).
2. A hypothesis that leaves a relevant fact unexplained is incomplete. Either it is wrong, or there is a second contributing condition. Write the unexplained fact down.
3. Apply the acceptance test:

| Condition | Confidence |
|---|---|
| Supported, explains all relevant facts, AND removing the trigger (the mitigation) ended the symptom | confirmed |
| Supported and explains all relevant facts, but the mitigation did not isolate it (for example a restart cleared several things at once) | probable |
| Supported but leaves a fact unexplained | not accepted; return to `inc-hypothesis-draft` |

4. Multiple supported hypotheses can be true together. Real incidents usually have a trigger plus conditions that let it cause harm (no timeout, no circuit breaker, a pool too small, a missing alert). Record conditions separately from the trigger.

### Output
Accepted cause with confidence, or a return to drafting.

### Quality Gate
- The fact-by-fact table exists for each supported hypothesis.
- Confidence is chosen by exactly one acceptance row.

---

## Phase 3: Write the Cause Statement

### Entry Criteria
- A hypothesis is accepted.

### Actions
1. Write `confirmed_cause` in three parts:
   - trigger: the change or event that started it, with its time.
   - mechanism: the steps from trigger to symptom.
   - contributing_conditions: each condition that made it possible or made it worse.
2. Use system language, not person language. Write "the deploy pipeline allowed a release without a timeout configured", not "the engineer forgot the timeout".
3. List remaining_unknowns: anything still unexplained. These become postmortem questions.
4. Post the cause statement in the channel for the IC to accept.

### Output
`confirmed_cause`.

### Quality Gate
- trigger has a timestamp.
- The statement contains no person's name as a cause.

---

## Worked Example

Illustrative only. Rows H1 (bad change), H2 (pricing-v2 overloaded), H3 (goroutine pileup in checkout).

- Phase 1: H1: `git diff v1.17.3 v1.18.0 -- internal/pricing/` shows the client switched to pricing-v2 with a 5 s timeout and no circuit breaker: supported. H2: pricing-v2 p99 rose from 0.9 s to 5 s at 13:59, but pricing-v2 had no traffic before 13:58 (it was new): its slowness is a cold service under full load, supported. H3: `go_runtime_evidence` shows 17,930 goroutines in `pricing.(*Client).Get`: supported.
- Phase 2: H1 plus H2 explain the onset, first mover, new log message and fault span. Rollback ended the symptom: confirmed. H3 is a consequence (contributing condition: no concurrency limit).
- Phase 3: trigger "checkout 1.18.0 deployed 13:58:02Z sent all pricing calls to pricing-v2"; mechanism "pricing-v2 was not sized for full traffic; calls hit the 5 s timeout; checkout goroutines piled up; requests failed"; conditions "no gradual rollout for the client switch, no circuit breaker, pricing-v2 capacity not load tested"; unknowns "why the canary step was skipped".

---

## Exit Criteria

DONE when every hypothesis has a status backed by output, one cause is accepted with a confidence from the acceptance table, and the cause statement lists trigger, mechanism, conditions and unknowns.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | All hypotheses refuted | **Return**: to `inc-hypothesis-draft` with the new facts the tests produced. |
| Phase 1 | A needed test changes state and is not approved | **Adjust**: mark it untested and record it under remaining_unknowns. |
| Phase 2 | No hypothesis explains all facts | **Return**: to `inc-hypothesis-draft` and add a two-cause hypothesis. |
| Phase 3 | Pressure to name a person | **Stop**: rewrite the statement in system terms before posting. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
