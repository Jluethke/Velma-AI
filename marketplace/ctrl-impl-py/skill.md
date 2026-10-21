# Python Real-Time Controller Package

**One-line description:** Packages the simulated controllers into a Python runtime with a fixed-period loop, an explicit IDLE, ENGAGED and FAULT state machine, stale-input detection, per-cycle logging, and a replay test that reproduces the simulator's golden vectors exactly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sim_verdict` (string, required): From `ctrl-closed-loop-sim-py`. Must be `PASS`.
- `sim_log` (object, required): Supplies golden vectors and the parameter manifest.
- `longitudinal_controller` (object, required): From `ctrl-pid-antiwindup`.
- `pid_gains` (object, required): From `ctrl-pid-step-tuning`.
- `actuator_limiter` (object, required): From `ctrl-actuator-rate-saturation`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `py_controller_build` (object): Path to the `controller_rt` package, `config.yaml` with every parameter and its source, the pytest report including golden replay, the pinned dependency file (`requirements.txt` with exact versions or a lock file), and the git commit.

---

## Phase 1: Runtime Structure

### Entry Criteria
- `sim_verdict` is `PASS`.

### Actions
1. Create `controller_rt/` with modules: `config.py` (load YAML, validate every key with a schema such as `pydantic`), `state_machine.py`, `loop.py`, `io_adapter.py` (interface to the user's actuator and sensor API; no vehicle bus write here unless the user's documented actuator interface requires it).
2. State machine:

| State | Entered when | Output |
|---|---|---|
| IDLE | start, or operator disengage | no motion request (as defined in `control_spec`) |
| ENGAGED | operator engage with all inputs fresh | controller commands through the limiter |
| FAULT | stale input, NaN, solver fallback latched, limiter fault | no motion request; latched until operator reset |

3. Stale input: each sensor message carries a receive timestamp from `time.monotonic_ns()`. If the age exceeds the user's maximum age for that signal, go to FAULT.
4. The runtime never reads, filters, delays or gates the brake pedal, any brake request from other systems, or the emergency stop. The hardware emergency stop acts without this software. State this in `README.md` of the package.

### Output
Package skeleton.

### Quality Gate
- `python -c "import controller_rt"` exits 0.
- A unit test drives every state transition in the table.

---

## Phase 2: Loop And Logging

### Entry Criteria
- State machine tested.

### Actions
1. Fixed-period loop with absolute deadlines: `next_t += period_ns; time.sleep(max(0, (next_t - time.monotonic_ns()) / 1e9))`. Never sleep a fixed `period` after the work (that accumulates drift).
2. Record per cycle: wake time, compute start and end, deadline miss flag, inputs, outputs, state. Write through a preallocated ring buffer flushed by a separate thread, not inline file writes in the loop.
3. Disable the garbage collector during ENGAGED with `gc.disable()` after `gc.freeze()`, and collect manually in IDLE; measure the effect in `ctrl-loop-timing-py`.
4. Same code path for simulation and hardware: the loop takes an `io_adapter` so the simulator adapter can run the package end to end.

### Output
`controller_rt/loop.py`.

### Quality Gate
- Running the loop with the simulator adapter for scenario S4 produces a log whose tracking metrics match the simulator's within the golden replay tolerance.

---

## Phase 3: Golden Replay And Freeze

### Entry Criteria
- Loop runs with the simulator adapter.

### Actions
1. `tests/test_golden.py`: load `golden/*_vectors.npz`, feed recorded inputs through the controller step functions, assert outputs equal the recorded outputs with `numpy.testing.assert_array_equal` (same code, same platform, so bit equality is expected). If you changed code since the sim run, regenerate golden vectors from the sim first, then test.
2. Run `python -m pytest -q` for the whole package.
3. Pin dependencies: `pip freeze > requirements.txt` in a clean virtual environment.
4. Commit and record the hash: `git rev-parse HEAD`.

### Output
`py_controller_build`.

### Quality Gate
- pytest all passed, including golden replay.
- `requirements.txt` has `==` pins for every package.

---

## Worked Example

Illustrative only. Stanley plus speed PID at 50 Hz.

- Phase 1: 9 transition tests pass.
- Phase 2: simulator adapter S4 run: cross-track max 0.29 m, identical to sim.
- Phase 3: golden replay 1,000 cycles bit-equal; `pytest -q`: `31 passed`; commit `a41c9e2`.

---

## Exit Criteria

DONE when the package passes state machine tests and bit-equal golden replay, with pinned dependencies and a recorded commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `sim_verdict` not PASS | **Stop**: return to simulation. |
| Phase 3 | Golden mismatch | **Adjust**: find the diverging cycle and term; do not switch to approximate comparison to hide it. |
| Phase 3 | Unpinned dependency | **Retry**: rebuild the virtual environment and freeze. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
