# Feedback Loop Assembler

Assemble the complete feedback loop and document it as a single operating system. The documentation includes all four components, the stability check, and the operating instructions for the person running the loop.

## Inputs

- `sensor-design`: Measurement mechanism
- `comparator-design`: Error calculation
- `actuator-design`: Execution mechanism
- `stability-assessment`: Whether the loop is stable

## Outputs

- `feedback-loop-document`: The complete loop: sensor, comparator, controller, actuator, stability check, and operating instructions
- `loop-health-metric`: How to measure whether the loop itself is working: is the error trending toward zero over time?

## Process

1. Assemble the four components into a single diagram or document: sensor reads, comparator calculates error, controller selects action, actuator executes. Draw the arrows showing the flow.
2. Add the operating instructions: how often the loop cycles, who is responsible for each component, and what to do if a component breaks (sensor stops reporting, actuator is unavailable).
3. Define the meta-metric: is the loop itself working? Plot the error over time. If the error is trending toward zero, the loop is working. If it is flat or increasing, one of the four components is broken.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
