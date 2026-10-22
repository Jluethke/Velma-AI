# Actuator Design

Design the actuator: the mechanism that executes the corrective action. This is where most feedback loops break. The sensor works, the comparator works, the controller decides, and then nobody does anything. The actuator is the person, process, or automation that actually changes the input.

## Inputs

- `controller-design`: The corrective actions at each error level
- `controlled-variable`: What is being controlled, for context on who can act

## Outputs

- `actuator-design`: For each corrective action: who executes it, how they are notified, and the deadline for execution
- `execution-verification`: How to verify the corrective action was actually taken (not just decided on)

## Process

1. For each corrective action, name the specific person (not team) who executes it. If it is automated, name the system and the trigger.
2. Define the notification mechanism: how does the actuator learn that an action is needed? Push notification, email, dashboard alert, calendar reminder. The notification must be unavoidable within the required response time.
3. Define the verification: how do you know the action was taken? The actuator confirms (checkbox, log entry, commit). If the action was not taken within the deadline, the escalation path activates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
