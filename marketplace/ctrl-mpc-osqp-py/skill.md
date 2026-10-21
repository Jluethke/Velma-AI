# MPC Solve Loop With OSQP In Python

**One-line description:** Wires the sparse MPC QP into OSQP's Python interface with one-time setup, per-cycle `update`, warm starting, a solve time limit, explicit status handling and a fallback command, and measures solve time distribution against the controller period.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mpc_problem` (object, required): From `ctrl-mpc-qp-formulation`; provides `build_qp` and the golden solution.
- `actuator_limiter` (object, required): From `ctrl-actuator-rate-saturation`.

---

## Outputs

- `mpc_controller` (object): Path to `control/mpc_osqp.py`, OSQP settings used, status handling table, solve time percentiles from the timing benchmark, and tests.

---

## Phase 1: Setup And Settings

### Entry Criteria
- `osqp` installed: `python -c "import osqp; print(osqp.__version__)"`. Record the version; settings names and defaults changed between OSQP 0.6 and 1.x, so read the settings page of the installed version.

### Actions
1. Create the solver once: `prob = osqp.OSQP(); prob.setup(P, q, A, l, u, warm_start=True, verbose=False, ...)`.
2. Settings to set explicitly and record: `eps_abs`, `eps_rel` (tolerances; the documented defaults are in the OSQP settings page), `max_iter`, `polish` (improves accuracy, costs time), `time_limit` (seconds; set from the controller period budget the user allocates to the solver), `adaptive_rho`. Do not set a setting whose name you have not confirmed in the installed version's documentation.
3. Check the golden instance: solve once and compare `res.x` to the golden vector from `mpc_problem` with `numpy.testing.assert_allclose(atol=...)` where `atol` is a small multiple of `eps_abs` (the tolerance is the solver's own; record the multiple).

### Output
Configured solver matching the golden solution.

### Quality Gate
- `res.info.status` prints `solved` on the golden instance and the comparison passes.

---

## Phase 2: Per-Cycle Loop

### Entry Criteria
- Golden check passed.

### Actions
1. Each cycle: build `q, l, u` and the new values of `P` and `A` (same pattern). Call `prob.update(q=q, l=l, u=u, Px=P_new.data, Ax=A_new.data)`. Do not call `setup` again per cycle; that redoes factorization from scratch.
2. Warm start with the shifted previous solution: `prob.warm_start(x=z_shifted)`.
3. `res = prob.solve()`. Read `res.info.status`, `res.info.iter`, `res.info.solve_time` (plus `setup_time`, `update_time` as available in the version).
4. Status table:

| Status | Action |
|---|---|
| `solved` | Use `u_0` from `res.x` |
| `solved inaccurate` | Use `u_0`, log a warning counter |
| `maximum iterations reached` or `run time limit reached` | Use the second input of the previous solution (shifted plan) if it exists and is less than the user's maximum plan age; else command the fallback |
| `primal infeasible`, `dual infeasible`, other | Fallback: hold the steering command and request the speed controller's deceleration to stop at the configured rate; latch a fault |

5. Pass `u_0` through the shared limiter before output. The fallback never overrides or delays a brake or emergency-stop path.

### Output
`control/mpc_osqp.py` with `MpcOsqp.step(x_meas, u_prev, ref_window)`.

### Quality Gate
- Each status row is exercised by a unit test (force `max_iter=1` to trigger the iteration limit; pass an infeasible `l > u` to trigger infeasibility).

---

## Phase 3: Timing Benchmark

### Entry Criteria
- Status handling tested.

### Actions
1. Replay the full reference trajectory in closed loop with the kinematic plant. Record `solve_time` and wall time around `step` with `time.perf_counter_ns()`.
2. Report p50, p99, p99.9 and max (`numpy.percentile`) and the count of cycles over the solver budget.
3. If p99.9 or max exceeds the budget: reduce N, loosen `eps_abs` and `eps_rel` within the accuracy the user accepts, turn `polish` off, or switch to OSQP generated C code (`prob.codegen(...)`; check the method signature for the installed version) or to acados. Rerun.
4. Run `python -m pytest tests/test_mpc_osqp.py -q`.

### Output
`mpc_controller`.

### Quality Gate
- Timing table printed; count of over-budget cycles is 0, or the flow returns the table as an open problem.
- pytest all passed.

---

## Worked Example

Illustrative only. N 30, nz 184, budget 10 ms of a 20 ms period.

- Phase 1: OSQP 1.0.x, eps_abs 1e-4 chosen by the user; golden check passes.
- Phase 3: solve_time p50 0.9 ms, p99 2.1 ms, max 4.6 ms; 0 cycles over 10 ms.

---

## Exit Criteria

DONE when the OSQP loop matches the golden solution, handles every status, and its measured worst-case time fits the solver budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Setting name rejected | **Adjust**: read the installed version's settings list; remove guessed names. |
| Phase 2 | `update` raises on Px size | **Adjust**: the sparsity pattern changed; fix `build_qp`. |
| Phase 3 | Budget exceeded | **Retry**: apply one change from step 3 at a time and re-measure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
