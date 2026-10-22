# Optical Coating Specification

Specify the anti-reflection, high-reflection, and filter coatings for every optical surface to maximize throughput, minimize ghosting, and meet spectral requirements.

## Inputs

- `lens-prescription`: Glass types and surface curvatures for coating substrate specification
- `stray-light-report`: Ghost analysis identifying which surface pairs need the lowest reflectance

## Outputs

- `coating-specifications`: For each surface: coating type (AR, HR, dichroic, filter), target reflectance or transmittance vs wavelength, angle of incidence, polarization sensitivity limit, environmental durability class
- `system-throughput`: Total system transmission vs wavelength accounting for all surface coatings, bulk absorption, and vignetting

## Process

1. For each refracting surface, specify a broadband anti-reflection coating. The target reflectance depends on the ghost analysis: critical ghost-forming surface pairs need R < 0.25% per surface; others can use standard BBAR at R < 0.5%.
2. For AR coating design, start from the quarter-wave MgF2 single layer (R_min at n_film = sqrt(n_substrate)). For lower reflectance, use V-coat (two-layer) for narrow band or W-coat / multi-layer for broadband. Specify the wavelength range and the maximum reflectance at each edge.
3. For mirrors, specify the reflectance and the damage threshold if laser illuminated. Protected aluminum: R > 90% from 400-700nm. Enhanced silver: R > 98% from 500-1100nm. Dielectric HR: R > 99.5% at the design wavelength with specified bandwidth.
4. For dichroic beamsplitters and filters, specify the transition wavelength, the slope (nm from 10% to 90% transmission), the passband ripple, and the blocking OD in the rejection band. State the angle of incidence and the cone half-angle.
5. Compute the total system throughput by multiplying the transmission of every surface and the internal transmittance of every glass element over the wavelength band. Verify this meets the radiometric or photometric specification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
