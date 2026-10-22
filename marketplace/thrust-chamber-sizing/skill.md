# Thrust Chamber Sizing

Size the thrust chamber from thrust requirement, chamber pressure, and propellant choice using characteristic velocity and thrust coefficient.

## Inputs

- `thrust-requirement-n`: Required engine thrust in Newtons (sea level or vacuum, specify which)
- `chamber-pressure-target-pa`: Target chamber pressure in Pascals (typically 5-30 MPa)
- `propellant-combination`: Oxidizer and fuel selection (e.g., LOX/RP-1, LOX/LCH4, LOX/LH2)

## Outputs

- `throat-area`: Nozzle throat area in m^2 from F = Cf * Pc * At
- `chamber-volume`: Chamber volume from characteristic length L* for complete combustion
- `mixture-ratio`: Optimal O/F ratio from equilibrium or frozen-flow thermochemistry
- `theoretical-performance`: C* (characteristic velocity) and Cf (thrust coefficient) from CEA or equivalent

## Process

1. Run chemical equilibrium analysis (NASA CEA or equivalent) for the propellant combination at the target chamber pressure. This gives theoretical C*, Isp, flame temperature, and gas properties (gamma, molecular weight) as a function of mixture ratio.
2. The optimal mixture ratio for Isp is NOT stoichiometric. For LOX/RP-1 the Isp peak is at O/F around 2.3-2.7 (fuel-rich), for LOX/LH2 at O/F around 4-6. Operating fuel-rich also keeps the gas temperature below the wall material limit.
3. Calculate throat area: At = F / (Cf * Pc). The thrust coefficient Cf depends on expansion ratio and exit pressure; for a well-expanded nozzle at sea level, Cf is approximately 1.5-1.7. At vacuum, Cf can exceed 1.9 with a high expansion ratio.
4. Size the chamber volume using characteristic length L* = Vc / At. L* represents the stay time needed for complete combustion. For LOX/RP-1: L* = 1.0-1.3 m; for LOX/LH2: L* = 0.6-0.8 m; for LOX/LCH4: L* = 0.8-1.1 m.
5. The chamber diameter is typically 2-4 times the throat diameter for a cylindrical or convergent chamber. Too small increases heat flux at the walls; too large increases mass and length. The contraction ratio affects combustion stability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
