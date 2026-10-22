# Safety Specification Formalization

Translate natural-language safety requirements into mathematical constraint sets suitable for control design and verification.

## Inputs

- `safety-requirements`: Natural-language safety requirements (e.g., 'vehicle must not leave lane', 'robot must not contact person above 10N')
- `system-model`: Plant dynamics model

## Outputs

- `safe-set-definition`: Mathematical definition of the safe set C = {x : h(x) >= 0} for each safety constraint
- `safety-margin-allocation`: How much margin to build in for model uncertainty, sensor noise, and actuator delay

## Process

1. For each safety requirement, define a constraint function h(x) such that h(x) >= 0 when the system is in a safe state and h(x) < 0 when it is unsafe. Example: for a distance constraint d >= d_min, define h(x) = d(x) - d_min.
2. The safe set C is the intersection of all individual constraint sets: C = {x : h_1(x) >= 0 AND h_2(x) >= 0 AND ... AND h_m(x) >= 0}.
3. Allocate safety margin: tighten each constraint by the worst-case effect of model uncertainty (if position error bound is epsilon, tighten distance constraint by epsilon), sensor noise (tighten by the sensor noise bound in the relevant state), and actuation delay (tighten by the maximum state change possible during the delay period at maximum velocity).
4. Check that the tightened safe set is non-empty and that the desired operating region is contained within it. If the margins consume the entire safe set, the requirements are infeasible with the current hardware (need better sensors, faster actuators, or relaxed requirements).
5. Distinguish between hard safety constraints (violation causes harm: must never be violated) and soft operational constraints (violation causes performance degradation: can be temporarily violated). Only hard constraints go into the safety-critical control layer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
