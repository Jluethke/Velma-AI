# Isolation Mount Selection

Select the isolation mount type and model based on natural frequency target, load, environment, and performance requirements.

## Inputs

- `required-natural-frequency`: Maximum allowable natural frequency
- `static-deflection-target`: Required static deflection
- `isolation-specification`: Complete specification including load per mount and environment
- `installation-constraints`: Weight, space, environmental conditions, and mounting interface constraints

## Outputs

- `selected-mounts`: Mount type, model, quantity, and arrangement with static and dynamic properties
- `predicted-performance`: Calculated transmissibility curve showing isolation at all forcing frequencies
- `mount-arrangement`: Physical layout of mounts under the equipment with CG alignment analysis

## Process

1. Select mount type by natural frequency range: elastomeric pads for 10-30 Hz (small deflection, compact, limited isolation); elastomeric mounts for 5-15 Hz (moderate deflection); steel springs for 1-5 Hz (large deflection, best isolation, but no high-frequency damping without secondary pads); air springs for 0.5-3 Hz (best isolation, require air supply and leveling).
2. For elastomeric mounts: select durometer (shore hardness) for the load range. Check that the operating point is within the mount's rated load range (typically 60-80% of maximum). Verify natural frequency from the load-deflection curve, not just the rated frequency at nominal load.
3. For steel springs: calculate required stiffness k = W/delta_static. Select a spring with this stiffness at the load. Add neoprene pads between spring and structure to attenuate high-frequency transmission that springs cannot isolate (wire resonance in the spring transmits at 50-200 Hz).
4. For air springs: size the air volume for the required stiffness (stiffness is proportional to pressure times area divided by volume). Design the leveling system to maintain ride height as load changes. Account for the surge volume and orifice for damping.
5. Arrange mounts symmetrically about the center of gravity. The CG should be in the same horizontal plane as the elastic center of the mounts to avoid coupled rocking and bouncing. Unequal load distribution across mounts produces different natural frequencies per mount, reducing isolation.
6. Calculate the full 6-DOF transmissibility (bounce, lateral, rocking, yawing). Check that no coupled mode has a natural frequency too close to a forcing frequency. Rocking modes are typically higher than the vertical bounce mode.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
