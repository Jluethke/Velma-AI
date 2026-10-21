# Closed-Loop Simulation Harness In Python

**One-line description:** Runs the longitudinal and selected lateral controllers in closed loop against the kinematic plant with measured actuator delay, first-order actuator lag, seeded sensor noise and the shared limiter, across a fixed scenario set, and logs every signal so tracking, stability and timing checks can be replayed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plant_model` (object, required): From `ctrl-bicycle-model-py`.
- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`.
- `longitudinal_controller` (object, required): From `ctrl-pid-antiwindup`.
- `pid_gains` (object, required): From `ctrl-pid-step-tuning`.
- `actuator_limiter` (object, required): From `ctrl-actuator-rate-saturation`.
- `lateral_method` (string, required): One of `pure_pursuit`, `stanley`, `lqr`, `mpc`.
- `pure_pursuit_controller` (object, optional): Present when `lateral_method` is `pure_pursuit`.
- `stanley_controller` (object, optional): Present when `lateral_method` is `stanley`.
- `lqr_controller` (object, optional): Present when `lateral_method` is `lqr`.
- `mpc_controller` (object, optional): Present when `lateral_method` is `mpc` with OSQP.
- `acados_controller` (object, optional): Present when `lateral_method` is `mpc` with acados.
- `model_fit_report` (object, optional): Supplies delay and lag; if absent, delay and lag come from `control_spec` user values, or the run is labeled "no delay modeled".

---

## Outputs

- `sim_log` (object): One NPZ or CSV file per scenario with `t`, plant state, reference, errors, raw and applied commands, limiter flags, controller debug fields, solver status and solve time; plus a run manifest with git commit, seeds, parameter values and scenario list. Also golden input-output vectors for the C++ parity test.
- `sim_verdict` (string): `PASS` when every scenario completes without NaN, fault latch, solver failure or limit violation of the applied commands; otherwise `FAIL` with the failing scenario and step.

---

## Phase 1: Harness Structure

### Entry Criteria
- Exactly one lateral controller input is present and it matches `lateral_method`. If none or more than one, stop.

### Actions
1. Create `sim/run_sim.py` with a fixed-step loop: plant integrates at `dt_plant = dt / n_sub` (n_sub a user choice, recorded) with `step_rk4`; controllers run every `dt`.
2. Delay: a `collections.deque` of length `round(delay / dt)` between controller output and plant input, prefilled with the initial command. Lag: discrete first-order filter `y += (dt_plant / (tau + dt_plant)) * (u - y)` per channel.
3. Noise: `rng = numpy.random.default_rng(seed)`; add zero-mean Gaussian noise to measured position, heading and speed with standard deviations the user supplies from their sensor datasheets. Record the seed in the manifest.
4. Command path per cycle: lateral controller then speed PID, both raw outputs through `CommandLimiter`, then delay and lag, then plant.
5. Engage logic: call `engage` with the current measured state at t = 0 (bumpless).
6. Every quantity is appended to a preallocated NumPy array; write once at the end (`numpy.savez_compressed` or `numpy.savetxt` to CSV with a header row).

### Output
`sim/run_sim.py`.

### Quality Gate
- Running the harness twice with the same seed produces byte-identical output files (`sha256sum` both runs).

---

## Phase 2: Scenario Set

### Entry Criteria
- Harness deterministic.

### Actions
1. Run these scenarios, each from the user's trajectory or generated with the same flows:
   - S1 straight at constant speed with a 1 m initial lateral offset.
   - S2 constant radius turn at the largest radius-speed pair inside the lateral limit.
   - S3 S-curve with curvature reversal.
   - S4 the user's full `reference_trajectory`.
   - S5 stop at the end of a straight (speed controller tracking to zero).
   - S6 S4 with delay increased by one controller period (sensitivity).
   - S7 S4 with noise doubled.
2. For MPC, also log solver status and solve time every cycle.
3. Store golden vectors: for 1,000 consecutive cycles of S4, save controller inputs and raw outputs to `golden/<controller>_vectors.npz` for parity testing.

### Output
Per-scenario logs.

### Quality Gate
- Seven scenario files exist and each covers the planned duration (last `t` equals scenario end time).

---

## Phase 3: Verdict

### Entry Criteria
- All scenarios ran.

### Actions
1. Checks per scenario, each a command or a NumPy expression:
   - No NaN: `numpy.isfinite(log).all()`.
   - Applied commands within limits and rate limits (recompute from the log, do not trust flags only).
   - No latched fault.
   - MPC: zero cycles with fallback, and the count of over-budget solves.
2. Write `sim_verdict` = `PASS` only if every check passes in every scenario. Tracking accuracy is judged separately by `ctrl-tracking-metrics`; stability margins by `ctrl-stability-margins`.
3. Do NOT rerun with a different seed to get a PASS. A seed-dependent failure is a real failure.

### Output
`sim_log`, `sim_verdict`.

### Quality Gate
- The verdict file lists each check per scenario with its result.

---

## Worked Example

Illustrative only. `lateral_method = stanley`, dt 0.02 s, n_sub 10, delay 0.12 s (6 cycles), lag tau 0.15 s, seed 7.

- Phase 1: two runs, identical sha256.
- Phase 2: seven files; golden vectors saved.
- Phase 3: S6 shows steering rate limiter active 14 percent of cycles but no violations; all checks pass, `sim_verdict = PASS`.

---

## Exit Criteria

DONE when seven deterministic scenario logs exist, golden vectors are saved, and `sim_verdict` is recorded with per-check evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lateral input does not match `lateral_method` | **Stop**: rerun the matching lateral flow. |
| Phase 1 | Non-deterministic output | **Adjust**: remove wall-clock reads and unseeded randomness. |
| Phase 3 | NaN in any log | **Return**: trace the first NaN index back to its controller term. |
| Phase 3 | FAIL only with doubled noise | **Return**: report; the sensor filter or gains need work before hardware. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
