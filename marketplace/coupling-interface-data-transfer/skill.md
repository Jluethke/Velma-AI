# Coupling Interface Data Transfer

Transfer loads and motions across non-matching meshes at the interface using conservative or consistent interpolation as the quantity demands, so coupling does not silently leak energy or force.

## Inputs

- `solver-assignment`: Which fields exchange data and in which direction
- `coupling-map`: The interface where data is transferred

## Outputs

- `mesh-mapping`: The interpolation operator between the non-matching interface meshes, with its conservation property
- `transfer-scheme`: Which quantities use conservative transfer and which use consistent transfer, with the reason

## Process

1. Accept that the interface meshes rarely match. The fluid surface mesh and the structural surface mesh are generated independently and have different node positions and densities, so data must be interpolated through a mapping operator built once and reused each exchange.
2. Use conservative interpolation for extensive quantities such as force and heat flow. A conservative map preserves the integral, so the total force transferred to the structure equals the total force the fluid applied; the per-node force is distributed by the mapping weights. This prevents a slow energy or momentum leak across the interface.
3. Use consistent interpolation for intensive quantities such as displacement, temperature, and velocity. A consistent map reproduces a constant field exactly and is accurate for smooth fields; applied to a force it would not conserve the total, which is why the choice depends on the quantity.
4. Mind the accuracy on curved and mismatched interfaces. Nearest-neighbor mapping is fast but low order and loses accuracy where the meshes differ; a projection or radial-basis mapping is higher order and handles gaps and overlaps between the two surfaces better, at higher setup cost.
5. Verify the map before coupling. Transfer a known uniform load and confirm the integrated force is preserved to machine precision for the conservative map; transfer a known linear field and confirm the consistent map reproduces it. A mapping that fails these patch tests will corrupt the coupled solution in ways that look like physics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
