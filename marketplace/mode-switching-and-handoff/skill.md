# Mode Switching And Handoff

Design mode switching between manual, assisted, and autonomous operation: define transition criteria, manage handoff timing, and prevent mode confusion.

## Inputs

- `teleoperation-system`: Teleoperation and shared autonomy capabilities
- `robot-system`: Autonomous system capabilities and limitations

## Outputs

- `mode-switching-design`: Mode transition logic, handoff timing, and mode annunciation design
- `mode-confusion-mitigations`: Analysis and mitigations for mode confusion risks

## Process

1. Define the operating modes and their capabilities. Manual: human has direct control, robot provides no autonomous assistance. Assisted: human controls with robot assistance (e.g., collision avoidance active, speed limiting). Autonomous: robot controls, human monitors. Emergency: robot executes a predefined safe behavior regardless of human input. Each mode must have clear entry conditions, exit conditions, and annunciation (visual and auditory indication of the current mode).
2. Design the handoff protocol for human-to-robot transition. When the operator engages autonomous mode: verify all preconditions (sensors healthy, localization valid, mission loaded), display a confirmation with the autonomous system's plan, require explicit operator confirmation (button press with verification), ramp control authority from operator to robot over 1-2 seconds (not instant) to smooth the transition. The operator must confirm they are monitoring; passive engagement (not touching controls does not mean monitoring) must be detected and flagged.
3. Design the handoff protocol for robot-to-human transition. The robot escalates to the human when: it encounters a situation outside its capability, a fault reduces its confidence below the threshold, or the operator requests control. The escalation must provide: time budget (how long before the robot must act without human input), context (what the situation is, what options the robot sees), a default action (what the robot will do if the human does not respond). The human must have enough time and information to make a decision. If the human does not respond within the time budget, the robot executes the default (which must be safe, not optimal).
4. Mitigate mode confusion. Mode confusion occurs when the human and robot disagree about who is in control. Historical cause of accidents in aviation and autonomous driving. Mitigations: always annunciate the current mode prominently (large indicator, distinct colors), require positive action to change modes (no automatic mode transitions without operator awareness), maintain control input monitoring (if the operator provides input inconsistent with the current mode, alert them), log all mode transitions for post-incident analysis. Test the mode switching design with human subjects to identify confusion scenarios before deployment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
