# Autonomous Mission Planning

Plan autonomous drone missions: waypoint generation, survey pattern design, corridor planning, geofencing, and dynamic replanning.

## Inputs

- `mission-profile`: Mission objectives, area of interest, and constraints
- `airframe-design`: Platform endurance, speed, and altitude capabilities
- `flight-controller`: Flight controller capabilities and limitations

## Outputs

- `mission-plan`: Complete mission plan with waypoints, altitudes, speeds, and camera/sensor actions at each point
- `contingency-plans`: Alternative plans for weather abort, battery margin, and airspace changes

## Process

1. Generate the mission plan from objectives. Survey mission: compute a lawnmower or serpentine pattern over the area of interest. Line spacing from camera footprint at altitude: GSD (ground sample distance) = pixel size * altitude / focal length. Overlap requirement (typically 70% forward, 60% side for photogrammetry) determines the line spacing and trigger interval. Inspection mission: generate waypoints at inspection points with specific viewing angles. Corridor mission (pipeline, powerline): follow the corridor centerline with cross-track waypoints for complete coverage.
2. Apply operational constraints. Altitude: minimum altitude for obstacle clearance, maximum altitude from regulation (400 ft AGL in US under Part 107) or airspace restriction. Speed: maximum speed for image quality (motion blur limit from exposure time and GSD), minimum speed for wind resistance (ground speed must be positive in worst-case wind). Geofence: define the boundary the drone must not cross, with a buffer for control authority. No-fly zones: restrict overflights of people, roads, or restricted areas. Battery: plan the return-to-launch with sufficient reserve from any point in the mission.
3. Optimize the flight path for efficiency. For survey patterns: orient the flight lines along the longest dimension of the area to minimize the number of turns (turns waste time and battery). Start from the downwind side so the return leg is faster. For multi-battery missions: plan each sortie to minimize the number of redundant overlap strips between sorties. For delivery or inspection: solve the traveling salesman problem variant for the optimal visit order.
4. Design contingency plans. Weather abort: monitor wind speed and precipitation, define thresholds for mission continue/abort based on the platform's wind resistance capability. If aborted mid-mission, log the completed coverage and generate a resume plan for the remaining area. Low battery contingency: at any point during the mission, the shortest safe path to a landing zone must be within the remaining battery capacity; if not, begin return immediately. Airspace conflict: if a manned aircraft is detected or ATC issues a restriction, execute a hold or descend pattern until clearance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
