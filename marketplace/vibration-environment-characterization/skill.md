# Vibration Environment Characterization

Define the vibration environment from the application standard or measured data, converting raw specifications into the inputs needed for structural analysis.

## Inputs

- `application-environment`: Application type (automotive, aerospace, industrial, consumer portable) and any measured vibration data or referenced standards
- `assembly-description`: Physical description of the electronic assembly: PCB dimensions, thickness, mounting method, total mass, and heavy component locations

## Outputs

- `vibration-specification`: Random vibration PSD profile (g^2/Hz vs frequency) and sinusoidal sweep profile if applicable, for each axis
- `test-duration`: Test duration per axis and number of axes, with acceleration factor justification if test is shorter than service life

## Process

1. Identify the governing standard. Automotive: ISO 16750-3 or GMW3172 (random vibration, 10-2000 Hz, profile depends on mounting location). Aerospace: DO-160 or MIL-STD-810. Industrial: IEC 60068-2-64. Consumer: IEC 60068-2-6 (sine) or proprietary shipping profiles.
2. Extract the PSD profile. A typical automotive underhood random vibration profile is 0.001-0.01 g^2/Hz from 10 to 2000 Hz. Calculate the overall Grms: Grms = sqrt(integral of PSD over frequency). For a flat PSD of 0.01 g^2/Hz from 20-2000 Hz, Grms = sqrt(0.01 * 1980) = 4.45 Grms.
3. If measured data exists instead of a standard, process the raw accelerometer time history into a PSD using Welch's method. Choose window size and overlap to balance frequency resolution and statistical confidence. Average at least 100 windows for a stable PSD estimate.
4. Determine test duration. If the standard specifies duration, use it directly. If deriving from field life, use Miner's rule with the material's S-N slope (b). Equivalent time at elevated level: T_test = T_field * (G_field / G_test)^(2b) where b is typically 4-6 for solder joints and 6-8 for component leads.
5. Define the test axes. Most standards require testing in three mutually perpendicular axes. Identify which axis is most severe for the assembly based on mounting orientation and mass distribution. This axis should be tested first to catch early failures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
