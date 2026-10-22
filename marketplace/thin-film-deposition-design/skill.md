# Thin Film Deposition Design

Design the thin film deposition process for the required film (dielectric, metal, or barrier) with target thickness, composition, and conformality.

## Inputs

- `film-requirements`: Target film material, thickness, electrical properties (resistivity, dielectric constant, breakdown voltage), and step coverage requirements
- `thermal-budget`: Maximum process temperature allowed by the device structure (especially for back-end-of-line processes with low-k dielectrics or metal interconnects)

## Outputs

- `deposition-recipe`: Deposition method (PVD, CVD, ALD, electroplating) with process parameters (temperature, pressure, gas flows, power, pulse timing)
- `film-characterization`: Measured film properties: thickness and uniformity (by ellipsometry or XRR), composition (by XPS or RBS), resistivity (by four-point probe), stress (by wafer bow), and step coverage (by SEM cross-section)

## Process

1. Select the deposition method from the conformality requirement. PVD (sputtering) for blanket metal films where step coverage is not critical (liner/barrier on planar surfaces, seed layers). CVD for conformal films in high-aspect-ratio features (TEOS oxide, tungsten via fill, TiN barrier). ALD for the highest conformality at sub-nm thickness control (required for films below 5nm: high-k gate dielectrics, ALD barrier layers, sub-3nm conformal coatings in extreme aspect ratios above 20:1). Electroplating for copper interconnect fill after PVD seed.
2. For PVD (sputtering): select the target material and sputtering gas (Ar for most metals). DC sputtering for metals, RF sputtering for insulators. Reactive sputtering (adding N2 or O2 to the Ar) for nitrides and oxides (e.g., TiN from a Ti target in Ar/N2). Ionized PVD (iPVD) for improved step coverage in high-aspect-ratio features (ions are directional, unlike neutral sputtered atoms). Typical deposition rates: 10-100 nm/min depending on power and target-substrate distance.
3. For CVD: select the precursor chemistry. TEOS (tetraethyl orthosilicate) + O3 for conformal oxide at moderate temperature (400-500C). PECVD SiO2 (SiH4 + N2O, 300-400C) for passivation and interlayer dielectric. PECVD SiN (SiH4 + NH3, 300-400C) for etch stop and barrier. Tungsten CVD (WF6 + H2, 300-450C) for via fill. The film properties (stress, composition, density) are sensitive to the plasma power, pressure, temperature, and gas ratio.
4. For ALD: define the pulse sequence. Example for Al2O3: TMA (trimethylaluminum) pulse, purge, H2O pulse, purge = 1 ALD cycle depositing approximately 0.1nm per cycle. The process temperature window (between precursor condensation at low T and precursor decomposition at high T) defines the ALD operating regime. For thermal ALD of HfO2 gate dielectric: HfCl4 + H2O at 300C. Plasma-enhanced ALD (PEALD) allows lower temperature and different film properties. Verify the saturation behavior (growth per cycle vs pulse time) to confirm true ALD mode.
5. Characterize the deposited film. Thickness and uniformity by spectroscopic ellipsometry (49-point map, target uniformity below 2% 3-sigma). Film composition by X-ray photoelectron spectroscopy (XPS) for stoichiometry and impurity levels. Resistivity by four-point probe (for metals and conductive films). Film stress by wafer bow measurement (Stoney equation: stress = Es * ts^2 * (1/R - 1/R0) / (6 * (1 - vs) * tf) where Es, ts, vs are substrate properties and tf is film thickness). High compressive or tensile stress can cause delamination or wafer warp.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
