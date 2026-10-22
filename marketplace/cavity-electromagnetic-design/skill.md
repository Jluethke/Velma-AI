# Cavity Electromagnetic Design

Design the cavity electromagnetic geometry for the target frequency, accelerating gradient, and beam loading.

## Inputs

- `beam-requirements`: Particle type, energy gain per cavity, beam current, and bunch structure
- `rf-frequency`: Operating frequency from beam dynamics requirements

## Outputs

- `cavity-geometry`: Cell shape, number of cells, and iris aperture
- `rf-parameters`: R/Q, geometric factor G, Epeak/Eacc, Bpeak/Eacc ratios
- `hom-spectrum`: Higher-order mode frequencies, R/Q, and Q for beam stability

## Process

1. Select cavity type from beam requirements. Normal-conducting (NC): copper, high gradient possible (50-100 MV/m pulsed), high RF power dissipation limits duty cycle. Superconducting (SRF): niobium, moderate gradient (25-50 MV/m), very low losses enable CW operation.
2. Design cell shape: for SRF elliptical cavities, optimize the cell profile to minimize Epeak/Eacc (limit field emission onset) and Bpeak/Eacc (limit quench field). TESLA shape: Epeak/Eacc = 2.0, Bpeak/Eacc = 4.26 mT/(MV/m). Low-loss and re-entrant shapes improve these ratios.
3. Choose number of cells: more cells = higher voltage per cavity, but increased risk of trapped modes and more difficult field flatness. Typical: 9-cell for TESLA/ILC, 5-cell for CEBAF, single-cell for heavy-ion linacs (spoke, quarter-wave). Calculate R/Q per cell and total R/Q.
4. Analyze HOMs: compute dipole, quadrupole, and sextupole mode frequencies, R/Q, and loaded Q. Dipole modes near beam harmonic frequencies can drive beam breakup (BBU). Threshold current I_th = 2 * E / (e * R/Q * Q * beta * c * tau). Design HOM damping to keep Q_loaded low enough.
5. Verify with 3D electromagnetic simulation (CST, HFSS, ACE3P): confirm mode spectrum, field flatness across multi-cell structure (tune by adjusting cell frequency via deformation), multipacting barriers (check for resonant electron trajectories at field levels below operating gradient).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
