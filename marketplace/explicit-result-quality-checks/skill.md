# Explicit Result Quality Checks

Verify that the explicit simulation result is physically meaningful by checking energy balance, hourglassing, and time step history.

## Inputs

- `contact-definitions`: Complete contact setup
- `explicit-mesh`: Meshed model ready for analysis

## Outputs

- `simulation-quality-report`: Energy balance, hourglass energy ratio, mass scaling ratio, time step history, and identified issues
- `validated-result`: Deformation, force history, and energy absorption with confidence assessment

## Process

1. Energy balance: total energy = kinetic + internal + contact + hourglass + external work. Total energy should remain constant (within 2% of the initial kinetic energy) throughout the simulation. Energy growth indicates instability. Energy loss beyond physical dissipation indicates excessive damping or contact energy leak.
2. Hourglass energy: the ratio of hourglass energy to internal energy should stay below 10% (5% is preferred). Hourglass modes are non-physical zero-energy deformations of reduced-integration elements. If hourglass energy is too high: increase hourglass stiffness, switch to fully integrated elements in critical regions, or refine the mesh.
3. Mass scaling check (if used): the ratio of added mass to original mass should be below 5%. Track which elements are mass-scaled and verify they are not in the critical deformation zone. The kinetic-to-internal energy ratio should remain below 5% for quasi-static simulations.
4. Time step history: the stable time step should not drop dramatically during the simulation. A sudden drop indicates extreme element distortion. If elements become too distorted, they should be deleted (erosion) rather than allowed to drive the time step to impractical levels.
5. Compare to test data: overlay force-displacement or acceleration-time curves from the simulation and the physical test. The peak force, energy absorption (area under the curve), and deformation pattern should agree within 10-15% for a well-calibrated model. Discrepancies point to material model, contact, or boundary condition errors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
