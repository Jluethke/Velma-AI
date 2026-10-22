# Scramjet Nozzle Thermal Management

Design the exhaust nozzle for thrust extraction and the thermal management system for the engine structure operating in a 1500 to 3000K environment.

## Inputs

- `combustor-geometry`: Combustor exit conditions and geometry
- `combustion-performance`: Exit Mach, pressure, temperature, and species
- `vehicle-integration-constraints`: Vehicle aft body shape and structural limits

## Outputs

- `nozzle-geometry`: Nozzle contour, expansion ratio, and thrust vector
- `thermal-management-design`: Cooling approach for each engine section with heat load and coolant flow rates
- `engine-performance-summary`: Net thrust, specific impulse, and drag accounting

## Process

1. Design the nozzle: for vehicle-integrated scramjets, the aft body of the vehicle serves as the external expansion surface (single expansion ramp nozzle, SERN). The expansion ratio is set by the ratio of nozzle exit pressure to ambient. At high altitude, the nozzle is underexpanded (exit pressure > ambient). Use method of characteristics for the expansion contour to avoid oblique shocks inside the nozzle.
2. Account for nozzle losses: divergence loss (thrust reduction from non-axial exit flow), friction loss on the expansion surface, chemical freezing loss (recombination reactions freeze as the gas expands and cools, trapping energy in dissociated species that cannot be recovered as kinetic energy).
3. Design the thermal management system: at Mach 6+, wall temperatures on the engine interior approach 1500 to 3000K. For hydrogen fuel, use regenerative cooling: route the hydrogen fuel through cooling passages in the combustor and nozzle walls before injecting it. Hydrogen's high specific heat (14.3 kJ/kg-K) makes it an excellent coolant. For hydrocarbon fuels, use endothermic cracking: the fuel absorbs heat by undergoing pyrolysis (thermal decomposition) in the cooling passages, absorbing 2 to 3 MJ/kg.
4. Size cooling passages: calculate heat flux at each engine station (q = h * (T_gas - T_wall)), determine required coolant flow rate from energy balance (m_dot * cp * delta_T = q * A), and size passage geometry for the required flow rate and pressure drop. Verify that wall temperature stays below material limits.
5. Perform net thrust accounting: gross thrust = m_dot_exit * V_exit + (p_exit - p_ambient) * A_exit. Subtract inlet momentum drag = m_dot_air * V_freestream. The net thrust is the difference. At high Mach numbers, the net thrust is a small difference between two large numbers, making every percent of loss significant.
6. Calculate specific impulse: Isp = F_net / (m_dot_fuel * g). Hydrogen scramjets achieve Isp of 1000 to 2000 s at Mach 6 to 10. Hydrocarbon scramjets achieve 800 to 1200 s. Compare to rocket Isp of 300 to 450 s.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
