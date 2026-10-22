# Use Related Risk Analysis

Identify use-related hazards through task analysis and use-error prediction, linking use risks to the risk management file per ISO 14971.

## Inputs

- `intended-use-and-users`: Device intended use, user profiles (professional, lay user, patient), and use environments
- `device-user-interface`: Description of all user interface elements: controls, displays, labels, alarms, connections, accessories

## Outputs

- `use-specification`: User profiles, use environments, and task analysis for all use scenarios
- `use-related-risk-analysis`: Identified use errors, their root causes (perception, cognition, action), associated hazards, and risk priority

## Process

1. Define user profiles: training level, physical capabilities (vision, dexterity, strength), experience with similar devices, cognitive state during use (emergency department stress vs routine clinic). Each profile may interact differently with the same interface.
2. Conduct task analysis: break each use scenario (setup, use, maintenance, disposal) into sequential tasks. For each task, identify the information the user needs, the action they must take, and the feedback they receive. This reveals the user-device interaction at each step.
3. For each task, predict possible use errors: perception errors (did not see the alarm, misread the display), cognitive errors (misinterpreted the reading, selected wrong mode), and action errors (pressed wrong button, connected wrong port, applied wrong force). Predict based on known human factors principles, not assumptions about careful users.
4. Link each predicted use error to its consequence (hazard and harm) and estimate risk. High-severity use errors (wrong drug, wrong dose, wrong patient) drive the design priority. Use errors that are common but low-severity may be acceptable with information for safety.
5. Prioritize use-related risks and define risk control measures. Design controls first (make the error impossible or self-correcting), then protective controls (interlocks, alarms), then training and labeling last. Each control measure must be verifiable through usability testing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
