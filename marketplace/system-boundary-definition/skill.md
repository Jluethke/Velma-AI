# System Boundary Definition

Define the system boundary for building a digital twin from observations. Catalog every signal crossing the boundary and assess which internal states are observable from the boundary signals alone.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load system description and observation channels
REASON  --> Classify signals, assess observability
PLAN    --> Identify hidden states, define twin requirements
ACT     --> Output boundary specification and observability assessment
```

## Inputs

- `system_description`: string -- What the system is, what it does, and what interfaces it exposes
- `observation_channels`: list[object] -- All measurable signals at the system boundary: name, type, rate, unit

## Outputs

- `boundary_specification`: object -- Inputs (controlled, disturbance), outputs, and internal states with types, ranges, and rates
- `observability_assessment`: object -- Each internal state classified as observable (determinable from outputs) or hidden (requires additional measurement)

---

## Execution

### OBSERVE: Catalog Signals

1. List every signal that crosses the system boundary from the observation channels.
2. Identify signals not in the observation channels but known to exist from the system description (unmeasured inputs or outputs).

### REASON: Classify and Assess

1. Classify each signal:
   - **Controlled input:** we choose its value (commands, setpoints)
   - **Disturbance input:** we measure but do not control (environmental conditions, load)
   - **Output:** the system's response (sensor readings, status, actuator positions)
   - **Internal state:** not directly measured, inferred from outputs (temperature of an internal component, wear level, calibration drift)

2. Assess observability: can each internal state be uniquely determined from the outputs?
   - If two different internal states produce identical outputs, the state is not observable from the boundary
   - Use the observability rank test: if the observability matrix has full rank, all states are observable

3. For hidden states, identify what additional measurement or input would make them observable.

### PLAN: Define Twin Requirements

1. The boundary specification defines what the digital twin must reproduce: it must match every output for every input, within measurement uncertainty.
2. Hidden states limit the twin's accuracy: the twin cannot predict behavior that depends on unobservable states.
3. Document the accuracy ceiling: the best the twin can achieve given the available observations.

### ACT: Deliver

1. Output the boundary specification as a table of signals with classification and range.
2. Output the observability assessment: observable states, hidden states, and what to add to observe them.

## Exit Criteria

1. Every signal crossing the boundary is classified
2. Internal states are assessed for observability
3. Hidden states are identified with remediation options

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
