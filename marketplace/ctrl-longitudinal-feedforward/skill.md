# Longitudinal Feedforward From Road Load

**One-line description:** Builds the longitudinal feedforward term from a road load model F(v) = A + B v + C v^2 fitted to coast-down segments, plus mass times target acceleration and grade, and maps the required force to the actuator request through a measured inverse table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plant_model` (object, required): From `ctrl-bicycle-model-py`; defines `a` as the longitudinal input.
- `control_spec` (object, required): Supplies mass and the actuator request type (acceleration request, torque request, or pedal position).
- `drive_log` (object, optional): From `ctrl-can-readonly-log`. When absent, the user supplies road load coefficients from their own documented test.

---

## Outputs

- `feedforward_model` (object): Road load coefficients A, B, C with fit residuals and source, the feedforward equation, the force-to-request inverse table if the actuator is not an acceleration request, and `control/feedforward.py` with tests.

---

## Phase 1: Fit Road Load

### Entry Criteria
- Either `drive_log` contains coast-down segments (driver lifts off, gear in neutral where the vehicle permits, no brake) on a level surface, or the user supplies A, B, C.

### Actions
1. The coast-down method is described in SAE J2263 and SAE J1263. Cite them as the method source; this flow does not claim conformance.
2. Select segments where accelerator and brake are zero and the driver confirmed neutral. Require runs in both directions on the same stretch to cancel grade and wind, as the coast-down method describes.
3. Compute deceleration from speed with a Savitzky-Golay derivative `scipy.signal.savgol_filter(v, window_length, polyorder, deriv=1, delta=dt)`; window length and order are user choices, recorded.
4. Force `F = -m_eff * dv/dt`, with `m_eff` = vehicle mass plus equivalent rotating inertia if the user provides it; otherwise use mass and record the omission.
5. Fit `F = A + B v + C v^2` with `numpy.polyfit(v, F, 2)` (returns C, B, A in that order). Report R^2 and residual RMS.

### Output
A, B, C with residuals.

### Quality Gate
- Fit printed with coefficient order labeled; `C > 0` (aerodynamic drag cannot be negative). If not, the data or segment selection is wrong.

---

## Phase 2: Feedforward Equation

### Entry Criteria
- Coefficients available.

### Actions
1. Force needed to follow the target: `F_ff = m a_ref + (A + B v + C v^2) + m g sin(theta)`, where `theta` is road grade if measured, otherwise 0 and recorded.
2. If the actuator accepts an acceleration request, output `a_ff = F_ff / m` directly.
3. If the actuator takes torque or pedal position: build an inverse table from logs of steady-state points (speed, request, measured acceleration) as a 2-D grid and use `scipy.interpolate.RegularGridInterpolator((v_grid, F_grid), request_table, bounds_error=False, fill_value=None)`. Points outside the measured grid are flagged, never extrapolated silently; set `fill_value=None` only together with an explicit out-of-range flag.
4. Brake: if negative force exceeds what coasting provides, the feedforward produces a deceleration request. Whether the controller is permitted to request braking is decided by the user's actuator interface, recorded in `control_spec`; this flow does not add any logic to the driver brake or emergency-stop path.

### Output
Feedforward equation and inverse map.

### Quality Gate
- The equation and every coefficient source are written in `feedforward_model`.

---

## Phase 3: Implement And Test

### Entry Criteria
- Equation defined.

### Actions
1. Write `control/feedforward.py` with `accel_feedforward(v, a_ref, grade=0.0) -> float` (and `request_from_force` when needed).
2. Tests: at `v = 0, a_ref = 0` the output equals A/m (static resistance); output is monotonic in `a_ref`; out-of-grid inputs set the flag.
3. Replay check: feed the logged speed and acceleration of a non-coasting segment; compare predicted request versus logged request; report RMS error.
4. Run `python -m pytest tests/test_feedforward.py -q`.

### Output
`feedforward_model`.

### Quality Gate
- pytest all passed.
- Replay RMS error is printed with units.

---

## Worked Example

Illustrative only. m = 1,950 kg, 6 coast-down runs, 3 each direction.

- Phase 1: `polyfit` gives C = 0.41 N/(m/s)^2, B = 4.2 N/(m/s), A = 182 N, R^2 0.97.
- Phase 2: acceleration request interface, so `a_ff = a_ref + (182 + 4.2 v + 0.41 v^2)/1950`.
- Phase 3: at v = 5, a_ref = 0: a_ff = 0.1095 m/s^2. `pytest -q`: `4 passed`.

---

## Exit Criteria

DONE when road load coefficients have a recorded source, the feedforward function is tested, and replay error is reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No coast-down data and no user coefficients | **Return**: request coast-down runs on a closed course or documented coefficients. |
| Phase 1 | Negative C | **Adjust**: remove segments with brake or slope; refit. |
| Phase 2 | Inverse table sparse | **Return**: list missing speed and request ranges for more logging. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
