# Seismic Analysis Methods

Perform seismic analysis using the appropriate method for the structure's characteristics and SDC.

## Inputs

- `lateral-system`: Selected LFRS, R factor, configuration
- `design-spectrum`: Design response spectrum and ground motion records
- `seismic-weight`: Mass distribution by floor

## Outputs

- `seismic-forces`: Design base shear, story forces, story drifts, and member forces for each load combination
- `drift-check`: Interstory drift ratios vs. allowable limits at each story

## Process

1. Equivalent Lateral Force (ELF) method for regular structures in SDC B/C. Base shear V = Cs * W, where Cs = Sds/(R/Ie) but not less than 0.044*Sds*Ie or 0.01 (and not less than 0.5*S1/(R/Ie) where S1 >= 0.6g). Distribute vertically: Fx = Cvx * V, where Cvx = wx*hx^k / sum(wi*hi^k), k=1 for T<=0.5s, k=2 for T>=2.5s, interpolate between.
2. Modal Response Spectrum Analysis for irregular structures or when required by SDC. Build analytical model (centerline or with rigid end offsets). Run eigenvalue analysis to get periods and mode shapes. Include enough modes to capture 90% of total mass in each direction. Apply design spectrum to each mode, combine with CQC (Complete Quadratic Combination). Scale results so base shear >= 100% of ELF base shear (ASCE 7-22) or 85% (ASCE 7-16).
3. Nonlinear Response History Analysis for complex or high-importance structures. Select minimum 11 ground motion pairs (7 per ASCE 7-16). Scale to match design spectrum over period range 0.2T to 2.0T. Run time-history analysis with appropriate hysteretic models. Use mean of 11 results for design (maximum of 7 for ASCE 7-16). Check acceptance criteria: drift, plastic rotation, force demands in force-controlled elements.
4. Check interstory drift. Amplify elastic drift by Cd/Ie. Allowable: 0.020*hsx for most buildings, 0.010*hsx for masonry, 0.025*hsx for single-story steel. Drift often controls the design for moment frames (push toward larger sections or add stiffness). P-delta check: stability coefficient theta = Px*delta/(Vx*hsx*Cd) < 0.10 without further analysis.
5. Combine seismic with gravity loads. Basic combination: 1.2D + 1.0E + 1.0L + 0.2S, where E = rho*QE + 0.2*Sds*D (vertical seismic). Also check 0.9D - 0.2*Sds*D + rho*QE for overturning and uplift. Apply orthogonal combination: 100% in one direction + 30% in orthogonal direction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
