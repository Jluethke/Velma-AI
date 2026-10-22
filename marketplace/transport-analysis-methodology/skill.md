# Transport Analysis Methodology

Analyze energy, particle, and momentum transport to predict confinement and design the operating scenario.

## Inputs

- `stability-assessment`: MHD stability boundaries
- `beta-limit`: Maximum beta
- `stability-control-plan`: Profile control approach

## Outputs

- `transport-coefficients`: Measured chi_e, chi_i, D_particle, and v_pinch profiles
- `confinement-prediction`: Predicted energy confinement time and comparison to scaling law
- `operating-scenario`: Target profiles, H-factor, and pedestal parameters

## Process

1. Perform power balance: for each flux surface, measure electron and ion temperature and density profiles (Thomson scattering, ECE, reflectometry), heating deposition profile (NBI: NUBEAM, ECRH: ray tracing), and radiation profile (bolometry). Heat flux = -n * chi * grad(T).
2. Extract transport coefficients: chi_e, chi_i by inverting the power balance. Compare to neoclassical prediction (banana-plateau regime). The anomalous excess over neoclassical is driven by microturbulence (ITG, TEM, ETG modes).
3. Predict transport with gyrokinetic codes (GENE, GS2, CGYRO) or quasilinear models (TGLF, QuaLiKiz). These capture the turbulent transport driven by microinstabilities. Stiff transport: above the critical gradient, chi increases rapidly.
4. Characterize the H-mode pedestal: pedestal height determines global confinement since the core gradient is stiff. Pedestal stability is limited by peeling-ballooning modes (EPED model). Pedestal width from kinetic ballooning mode constraint.
5. Design the operating scenario: combine core and pedestal predictions. Target H98 = tau_E / tau_E,scaling = 1.0-1.5. Include ELM regime (type-I, type-III, ELM-free QH-mode) and its impact on divertor heat loads. Time-dependent scenarios for ramp-up, flat-top, ramp-down.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
