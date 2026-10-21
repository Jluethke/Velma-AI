# PID Tuning From Logged Step Responses

**One-line description:** Identifies a first-order-plus-dead-time model from a logged open-loop step, computes initial speed PID gains with the SIMC rules, verifies closed-loop step responses in simulation with python-control `step_info`, and logs every step response with the gains that produced it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `longitudinal_controller` (object, required): From `ctrl-pid-antiwindup`.
- `plant_model` (object, required): From `ctrl-bicycle-model-py`.
- `control_spec` (object, required): Supplies period, limits, site and emergency-stop facts.
- `model_fit_report` (object, optional): From `ctrl-model-fit-from-logs`; supplies longitudinal delay and lag if measured.

---

## Outputs

- `pid_gains` (object): Kp, Ti, Td, N, b, Tt with the SIMC closed-loop time constant used and the identification data they came from.
- `step_response_log` (object): One CSV per step test (sim and bench) with `t`, `v_ref`, `v`, `u_req`, `u_applied`, P, I, D terms, and a summary table of rise time, overshoot, settling time and steady-state error per test with the gains used.

---

## Phase 1: Identify FOPDT

### Entry Criteria
- An open-loop step of the longitudinal request is available: from `model_fit_report`, from a bench log, or the plant model plus the user's measured delay and lag. If none, use the plant model and mark gains as provisional.

### Actions
1. Fit `G(s) = K e^{-theta s} / (tau s + 1)` from the response `y(t)` to request step `du`.
2. Two-point method (Smith): find times `t28` and `t63` where the response reaches 28.3 percent and 63.2 percent of its final change. Then `tau = 1.5 (t63 - t28)`, `theta = t63 - tau`, `K = dy_final / du`.
3. Cross-check with `scipy.optimize.least_squares` on the full response. Report both.
4. For a speed loop with acceleration request, `K` relates speed to request integral; if the response ramps instead of settling, the plant is integrating: use the SIMC integrating-process rule in Phase 2 instead.

### Output
K, tau, theta (or integrating gain k and theta).

### Quality Gate
- Both identification methods are printed and the fitted response is overlaid on the data in `fopdt_fit.png`.

---

## Phase 2: SIMC Gains

### Entry Criteria
- Model identified.

### Actions
1. SIMC rules (Skogestad, "Simple analytic rules for model reduction and PID controller tuning", J. Process Control, 2003):
   - Self-regulating FOPDT: `Kc = (1/K) * tau / (tau_c + theta)`, `Ti = min(tau, 4 (tau_c + theta))`.
   - Integrating with gain k: `Kc = (1/k) * 1 / (tau_c + theta)`, `Ti = 4 (tau_c + theta)`.
2. `tau_c` is the single tuning knob. The paper recommends `tau_c = theta` for tight control; slower choices give smoother response. The user chooses; record the choice.
3. Convert to the parallel form in `longitudinal_controller`: `Kp = Kc`; integral gain `Kp / Ti`. Start with `Td = 0`.
4. Set `Tt = Ti` for back-calculation unless the user gave another value.

### Output
Initial `pid_gains`.

### Quality Gate
- Gains printed with the formula and `tau_c` that produced them.

---

## Phase 3: Simulated Step Responses

### Entry Criteria
- Initial gains exist.

### Actions
1. Run the controller in `ctrl-closed-loop-sim-py` style closed loop (or a dedicated script) on the plant with measured delay: speed steps at the amplitudes the user lists, inside `v_max_test`.
2. Log each run to `step_response_log/sim_<amp>_<gainset>.csv`.
3. Measure with python-control: build the response as arrays and call `control.step_info(y, T)` (accepts time-series data). Read `RiseTime` (10 to 90 percent default), `SettlingTime` (2 percent default `SettlingTimeThreshold=0.02`), `Overshoot` (percent), `SteadyStateValue`.
4. Compare against the user's response requirements. If unmet, adjust `tau_c` only (one knob) and repeat. Record every iteration, including rejected ones.
5. Check the saturation fraction (share of samples with `saturated` True). Large saturation makes linear tuning metrics meaningless; reduce step amplitude if the user's requirement is for small-signal response.

### Output
Simulated step summary table.

### Quality Gate
- Every row in the summary table cites a CSV file that exists.
- The chosen gain set meets every user requirement in the table, or the gap is reported.

---

## Phase 4: Bench Step Responses

### Entry Criteria
- Runs only on a bench rig or a closed course behind an independent hardware emergency stop, as recorded in `control_spec`.
- The emergency stop was function-tested today before this phase, by a person pressing it and confirming actuator power is removed.
- A second person stands at the emergency stop for the whole phase.

### Actions
1. Repeat the smallest amplitude step from Phase 3 with the chosen gains. Log the same columns at the controller period.
2. Increase amplitude one level at a time from the user's list. After each, compute `step_info` and compare to the simulated row. Stop increasing if the measured overshoot exceeds the simulated value by more than the user's agreed margin.
3. If bench results differ from simulation, update the FOPDT model from the bench data (Phase 1), recompute gains (Phase 2), re-simulate (Phase 3), then return here.
4. Never tune gains by trial on the vehicle without re-simulating first.

### Output
`pid_gains` and complete `step_response_log`.

### Quality Gate
- The bench summary table lists each step with its sim counterpart and the difference.
- The log shows the emergency-stop test time before the first bench step.

---

## Worked Example

Illustrative only.

- Phase 1: bench step of acceleration request 0.5 m/s^2 gives integrating behavior; slope k = 0.98, theta = 0.18 s.
- Phase 2: tau_c = theta = 0.18 s: Kc = 1/0.98 * 1/0.36 = 2.83, Ti = 1.44 s.
- Phase 3: `control.step_info(v, t)` on a 1 m/s step: RiseTime 0.52 s, Overshoot 6.1 percent, SettlingTime 2.3 s.
- Phase 4: bench overshoot 7.4 percent, within the user's agreed 3 point margin.

---

## Exit Criteria

DONE when gains are traceable to an identified model and a SIMC formula, and every simulated and bench step response is logged with its metrics.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Response too noisy for t28 and t63 | **Adjust**: use the least_squares fit only; record why. |
| Phase 3 | Requirements unmet at any tau_c | **Return**: report the trade-off table; the plant delay may be too long. |
| Phase 4 | Emergency stop not tested today | **Stop**: test it before any command. |
| Phase 4 | Oscillation on bench | **Stop**: press the emergency stop if needed; return to Phase 1 with bench data. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
