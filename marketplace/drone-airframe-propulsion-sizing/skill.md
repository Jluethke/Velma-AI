# Drone Airframe Propulsion Sizing

Select the airframe type and size the propulsion system: match the platform to the mission profile, select motors and propellers, and calculate endurance from battery energy.

## Inputs

- `mission-profile`: Mission type (inspection, survey, delivery, surveillance), payload mass, endurance requirement, operating environment
- `performance-requirements`: Max speed, climb rate, wind resistance, and operating altitude

## Outputs

- `airframe-design`: Selected airframe type with configuration, dimensions, and mass breakdown
- `propulsion-system`: Motor, propeller, ESC, and battery selection with performance curves and endurance calculation

## Process

1. Select the airframe type from the mission profile. Multirotor (quad, hex, octo): vertical takeoff and landing, hover capability, simple control, but low endurance (20-40 min typical) and low cruise efficiency. Best for: inspection, photography, short-range delivery, indoor operation. Fixed-wing: high endurance (1-4 hours), long range, efficient cruise, but cannot hover and needs space for takeoff and landing. Best for: mapping, survey, long-range surveillance. VTOL hybrid (tilt-rotor, tail-sitter, quadplane): combines hover capability with efficient cruise, complex mechanically and aerodynamically. Best for: missions needing both hover and long range.
2. Size the propulsion for multirotor. Start from the all-up weight (airframe + battery + payload + propulsion). The thrust-to-weight ratio at hover determines efficiency; design for hover at 50-60% throttle (TWR ~2:1) for maneuverability margin and efficiency. Select the propeller diameter from the frame size. Match the motor KV (rpm/volt) to the propeller: low KV for large props (efficient hover), high KV for small props (agile). From the motor and propeller thrust curve, verify thrust at hover throttle, maximum thrust for climb and wind resistance, and power consumption at hover.
3. Calculate endurance from battery energy. Battery energy (Wh) = capacity (Ah) * nominal voltage (V). Hover power = all-up weight (N) * disk loading correction. Endurance = battery energy / hover power * discharge efficiency (typically 80% usable). For fixed-wing: calculate cruise power from drag at cruise speed (drag = 0.5 * rho * V^2 * S * Cd), endurance = battery energy / cruise power. Account for reserve (typically 20% for safe return). The endurance calculation is the primary constraint driving the battery-payload trade-off.
4. Complete the mass breakdown and verify closure. Sum: airframe structure (30-40% of AUW for multirotor), propulsion (motors, ESCs, 15-20%), battery (30-40%), payload (given), avionics (GPS, flight controller, telemetry, 5-10%). Verify the total equals the all-up weight assumed in propulsion sizing. Iterate if not: a heavier battery gives more endurance but increases the weight that the motors must lift, diminishing returns. Plot endurance vs battery mass to find the optimum.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
