# Fatigue Method Selection And Sn Curve

Select the fatigue analysis method and construct the appropriate S-N or epsilon-N curve for the component.

## Inputs

- `cycle-count`: Characterization of the cyclic loading
- `component-description`: Material, surface finish, size, and required life

## Outputs

- `fatigue-curve`: S-N curve or strain-life curve with all modification factors applied for the specific component
- `method-selection`: Stress-life (high-cycle), strain-life (low-cycle), or fracture mechanics (damage tolerance), with rationale

## Process

1. Choose the method based on the expected life: stress-life (S-N approach) for high-cycle fatigue (> 10,000 cycles to failure) where strains remain elastic. Strain-life (epsilon-N approach) for low-cycle fatigue (< 10,000 cycles) where plastic strains occur at the notch root. Fracture mechanics for damage tolerance (known initial crack from inspection).
2. For stress-life: start with the polished specimen S-N data from fatigue databases (MMPDS for aerospace metals, Eurocode for structural steel). Modify for component conditions: S_component = S_specimen * k_surface * k_size * k_reliability * k_temperature * k_environment. Surface factor k_surface depends on surface finish (0.7-1.0). Size factor k_size corrects for stress gradient (0.6-0.9 for large parts).
3. For strain-life: obtain the Coffin-Manson parameters (sigma_f', b, epsilon_f', c) from strain-controlled fatigue tests. The total strain amplitude is epsilon_a = (sigma_f'/E) * (2N_f)^b + epsilon_f' * (2N_f)^c. The transition life 2N_T where elastic and plastic strain amplitudes are equal separates the high-cycle and low-cycle regimes.
4. Apply mean stress correction: Goodman (linear, conservative), Gerber (parabolic, less conservative), or Smith-Watson-Topper (SWT: sigma_a_eq = sqrt(sigma_max * sigma_a), which accounts for mean stress through the maximum stress). SWT is preferred for strain-life because it naturally handles R-ratio effects.
5. For welded joints: use the S-N curves from the applicable standard (IIW, BS 7608, Eurocode 3) based on the weld detail class. Weld detail class depends on joint geometry and loading direction. These curves already include the effect of the weld toe stress concentration and residual stress.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
