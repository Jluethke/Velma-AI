# Luminescence Age Calculation

Compute the luminescence age from the equivalent dose and dose rate, assessing for complications like incomplete bleaching or dose rate changes.

## Inputs

- `de-distribution`: Equivalent dose values with uncertainties
- `total-dose-rate`: Environmental dose rate in Gy/ka

## Outputs

- `luminescence-age`: Calculated age in ka with total uncertainty
- `age-model-assessment`: Assessment of De distribution shape, overdispersion, and chosen age model (CAM, MAM, FMM)

## Process

1. Plot the De distribution and assess overdispersion relative to measurement uncertainty
2. Select the appropriate age model: central age model for well-bleached, minimum age model for partially bleached
3. Compute the age as De / dose rate and propagate all uncertainties
4. Compare the result with independent age control if available

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
