# Nonlinear MPC With acados

**One-line description:** Builds the kinematic bicycle MPC as a nonlinear optimal control problem in acados via its Python template interface, with CasADi dynamics, ERK integration, SQP_RTI with partial condensing HPIPM, input and rate bounds, generated C code, and status and timing checks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mpc_problem` (object, required): From `ctrl-mpc-qp-formulation`; supplies horizon, weights, constraints and the golden solution.
- `plant_model` (object, required): From `ctrl-bicycle-model-py`; equations to restate in CasADi.
- `actuator_limiter` (object, required): From `ctrl-actuator-rate-saturation`.

---

## Outputs

- `acados_controller` (object): `control/mpc_acados.py`, the generated `c_generated_code/` directory and `acados_ocp.json`, solver options used, status handling, solve time percentiles, and tests.

---

## Phase 1: Install And Verify acados

### Entry Criteria
- Linux or WSL with CMake and a C compiler.

### Actions
1. Build acados from source following the official installation page (clone with `--recursive`, `cmake -DACADOS_WITH_QPOASES=ON ..` only if you need qpOASES, `make install -j`). Install the Python template: `pip install -e <acados_root>/interfaces/acados_template`.
2. Export `ACADOS_SOURCE_DIR=<acados_root>` and add `<acados_root>/lib` to `LD_LIBRARY_PATH`.
3. Run one of the shipped examples under `examples/acados_python/` to completion. The first run may download the `t_renderer` binary; allow it or place it manually as the docs describe.
4. Record the acados commit hash (`git -C <acados_root> rev-parse HEAD`); option names have changed across versions (for example horizon setting `ocp.dims.N` versus `ocp.solver_options.N_horizon`). Use the name your version's examples use.

### Output
Working acados installation.

### Quality Gate
- The shipped example exits 0 and prints a solver status of 0.

---

## Phase 2: Define The OCP

### Entry Criteria
- acados runs.

### Actions
1. Model: `AcadosModel()` with CasADi `SX` symbols `x = [px, py, psi, v]`, `u = [a, delta]`, `f_expl_expr` from the kinematic bicycle (same reference point as `plant_model`). To bound input rates, augment the state with `a` and `delta` and make the inputs their rates; then rate limits are plain input bounds.
2. Cost: `cost_type = "NONLINEAR_LS"` (or `LINEAR_LS` with `Vx`, `Vu`), `W` = block diagonal of the same Q, R used in `mpc_problem`, terminal `W_e` = Q_N.
3. Constraints: `constraints.lbu`, `ubu`, `idxbu` for rates; `lbx`, `ubx`, `idxbx` for steering angle and acceleration states; `constraints.x0` for the initial state. Soft corridor constraints through `idxsh` with slack weights `zl`, `zu`, `Zl`, `Zu`.
4. Solver options: `qp_solver = "PARTIAL_CONDENSING_HPIPM"`, `nlp_solver_type = "SQP_RTI"`, `hessian_approx = "GAUSS_NEWTON"`, `integrator_type = "ERK"`, `tf = N * dt_mpc`.
5. Create: `solver = AcadosOcpSolver(ocp, json_file="acados_ocp.json")`. This generates and compiles `c_generated_code/`.

### Output
Generated solver.

### Quality Gate
- `c_generated_code/` exists and contains a compiled shared library (`ls c_generated_code/*.so`).

---

## Phase 3: Loop, Status And Timing

### Entry Criteria
- Solver generated.

### Actions
1. Per cycle: set `x0` with `solver.set(0, "lbx", x_meas)` and `solver.set(0, "ubx", x_meas)`, set `yref` per stage with `solver.set(k, "yref", ...)`, shift the previous solution into `x` and `u` initial guesses, call `status = solver.solve()`.
2. Status: 0 is success. Any nonzero status (see the acados documentation for the code list, for example maximum iterations or QP failure) triggers the same fallback as the OSQP flow: hold steering, request deceleration to stop, latch fault. Never skip the limiter.
3. Read `solver.get(0, "u")` and `solver.get_stats("time_tot")`.
4. Compare the first solve on the golden instance with the golden solution from `mpc_problem` (states and inputs). Expect small differences from integration method; report the max difference.
5. Closed-loop replay over the reference trajectory; report p50, p99, p99.9 and max of `time_tot` against the solver budget.
6. `python -m pytest tests/test_mpc_acados.py -q` covering: success path, forced failure (infeasible bounds) reaches the fallback, output passes through the limiter.

### Output
`acados_controller`.

### Quality Gate
- Over-budget cycle count printed and 0, or returned as an open problem.
- pytest all passed.

---

## Worked Example

Illustrative only. N 30, dt_mpc 0.05 s, rates augmented into the state.

- Phase 2: generation and compile finish; `c_generated_code/libacados_ocp_solver_kin_bicycle.so` present.
- Phase 3: time_tot p50 0.41 ms, max 1.3 ms; golden max state difference 0.003 m.

---

## Exit Criteria

DONE when the acados solver is generated from the documented OCP, handles nonzero status through the fallback, and fits the solver budget in replay.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ImportError: libacados.so` | **Adjust**: fix `LD_LIBRARY_PATH`; rerun. |
| Phase 2 | Option name not found | **Adjust**: follow the naming in your version's examples. |
| Phase 3 | Status nonzero on most cycles | **Return**: check weights scaling and initial guess shift; report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
