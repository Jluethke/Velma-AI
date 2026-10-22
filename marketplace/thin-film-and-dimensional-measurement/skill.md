# Thin Film And Dimensional Measurement

Measure thin-film thickness and optical constants by ellipsometry and reflectometry, and dimensional features by optical coordinate measurement.

## Inputs

- `profilometer-setup`: Complementary surface measurement if topography is part of the measurement scope
- `measurement-target`: Film material and expected thickness range, substrate, number of layers; or dimensional features (line width, step height, overlay) to measure

## Outputs

- `thin-film-results`: Film thickness (nm), refractive index n and extinction coefficient k vs wavelength (dispersion curve), uniformity map across the wafer or sample
- `dimensional-results`: Critical dimensions with measurement uncertainty, overlay error, calibration traceability to SI through the reference standard

## Process

1. Spectroscopic ellipsometry: measure the change in polarization state (psi and delta) of light reflected from the film stack at multiple wavelengths and angles of incidence. Psi = atan(|rp/rs|), Delta = phase(rp) - phase(rs) where rp and rs are the Fresnel reflection coefficients for p and s polarization.
2. Build an optical model of the film stack: substrate (known n,k), film 1 (thickness t1, dispersion model), film 2 (t2, dispersion model), etc. Common dispersion models: Cauchy (n = A + B/lambda^2 + C/lambda^4) for transparent films (SiO2, Si3N4). Tauc-Lorentz for absorbing films (a-Si, TiO2). Drude for metals (Au, Ag, Cu). Fit the model to the measured (psi, delta) vs wavelength by minimizing chi-squared.
3. For reflectometry (simpler, single measurement per point): measure the reflectance spectrum R(lambda) at normal incidence. The thin-film interference produces oscillations: the thickness determines the fringe spacing, and the refractive index determines the fringe amplitude. Fit the calculated reflectance from the Fresnel equations to the measured spectrum. Works well for single films > 50nm on known substrates.
4. Optical dimensional measurement: for line widths and overlay on semiconductor wafers, scatterometry (OCD: optical critical dimension) measures the diffraction signature from periodic structures. The diffraction efficiency vs wavelength and angle is compared to a rigorous coupled-wave analysis (RCWA) model of the grating profile (width, height, sidewall angle). Sub-nm sensitivity to profile changes.
5. Calibration traceability: for dimensional measurements, calibrate against a certified reference standard (NIST-traceable step height standard for z-axis, pitch standard for x-y). For ellipsometry, use a certified SiO2/Si reference wafer with known oxide thickness and Si optical constants. Report measurement uncertainty following GUM (Guide to the expression of Uncertainty in Measurement): combine type A (statistical) and type B (systematic) contributions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
