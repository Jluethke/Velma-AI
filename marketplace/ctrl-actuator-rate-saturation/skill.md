# Actuator Rate Limiting And Saturation Module

**One-line description:** Implements and tests one shared command-shaping module that applies rate limits and magnitude saturation to steering and longitudinal commands in a fixed order, reports the saturated value back for anti-windup, and never touches the brake or emergency-stop path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `control_spec` (object, required): Supplies maximum road wheel angle, road wheel angle rate limit, acceleration and deceleration limits, jerk limit and controller period.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `actuator_limiter` (object): Path to `control/limiter.py`, its tests, the limit values it reads, the ordering rule, and the passing pytest output. The C++ port in `ctrl-impl-cpp` reproduces this module.

---

## Phase 1: Specify Behavior

### Entry Criteria
- All limits present in `control_spec`.

### Actions
1. Write the order of operations in the module docstring: (1) rate limit relative to the last applied command, (2) magnitude saturation, (3) report the applied command and a flag per channel `rate_limited`, `saturated`.
2. Rate limit: `u_applied = u_prev + clip(u_req - u_prev, -r_max * dt, r_max * dt)`. For longitudinal acceleration, `r_max` is the jerk limit; for steering, it is the road wheel angle rate limit.
3. Saturation: `clip(u, u_min, u_max)`; for acceleration `u_min = -decel_max`, `u_max = a_max`.
4. Initialization: on engage, `u_prev` is set to the measured actuator state (measured road wheel angle, measured acceleration), not to zero. Starting from zero causes a step on engage.
5. Brake and emergency-stop rule: this module shapes only the controller's own requests. It must not sit in, delay, filter or rate-limit any brake pedal input, any brake request from another system, or the emergency stop. The hardware emergency stop acts independently of this software. Write this rule in the docstring.

### Output
Docstring specification.

### Quality Gate
- Docstring lists the operation order, initialization rule and brake and emergency-stop rule.

---

## Phase 2: Implement

### Entry Criteria
- Specification written.

### Actions
1. Create `control/limiter.py` with a class `ChannelLimiter(rate_max, u_min, u_max, dt)` holding `u_prev`, methods `reset(u_measured)` and `apply(u_req) -> (u_applied, rate_limited, saturated)`.
2. Create `CommandLimiter` composing two channels: `steer` and `accel`.
3. Reject NaN or infinite requests: if `not math.isfinite(u_req)`, return `u_prev` and set a `fault` flag the controller must latch. Do not pass NaN to an actuator.
4. Use plain floats; no global state. Edit only these files in this flow.

### Output
`control/limiter.py`.

### Quality Gate
- `python -c "from control.limiter import CommandLimiter"` exits 0.

---

## Phase 3: Test

### Entry Criteria
- Module imports.

### Actions
1. `tests/test_limiter.py` with pytest:
   - Step request from 0 to `u_max` reaches `u_max` in exactly `ceil(u_max / (r_max dt))` steps and never exceeds `r_max dt` per step (check `numpy.diff`).
   - Request above `u_max` is clamped and `saturated` is True.
   - Reset to a measured value then holding the same request gives zero change.
   - NaN request returns previous value and sets `fault`.
   - Property test with `hypothesis` (`@given(st.floats(allow_nan=False, allow_infinity=False))`) asserting every output is within bounds and every step within the rate limit.
2. Run `python -m pytest tests/test_limiter.py -q`.
3. Do not delete or weaken a failing test.

### Output
`actuator_limiter`.

### Quality Gate
- pytest reports all passed, zero skipped.
- The hypothesis test ran (pytest output lists it as passed, not skipped).

---

## Worked Example

Illustrative only. Steering rate limit 0.5 rad/s, dt 0.02 s, delta_max 0.5236 rad.

- Phase 1: per step change at most 0.01 rad.
- Phase 3: step 0 to 0.5236 takes ceil(52.36) = 53 steps; `pytest -q` prints `5 passed`.

---

## Exit Criteria

DONE when the limiter passes all tests including the property test and its docstring states the brake and emergency-stop exclusion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A limit missing | **Stop**: return to `ctrl-spec-intake`. |
| Phase 3 | Off-by-one in step count | **Adjust**: check rate limit uses the last applied value, not the last request. |
| Phase 3 | hypothesis finds a bound violation | **Adjust**: fix the order of operations; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
