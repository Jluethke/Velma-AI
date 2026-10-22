# Seismic Hazard And Site Response

Determine the seismic hazard at the site and characterize site-specific ground motion.

## Inputs

- `site-location`: Geographic coordinates of the project site
- `site-geotechnical-data`: Shear wave velocity profile (Vs30 at minimum), soil stratigraphy

## Outputs

- `design-spectrum`: Site-specific design response spectrum (Sds, Sd1) and seismic design category
- `ground-motion-parameters`: PGA, spectral accelerations at key periods, and selected ground motion records if needed

## Process

1. Determine spectral acceleration parameters from USGS seismic hazard maps (or equivalent national maps). For ASCE 7: Ss (0.2s) and S1 (1.0s) for risk-targeted MCE (2% in 50 years, adjusted for risk). For Eurocode 8: ag from national annex zonation map for 475-year return period.
2. Classify site condition from Vs30. ASCE 7 Site Class: A (Vs30 > 1500 m/s hard rock), B (760-1500), C (360-760 dense soil/soft rock), D (180-360 stiff soil), E (< 180 soft soil), F (requires site-specific analysis: liquefiable soil, > 3 m peat, > 8 m soft clay with PI > 20 and su < 24 kPa).
3. Apply site coefficients. Fa (short period) and Fv (long period) from site class and mapped spectral values. Design spectrum: Sds = 2/3 * Fa * Ss, Sd1 = 2/3 * Fv * S1. Construct the design spectrum: plateau at Sds from T=0 to T=Sd1/Sds, then 1/T decay.
4. Determine Seismic Design Category from Sds, Sd1, and risk category. SDC A: no seismic design. SDC B: basic detailing. SDC C: intermediate detailing. SDC D/E/F: special detailing required, non-linear analysis may be needed.
5. For Site Class F or when site-specific analysis is required: run 1D equivalent-linear (SHAKE) or nonlinear site response analysis. Input: shear wave velocity profile, modulus reduction and damping curves, bedrock ground motions. Check for liquefaction potential: factor of safety from SPT or CPT-based methods (Boulanger and Idriss 2014), assess post-liquefaction settlement and lateral spread.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
