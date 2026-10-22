# Laminate Load Analysis

Define the structural load cases and translate them into ply-level stress requirements using classical laminate theory (CLT) and the ABD stiffness matrix.

## Inputs

- `structural-loads`: Applied forces and moments on the laminate (Nx, Ny, Nxy, Mx, My, Mxy) from the structural model or test specification
- `material-system`: Fiber and resin system under consideration (e.g., T700/epoxy, IM7/BMI) with unidirectional ply properties (E1, E2, G12, nu12, ply thickness)

## Outputs

- `abd-stiffness-matrix`: 6x6 ABD matrix relating applied loads to mid-plane strains and curvatures for the candidate laminate
- `ply-stress-distribution`: Stress state (sigma_1, sigma_2, tau_12) in each ply in its local material coordinate system

## Process

1. Identify all load cases: static ultimate, fatigue spectrum, thermal (delta-T from cure to operating), and moisture (delta-M from dry to equilibrium). Combine using the governing load combinations per the design code (e.g., CMH-17, ECSS).
2. Select an initial ply orientation set. Start with the 10% rule (minimum 10% of plies in each of 0, 45, -45, 90 directions). For shear-dominated loads, increase the +/-45 fraction. For axially loaded members, increase the 0 fraction.
3. Build the ABD stiffness matrix by summing each ply's transformed stiffness contribution through the laminate thickness. A = sum of Q_bar * t_k, B = sum of Q_bar * t_k * z_bar_k, D = sum of Q_bar * (t_k * z_bar_k^2 + t_k^3/12). A symmetric balanced laminate zeros out B and the A16/A26 coupling terms.
4. Invert the ABD matrix to get mid-plane strains and curvatures from the applied loads. Then back-calculate the strain in each ply in the laminate coordinate system, and rotate into each ply's material coordinates using the transformation matrix.
5. Report the ply-level stresses for input to the failure analysis step. Flag any ply where the transverse stress sigma_2 exceeds 50% of the transverse strength as a candidate for matrix cracking under fatigue.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
