# Efficiency Measurement Methodology

Measure converter efficiency accurately across the load range, addressing measurement instrument accuracy, thermal equilibrium, and light-load measurement challenges.

## Inputs

- `ripple-measurement`: Output ripple characterization for output power accuracy
- `noise-measurement`: Noise characterization

## Outputs

- `efficiency-curve`: Measured efficiency vs load current from 1% to 100% of rated load, at minimum, nominal, and maximum input voltage, after thermal equilibrium at each point
- `loss-budget-verification`: Measured total loss compared to the predicted loss budget, with discrepancy analysis identifying unaccounted losses

## Process

1. Select measurement instruments. Power analyzer (Yokogawa, Keysight): best accuracy (0.01-0.05% of reading), true RMS measurement including ripple and harmonics. Digital multimeters: 6.5-digit DMMs provide 0.01% accuracy for DC voltage and current, adequate for steady-state measurements. Oscilloscope: not recommended for efficiency (limited vertical resolution and DC accuracy).
2. Input power: measure Vin and Iin simultaneously. For DC-DC converters, use a shunt and DMM for current, and a separate DMM for voltage, at the converter input terminals (not the power supply terminals, to include cable losses). For AC-DC, use a power analyzer that handles power factor and THD.
3. Output power: measure Vout and Iout at the load terminals. Use 4-wire (Kelvin) sensing for both voltage and current to eliminate lead resistance errors. At high current (50A+), cable drops of 100-200mV can cause 0.5-1% efficiency error if not accounted for.
4. Thermal equilibrium. Efficiency changes with temperature (Rds(on) increases, capacitor ESR changes). Allow 15-30 minutes at each load point for the converter to reach thermal steady state before recording the measurement. Monitor the case temperature of the hottest component; it should stabilize within 1C before the measurement is valid.
5. Light-load efficiency. At loads below 10% of rated, the quiescent power of the controller IC, gate drive, and bias supplies dominates. Measurement accuracy becomes critical: a 100mA offset in a 10A-rated ammeter causes 1% efficiency error at 1A load but only 0.01% at full load. Use a lower-range meter or power analyzer for light-load measurements. Document the no-load input power (quiescent consumption).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
