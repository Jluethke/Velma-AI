# Closed-Course Tracking Run

**One-line description:** Runs the bench-approved controller on a closed course behind an independent hardware emergency stop with a safety driver, following a speed ladder from the lowest user-set speed upward, with predefined abort rules, and records a `course_log` for tracking metrics.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bench_verdict` (string, required): From `ctrl-bench-actuation-test`. Must be `PASS`.
- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`, surveyed on this course.
- `control_spec` (object, required): Supplies site rules, `v_max_test`, emergency-stop facts and the user's speed ladder.

---

## Outputs

- `course_log` (object): Session record (site, date, people, weather and surface notes, build commit, emergency-stop tests) and per-run logs in the same format as `sim_log`, with abort events marked.

---

## Phase 1: Site And Emergency-Stop Readiness

### Entry Criteria
- `bench_verdict` is `PASS`.
- Actuation runs only on a closed course with access control as described in `control_spec`, behind an independent hardware emergency stop that removes actuator authority without depending on the control computer.
- A safety driver sits in the driver seat with normal brake and steering available at all times; a second person holds the remote emergency stop if the setup includes one.
- Run area clear of people and obstacles; runoff area the user surveyed.

### Actions
1. Brief everyone: abort rules from Phase 2, hand signals or radio channel.
2. Stationary emergency-stop test: engage controller with no motion request, press the stop, confirm actuator authority is removed. Record.
3. Rolling emergency-stop test at the lowest ladder speed on a straight: safety driver drives, controller engaged with steering hold, press the stop, confirm the actuator releases and the driver has full control. Record.
4. Confirm the safety driver's brake pedal acts directly. The controller never blocks or delays braking.

### Output
Readiness record.

### Quality Gate
- Two emergency-stop test entries with times earlier than the first tracking run.

---

## Phase 2: Abort Rules

### Entry Criteria
- Readiness recorded.

### Actions
1. Write abort rules before driving, from user tolerances only: cross-track error beyond the user's abort distance, speed above the ladder rung plus the user's margin, any FAULT state, any oscillation the safety driver perceives, any person entering the area.
2. Abort action: safety driver takes over and brakes; emergency stop pressed. No automated "recovery" attempt.
3. Store the rules in the session record.

### Output
Abort rules.

### Quality Gate
- Each abort rule names its numeric value and its source (user tolerance).

---

## Phase 3: Speed Ladder Runs

### Entry Criteria
- Abort rules recorded.

### Actions
1. Rung 1 at the lowest speed in the user's ladder. Scale the reference speed profile so no sample exceeds the rung speed.
2. After each run, compute tracking metrics with `ctrl-tracking-metrics` before the next rung. Advance one rung only if every judged metric is PASS and no abort occurred.
3. Never exceed `v_max_test`. Never skip rungs.
4. On any abort: stop the session for that controller version, save the log, and return to simulation with the logged data.
5. Repeat the stationary emergency-stop test if the session pauses longer than the user's re-check interval.

### Output
`course_log`.

### Quality Gate
- Each run file has a matching tracking metrics result before the next rung's file timestamp.
- No run's max speed exceeds its rung (computed from the log).

---

## Worked Example

Illustrative only. Ladder 2, 3, 4, 5 m/s; abort cross-track 0.6 m; `v_max_test` 6.94 m/s.

- Phase 1: stationary stop 10:02, rolling stop 10:09, both released.
- Phase 3: 2 and 3 m/s PASS; at 4 m/s curve max error 0.41 m exceeds the 0.35 m tolerance: FAIL, ladder stops, logs returned to simulation.

---

## Exit Criteria

DONE when runs climbed the ladder only on PASS results, every run is logged with its metrics, and any abort ended the session and was returned to simulation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Emergency stop test fails | **Stop**: no runs today. |
| Phase 3 | Abort rule triggered | **Stop**: safety driver takes over; return logs to `ctrl-closed-loop-sim-py`. |
| Phase 3 | Metrics FAIL on a rung | **Return**: do not advance; rework in simulation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
