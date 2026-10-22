# Coating Process Design

Design the coating deposition process including surface preparation, deposition parameters, and post-treatment to achieve the target properties.

## Inputs

- `candidate-processes`: Short-listed processes from the requirements analysis
- `surface-specification-targets`: Target properties for the coating

## Outputs

- `coating-process-specification`: Complete process specification: surface preparation, deposition parameters (temperature, pressure, power, gas composition, rotation), post-treatment, and expected properties
- `trial-coating-results`: Properties of the trial coating measured on test coupons (hardness, adhesion, thickness, composition, residual stress)

## Process

1. Surface preparation. Clean the substrate to remove all contaminants (ultrasonic cleaning in alkaline solution, rinse in DI water, dry). For PVD: sputter etch in the vacuum chamber (Ar ion bombardment at 500-1000V bias for 5-30 minutes) to remove the native oxide and activate the surface. For thermal spray: grit blast to Sa 3 (white metal) with angular alumina (grit size per the coating specification, typically 24-60 mesh) to create anchor tooth profile (Ra 5-15 microns). For electroplating: acid activation per the plating specification.
2. For PVD (cathodic arc or magnetron sputtering): select the target material (Ti, Cr, Al, or alloy for reactive deposition of TiN, CrN, TiAlN, AlCrN). Set the reactive gas flow (N2 for nitrides, C2H2 for carbides/DLC). Substrate temperature (200-500C), bias voltage (-50 to -200V), and chamber pressure (0.5-5 Pa) control the coating microstructure, hardness, and residual stress. Higher bias gives denser, harder coatings but higher compressive stress (risk of delamination above 4-6 GPa for most substrates).
3. For HVOF thermal spray (WC-Co, Cr3C2-NiCr): select the spray gun and fuel (kerosene or hydrogen). Particle velocity (600-900 m/s for HVOF) determines the coating density and adhesion. Spray distance (200-400mm), powder feed rate, and traverse speed determine the coating thickness per pass (typically 20-50 microns per pass). Keep the substrate temperature below the tempering temperature of steel substrates (monitor with IR pyrometer during spraying).
4. Post-treatment. For PVD coatings on cutting tools: typically none required (the coating is used as-deposited). For thermal spray: sealing with a polymer or glass sealant to close surface-connected porosity (required for corrosion applications). For electroplated chromium: baking at 190C for 4+ hours to desorb hydrogen and prevent hydrogen embrittlement of high-strength steel substrates (mandatory per ASTM B850 / AMS 2759/9 for steels above 1000 MPa tensile strength).
5. Trial coating on test coupons (same material and surface condition as the production parts). Measure: hardness by nanoindentation (ISO 14577, indent depth less than 10% of coating thickness to avoid substrate influence), adhesion by scratch test (ISO 20502, report Lc2 critical load), thickness by calotest (ball cratering) or cross-section SEM, composition by EDS or GD-OES, and residual stress by the substrate curvature method (Stoney equation) or XRD sin-squared-psi method.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
