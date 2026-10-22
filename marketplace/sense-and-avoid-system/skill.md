# Sense And Avoid System

Implement sense-and-avoid for drone operations: detect and track airborne and ground obstacles, compute collision risk, and execute avoidance maneuvers.

## Inputs

- `mission-plan`: Planned flight path and operational area
- `airframe-design`: Platform maneuverability and sensor payload capacity

## Outputs

- `detect-and-avoid-system`: Obstacle detection, tracking, collision risk assessment, and avoidance maneuver design
- `regulatory-compliance-package`: Documentation showing compliance with detect-and-avoid requirements for BVLOS operations

## Process

1. Select detection sensors for the operating environment. Cooperative: ADS-B In receiver detects transponder-equipped aircraft (most manned aircraft above 18,000 ft, increasingly at lower altitudes). FLARM for general aviation and gliders in some regions. Non-cooperative: radar (detects aircraft without transponders, works in all weather, heavy and power-hungry), camera-based detection (lightweight, detects against sky background using contrast, limited range in poor visibility, requires specialized tracking algorithms for small targets against cluttered backgrounds), lidar (limited range for air-to-air, more useful for ground obstacles during low-altitude operations). Most BVLOS operations require both cooperative and non-cooperative detection.
2. Implement obstacle tracking and collision risk assessment. Track detected obstacles using a Kalman filter with a constant-velocity or constant-turn model. Compute the closest point of approach (CPA): project both the drone's and the obstacle's trajectories forward, find the time and distance of minimum separation. If the projected CPA is within the collision avoidance threshold (well clear volume: 2000 ft horizontally, 250 ft vertically for integration with manned aviation, or smaller for small UAS operations), initiate avoidance. Assess urgency from time to CPA: advisory (>60s), corrective (35-60s), warning (<35s).
3. Design avoidance maneuvers. Follow the right-of-way rules: drones yield to all manned aircraft. Preferred avoidance direction: horizontal (right turn in head-on, right turn away in converging), or vertical (descend if the intruder is above, climb if below, matching manned aircraft convention). The avoidance maneuver must clear the well-clear volume and return to the planned path after the conflict is resolved. For ground obstacles during low-altitude flight: maintain a minimum clearance altitude, use lidar or camera-based terrain following.
4. Prepare the regulatory compliance package. For BVLOS operations in the US, an FAA waiver requires demonstrating: the ability to detect and avoid other aircraft (equivalent level of safety to visual line of sight), a plan to mitigate risk to people on the ground (ground risk buffer or population density constraints), operational procedures for lost link, low battery, and weather. Document: detection sensor specifications and tested detection range, tracking filter performance, avoidance maneuver response time, and field test results demonstrating the system detects and avoids intruder aircraft.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
