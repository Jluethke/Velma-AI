# Monitor Fault Injection Plan

**One-line description:** Builds a fault injection plan for the monitor in which every envelope bound, every temporal property and every independence assumption gets at least one injected fault from a fixed fault model list (value, timing, omission, commission, monitor-side), with the injection point, the expected verdict, a detection deadline and labeled nominal runs for false-trip measurement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`.
- `independence_plan` (object, required): Output of `rmon-independence-analysis`.
- `temporal_properties` (object[], required): Output of `rmon-temporal-property-spec`.

---

## Outputs

- `fault_injection_plan` (object[]): One row per case: `case_id`, `target` (envelope row, property id or independence level), `fault_model`, `injection_point`, `parameters`, `expected_verdict`, `detection_deadline_ms`, `label` (`must_trip` or `must_not_trip`), `executor` (which flow runs it), `repetitions`.

---

## Phase 1: Choose Fault Models per Target

### Entry Criteria
- All three inputs present.

### Actions
1. Use this fault model list (based on the fault classes in ISO 26262-5 Annex D and ISO 26262-6 fault injection guidance, and the omission, timing and value classes common in dependability literature):

   | Fault model | Applies to | Example parameters |
   |---|---|---|
   | out-of-range value | range check | value = `max` plus one ulp, value = `min` minus one ulp, far out |
   | rate step | rate check | step of `max_rate * dt` and just above |
   | NaN, infinity | all numeric inputs | `nan`, `inf`, `-inf` |
   | stuck-at (frozen value) | sequence and content checks | repeat last value and counter |
   | offset, drift | sensor-derived inputs | offset or slope as user input |
   | omission (message loss) | staleness | stop publisher for longer than `max_age_ms` |
   | delay, jitter | staleness, ordering | network delay via netem |
   | counter gap, repeat, wrap | sequence checker | skip by 2, repeat, 65535 to 0 |
   | supervised process crash or hang | independence: process | `kill -9`, `kill -STOP` on the component |
   | monitor process hang | self-check | `kill -STOP` on the monitor |
   | CPU starvation | timing | `stress-ng` on shared cores |

2. For every envelope field with a sourced value and every property, write at least one `must_trip` case just outside the bound and one `must_not_trip` case exactly at the bound.
3. For every independence `gap` row, write one case that exercises the shared resource.

### Output
Draft case list.

### Quality Gate
- Every sourced envelope field and every property ID appears as a `target` in at least one `must_trip` and one `must_not_trip` case (check with a script that counts targets per label).
- Every independence gap appears as a `target`.

---

## Phase 2: Set Deadlines and Executors

### Entry Criteria
- Draft case list exists.

### Actions
1. `detection_deadline_ms` for each `must_trip` case = the `detection_ms` from `fallback_strategy` if numeric, otherwise `open`; never fill it with a guess.
2. Assign `executor`:

   | Injection point | Executor flow |
   |---|---|
   | Function input in Python | `rmon-py-pytest-fault-injection` |
   | Function input in C++ | `rmon-cpp-gtest-fault-injection` |
   | Network or CPU timing | `rmon-linux-netem-stress-timing` |
   | CAN frames | `rmon-can-vcan-replay-test` |
   | Physical sensors or actuators | `rmon-closed-course-trip-validation` (bench or closed course only) |

3. `repetitions`: deterministic unit cases run once; timing and physical cases repeat the number of times needed for the confidence statement in `rmon-trip-rate-measurement` (user input).
4. Add nominal runs: at least one `must_not_trip` run of fault-free operation per operating mode in the ODD, with duration as a user input. These are the denominator for the false-trip rate.

### Output
`fault_injection_plan`.

### Quality Gate
- Every case has an `executor` from the table.
- At least one nominal run per operating mode is listed with its duration source.

---

## Worked Example

Illustrative only.
```
{"case_id":"FI-012","target":"P-RANGE-01","fault_model":"out-of-range value","injection_point":"checker input",
 "parameters":{"value":"nextafter(2.0, inf)"},"expected_verdict":"fail","detection_deadline_ms":"open",
 "label":"must_trip","executor":"rmon-py-pytest-fault-injection","repetitions":1}
{"case_id":"FI-031","target":"independence:process","fault_model":"supervised process hang",
 "injection_point":"kill -STOP policy_node","expected_verdict":"stale","detection_deadline_ms":"open",
 "label":"must_trip","executor":"rmon-linux-netem-stress-timing","repetitions":30}
```

---

## Exit Criteria

DONE when every bound, property and independence gap has trip and no-trip cases, every case has an executor and a sourced or open deadline, and nominal runs are planned per operating mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Envelope field open | **Adjust**: no case for that field; list it as untestable until sourced. |
| Phase 2 | No executor fits an injection point | **Return**: add an executor flow or move the case to closed-course validation. |
| Phase 2 | Repetition count unknown | **Adjust**: mark `repetitions: open` and resolve with `rmon-trip-rate-measurement` inputs. |

**Do not:** plan only trip cases (false trips need no-trip cases), inject physical faults outside a bench or closed course, or copy deadlines from another project.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
