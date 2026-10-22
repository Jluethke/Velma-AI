# Dimensionless Scale Analysis

Analyze the process using dimensionless numbers to identify which transport phenomena dominate at each scale.

## Inputs

- `lab-data`: Laboratory reactor or process data at bench scale
- `target-scale`: Production scale target (volume, throughput)

## Outputs

- `controlling-regime`: Whether the process is kinetics-limited, heat-transfer-limited, or mass-transfer-limited at target scale
- `dimensionless-groups`: Key dimensionless numbers (Re, Da, Pe, Nu, Sh) at both scales
- `scale-dependent-risks`: Phenomena that change regime between lab and production scale

## Process

1. Calculate the Damkohler number Da = reaction rate / transport rate at both scales. Da less than 0.1 means kinetics-controlled (safe to scale). Da greater than 10 means transport-controlled; the rate at production scale will be limited by mixing or heat transfer, not intrinsic kinetics.
2. Calculate the Reynolds number at both scales for stirred vessels: Re = N*D^2*rho/mu. Turbulent mixing (Re above 10000) may be easy at lab scale but expensive to maintain at production scale if the vessel diameter increases geometrically.
3. Calculate the Peclet number Pe = u*L/D_eff for flow reactors. High Pe means plug flow; low Pe means significant axial dispersion. Pe often decreases at scale-up due to velocity profile changes, converting an approximately plug-flow lab reactor into a partially backmixed production reactor.
4. Evaluate the surface-to-volume ratio: S/V scales as 1/R for a sphere or cylinder. At lab scale (100 mL), the reactor wall provides ample heat transfer area. At production scale (10 m3), the same wall area per volume is 50x lower. Identify whether internal coils, external heat exchange, or a different reactor type is needed.
5. List every dimensionless number that changes by more than an order of magnitude between lab and production scale. Each such change is a scale-up risk that must be addressed in pilot design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
