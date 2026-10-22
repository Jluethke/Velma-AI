# Conducted Emissions Mitigation

Design the EMI filter to reduce conducted emissions on the power input below the applicable limit, handling both differential-mode and common-mode noise.

## Inputs

- `emi-source-inventory`: Conducted emissions spectrum from each source, separated into DM and CM components
- `emc-standard`: Conducted emissions limit line (e.g., CISPR 32 Class B: quasi-peak and average limits from 150 kHz to 30 MHz)

## Outputs

- `filter-design`: Schematic of the EMI filter with component values: X-capacitors, Y-capacitors, common-mode choke, and DM inductor (or choke leakage inductance)
- `filter-performance`: Predicted insertion loss vs frequency for both DM and CM, showing adequate margin to the limit at all frequencies

## Process

1. DM filter: X-capacitors shunt DM noise to the return conductor. A single X-cap provides -20 dB/decade above its self-resonant frequency. For more attenuation, use an LC pi-filter: X-cap, DM inductor, X-cap. Each LC stage provides -40 dB/decade above the resonant frequency. The DM inductor can be a separate component or the leakage inductance of the CM choke.
2. CM filter: Y-capacitors shunt CM noise from each line to the chassis ground. A CM choke (two windings on one core, wound in the same direction) presents high impedance to CM current and near-zero impedance to DM current. The CM choke impedance is: Zcm = 2*pi*f*Lcm up to the self-resonant frequency, then decreases. Select a choke with self-resonant frequency above the highest frequency where CM attenuation is needed.
3. Y-capacitor value is limited by safety leakage current. For IEC 60950-1 Class I equipment: total leakage through Y-caps must be under 3.5 mA at maximum line voltage and frequency. At 240 VAC, 50 Hz: C_y_max = 3.5e-3 / (2*pi*50*240) = 46 nF total. Typical values are 2.2 nF to 4.7 nF per line-to-ground Y-cap.
4. Damping: the filter LC resonance can amplify noise at the resonant frequency instead of attenuating it. Add damping to prevent resonance peaks that exceed the limit. A resistor in series with a capacitor across the filter input (Rd, Cd network) damps the resonance. Rd is chosen to equal the characteristic impedance sqrt(L/C) of the filter at resonance. Cd must be at least 4x the filter capacitor to be effective.
5. Verify the filter by measuring conducted emissions with a LISN (line impedance stabilization network) per the applicable standard. The LISN provides a defined 50 ohm impedance at the measurement port and isolates the equipment under test from the mains. Compare the measured emissions against the quasi-peak and average limits. If the measured emissions exceed the limit at any frequency, increase the filter attenuation at that frequency by adding components or improving layout.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
