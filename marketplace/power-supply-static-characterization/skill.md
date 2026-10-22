# Power Supply Static Characterization

Measure load regulation, line regulation, and steady-state output accuracy across operating conditions using proper electronic load configuration and measurement technique.

## Inputs

- `supply-specification`: Power supply rated output voltage, current range, input voltage range, and accuracy specifications
- `test-conditions`: Ambient temperature, input voltage set points (nominal, min, max), load current set points (no-load, 25%, 50%, 75%, 100%, and overload)

## Outputs

- `load-regulation-data`: Output voltage vs load current at each input voltage, calculated load regulation percentage ((V_no_load - V_full_load)/V_nominal * 100)
- `line-regulation-data`: Output voltage vs input voltage at each load point, calculated line regulation percentage ((V_out_max - V_out_min)/V_nominal * 100)
- `steady-state-accuracy`: Output voltage set-point accuracy across all operating points with measurement uncertainty

## Process

1. Configure the electronic load in constant-current mode. Set the load sense leads at the supply output terminals (Kelvin connection) to eliminate cable drop from the measurement.
2. Allow the supply to reach thermal equilibrium at each operating point (minimum 5 minutes for initial warm-up, 2 minutes per subsequent point). Measure output voltage with a calibrated DMM at 6.5-digit resolution.
3. Sweep load current in steps: 0%, 10%, 25%, 50%, 75%, 90%, 100% of rated current. At each point, record input voltage, input current, output voltage, and output current. Repeat at minimum, nominal, and maximum input voltage.
4. Calculate load regulation at each input voltage: (V_no_load - V_full_load) / V_nominal * 100%. Calculate line regulation at each load point: (V_out_high_line - V_out_low_line) / V_nominal * 100%.
5. Record ambient temperature. For supplies with thermal derating, repeat key points at the maximum rated ambient to verify derating curve compliance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
