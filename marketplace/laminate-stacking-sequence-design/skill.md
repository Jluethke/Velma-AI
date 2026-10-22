# Laminate Stacking Sequence Design

Define the ply orientations and stacking order that meet stiffness and strength targets while obeying symmetry, balance, and stacking rules.

## Inputs

- `laminate-loads`: In-plane loads and moments (Nx, Ny, Nxy, Mx, My, Mxy) and stability requirements for the panel or member
- `ply-properties`: Unidirectional ply stiffness and thickness (E1, E2, G12, nu12, cured ply thickness, typically 0.125 to 0.19 mm for carbon prepreg)

## Outputs

- `stacking-sequence`: The ordered ply stack by angle, with the percentage in each of the 0, plus/minus 45, and 90 families
- `abd-matrix`: The 6x6 ABD stiffness matrix for the stack, confirming symmetry and balance and the in-plane and bending stiffness it delivers

## Process

1. Start from the load-driven percentage split, then refine. Begin near the 10% rule (at least 10% of plies in each of 0, +45, -45, 90). For axial members raise the 0 fraction; for shear-dominated webs raise the plus/minus 45 fraction; for pressure or biaxial loads balance 0 and 90. A typical general-purpose quasi-isotropic stack is 25/50/25 across 0, plus/minus 45, 90.
2. Build the stack symmetric and balanced. Symmetry about the mid-plane zeros the B matrix so in-plane loads do not induce bending (and the part cures flat); balance (equal numbers of +theta and -theta plies) zeros the A16 and A26 shear-extension coupling. Deviations are deliberate only (for example aeroelastic tailoring), not accidental.
3. Obey the stacking rules that prevent premature failure. Limit contiguous same-angle plies to about 4 (0.6 to 0.8 mm) to avoid matrix-crack coalescence; place plus/minus 45 pairs adjacent; keep 45-degree jumps between neighbors rather than 90-degree jumps where possible; put a 45 ply on the outer surface to improve damage tolerance and impact resistance.
4. Assemble the ABD matrix by summing each ply's transformed reduced stiffness through the thickness: A from Q-bar times ply thickness, B from the first moment about the mid-plane, D from the second moment. Confirm B is effectively zero for the symmetric stack and read off the in-plane (A) and bending (D) stiffness the design delivers.
5. Invert the ABD relation to get mid-plane strains and curvatures under the design loads, and check they are within the strain allowable before moving to detailed failure analysis. Carry the ply-by-ply strains forward; they are the input to the failure criteria step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
