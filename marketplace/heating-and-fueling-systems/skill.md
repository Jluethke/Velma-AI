# Heating And Fueling Systems

Design the auxiliary heating systems and fueling methods to reach and sustain burning plasma conditions.

## Inputs

- `divertor-configuration`: Divertor geometry and operating regime
- `pfc-specifications`: PFC design constraints
- `power-exhaust-strategy`: Radiation and detachment approach

## Outputs

- `heating-system-design`: NBI, ICRH, and ECRH system specifications
- `fueling-system-design`: Gas puff and pellet injection specifications
- `plasma-control-architecture`: Real-time control scheme for plasma parameters

## Process

1. Partition heating power among systems. Neutral beam injection (NBI): 80-1000 keV beams for bulk ion heating, current drive, and diagnostics. Beam energy must exceed the shine-through threshold for the target density.
2. Design ion cyclotron resonance heating (ICRH): select frequency for the target species (typically minority H or He-3 in D-T plasma, f = Z*e*B / (2*pi*m)). Antenna design for coupling through the scrape-off layer. Power density limits from voltage standoff.
3. Design electron cyclotron resonance heating (ECRH): frequency = n * omega_ce = n * eB/(m_e). Use second harmonic X-mode for good absorption. ECRH provides localized heating and current drive for NTM stabilization. Gyrotron source at 110-170 GHz.
4. Design fueling: gas puffing from the edge for density control (slow, limited penetration). Pellet injection for deep fueling (centrifuge launcher, 1-3 km/s, pellet size for target density increment per pellet). High-field-side launch for better penetration.
5. Design the plasma control system: real-time magnetic equilibrium reconstruction, PID control of density (gas valve), beta (heating power), and position (vertical stability coils). Integrate disruption prediction algorithms.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
