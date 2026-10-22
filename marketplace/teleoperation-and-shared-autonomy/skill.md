# Teleoperation And Shared Autonomy

Implement teleoperation with shared autonomy: handle communication latency, blend human input with autonomous capability, and design the control interface for efficient remote operation.

## Inputs

- `robot-system`: Robot with its autonomous capabilities and communication link
- `interface-design`: Operator interface layout

## Outputs

- `teleoperation-system`: Teleoperation control system with latency compensation and shared autonomy modes
- `operator-workload-analysis`: Analysis of operator cognitive load and maximum number of robots per operator

## Process

1. Characterize the communication link. Measure: round-trip latency (typical: 50-200ms for cellular, 500ms-2s for satellite), jitter (variation in latency), bandwidth (sufficient for video and control data), reliability (packet loss rate). Latency above 300ms makes direct teleoperation (joystick to motor) unreliable due to operator overcorrection. Above 1s, direct teleoperation is impractical. The communication link quality determines the level of autonomy sharing required.
2. Design shared autonomy levels. Level 1 (direct teleoperation): operator sends velocity or steering commands, robot executes immediately. Viable only with <200ms latency. Level 2 (assisted teleoperation): operator sends high-level commands (go to waypoint, follow path), robot handles low-level control (obstacle avoidance, path following). Viable up to ~1s latency. Level 3 (supervisory control): robot operates autonomously, operator monitors and intervenes by exception (approve a decision, select an alternative plan). Viable for any latency. Level 4 (full autonomy with escalation): robot operates independently, escalates specific decisions to the operator when it is uncertain. Implement smooth transitions between levels based on link quality and situation complexity.
3. Implement latency compensation. Predictive display: render the robot's predicted future state (where it will be given the current commands and vehicle model) alongside the actual state. The operator controls the predicted state, which feels responsive despite the delayed feedback. Model-based: maintain a local simulation of the robot on the operator's side, driven by the same commands; the local simulation provides instant feedback while the real robot catches up. Haptic feedback: if using force-feedback controls, model the remote environment locally and update with delayed sensor data; direct force transmission over a latent link causes instability.
4. Analyze operator workload. Count the information sources the operator must monitor and the decisions they must make per unit time. For a single robot in a complex environment: one operator is fully occupied. For robots in simple environments with high autonomy: one operator can supervise 3-5 robots (fleet management model). Key factor: the intervention rate. If the robot needs operator input every 30 seconds, one operator per robot. If the robot needs input every 10 minutes, one operator can handle a small fleet. Measure intervention rates from field data and staff accordingly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
