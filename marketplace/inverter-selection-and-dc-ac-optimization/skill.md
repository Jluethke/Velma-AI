# Inverter Selection And Dc Ac Optimization

Select inverter topology and optimize the DC/AC ratio to maximize energy harvest while managing clipping losses against cost savings.

## Inputs

- `module-selection`: Selected module parameters
- `string-configuration`: String length and count per MPPT

## Outputs

- `inverter-specification`: Inverter model, rated AC power, MPPT channels, efficiency curve, and grid-code compliance features
- `dc-ac-ratio`: Installed DC capacity divided by inverter AC rating, with annual clipping loss quantified

## Process

1. Choose inverter topology. Central inverters (500kW-4MW) minimize cost per watt for utility scale. String inverters (50-350kW) allow per-string MPPT and eliminate DC combiner boxes. Microinverters serve residential but add per-module cost and communication complexity.
2. Size the DC/AC ratio (also called inverter loading ratio or ILR). For a fixed-tilt system in a moderate resource, ILR of 1.2-1.3 is typical. Higher ILR (1.3-1.5) suits tracker systems or sites where marginal DC capacity is cheap relative to inverter and interconnection cost.
3. Quantify clipping loss. Run an hourly simulation: for each hour where DC power exceeds AC rating, the inverter clips to rated AC. Annual clipping loss of 1-3% is generally economic. Beyond 3-4%, the marginal module adds cost without proportional energy.
4. Verify inverter efficiency across the operating range. CEC-weighted efficiency (which weights partial-load hours more heavily than peak) matters more than peak efficiency. A 98.5% CEC vs 98.0% CEC inverter recovers the efficiency difference over the project life.
5. Confirm grid-code compliance features: reactive power capability (typically +/- 0.85 power factor), voltage ride-through, frequency ride-through, ramp rate control, and anti-islanding per IEEE 1547-2018 Category III for utility-scale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
