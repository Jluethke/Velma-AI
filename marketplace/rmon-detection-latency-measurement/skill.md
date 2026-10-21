# Detection Latency against the FTTI

**One-line description:** Measures, from monitor event logs on one monotonic clock, the fault-to-trip latency and the trip-to-safe-state latency for every detected `must_trip` case, reports the maximum and the distribution per check, and compares the worst-case sum with the fault tolerant time interval (ISO 26262-1 term) from the hazard analysis.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_fault_results` (object[], required): Output of `rmon-py-pytest-fault-injection` (empty for a C++ stack).
- `cpp_fault_results` (object[], required): Output of `rmon-cpp-gtest-fault-injection` (empty for a Python stack).
- `ftti_ms` (number, required): FTTI per hazard from the hazard analysis, as a map `hazard_id -> ms` or one value.
- `monitor_log_schema` (object, required): Output of `rmon-monitor-log-schema` (field names for times and events).

---

## Outputs

- `latency_report` (object): Per check: `n`, `max_detect_ms`, `p50`, `p99` (only when n is 100 or more, so the 99th percentile is an observed sample rather than an extrapolation), `max_react_ms`, `max_total_ms`, the FTTI it maps to, verdict `within` or `exceeds` or `not_measured`, and the list of cases with the worst latencies.

---

## Phase 1: Extract Time Points

### Entry Criteria
- Results contain `t_inject_ns` and `t_detect_ns` for detected cases.
- Reaction time needs a measured safe-state signal (for example `state_change` to `SAFE_STOPPED` logged when zero speed is measured). Unit-level results have no physical reaction; their reaction is `not_measured`.

### Actions
1. For each detected case compute `detect_ms = (t_detect_ns - t_inject_ns) / 1e6`.
2. Where logs exist from rig or closed-course runs, find the `state_change` record to `SAFE_STOPPED` after the trip and compute `react_ms = (t_safe_ns - t_detect_ns) / 1e6`:
   ```
   jq -c 'select(.event=="state_change" and .switch_state=="SAFE_STOPPED" and .t_mono_ns > <t_detect_ns>)' events.jsonl | head -1
   ```
3. Confirm all times come from the same host's monotonic clock (`t_mono_ns`). If injection time came from another host, the latency is invalid unless the clock offset bound is documented; mark such rows `clock_unverified`.
4. Fake-clock unit results measure logic latency in samples, not real time. Label them `logic_only`.

### Output
Per-case latency rows.

### Quality Gate
- Every detected `must_trip` case has a `detect_ms` or a reason it is missing.
- No row mixes clocks without a `clock_unverified` flag.

---

## Phase 2: Compare with the FTTI

### Entry Criteria
- Latency rows exist.

### Actions
1. Map each check to its hazard through `operating_envelope` and `fallback_strategy`, then to `ftti_ms`.
2. Per check compute `max_detect_ms`, `max_react_ms` and `max_total_ms = max_detect_ms + max_react_ms`. Use the maximum, not the mean: the FTTI is a worst-case budget. Percentiles are reported for information only.
   ```python
   import statistics
   d = sorted(detect)
   p50 = statistics.median(d)
   ```
3. Verdict rules:

   | Condition | Verdict |
   |---|---|
   | `max_total_ms` measured and `<= ftti_ms` | `within` |
   | `max_total_ms` measured and `> ftti_ms` | `exceeds` |
   | reaction not measured | `not_measured` (detection margin reported alone) |

4. Note that the observed maximum is only a lower bound of the true worst case. If the requirements call for a worst-case execution time argument, state that it is still needed.

### Output
`latency_report`.

### Quality Gate
- Every check has a verdict from the table.
- Every `exceeds` row lists its case IDs.

---

## Worked Example

Illustrative only. Check `AGE-cmd_linear_x`, hazard H-01, `ftti_ms` 400. Thirty netem omission repetitions on the rig, plus closed-course stop logs.
```
max_detect_ms 41.8, p50 33.0
max_react_ms 287.5 (from SAFE_STOPPED records)
max_total_ms 329.3 -> within (400)
```
Unit-level pytest rows for the same check are labeled `logic_only` (detected at sample 2 after the gap).

---

## Exit Criteria

DONE when every detected trip has a latency on one clock, every check has a worst-case total compared with its FTTI or is marked not measured, and the report notes that observed maxima are lower bounds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No safe-state records in logs | **Adjust**: report detection only and mark reaction `not_measured`. |
| Phase 1 | Times from two hosts | **Adjust**: flag `clock_unverified`; rerun on one host or document clock sync error. |
| Phase 2 | `exceeds` | **Return**: to `rmon-fallback-mode-selection` and the checker flow; do not raise the FTTI. |

**Do not:** use mean latency for the FTTI comparison, mix fake-clock and real-clock results, or treat the largest observed value as a proven bound.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
