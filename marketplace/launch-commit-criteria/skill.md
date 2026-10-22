# Launch Commit Criteria

Define the go/no-go criteria that must be met for launch to proceed.

## Inputs

- `vehicle-configuration`: Vehicle systems and their health monitoring capability
- `launch-site`: Launch site weather patterns and range constraints
- `mission-requirements`: Mission-specific constraints (crew safety, payload sensitivity)

## Outputs

- `weather-criteria`: Wind, precipitation, lightning, and cloud ceiling limits for launch
- `vehicle-health-criteria`: Redline parameters and their limits for each vehicle system
- `range-criteria`: Range safety requirements that must be met (tracking, FTS, exclusion zones)

## Process

1. Weather criteria: surface wind speed (typically <30 knots), upper-level wind shear (from weather balloon soundings, compared to vehicle structural limits), cumulus cloud rules (no launch through or near cumulus with tops above freezing level, to avoid triggered lightning), precipitation, temperature limits for propellant and electronics.
2. Lightning rules: the most complex weather criteria. Natural lightning within 10 nm in the last 30 minutes = no launch. Triggered lightning risk assessment from electric field mills on the pad and aloft. The vehicle and its exhaust plume can trigger lightning by creating a conducting path through a charge field. Atlas-Centaur 67 was destroyed by triggered lightning.
3. Vehicle health: every critical system has redline parameters monitored in real time. Engine parameters (pump inlet pressure, turbopump speed, temperatures), tank pressures, battery voltage, IMU alignment quality, flight computer status. Any single redline violation triggers an automatic hold or cutoff.
4. Range safety requirements: the flight termination system (FTS) must be armed and tested. Tracking systems (radar, telemetry) must be operational. Impact prediction must show the vehicle debris footprint is within the approved corridor. Ship and aircraft exclusion zones must be clear. The range safety officer must have communications with the launch team.
5. Go/no-go poll: each console position (propulsion, avionics, guidance, range safety, weather, payload, launch director) reports status. Any single 'no-go' stops the count. The launch director makes the final decision. For crewed missions, the crew also has a go/no-go input.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
