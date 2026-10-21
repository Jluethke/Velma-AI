# Pure Pursuit Lateral Controller

**One-line description:** Implements pure pursuit steering on a rear-axle-referenced kinematic bicycle with a speed-scheduled lookahead distance, a forward-only windowed goal-point search along the reference path, and tests for straight, constant-curvature and offset-start cases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`.
- `plant_model` (object, required): From `ctrl-bicycle-model-py`; must use the rear-axle reference point.
- `control_spec` (object, required): Supplies wheelbase and maximum road wheel angle.

---

## Outputs

- `pure_pursuit_controller` (object): Path to `control/pure_pursuit.py`, its tests, the lookahead schedule parameters, and the known limitations recorded for the sim flow.

---

## Phase 1: Law And Lookahead

### Entry Criteria
- `plant_model` reference point is the rear axle. If it is the center of mass, transform positions to the rear axle first: `p_rear = p_cg - lr [cos psi, sin psi]`.

### Actions
1. Pure pursuit law (Coulter, "Implementation of the Pure Pursuit Path Tracking Algorithm", CMU-RI-TR-92-01, 1992): with goal point at distance `Ld` and angle `alpha` between vehicle heading and the line to the goal point, `delta = atan(2 L sin(alpha) / Ld)`.
2. Lookahead schedule: `Ld = clip(k_ld * v + Ld_min, Ld_min, Ld_max)`. `k_ld`, `Ld_min`, `Ld_max` are tuning parameters chosen by the user in simulation; record them.
3. Behavior to expect (record it for the user):
   - Short `Ld`: tighter tracking, oscillation at speed.
   - Long `Ld`: smooth but cuts corners; steady-state cross-track error on curves grows with `Ld`.
   - The law has no knowledge of path curvature, so it always cuts inside on constant curves.

### Output
Law and schedule in the module docstring.

### Quality Gate
- Docstring cites the source and lists the three tuning parameters.

---

## Phase 2: Implement Goal-Point Search

### Entry Criteria
- Law documented.

### Actions
1. Keep an index `i_near` of the nearest path point. Search forward only from the previous `i_near` within a window (prevents snapping to a later loop of a self-crossing path).
2. Goal point: first path point forward from `i_near` whose distance from the rear axle is at least `Ld`. Interpolate linearly between the two straddling samples for a continuous goal point.
3. `alpha = atan2(gy - y, gx - x) - psi`, wrapped with `atan2(sin(alpha), cos(alpha))`.
4. Compute `delta`, then pass through the shared limiter from `ctrl-actuator-rate-saturation` (in the caller, not here). Return the unclipped `delta` plus debug fields `i_near`, goal point, `alpha`, `Ld`.
5. End of path: when the goal search reaches the last point, use the last point and flag `end_of_path`.

### Output
`control/pure_pursuit.py`.

### Quality Gate
- `python -c "from control.pure_pursuit import PurePursuit"` exits 0.

---

## Phase 3: Tests

### Entry Criteria
- Module imports.

### Actions
1. pytest cases using the kinematic plant and `step_rk4`:
   - Straight path, vehicle on path: `delta` is 0 every cycle (`assert abs(delta) < 1e-12`).
   - Constant circle of radius R: steady-state `delta` matches the geometry; record steady-state cross-track error and confirm it is on the inside of the circle (sign check).
   - Offset start 1 m left of a straight path: error decays and does not change sign more times than the user's allowed oscillation count. Print the count.
   - Search window: a figure-eight path; the nearest index never jumps backward.
2. Run `python -m pytest tests/test_pure_pursuit.py -q`.

### Output
`pure_pursuit_controller`.

### Quality Gate
- pytest all passed; printed steady-state error sign is "inside" for the circle test.

---

## Worked Example

Illustrative only. L 2.70 m, k_ld 0.9 s, Ld_min 3 m, Ld_max 12 m, circle R 25 m at 5 m/s.

- Phase 2: Ld = 7.5 m.
- Phase 3: steady delta 0.1080 rad versus geometric L/R = 0.1080; cross-track error 0.28 m inside. Offset start: 1 sign change. `pytest -q`: `4 passed`.

---

## Exit Criteria

DONE when pure pursuit passes the four tests and the lookahead parameters are recorded for simulation tuning.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Model uses center of mass | **Adjust**: convert to rear axle before computing alpha. |
| Phase 2 | Goal point jumps on self-crossing path | **Adjust**: shrink the search window; rerun tests. |
| Phase 3 | Oscillation at speed in tests | **Adjust**: raise `k_ld` in simulation; never remove the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
