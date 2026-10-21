# Kinematic Bicycle Model In Python

**One-line description:** Implements and unit-tests a rear-axle-referenced kinematic bicycle model in Python with NumPy, with a fixed-step RK4 integrator, steering saturation, and analytic Jacobians for linearization, as the reference plant for every simulation and controller design flow.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `control_spec` (object, required): From `ctrl-spec-intake`; supplies wheelbase, lr, maximum road wheel angle and controller period.
- `project_dir` (string, required): Repository root where the Python package lives.

---

## Outputs

- `plant_model` (object): Path to `plant/kinematic_bicycle.py`, its test file, the state and input definitions, the reference point (rear axle or center of mass), and the passing pytest report.

---

## Phase 1: Write The Equations

### Entry Criteria
- `control_spec` has wheelbase L and maximum road wheel angle.

### Actions
1. Fix the state and input definitions and write them in the module docstring: state `x = [px, py, psi, v]` (m, m, rad, m/s) at the rear axle center; input `u = [a, delta]` (m/s^2, rad road wheel angle).
2. Rear-axle kinematic bicycle equations (Rajamani, Vehicle Dynamics and Control, ch. 2):
   - `px_dot = v cos(psi)`
   - `py_dot = v sin(psi)`
   - `psi_dot = v tan(delta) / L`
   - `v_dot = a`
3. If the user wants the center of mass as reference, use the slip angle form: `beta = atan(lr tan(delta) / L)`, `px_dot = v cos(psi + beta)`, `py_dot = v sin(psi + beta)`, `psi_dot = v cos(beta) tan(delta) / L`. Record which form is used in `plant_model`; pure pursuit assumes rear axle, Stanley uses the front axle point.
4. Note the model's validity: no tire slip, so it is valid only at low lateral acceleration. Do not quote a numeric validity limit unless the user supplies one; `ctrl-model-fit-from-logs` measures where it breaks.

### Output
Equations and conventions written into the module docstring.

### Quality Gate
- Docstring states state order, units, reference point and sign convention (positive delta turns left, psi counterclockwise from x).

---

## Phase 2: Implement

### Entry Criteria
- Equations fixed.

### Actions
1. Create `plant/kinematic_bicycle.py` with:
   - `f(x, u, params) -> np.ndarray` continuous derivative.
   - `step_rk4(x, u, dt, params)` classic fourth-order Runge-Kutta, input held constant over `dt` (zero-order hold).
   - `saturate_input(u, params)` clipping delta to plus or minus the maximum road wheel angle with `np.clip`.
   - `jacobians(x, u, params) -> (A, B)` analytic partial derivatives: `A[0,2] = -v sin(psi)`, `A[0,3] = cos(psi)`, `A[1,2] = v cos(psi)`, `A[1,3] = sin(psi)`, `A[2,3] = tan(delta)/L`, `B[2,1] = v / (L cos(delta)^2)`, `B[3,0] = 1`.
2. Wrap heading with `np.arctan2(np.sin(psi), np.cos(psi))` only when reporting, never inside the integrator state (wrapping inside causes jumps in the Jacobian evaluation and logs).
3. Do not add tire models, noise or delay here; delay and noise live in `ctrl-closed-loop-sim-py`.
4. Edit only this module and its test file in this flow.

### Output
`plant/kinematic_bicycle.py`.

### Quality Gate
- `python -c "import plant.kinematic_bicycle as m; print(m.f)"` runs from `project_dir`.

---

## Phase 3: Test Against Closed-Form Cases

### Entry Criteria
- Module imports.

### Actions
1. Write `tests/test_kinematic_bicycle.py` with pytest:
   - Straight line: delta = 0, a = 0, v0 = 5 m/s, 10 s gives px = 50 m, py = 0 (`numpy.testing.assert_allclose`).
   - Constant turn: fixed delta, a = 0. The radius must equal `L / tan(delta)`. Integrate one full circle period `2 pi R / v` and check the end position returns to the start.
   - Constant acceleration: v(t) = v0 + a t.
   - Jacobian check: compare `jacobians` against central finite differences with step 1e-6 using `assert_allclose(rtol=1e-5, atol=1e-6)`; these tolerances bound finite-difference truncation, not vehicle behavior.
   - Saturation: an input above the limit is clipped to the limit.
2. Integration tolerance for the circle test: report the end-point error at dt = controller period and at dt/10. RK4 error should drop by roughly a factor of 10^4 (fourth order). If it does not, the integrator is wrong.
3. Run `python -m pytest tests/test_kinematic_bicycle.py -q` and save the output.
4. Do NOT loosen a tolerance to make a failing test pass. Find the bug.

### Output
`plant_model`.

### Quality Gate
- `python -m pytest tests/test_kinematic_bicycle.py -q` reports all tests passed and zero skipped.
- The dt versus dt/10 error ratio is printed in the test output and is consistent with fourth order.

---

## Worked Example

Illustrative only. L = 2.70 m, delta = 0.1 rad, v = 5 m/s.

- Phase 1: rear-axle form chosen.
- Phase 2: `jacobians` returns `B[2,1] = 5 / (2.7 * cos(0.1)^2) = 1.870`.
- Phase 3: R = 2.70 / tan(0.1) = 26.91 m; one circle at dt = 0.02 s ends 3.1e-7 m from start; at dt = 0.002 s, 3.0e-11 m. `pytest -q` prints `5 passed`.

---

## Exit Criteria

DONE when the module implements the stated equations, the five tests pass, and `plant_model` records the reference point.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Wheelbase missing | **Return**: send back to `ctrl-spec-intake`. |
| Phase 3 | Circle test does not close | **Adjust**: check the zero-order hold and that tan uses the saturated delta; rerun. |
| Phase 3 | Jacobian mismatch | **Adjust**: recompute the failing partial by hand; never widen the tolerance. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
