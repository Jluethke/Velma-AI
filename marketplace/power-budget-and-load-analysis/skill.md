# Power Budget And Load Analysis

Build the spacecraft power budget from subsystem loads across all operating modes (nominal, safe, eclipse, peak), including margins and contingency.

## Inputs

- `subsystem-power-estimates`: Power consumption per subsystem per operating mode
- `orbit-parameters`: Altitude, inclination, eclipse fraction, beta angle range

## Outputs

- `power-budget`: Complete power budget table with per-mode totals, margins, and peak vs average loads
- `energy-storage-requirement`: Watt-hours required through eclipse, including depth-of-discharge constraint

## Process

1. List every load by subsystem and operating mode. Include primary bus loads (avionics, payload, thermal control, propulsion valves, communication, attitude control) and secondary loads (deployment mechanisms, one-time actuations). Apply a 20% contingency to the sum of estimated loads for preliminary design; reduce to 5-10% as hardware selections mature.
2. Calculate the orbit-average power by weighting sunlight and eclipse mode powers by their fractional durations. For a circular LEO orbit, sunlight fraction is approximately 1 - (1/pi)*arccos(sqrt(h^2 + 2*R_e*h) / ((R_e+h)*cos(beta))). The power system must generate enough in sunlight to run sunlit loads AND recharge the battery.
3. Identify the peak power mode and its duration. If the peak substantially exceeds average, evaluate whether the bus capacitance or a brief battery supplement can handle it, or whether the solar array must be sized to peak.
4. Compute the eclipse energy storage requirement: E_eclipse = P_eclipse * T_eclipse / eta_discharge, where eta_discharge accounts for battery and power conditioning efficiency (typically 0.90-0.95). Add harness losses (2-5% depending on bus voltage and harness length).
5. Compile the power budget into a table with columns for each mode and rows for each subsystem, with totals, margins, and the required solar array output and battery capacity clearly stated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
