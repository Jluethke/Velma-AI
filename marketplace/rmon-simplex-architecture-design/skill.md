# Simplex Architecture Design

**One-line description:** Designs a Simplex run-time assurance architecture (Seto, Krogh, Sha and Chutinan, ACC 1998; Sha, IEEE Software 2001; the RTA pattern in ASTM F3269) around the scoped component: the advanced controller, a simpler verified safety controller, and a decision module that switches on a recoverable-region test rather than on the hazard itself.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `monitor_scope` (object, required): Output of `rmon-scope-supervised-component`.
- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`.

---

## Outputs

- `simplex_design` (object): `advanced_controller` (the scoped component), `safety_controller` (law, inputs, outputs, verification method), `decision_module` (switch condition, inputs, location), `recoverable_region` (definition and how it is computed), `switch_latency_budget_ms` (open or sourced), `diagram` (text block), `open_items`.

---

## Phase 1: Define the Safety Controller

### Entry Criteria
- `operating_envelope` has no row marked `invalid`.

### Actions
1. Write the safety controller as the simplest control law that brings the plant to the safe state defined by the hazards in `monitor_scope.hazard_map`. Examples: a fixed deceleration profile to stop, hold current position, a PID loop to a fixed setpoint.
2. Record how it will be verified. Use this table:

   | Safety controller form | Verification method to record |
   |---|---|
   | Linear state feedback on a linear model | Lyapunov function from an LMI solve (for example with CVXPY) plus the model error assumptions |
   | Fixed open-loop profile (constant deceleration) | Closed-form stopping distance from the plant model and actuator datasheet |
   | Lookup table or rule set | Exhaustive enumeration of inputs, unit tested |

3. The safety controller must not use any output of the advanced controller and must not share learned weights with it.

### Output
Safety controller specification.

### Quality Gate
- The safety controller section lists every input signal and every one of them is in `monitor_scope.inputs`.
- No input of the safety controller is a command produced by the advanced controller.

---

## Phase 2: Define the Recoverable Region and Switch

### Entry Criteria
- Safety controller specified.

### Actions
1. Define the recoverable region: the set of states from which the safety controller can still reach the safe state without leaving the envelope. Simplex switches when the next state predicted under the advanced command would leave this region, not when the envelope is already violated.
2. Choose how to test membership:

   | Plant knowledge | Region test |
   |---|---|
   | Linear model, quadratic Lyapunov function V(x) = x^T P x | V(x_next) <= c, with c from the LMI solve |
   | Stopping profile known | predicted stopping distance under the safety controller < distance to the nearest envelope boundary |
   | Neither | open item: no switch condition can be justified yet |

3. Predict one control period ahead using the plant model and the advanced command. The prediction model and its error bound go into `open_items` if not already documented.
4. State `switch_latency_budget_ms` as the time from sample to safety controller output being applied. Take it from requirements or mark it open; do NOT pick a number.

### Output
`recoverable_region` and `decision_module` definitions.

### Quality Gate
- `recoverable_region` names its test from the table and the source of every constant in it.
- The decision module's inputs come from sensors, not from the advanced controller's internal state.

---

## Phase 3: Write the Design Record

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Draw the text diagram:
   ```
   sensors --+--> advanced controller --cmd_a--+
             +--> safety controller  --cmd_s--+--> decision module --> actuators
             +--> decision module (state)     |      (brake / e-stop path bypasses this box)
   ```
2. State explicitly that braking and emergency stop are wired outside the decision module and are never delayed by it.
3. Emit `simplex_design` as JSON.

### Output
`simplex_design`.

### Quality Gate
- The diagram shows the brake and emergency stop path not passing through the decision module.
- `python -c "import json; json.load(open('simplex_design.json'))"` exits 0.

---

## Worked Example

Illustrative only. Advanced controller: learned speed policy. Safety controller: constant deceleration to zero at the actuator datasheet limit, verified by closed-form stopping distance d = v^2 / (2a). Region test: d computed at v_next (speed after one 20 ms step under the advanced command) must be less than the lidar distance to the nearest obstacle minus the sensor error from its datasheet. `switch_latency_budget_ms`: open, to be derived from the FTTI.

---

## Exit Criteria

DONE when the safety controller, recoverable region test and decision module are written with a cited verification method, braking is outside the switch, and every unknown constant is an open item.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No safe state exists that a simple controller can reach | **Return**: to `rmon-fallback-mode-selection`; a fail-operational fallback is needed first. |
| Phase 2 | No plant model available | **Stop**: record the region test as open; a switch on envelope violation alone is too late for Simplex. |
| Phase 2 | Region test needs advanced controller internals | **Adjust**: rewrite it in terms of measured state only. |
| Phase 3 | Diagram routes braking through the switch | **Stop**: redesign; braking is never gated. |

**Do not:** let the safety controller reuse the learned model, switch on the advanced controller's self-reported confidence alone, or invent a region constant.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
