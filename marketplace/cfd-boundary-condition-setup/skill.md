# Cfd Boundary Condition Setup

Define boundary conditions that correctly represent the physical problem without introducing numerical artifacts.

## Inputs

- `problem-description`: Physical scenario including inlet/outlet conditions, wall properties, and symmetry planes
- `turbulence-model`: Selected turbulence model dictates what turbulence quantities must be specified at boundaries

## Outputs

- `boundary-conditions`: Complete specification of every boundary: type, values, and turbulence quantities
- `domain-sizing-rationale`: How far upstream, downstream, and laterally the domain extends, and why

## Process

1. Inlet: specify velocity profile (uniform or developed), total pressure, or mass flow rate. For turbulence quantities, set turbulent intensity I = u'/U (typically 1-5% for wind tunnels, 5-20% for industrial flows) and turbulent length scale l = 0.07*D_h (hydraulic diameter) or turbulent viscosity ratio (mu_t/mu typically 1-10). If the inlet profile matters, run a precursor simulation or use a recycling boundary.
2. Outlet: use pressure outlet (fixed static pressure) for most cases. Place it far enough downstream that the flow is nearly parallel (no large gradients). For internal flows, 10-20 diameters downstream of the last disturbance. Avoid velocity outlet unless the mass flow must be exactly specified, as it can cause convergence issues with backflow.
3. Walls: no-slip for viscous flow. Specify thermal condition (adiabatic, constant temperature, constant heat flux, or conjugate heat transfer). For rough walls, set equivalent sand-grain roughness height from surface finish data. Wall roughness shifts the log-law intercept and increases skin friction.
4. Symmetry: use only when the geometry AND the flow are symmetric. Turbulent flows with instabilities (vortex shedding) are not symmetric even if the geometry is. Symmetry planes reduce cell count by 2x per plane but miss asymmetric flow structures.
5. Domain sizing: for external flows, place the inlet at least 5 characteristic lengths upstream (farther for bluff bodies), the outlet at least 10-20 lengths downstream, and lateral boundaries at least 5 lengths away. Check that blockage ratio (object frontal area / domain cross-section) is below 5% to avoid confinement effects.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
