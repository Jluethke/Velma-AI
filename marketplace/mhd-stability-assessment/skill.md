# Mhd Stability Assessment

Assess plasma MHD stability against ideal and resistive modes that limit achievable pressure and current.

## Inputs

- `flux-surface-map`: Equilibrium poloidal flux map
- `plasma-profiles`: Pressure and current density profiles
- `derived-quantities`: q profile, beta, and internal inductance

## Outputs

- `stability-assessment`: Stability boundaries for kink, ballooning, and tearing modes
- `beta-limit`: Maximum achievable beta_N and limiting instability
- `stability-control-plan`: Required profile shaping or active control for target operating point

## Process

1. Check ideal MHD stability: external kink modes (n=1 global, driven by current gradient near edge), ballooning modes (n=infinity, driven by pressure gradient in bad curvature region). Use DCON, MISHKA, or GATO codes.
2. Assess the Troyon beta limit: beta_N < 2.5-3.5 depending on profiles and wall proximity. The ideal wall stabilization can raise the no-wall limit by 50-100% but requires resistive wall mode feedback control.
3. Check resistive instabilities: tearing modes (classical, driven by delta-prime from current gradient), neoclassical tearing modes (NTM, driven by bootstrap current perturbation). NTMs are the most common beta-limiting instability in tokamaks.
4. Plan NTM control: ECCD driven inside the island O-point to replace missing bootstrap current. Requires real-time island detection (magnetic perturbation amplitude and phase) and steerable ECRH launcher.
5. Assess vertical stability: growth rate of the n=0 vertical displacement event. Required feedback bandwidth from growth rate and control coil mutual inductance. Design passive stabilization (conducting wall or saddle loops) to slow the growth rate to a controllable level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
