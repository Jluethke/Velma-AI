# Tfs Component Characterization

Assign each branch its physical flow relation, pulling friction, pump, valve, and heat-exchanger characteristics from correlations and curves so the network equations have real coefficients.

## Inputs

- `network-graph`: The branches needing flow and heat characteristics
- `operating-conditions`: Fluid properties and the operating range over which characteristics are evaluated

## Outputs

- `component-models`: The pressure-flow and heat-transfer relation for each branch with its parameters
- `property-evaluation`: The fluid properties (density, viscosity, specific heat) evaluated at the operating states

## Process

1. Model pipe friction with the Darcy-Weisbach relation dP = f*(L/D)*(rho*V^2/2), where f is the Darcy friction factor, L and D the length and diameter, and V the mean velocity. Use f = 64/Re for laminar flow (Re < 2300) and solve the Colebrook relation 1/sqrt(f) = -2*log10(eps/(3.7*D) + 2.51/(Re*sqrt(f))) for turbulent flow, where eps is the wall roughness; the Swamee-Jain explicit formula is a good non-iterative approximation.
2. Model pumps with their head-versus-flow curve and affinity laws. Represent the pump as a branch whose pressure rise follows the manufacturer head curve H(Q); scale between speeds with the affinity laws Q proportional to N, H proportional to N^2, and shaft power proportional to N^3, so a 20 percent speed cut roughly halves the head and cuts power to about half of half.
3. Model valves and orifices with a flow coefficient. Use Q = Cv*sqrt(dP/SG) for a valve of coefficient Cv and fluid specific gravity SG, or a loss coefficient K giving dP = K*(rho*V^2/2) for fittings; the valve characteristic (linear, equal-percentage) sets how Cv varies with stem position for control studies.
4. Model heat exchangers with the effectiveness-NTU method. Compute NTU = U*A/C_min where C_min is the smaller of the two stream heat-capacity rates and U*A the overall conductance; for a counterflow exchanger the effectiveness is eps = (1 - exp(-NTU*(1 - Cr)))/(1 - Cr*exp(-NTU*(1 - Cr))) with Cr = C_min/C_max, and the heat duty is Q = eps*C_min*(T_hot_in - T_cold_in).
5. Evaluate fluid properties at the local state and flag strong variation. Density, viscosity, and specific heat change with temperature and pressure; for liquids viscosity changes most and feeds back into the friction factor through Re, so for systems with large temperature swings evaluate properties per branch rather than once globally.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
