# Shielding Calculation Methodology

Calculate radiation shielding requirements using analytical and Monte Carlo methods for prompt and residual radiation.

## Inputs

- `source-characterization`: Radiation source type, energy, intensity, and geometry
- `dose-limits`: Regulatory dose limits and design targets for each area classification

## Outputs

- `shielding-design`: Material selection, thickness, and geometry for each shield wall
- `dose-rate-map`: Calculated dose rates at all occupied locations
- `skyshine-analysis`: Dose rates from radiation scattered by atmosphere above the facility

## Process

1. Characterize the source: for accelerators, beam loss points define the source (normal loss, accidental full beam loss). For electron machines: electromagnetic showers dominate (photons, e+e-). For proton machines above ~200 MeV: hadronic cascades produce neutrons as the penetrating component.
2. Analytical methods for quick estimates: point kernel integration for photon shielding (buildup factor * e^(-mu*t) / r^2). Moyer model for high-energy proton accelerators: H(r,theta) = H_0 * E^0.8 * exp(-d/lambda(theta)) / r^2 where lambda is the attenuation length (~120 g/cm2 for concrete at 0 degrees for GeV protons).
3. Monte Carlo simulation for detailed design: FLUKA (CERN, good for accelerator and medical), GEANT4 (flexible, detector simulation), MCNP (neutronics, fission/fusion). Build geometry model, define materials, run sufficient histories for statistical convergence (relative error < 10% in regions of interest).
4. Material selection: ordinary concrete (2.35 g/cm3) is the baseline. Heavy concrete (barite, 3.5 g/cm3; iron-loaded, 3.7 g/cm3) where space is limited. Iron for forward direction where high-Z is effective against hadronic shower. Earth berm for outdoor facilities. Polyethylene or water for low-energy neutron moderation and capture.
5. Skyshine: radiation escaping through roof or thin shields scatters in atmosphere and returns to ground level beyond the facility boundary. Calculate using Stevenson formula or full Monte Carlo of the building + atmosphere. Often the limiting case for site boundary dose.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
