# Closed-Course Trip Validation

**One-line description:** Validates monitor trips and the fallback on real hardware only on a bench or a closed course behind an independent hardware emergency stop (designed per ISO 13850, stop category per IEC 60204-1), with a pre-run stop test, a scripted fault per run, and a per-run record that ties logs to the result.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `trip_rate_report` (object, required): Output of `rmon-trip-rate-measurement`; no open missed trips.
- `latency_report` (object, required): Output of `rmon-detection-latency-measurement`; no `exceeds` rows.
- `estop_test_record` (object, required): Record of the hardware emergency stop design and its last functional test (who, when, result).
- `test_site_plan` (string, required): Path to the site plan: boundaries, run-off area, people positions, communication, abort criteria.

---

## Outputs

- `course_validation_record` (object[]): One row per run: `run_id`, date, site, operator, safety observer, pre-run stop test result, injected fault and case ID, observed verdict, `t_detect` and `t_safe` from logs, emergency stop used (yes or no), log and video paths, outcome.

---

## Phase 1: Readiness Check

### Entry Criteria
- The test runs on a bench with the drive lifted or on a closed course with no public access.
- An independent hardware emergency stop is installed: it removes actuator power or applies the brakes through hardware, not through the monitor, the decision module or any software.
- `trip_rate_report` has zero open missed trips and `latency_report` has zero `exceeds` rows.

### Actions
1. Confirm the stop path from the drawing in `estop_test_record`: button or wireless stop receiver to a safety relay or contactor that de-energizes propulsion. Software can read the stop state but has no write path into it.
2. Confirm braking and the emergency stop are not gated by the monitor, the decision module or any software state. Write "verified on drawing <ref>" in the record.
3. Read `test_site_plan`; confirm abort criteria and that a safety observer, separate from the operator, holds the stop.
4. If any item fails, do not run.

### Output
Readiness checklist signed by the test lead.

### Quality Gate
- Every Phase 1 item is marked done with a reference (drawing number, plan section, person).
- `estop_test_record` date is the same day as the planned runs or within the interval required by the site plan.

---

## Phase 2: Run Scripted Faults

### Entry Criteria
- Readiness signed.

### Actions
1. Before each run session, test the emergency stop at low speed or on the bench: press it and confirm motion stops. Record the result. If it fails, end the session.
2. Start logging (monitor event log, and `ros2 bag record` if ROS 2 is used) before motion.
3. For each run, inject exactly one fault from the plan cases with executor `rmon-closed-course-trip-validation` (for example, a scripted out-of-envelope command from a test injector, or unplugging a sensor connector on the bench). Speed and maneuver come from the site plan.
4. The observer presses the emergency stop whenever behavior is not as expected; that run is recorded as an outcome `estop_used`, never discarded.
5. One fault per run. Do not chain faults.

### Output
Raw run logs.

### Quality Gate
- Every run has a pre-session stop test result recorded.
- Every run has a log file whose first record precedes the injection time.

---

## Phase 3: Record and Classify

### Entry Criteria
- Runs complete.

### Actions
1. For each run, extract trip and safe-state times with `jq` from the event log as in `rmon-detection-latency-measurement`.
2. Outcomes:

   | Observation | Outcome |
   |---|---|
   | Trip and safe state within FTTI, no stop pressed | `pass` |
   | Trip but safe state late | `late` |
   | No trip | `missed` |
   | Stop pressed | `estop_used` (investigate) |
   | Trip without injected fault | `false_trip` |

3. Feed `late`, `missed` and `false_trip` rows back to `rmon-trip-rate-measurement` and `rmon-detection-latency-measurement` as new data.
4. Do not describe the result as certification or compliance with any standard; it is engineering test evidence.

### Output
`course_validation_record`.

### Quality Gate
- Every run row has log and video paths that exist (`ls <path>` succeeds).
- Every non-`pass` row has an issue reference.

---

## Worked Example

Illustrative only.
```
run_id CC-007  site: test lot B (closed)  operator: A  observer: B
pre-run stop test: pass at 0.5 m/s
fault: FI-012 scripted cmd_linear_x = 2.3 m/s from the test injector
$ jq -c 'select(.event=="trip")' logs/CC-007/events.jsonl | head -1
{"t_mono_ns":5120044311,"event":"trip","check_id":"P-RANGE-01","verdict":"fail","switch_state":"SAFETY",...}
t_detect - t_inject 22 ms, t_safe - t_detect 301 ms, FTTI 400 ms -> pass, stop not used
```

---

## Exit Criteria

DONE when every closed-course case ran behind a tested hardware emergency stop, each run has logs, video and an outcome, and every non-pass outcome is fed back as a defect or new data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Emergency stop goes through software | **Stop**: rewire to a hardware path before any run. |
| Phase 1 | Open missed trips or `exceeds` rows | **Return**: to the checker and latency flows. |
| Phase 2 | Pre-session stop test fails | **Stop**: end the session; fix and retest the stop. |
| Phase 3 | Log missing for a run | **Retry**: rerun that case; a run without logs is not evidence. |

**Do not:** run on public roads, run without a tested hardware emergency stop, let software gate braking, discard runs where the stop was used, or claim certification.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
