# Hall Effect Measurement

Measure the Hall effect to determine carrier concentration, carrier type (n or p), and Hall mobility of the semiconductor material.

## Inputs

- `hall-sample`: Semiconductor sample in van der Pauw or Hall bar geometry
- `hall-conditions`: Magnetic field strength, current level, temperature

## Outputs

- `hall-data`: Hall voltage measurements and sheet resistance values
- `carrier-properties`: Carrier type, carrier concentration, and Hall mobility

## Process

1. Measure the sheet resistance using the van der Pauw method with current reversal and contact averaging
2. Apply the magnetic field and measure the Hall voltage with current and field reversals to eliminate offsets
3. Compute the Hall coefficient, carrier concentration, and carrier type from the sign of the Hall voltage
4. Calculate the Hall mobility from the ratio of Hall coefficient to resistivity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
