# Balancing And Torsional

Define the balancing procedure and analyze torsional vibration for gear trains and reciprocating machinery.

## Inputs

- `rotor-geometry`: Shaft dimensions and correction plane locations
- `torsional-model`: Lumped inertia and stiffness model for torsional analysis
- `unbalance-response`: Vibration response showing correction needed

## Outputs

- `balance-procedure`: Balance grade, number of planes, method (single-plane, two-plane influence coefficient, or modal), and acceptance criteria
- `torsional-analysis-results`: Torsional natural frequencies, forced response to excitation orders, and stress in shaft sections
- `torsional-compliance`: Margin between torsional natural frequencies and excitation frequencies per API or applicable standard

## Process

1. Select balance grade per ISO 1940: G2.5 for general machinery, G1.0 for precision, G0.4 for high-speed precision. The allowable residual unbalance is U_per = G*M/(omega) where M is rotor mass and omega is operating speed in rad/s.
2. Select balancing method: single-plane for rigid rotors or when one correction plane dominates (disc-shaped rotors). Two-plane influence coefficient for rigid rotors with two correction planes (most common). Modal balancing for flexible rotors that operate above the first critical speed (correct each mode at its own influence coefficient).
3. For influence coefficient balancing: attach a trial weight at each correction plane in turn. Measure the vibration change (influence coefficient = vibration change / trial weight). Solve for correction weights that minimize vibration at the measurement points. Verify by installing corrections and measuring the final vibration.
4. For torsional analysis: compute undamped torsional natural frequencies from the eigenvalue problem [K_t - omega^2 * J]{theta} = 0. Per API 617/618: torsional natural frequencies must have at least 10% separation from any excitation order (1x, 2x for reciprocating, gear mesh frequency and sidebands).
5. Calculate forced torsional response at each excitation order. For geared systems: gear mesh excitation from transmission error. For reciprocating machines: gas and inertia torque harmonics up to the significant order. Compute alternating shear stress in each shaft section and compare to the endurance limit with appropriate safety factor (typically 2.0 on alternating stress for infinite life).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
