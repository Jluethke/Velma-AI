# Stability Rating Methods

Apply stability rating tests (bomb test, pulse gun, variable orifice) and analytical methods to determine engine stability margins.

## Inputs

- `acoustic-mode-map`: Identified acoustic modes and their frequencies
- `injector-type`: Injector design details that affect combustion response
- `mode-coupling-risk`: Which modes are at risk

## Outputs

- `stability-rating`: Stable, marginally stable, or unstable for each mode
- `decay-rate`: Measured pressure oscillation decay rate after perturbation (higher = more stable)
- `stability-margin`: Distance from stability boundary in terms of gain or damping

## Process

1. The bomb test: detonate a small explosive charge (50-200 mg of RDX) mounted on the injector face during steady-state operation. The explosion excites all acoustic modes simultaneously. Measure the pressure decay: if oscillations decay within a few milliseconds, the engine is stable. If they grow, immediate shutdown.
2. The pulse gun: a directed pressure pulse from a small powder charge. Less violent than a bomb, can target specific modes by location on the injector face. Used when bomb tests show marginal stability and more precise data is needed.
3. Directional pulse injection: rapidly inject a slug of propellant through a special port to create a localized combustion perturbation. This method allows repeated testing without replacing explosive charges.
4. Analytical methods: linear stability analysis solves the coupled acoustic-combustion equations for eigenvalues. If any eigenvalue has a positive real part (growth rate > damping rate), that mode is unstable. The analysis requires a combustion response function, which is difficult to measure or predict accurately.
5. Hewitt stability correlation: an empirical method that correlates stability with injector orifice size, chamber diameter, and propellant properties. Smaller orifices (finer atomization) and larger chambers (lower mode frequency relative to combustion time) tend to be more stable. This is a screening tool, not a guarantee.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
