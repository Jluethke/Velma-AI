# Nuclear Neutronics And Criticality

Apply neutron transport and diffusion theory to achieve criticality: four-factor formula, multiplication factor, and neutron economy optimization.

## Inputs

- `reactor-concept`: Reactor type (PWR, BWR, SMR, MSR, HTGR), thermal power rating, and target fuel cycle length
- `fuel-specification`: Fuel form (UO2, TRISO, metallic), enrichment target, and cladding material

## Outputs

- `neutronics-design`: Fuel assembly geometry, enrichment zoning, and beginning-of-life k-effective with margin for burnup reactivity swing
- `neutron-economy-analysis`: Four-factor formula breakdown (eta, f, p, epsilon), neutron leakage, and excess reactivity requiring control

## Process

1. Start with the four-factor formula: k_inf = eta x f x p x epsilon. Eta is the average number of fission neutrons per thermal neutron absorbed in fuel (about 2.06 for U-235 thermal fission). f is the thermal utilization factor (fraction of thermal absorptions in fuel vs total). p is the resonance escape probability (fraction of neutrons that slow down past U-238 resonances without capture). Epsilon is the fast fission factor (slight multiplication from fast fission in U-238, about 1.03).
2. Calculate k-effective by applying the non-leakage probability: k_eff = k_inf x P_NL, where P_NL depends on the geometric buckling B2 and the migration length M. For a cylindrical reactor, B2 = (2.405/R_extrapolated)2 + (pi/H_extrapolated)2. k_eff must equal 1.0 at steady state; the excess above 1.0 at beginning of life is managed by control systems.
3. Determine the excess reactivity needed. Over the fuel cycle, reactivity decreases as fissile material is consumed and fission products (especially Xe-135 and Sm-149) build up. The initial excess reactivity must compensate for this burnup swing (typically 10-20% delta_k/k for a PWR operating on an 18-month cycle). This excess is held down by control rods, soluble boron, and burnable absorbers.
4. Design the fuel assembly lattice. For a PWR, a 17x17 rod array is standard. The fuel rod pitch (center-to-center distance) determines the moderator-to-fuel ratio, which affects both f and p. Undermoderation (too tight a pitch) reduces f; overmoderation reduces p. The optimal ratio balances these for maximum k_inf. Enrichment zoning (lower enrichment at the periphery of the assembly) flattens the power distribution.
5. Run lattice physics calculations using a deterministic code (CASMO, HELIOS) or Monte Carlo (Serpent, OpenMC). Generate few-group cross sections as a function of burnup, moderator temperature, fuel temperature, and boron concentration. These feed into the core-level diffusion calculation for full-core power distribution, critical boron search, and shutdown margin verification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
