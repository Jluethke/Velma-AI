# Relative Navigation Sensors

Select relative-navigation sensors and plan handover by range.

## Inputs

- `approach_corridor`: Corridor that sets pointing and field-of-view needs.
- `hold_points`: Ranges at which sensors hand over.
- `relative_dynamics`: Relative states the navigation filter estimates.

## Outputs

- `navigation_sensors`: Sensor set across far, mid, and near range.
- `nav_accuracy`: Relative position and velocity accuracy by phase.
- `sensor_handover`: Ranges at which the active sensor changes.

## Process

1. Far range (kilometers): use relative satellite-navigation or radio ranging for meter-level relative position.
2. Mid range (hundreds of meters): use radar or a camera tracking the target against the star background for bearing and range.
3. Near range (below about 100 m): use lidar or flash lidar with a vision system for centimeter-level relative position and attitude.
4. Fuse range and bearing in an extended Kalman filter built on the relative dynamics to estimate position and velocity continuously.
5. Define handover ranges where the active sensor changes, and account for lighting constraints that can blind an optical sensor during approach.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
