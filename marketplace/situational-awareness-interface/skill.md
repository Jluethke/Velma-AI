# Situational Awareness Interface

Design the interface that communicates the robot's state and intent to human operators or bystanders: what the robot perceives, what it plans to do, and how confident it is.

## Inputs

- `robot-system`: The autonomous system with its perception, planning, and control capabilities
- `user-roles`: Who interacts with the robot (operator, supervisor, bystander, co-worker) and what they need to know

## Outputs

- `interface-design`: Interface layout and information architecture for each user role
- `information-priority-model`: What to show and when, based on urgency and relevance

## Process

1. Identify what information each user role needs. Operator (remote): full perception view (camera feeds, lidar visualization), system status (localization confidence, sensor health, battery, connectivity), current plan (trajectory, next action), and alerts (detected anomalies, approaching limits). Supervisor (oversight): aggregate fleet status, individual robot status on demand, exception alerts, intervention history. Bystander: the robot's immediate intent (direction of travel, stopping, yielding) through physical signals (lights, sounds, display). Co-worker (collaborative robot): the robot's planned motion (will it enter my workspace), force/speed status, e-stop accessibility.
2. Design the display hierarchy. Apply the visual hierarchy: most critical information largest and most prominent, secondary information available but not distracting. For remote operation: center of display is the primary camera view or map view, periphery shows system health indicators, bottom shows the current action and next planned action. Use color coding consistently: green for nominal, yellow for degraded, red for fault or alert. Avoid information overload: show summary status by default, drill-down for details. Display confidence levels for perception outputs so the operator knows when to trust or override.
3. Design intent communication for bystanders and co-workers. External signals: LED strips showing direction of travel (animated directional pattern), brake lights for deceleration, warning lights for reversing. Audio: low tone for normal operation (so people know it is there), higher tone or verbal announcement for approaching people or tight spaces. Display: a simple screen showing the robot's immediate plan in pictographic form (arrow for direction, stop sign for stopping). For collaborative robots: projected light showing the planned workspace boundary on the floor.
4. Prioritize information by urgency. Define alert levels: informational (system status changes, logged for review), advisory (approaching a limitation, operator should be aware), caution (action may be needed soon), warning (immediate action required). Each alert level gets progressively more intrusive display: informational updates in a log, advisory as a highlighted status change, caution as a pop-up with audio tone, warning as a full-screen alert with persistent audio. Test with operators to verify that critical information is noticed and non-critical information does not cause alarm fatigue.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
