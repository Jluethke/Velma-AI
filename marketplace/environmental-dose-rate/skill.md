# Environmental Dose Rate

Determine the environmental dose rate from radioelement concentrations, cosmic ray contribution, and water content.

## Inputs

- `field-dosimetry-data`: In-situ gamma spectrometry or dosimeter readings
- `sediment-chemistry`: Uranium, thorium, and potassium concentrations from lab analysis (ICP-MS or NAA)

## Outputs

- `total-dose-rate`: Total environmental dose rate in Gy/ka with uncertainty
- `dose-rate-components`: Alpha, beta, gamma, and cosmic dose rate contributions

## Process

1. Convert U, Th, and K concentrations to alpha, beta, and gamma dose rates using published conversion factors
2. Correct the beta dose rate for grain-size attenuation and the alpha dose rate for efficiency
3. Estimate the cosmic dose rate from burial depth and site latitude/altitude
4. Apply the water content correction and sum all components

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
