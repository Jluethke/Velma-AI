# Post Flight Data Review

Conduct the post-flight data review to verify vehicle performance, identify anomalies, and certify for next flight.

## Inputs

- `flight-telemetry`: Complete telemetry dataset from the flight
- `vehicle-configuration`: As-flown vehicle configuration and predicted performance
- `inspection-data`: Post-flight hardware inspection results (for reusable stages)

## Outputs

- `flight-performance-assessment`: Actual vs predicted performance for every subsystem
- `anomaly-list`: All anomalies identified during flight with severity and root cause assessment
- `flight-readiness-for-next-mission`: Certification that the vehicle design is ready for the next flight

## Process

1. Reconstruct the trajectory: compare actual position, velocity, and attitude from navigation data with the predicted trajectory. Differences indicate performance variations (engine Isp, drag, wind) or anomalies. The reconstructed trajectory is the ground truth for all subsequent analysis.
2. Engine performance: compare measured chamber pressure, turbopump speeds, temperatures, and mixture ratio with predictions. Calculate actual Isp and thrust from chamber pressure and flow rates. Any deviation from prediction is investigated. Engine performance data feeds the model for the next flight prediction.
3. GNC performance: evaluate navigation accuracy (comparing INS solution with GPS if available), guidance commanding, and control system response. Check control actuator usage (gimbal angles, RCS pulses) against predictions. Excessive control activity may indicate unexpected disturbances or model errors.
4. Structural loads: compare measured accelerations, acoustic environment, and temperatures with the design loads analysis. If any measurement exceeds the predicted envelope, investigate whether the structure was overloaded and whether the design loads analysis needs updating.
5. Anomaly resolution: each anomaly is categorized by severity (critical, major, minor) and assigned a root cause investigation team. No anomaly may be carried forward to the next flight without either a root cause and corrective action, or a formal risk acceptance by the mission assurance authority. This process is the final gate before the next launch.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
