# Stanley Lateral Controller

**One-line description:** Implements the Stanley front-axle steering law with heading error, softened cross-track term, optional curvature feedforward, and correct signed cross-track error at the front axle, with tests that catch the common sign and reference-point mistakes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`.
- `plant_model` (object, required): From `ctrl-bicycle-model-py`.
- `control_spec` (object, required): Supplies wheelbase and maximum road wheel angle.

---

## Outputs

- `stanley_controller` (object): Path to `control/stanley.py`, its tests, the gains `k`, `k_soft`, the feedforward option, and the sign conventions.

---

## Phase 1: Law

### Entry Criteria
- Path has `psi` and `kappa`.

### Actions
1. Stanley law (Thrun et al., "Stanley: The Robot that Won the DARPA Grand Challenge", J. Field Robotics, 2006; Hoffmann et al., ACC 2007): `delta = psi_e + atan(k e_fa / (k_soft + v))`.
   - `psi_e = psi_path(s_fa) - psi`, wrapped to (-pi, pi].
   - `e_fa` is the signed cross-track error measured at the front axle center `p_fa = p_rear + L [cos psi, sin psi]`.
   - `k_soft` keeps the term finite at low speed.
2. Sign convention: `e_fa` positive when the path lies to the left of the vehicle, so a positive error commands positive (left) steering. Write this in the docstring; it is the most common bug.
3. Optional curvature feedforward: add `delta_ff = atan(L kappa(s_fa))`. Record whether it is used.
4. Optional terms from Hoffmann et al. (yaw rate damping, steering damping) are listed but left off until the simulator shows a need; record the decision.

### Output
Law and conventions in the docstring.

### Quality Gate
- Docstring states the reference point (front axle), sign of `e_fa`, and citation.

---

## Phase 2: Implement

### Entry Criteria
- Law documented.

### Actions
1. Nearest point to `p_fa`: project onto the segment between the two nearest samples to get `s_fa`, the foot point and the path tangent `t_hat = [cos psi_path, sin psi_path]`.
2. Signed error: `e_fa = cross(t_hat, p_path - p_fa)` using the 2-D cross product `t_x * d_y - t_y * d_x` with `d = p_path - p_fa`. Check: path to the left gives positive.
3. Compute `delta` and return it unclipped with debug fields; the caller applies the shared limiter.
4. Low speed: Stanley is defined for forward motion. For `v < 0` return a flag `reverse_unsupported` and do not compute a command.

### Output
`control/stanley.py`.

### Quality Gate
- `python -c "from control.stanley import Stanley"` exits 0.

---

## Phase 3: Tests

### Entry Criteria
- Module imports.

### Actions
1. pytest:
   - Sign test: straight path along +x, vehicle at y = -1 heading +x: `e_fa > 0` and `delta > 0`.
   - Heading test: on path with heading +0.1 rad relative to path: `delta` is close to -0.1 rad.
   - Reference point test: vehicle with rear axle on path but heading misaligned gives nonzero `e_fa` (proves the front axle is used).
   - Convergence: offset start 1 m on a straight path in closed loop with the kinematic plant converges; print time to reach the user's error band.
   - Circle with and without feedforward: print steady-state `e_fa` for both.
2. Run `python -m pytest tests/test_stanley.py -q`.

### Output
`stanley_controller`.

### Quality Gate
- pytest all passed; sign test passes.

---

## Worked Example

Illustrative only. k 1.2, k_soft 1.0 m/s, v 5 m/s, vehicle 0.5 m right of path, aligned.

- Phase 1: delta = 0 + atan(1.2 * 0.5 / 6) = 0.0997 rad (left).
- Phase 3: circle R 25 m: steady e_fa 0.21 m without feedforward, 0.01 m with. `pytest -q`: `5 passed`.

---

## Exit Criteria

DONE when Stanley passes the sign, heading, reference-point and convergence tests and its gains are recorded for the simulator.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Sign test fails | **Adjust**: flip the cross product argument order, not the gain sign. |
| Phase 3 | Oscillation at low speed | **Adjust**: increase `k_soft` in simulation. |
| Phase 3 | Reverse motion required | **Return**: Stanley as implemented does not cover reverse; record as open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
