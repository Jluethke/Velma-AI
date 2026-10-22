# Pdn Target Impedance Calculation

Calculate the PDN target impedance from the IC transient current demand and allowable voltage ripple. Derive the impedance vs frequency profile the PDN must meet.

## Inputs

- `supply-voltage`: Nominal supply voltage in volts
- `voltage-tolerance`: Allowable voltage ripple as percentage or absolute value
- `transient-current`: Maximum transient current step in amps from the IC datasheet or power model
- `clock-frequency`: Primary clock frequency of the IC drawing this power

## Outputs

- `target-impedance`: Z_target = V_ripple / I_transient in milliohms, the flat impedance ceiling the PDN must stay below
- `frequency-range`: Frequency range over which the target impedance must be met, from DC to the clock's third or fifth harmonic
- `impedance-profile`: Target impedance vs frequency curve showing the flat region and the rolloff points

## Process

1. Calculate target impedance: Z_target = (V_supply * tolerance_percent) / I_transient. For a 1.0V rail with 3% tolerance and 5A transient, Z_target = 0.03V / 5A = 6 milliohms. This is the ceiling the PDN impedance must stay below.
2. Determine the frequency range: the PDN must meet this target from DC up to at least the third harmonic of the clock frequency (fifth harmonic for aggressive designs). For a 1 GHz clock, that means DC to 3 GHz or 5 GHz.
3. Plot the target as a flat line on an impedance vs frequency chart (log-log scale). Everything below this line is acceptable. The PDN design task is to assemble VRM, bulk caps, ceramic caps, and plane capacitance so their combined impedance stays below this line across the entire frequency range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
