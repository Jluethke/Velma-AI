# Converter Requirements Capture

Capture the electrical requirements that drive topology selection: input voltage range, output voltage and current, isolation needs, efficiency target, cost and size constraints.

## Inputs

- `input-voltage-range`: Minimum and maximum input voltage in volts (e.g., 36V to 72V for telecom, 85V to 265V for universal AC-DC)
- `output-voltage-current`: Required output voltage and maximum load current, plus any regulation accuracy requirement
- `power-level-watts`: Total output power in watts, which is the primary topology discriminator
- `isolation-requirement`: Whether galvanic isolation is needed and at what voltage rating, or non-isolated is acceptable

## Outputs

- `duty-cycle-range`: Calculated duty cycle range across input voltage range for candidate topologies using D = Vout/(Vin*eta) for buck, D = 1 - (Vin*eta/Vout) for boost
- `topology-candidates`: Filtered list of viable topologies based on power level (buck/boost under 150W, flyback under 200W, forward under 500W, half-bridge under 1kW, full-bridge above 500W) and isolation needs

## Process

1. Calculate the voltage conversion ratio Vout/Vin at minimum and maximum input voltage. Ratios above 4:1 or below 1:4 stress single-stage topologies and may require two stages or transformer turns ratio adjustment.
2. For each candidate topology, compute the duty cycle at minimum and maximum Vin. Flag any topology where duty cycle exceeds 0.8 (excessive switch stress) or falls below 0.1 (current pulse issues). For boost-derived topologies, note that duty cycle above 0.5 introduces right-half-plane zero.
3. Calculate the CCM/DCM boundary: Lcrit = (Vout * (1-D)) / (2 * fsw * Iout_min) for buck. If the minimum load is light, determine whether DCM operation is acceptable or forced-CCM with synchronous rectification is needed.
4. If isolation is required, eliminate buck, boost, buck-boost, SEPIC, and Cuk (unless coupled-inductor variants are considered). Rank flyback (under 150W, multiple outputs easy), forward (under 500W, better cross-regulation), half-bridge (under 1kW, good transformer utilization), full-bridge (above 500W, best for high power).
5. Output the candidate list with duty cycle ranges and flag any topology operating near its stress limits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
