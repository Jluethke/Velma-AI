# Mhd Equilibrium Reconstruction

Reconstruct the plasma MHD equilibrium from magnetic measurements by solving the Grad-Shafranov equation with experimental constraints.

## Inputs

- `magnetic-measurements`: Flux loops, Rogowski coils, and magnetic probe data from the machine
- `machine-geometry`: Coil positions, vessel geometry, and passive structure locations

## Outputs

- `flux-surface-map`: Poloidal flux map psi(R,Z) with nested flux surfaces
- `plasma-profiles`: Pressure p(psi) and current density j(psi) profiles
- `derived-quantities`: Plasma stored energy, internal inductance, beta, safety factor profile q(psi)

## Process

1. Formulate the Grad-Shafranov equation: Delta* psi = -mu0 * R * dp/dpsi - F * dF/dpsi where Delta* is the toroidal elliptic operator. The two free functions p(psi) and F(psi)=R*B_phi are parametrized (spline, polynomial).
2. Set up the inverse problem: match computed magnetic signals from the trial equilibrium to measured signals. Minimize chi-squared with regularization to avoid overfitting. This is the EFIT approach (or similar codes: CLISTE, EQUINOX).
3. Incorporate internal constraints when available: pressure profile from Thomson scattering, current profile from MSE (motional Stark effect), q-profile from polarimetry. These dramatically improve the interior reconstruction.
4. Iterate to convergence: solve the GS equation with current p', FF' profiles, compute magnetic signals, update profiles to reduce residuals. Typical convergence in 10-20 iterations.
5. Extract derived quantities: q(psi) = 1/(2*pi) * integral of (B_phi / R*B_p) dl around flux surface. Beta_N = beta(%) * a(m) * B_T(T) / I_p(MA). Internal inductance li = <B_p^2>_vol / B_p^2(a). These are inputs to stability analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
