# Speed PID With Anti-Windup And Feedforward

**One-line description:** Implements a discrete speed controller as feedforward plus PID with derivative on measurement, a filtered derivative, back-calculation anti-windup driven by the limiter's applied command, and bumpless engage, with unit tests that prove the integrator stops winding up under saturation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feedforward_model` (object, required): From `ctrl-longitudinal-feedforward`.
- `actuator_limiter` (object, required): From `ctrl-actuator-rate-saturation`; returns the applied command used by anti-windup.
- `control_spec` (object, required): Supplies controller period and limits.

---

## Outputs

- `longitudinal_controller` (object): Path to `control/speed_pid.py`, its tests, the discrete equations, the anti-windup method chosen, and placeholder gains to be set by `ctrl-pid-step-tuning`.

---

## Phase 1: Discrete Equations

### Entry Criteria
- Feedforward function and limiter exist.

### Actions
1. Structure (parallel form, Astrom and Hagglund, Advanced PID Control, 2006, ch. 3):
   - `e = v_ref - v`
   - `P = Kp * (b * v_ref - v)` with setpoint weight `b` (user choice, 1 gives standard P).
   - `D` on measurement only, filtered: `D_k = (Td / (Td + N dt)) * D_{k-1} - (Kp Td N / (Td + N dt)) * (v_k - v_{k-1})` (backward difference). `N` is the derivative filter parameter; the cited text discusses its typical range; the user picks the value and records it. Speed loops often run with `Td = 0`; then D is skipped.
   - `u_req = a_ff + P + I + D`.
2. Anti-windup by back-calculation: after the limiter returns `u_applied`, update `I_{k+1} = I_k + (Kp dt / Ti) * e + (dt / Tt) * (u_applied - u_req)`. Tracking time constant `Tt`: the cited text gives `Tt = sqrt(Ti Td)` as a rule of thumb, and `Tt` around `Ti` when `Td = 0`. Record the choice.
3. Alternative: conditional integration (clamping), freeze I when `saturated` or `rate_limited` is True and `e` has the same sign as the saturation direction. Decision table:

| Situation | Use |
|---|---|
| Limiter reports the exact applied value every cycle | Back-calculation |
| Applied value not observable (open-loop actuator) | Conditional integration |

4. Bumpless engage: on engage, set `I = u_measured - a_ff - P` so the first `u_req` equals the current actuator state.

### Output
Equations documented in the module docstring.

### Quality Gate
- Docstring lists every equation and the anti-windup choice with its citation.

---

## Phase 2: Implement

### Entry Criteria
- Equations documented.

### Actions
1. `control/speed_pid.py`: `class SpeedPID` with `__init__(kp, ti, td, n, b, tt, dt)`, `engage(v, u_measured, v_ref)`, `step(v_ref, v, a_ref) -> (u_applied, debug)`. `step` calls feedforward, computes `u_req`, calls `CommandLimiter.accel.apply`, then updates I with the applied value.
2. `debug` returns P, I, D, a_ff, u_req, u_applied, flags. These are logged every cycle by the simulator and the real loop.
3. `Ti = inf` disables I; guard divisions accordingly.
4. Do not reference wall clock time; `dt` is fixed from `control_spec`.

### Output
`control/speed_pid.py`.

### Quality Gate
- `python -c "from control.speed_pid import SpeedPID"` exits 0.

---

## Phase 3: Windup Tests

### Entry Criteria
- Module imports.

### Actions
1. Test with a toy first-order plant `v_{k+1} = v_k + dt * u_applied` in pytest:
   - Saturation test: request a speed step that saturates acceleration for many cycles. With anti-windup, the overshoot after leaving saturation is smaller than with anti-windup disabled (`tt = inf`). Assert the inequality and print both overshoots.
   - Integrator bound: during saturation, `I` stays bounded (assert the max |I| over the run is less than the value it reaches with anti-windup disabled).
   - Bumpless: after `engage`, `abs(u_applied_first - u_measured)` is below the limiter's one-step rate bound.
   - Zero error, zero feedforward residual: output stays constant.
2. Run `python -m pytest tests/test_speed_pid.py -q`.

### Output
`longitudinal_controller`.

### Quality Gate
- pytest all passed; printed overshoot with anti-windup is lower than without.

---

## Worked Example

Illustrative only. dt 0.02 s, Kp 0.8, Ti 2.0 s, Td 0, Tt 2.0 s, a_max 2.0.

- Phase 3 saturation test: step 0 to 6 m/s. Without anti-windup overshoot 1.41 m/s; with back-calculation 0.12 m/s. `pytest -q`: `4 passed`.

---

## Exit Criteria

DONE when the controller uses the limiter's applied output for anti-windup, engages bumplessly and passes the windup tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | I updated with `u_req` instead of `u_applied` | **Adjust**: anti-windup has no effect then; fix and rerun tests. |
| Phase 3 | Overshoot not reduced | **Adjust**: check sign of the tracking term `(u_applied - u_req)`. |
| Phase 3 | Engage step too large | **Retry**: confirm `engage` sets I before the first step. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
