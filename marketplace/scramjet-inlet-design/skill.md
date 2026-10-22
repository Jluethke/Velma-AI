# Scramjet Inlet Design

Design the inlet compression system to decelerate and compress the incoming air while maintaining total pressure recovery and starting characteristics.

## Inputs

- `design-mach-range`: Operating Mach number range (e.g., Mach 4 to 8)
- `capture-area-requirement`: Required mass flow rate and capture area from thrust sizing
- `vehicle-integration-constraints`: Forebody geometry, cowl position, and structural limitations

## Outputs

- `inlet-geometry`: Ramp angles, cowl position, and internal contraction ratio
- `compression-performance`: Total pressure recovery, static pressure ratio, and temperature at combustor entrance
- `starting-characteristics`: Kantrowitz limit check and unstart margin

## Process

1. Select inlet type: external compression (all shocks outside cowl, lower performance but self-starting), mixed compression (external + internal shocks, higher performance but must manage starting), or REST inlet (rectangular to elliptical shape transition for 3D vehicles).
2. For external compression, set ramp angles to produce oblique shocks that converge at the cowl lip (shock-on-lip condition) at the design Mach number. Use oblique shock relations iteratively: each ramp turns the flow and generates a shock, with the flow behind that shock as the input to the next ramp.
3. Calculate total pressure recovery: for n oblique shocks each at angle beta_i, the total pressure ratio is the product of (p02/p01)_i across all shocks. Compare to the normal shock benchmark. Optimal compression uses equal total pressure ratio across each shock.
4. Check the Kantrowitz starting limit: the internal contraction ratio (A_throat / A_capture) must exceed the Kantrowitz limit (which is less restrictive than the isentropic limit) for the inlet to start. If the contraction is too high, the inlet will not swallow the starting shock and will operate in an unstarted mode with massive spillage.
5. Design variable geometry or boundary layer bleed if the operating Mach range requires it: at off-design Mach numbers, the shock angles change and the shock-on-lip condition is lost. Variable cowl or ramp angles can maintain performance across the Mach range.
6. Calculate the boundary layer state on the compression surfaces: thick boundary layers reduce effective compression and can cause shock-boundary layer interactions that trigger inlet unstart.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
