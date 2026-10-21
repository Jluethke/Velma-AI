# Stability Margins With python-control

**One-line description:** Builds the loop transfer functions of the speed PID loop and the linearized lateral loop including measured delay (Pade approximation and exact discrete delay), computes gain margin, phase margin and delay margin with python-control, and checks closed-loop pole locations against the user's required margins.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plant_model` (object, required): From `ctrl-bicycle-model-py`.
- `pid_gains` (object, required): From `ctrl-pid-step-tuning`.
- `sim_log` (object, required): From `ctrl-closed-loop-sim-py`; supplies the lateral controller type, its gains and the scenario speeds.
- `model_fit_report` (object, optional): Delay and lag; if absent use `control_spec` values and label results accordingly.

---

## Outputs

- `stability_report` (object): For each loop and speed: gain margin (dB), phase margin (deg), crossover frequencies, delay margin (s), closed-loop pole magnitudes (discrete), Bode and Nyquist plots, and PASS or FAIL against the user's required margins.

---

## Phase 1: Build Loop Models

### Entry Criteria
- `python -c "import control; print(control.__version__)"` prints a version.

### Actions
1. Speed loop: plant from acceleration request to speed with lag and delay: `P(s) = 1 / (s (tau s + 1)) * e^{-T s}`. Controller `C(s) = Kp (1 + 1/(Ti s))` (plus filtered D if used). Build with `control.tf`.
2. Delay: continuous approximation `num, den = control.pade(T, n)` with order n chosen so the phase error is small up to the crossover (check by comparing `n` and `n+2` margins; report both). Also build the exact discrete version: `control.c2d(P_no_delay, dt, method="zoh")` times `z^{-d}` with `d = round(T/dt)`, made with `control.tf([1], [1] + [0]*d, dt)`.
3. Lateral loop, linearized about straight driving at each speed in the sim scenarios:
   - Pure pursuit: for small angles the goal point's lateral offset in the vehicle frame is about `e + Ld e_psi`, so `delta = (2 L / Ld^2)(e + Ld e_psi)` (proportional plus heading term); the kinematic plant from delta to e is `v^2 / (L s^2)` with `e_psi = s e / v`. Use consistent signs from the sign convention in `ctrl-tracking-metrics`.
   - Stanley: small-angle `delta = psi_e + (k / (k_soft + v)) e_fa`; build state space and break the loop at the steering input.
   - LQR and MPC: break the loop at the steering input using `control.ss` of the closed system with the gain at that speed (MPC: use the unconstrained LQR-equivalent gain at the linearization point, labeled as an approximation).
4. Include steering lag and delay in every lateral loop.

### Output
Loop transfer functions `L(s)` and `L(z)` per loop and speed.

### Quality Gate
- Each loop prints its order and the delay representation used.

---

## Phase 2: Margins

### Entry Criteria
- Loops built.

### Actions
1. `gm, pm, wcg, wcp = control.margin(L)`. Convert `gm` to dB with `20*log10(gm)`. Also call `control.stability_margins(L, returnall=True)` to catch multiple crossovers; report the worst.
2. Delay margin: `DM = (pm in radians) / wcp` seconds (the extra delay that removes the phase margin). Compare to the measured delay uncertainty.
3. Discrete closed-loop poles: `numpy.abs(control.poles(control.feedback(L_z, 1)))`; all must be below 1.
4. Plots: `control.bode_plot(L, display_margins=True)` (older versions used `margins=True`; check your version), `control.nyquist_plot(L)`. Save PNGs.

### Output
Margin table.

### Quality Gate
- Margin table prints gm (dB), pm (deg), DM (s) and max pole magnitude for every loop and speed.

---

## Phase 3: Judge

### Entry Criteria
- Margin table complete.

### Actions
1. Compare against the user's required gain and phase margins. If the user has none, report the values with the classical design guidance cited from the textbook they use (for example Franklin, Powell and Emami-Naeini, Feedback Control of Dynamic Systems) and mark the result "not judged".
2. Any discrete pole magnitude at or above 1 is FAIL regardless of user input.
3. If continuous (Pade) and discrete results disagree on PASS or FAIL, trust the discrete result and report the discrepancy.
4. Write `stability_report.json`.

### Output
`stability_report`.

### Quality Gate
- `stability_report.json` parses and has a verdict per loop and speed.

---

## Worked Example

Illustrative only. Speed loop Kp 2.83, Ti 1.44 s, tau 0.15 s, T 0.18 s, dt 0.02 s.

- Phase 1: Pade n = 3 and n = 5 give phase margin within 0.2 deg of each other.
- Phase 2: gm 9.8 dB, pm 47 deg at 1.9 rad/s, DM = 0.82 / 1.9 = 0.43 s; discrete max pole magnitude 0.987.
- Phase 3: user requires 6 dB and 45 deg: PASS.

---

## Exit Criteria

DONE when every loop at every simulated speed has margins, delay margin and discrete pole magnitudes, judged against the user's requirements or marked not judged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Keyword not accepted by installed python-control | **Adjust**: check `help(control.bode_plot)` for the version's keyword. |
| Phase 2 | `margin` returns inf gain margin | **Adjust**: the phase never crosses -180 deg in range; report gm as infinite and rely on DM. |
| Phase 3 | Discrete pole magnitude at or above 1 | **Stop**: no bench test until gains are reworked. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
