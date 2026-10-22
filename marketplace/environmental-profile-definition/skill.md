# Environmental Profile Definition

Define the operational, storage, and transportation environments the product must survive, with measured or estimated severity levels.

## Inputs

- `deployment-environment`: Where and how the product will be used, stored, and transported
- `product-lifetime`: Required operating hours, storage duration, and number of transportation cycles

## Outputs

- `thermal-profile`: Operating temperature range, rate of change, number of cycles over lifetime, storage temperature extremes
- `vibration-profile`: Random vibration PSD in g-squared/Hz at the mounting point, sine vibration frequencies and amplitudes, shock levels
- `combined-environment`: Conditions that occur simultaneously: temperature plus vibration, humidity plus temperature, altitude plus temperature

## Process

1. Measure the actual environment whenever possible. Mount accelerometers and temperature loggers at the product mounting location during representative operating conditions. Field-measured data is always more accurate than handbook values or estimates.
2. When measurement is not possible, use environmental standards as starting points. MIL-STD-810 defines environments by platform type (ground mobile, shipboard, airborne). IEC 60068 defines standard test severities. ETSI EN 300 019 defines environments for telecom equipment. Apply the standard that matches the actual deployment, not the one that is easiest to pass.
3. Account for the entire lifecycle, not just operation. Transportation vibration (truck, rail, air cargo) often produces higher vibration levels than the operating environment. Storage in an uncontrolled warehouse can expose the product to wider temperature and humidity ranges than operation. Include these phases in the environmental profile.
4. Define the combined environment profile. Real environments are not one stress at a time. A product in an engine compartment experiences high temperature and high vibration simultaneously. The combined effect is often worse than either stress alone because material properties degrade at elevated temperature, reducing vibration fatigue strength.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
