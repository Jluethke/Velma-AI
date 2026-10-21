# Jerk-Limited Speed Profile

**One-line description:** Builds a time-parameterized speed profile along a reference path that respects user-supplied speed, lateral acceleration, longitudinal acceleration, deceleration and jerk limits, using a forward-backward pass for the velocity ceiling and a piecewise-jerk quadratic program in OSQP for jerk.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_path` (object, required): From `ctrl-path-spline-smoothing`; columns `s`, `x`, `y`, `psi`, `kappa`, `dkappa_ds`.
- `control_spec` (object, required): Supplies `v_max_test`, a_max, decel_max, jerk_max, lateral acceleration limit, road wheel angle rate limit, wheelbase and controller period. All limits are user supplied; this flow never picks them.

---

## Outputs

- `reference_trajectory` (object): CSV `reference_trajectory.csv` with columns `t`, `s`, `x`, `y`, `psi`, `kappa`, `v`, `a`, `jerk`, sampled at the controller period, plus a limit-check table showing the maximum of each quantity against its limit.

---

## Phase 1: Velocity Ceiling Along s

### Entry Criteria
- All five limits are present in `control_spec`. If any is missing, stop; do not substitute a default.

### Actions
1. Lateral limit: `v_lat(s) = sqrt(a_lat_max / max(|kappa(s)|, eps))`, with `eps` a small positive number to avoid division by zero on straights; then `v_cap(s) = min(v_max_test, v_lat(s))`.
2. Steering rate limit: on the kinematic model, road wheel rate is about `L * v * dkappa_ds / (1 + (L kappa)^2)` near small angles. Where `|dkappa_ds| > 0`, cap `v` so that this rate is below the road wheel rate limit. Record which constraint is active at each s.
3. Forward pass (acceleration): for i from 0 upward, `v[i+1] = min(v_cap[i+1], sqrt(v[i]^2 + 2 a_max ds))`, starting from the initial speed the user gives.
4. Backward pass (deceleration): for i from the end downward, `v[i] = min(v[i], sqrt(v[i+1]^2 + 2 decel_max ds))`, ending at the final speed the user gives (zero for a stop).
5. The result `v_fb(s)` respects speed, lateral and acceleration limits but has infinite jerk at the corners.

### Output
`v_fb(s)` and the active-constraint label per sample.

### Quality Gate
- `max(v_fb) <= v_max_test` and `max(v_fb^2 * |kappa|) <= a_lat_max` both print True.

---

## Phase 2: Piecewise-Jerk QP In Time

### Entry Criteria
- `v_fb(s)` exists.

### Actions
1. Choose horizon: total time `T` from integrating `ds / v_fb` (skip zero-speed samples), grid `dt` equal to the controller period or a multiple the user picks, `n = ceil(T / dt)`.
2. Decision variables per knot: `s_k`, `v_k`, `a_k`. Equality constraints (piecewise constant jerk between knots):
   - `v_{k+1} = v_k + a_k dt + 0.5 j_k dt^2`, `s_{k+1} = s_k + v_k dt + 0.5 a_k dt^2 + (1/6) j_k dt^3`, with `j_k = (a_{k+1} - a_k) / dt`.
3. Bounds: `0 <= v_k <= v_fb(s_ref_k)` where `s_ref_k` is the station of the forward-backward profile at time k (linearization of the s-dependent ceiling); `-decel_max <= a_k <= a_max`; `-jerk_max <= (a_{k+1} - a_k)/dt <= jerk_max`. Initial and final s, v, a fixed to the user's boundary values.
4. Cost: `sum w_v (v_k - v_fb(s_ref_k))^2 + w_a a_k^2 + w_j j_k^2`. Weights are user tuning choices; record them.
5. Build sparse `P` (upper triangle, `scipy.sparse.triu(P, format="csc")`) and `A`, solve with `osqp.OSQP().setup(P, q, A, l, u)` then `.solve()`. Check `res.info.status == "solved"`.
6. Re-evaluate `v_fb` at the new s values; if any `v_k` exceeds `v_fb(s_k)` by more than the solver tolerance, repeat steps 3 to 5 with the new `s_ref`. Stop after the iteration cap the user sets and report if not converged.

### Output
Jerk-limited `s(t)`, `v(t)`, `a(t)`.

### Quality Gate
- OSQP status is `solved` (print `res.info.status`).
- The re-evaluation step reports zero ceiling violations above solver tolerance.

---

## Phase 3: Sample And Check

### Entry Criteria
- QP converged.

### Actions
1. Interpolate `x`, `y`, `psi`, `kappa` from `reference_path` at `s(t)` with `numpy.interp`.
2. Compute `jerk = numpy.diff(a) / dt`.
3. Build the limit-check table: for v, a (positive and negative), jerk, lateral acceleration `v^2 kappa`, and kinematic road wheel rate, report the maximum and the limit.
4. Write `reference_trajectory.csv` and a plot of v, a, jerk versus t.
5. Do NOT clip any column after the fact to pass the check. A violation means the QP or the limits are wrong.

### Output
`reference_trajectory`.

### Quality Gate
- Every row in the limit-check table shows maximum less than or equal to limit (within OSQP's `eps_abs` as configured; print it).
- `t` is strictly increasing with uniform spacing `dt`.

---

## Worked Example

Illustrative only. Path 180 m, user limits v_max_test 6.94 m/s, a_max 2.0, decel 3.0, jerk 1.5 m/s^3, a_lat 2.0 m/s^2, start and end at rest.

- Phase 1: lateral limit active in the hairpin (kappa 0.081, v_lat 4.97 m/s).
- Phase 2: T about 34 s, 1,700 knots at 0.02 s; OSQP `solved` in 41 iterations; second pass no violations.
- Phase 3: table: max jerk 1.50 of 1.5, max a 1.21 of 2.0, max a_lat 1.998 of 2.0.

---

## Exit Criteria

DONE when `reference_trajectory.csv` exists at the controller period and every limit-check row passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Any limit missing | **Stop**: return to `ctrl-spec-intake`; never default a limit. |
| Phase 2 | OSQP `primal infeasible` | **Adjust**: boundary conditions conflict with limits (for example a stop too short for decel and jerk); extend the path or report to the user. |
| Phase 2 | Not converged after iteration cap | **Return**: report remaining violations; do not publish the trajectory. |
| Phase 3 | Limit check fails | **Retry**: inspect constraint construction in Phase 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
