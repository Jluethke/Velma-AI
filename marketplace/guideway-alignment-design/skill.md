# Guideway Alignment Design

Design the horizontal and vertical alignment of the guideway for target speed and passenger comfort.

## Inputs

- `route-endpoints`: Origin and destination with intermediate stop requirements
- `design-speed`: Maximum operating speed and vehicle characteristics

## Outputs

- `alignment-geometry`: Horizontal curves (radius, superelevation, transition lengths), vertical grades, and station locations
- `right-of-way-requirements`: Corridor width, property acquisition needs, utility conflicts

## Process

1. Set minimum horizontal curve radius from speed, superelevation, and comfort. R = V^2 / (g * (e + f)), where V is speed, e is superelevation (bank angle), f is unbalanced lateral acceleration limit. For passenger comfort: unbalanced acceleration < 0.05g for seated passengers. For 300 km/h with 8 degrees cant: R approximately 4,200 m. For 1,000 km/h in a tube at 15 degrees: R approximately 25,000 m.
2. Design transition curves between tangent and circular curves. Clothoid (Euler spiral) for gradual introduction of curvature and superelevation. Length of transition: roll rate for superelevation change limited to 5 degrees/s for conventional, possibly higher for enclosed pods. At high speeds, transitions are several kilometers long.
3. Set vertical alignment. Maximum grade depends on propulsion capability at speed. Maglev: up to 8 to 10%. Wheel-on-rail HSR: up to 3.5 to 4%. Vertical curves: minimum radius from vertical acceleration limit (0.3 m/s2 for comfort on crests). Crest curve radius R = V^2 / (3.6^2 * a_v). At 300 km/h: R approximately 23,000 m.
4. Locate stations for passenger access and system operations. Stations at population centers and transport hubs. Deceleration distance from maximum speed: several km depending on comfortable deceleration (1.0 to 1.5 m/s2 for seated passengers). Include bypass tracks at stations for non-stop services if applicable.
5. Define right-of-way. Guideway structure width plus clearance envelope plus maintenance access plus safety setback. For elevated guideway: typically 15 to 25 m corridor. For tunnel: surface easement width depends on depth. Identify utility relocations, road crossings, and environmental sensitive areas requiring avoidance or mitigation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
