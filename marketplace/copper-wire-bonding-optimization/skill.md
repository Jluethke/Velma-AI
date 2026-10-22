# Copper Wire Bonding Optimization

Optimize the copper wire bonding process to address the specific challenges of copper vs gold wire: harder ball, pad cratering, and oxidation.

## Inputs

- `loop-profile`: Wire loop and pad design from previous step
- `pad-design`: Bond pad geometry and metallization

## Outputs

- `bonding-recipe`: USG power, bonding force, time, and temperature optimized for copper wire on the target pad metallization
- `process-controls`: Forming gas (N2/H2) flow, capillary selection, FAB (free air ball) current, and pad cratering prevention measures

## Process

1. Copper wire is 30% harder than gold. The ball formed by EFO (electronic flame-off) is harder and requires higher bonding force or USG power to deform and bond to the pad. But excessive force craters the underlying pad metallization and ILD (low-k dielectric).
2. Optimize FAB (free air ball) formation. Copper oxidizes rapidly in air. Use forming gas (95% N2, 5% H2) during EFO to prevent oxidation. Ball size uniformity depends on EFO current, gap, and gas flow.
3. Prevent pad cratering. Cratering occurs when the bond force cracks the dielectric stack beneath the aluminum pad. Mitigation: reduce impact force (use ultrasonic-dominant bonding over force-dominant), add a thick top metal pad (Cu redistribution layer under Al pad), or optimize bond tool trajectory to reduce first-impact velocity.
4. Design the bonding recipe using DOE: factors = USG power, bond force, bond time, stage temperature. Responses = ball shear strength, wire pull strength, pad crater occurrence, ball size. Find the process window where shear > 5 gf/mil2, pull > 3 gf, and zero craters.
5. Implement in-line monitoring: ball shear test (destructive, sample basis), wire pull test (destructive, sample basis), non-stick on pad detection (automatic, 100%), ball placement accuracy (vision system, 100%). Set control limits from DOE results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
