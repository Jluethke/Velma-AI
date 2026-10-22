# Stpa Hazard Analysis

Perform Systems-Theoretic Process Analysis to identify hazards through unsafe control actions and loss scenarios in the control structure.

## Inputs

- `system-control-structure`: Control structure diagram showing controllers, controlled processes, actuators, sensors, and feedback loops
- `system-losses`: Unacceptable losses (loss of life, environmental damage, mission failure) the analysis must prevent

## Outputs

- `unsafe-control-action-table`: UCAs classified by type: not provided, provided incorrectly, wrong timing, stopped too soon
- `loss-scenario-register`: Causal scenarios for each UCA with contributing factors at controller, actuator, sensor, and process levels

## Process

1. Define system-level losses (L1, L2, ...) and trace to system-level hazards (H1, H2, ...): system states that, combined with worst-case environment, lead to a loss. Each hazard must name the system state and the environmental condition.
2. For each controller in the control structure, enumerate control actions. For each control action, analyze four types of unsafe control action: (1) not provided when needed, (2) provided when not needed, (3) provided too early/too late/wrong order, (4) stopped too soon or applied too long. Link each UCA to the hazard it causes.
3. For each UCA, identify loss scenarios: what causes the controller to issue the UCA? Analyze at four levels: controller (incorrect process model, flawed algorithm), actuator (fails to execute, executes differently), sensor (provides incorrect feedback), and controlled process (state evolves unexpectedly).
4. For each loss scenario, identify the causal factor and determine whether a safety constraint (design requirement) can eliminate it. Safety constraints are the output: they become safety requirements in the requirements baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
