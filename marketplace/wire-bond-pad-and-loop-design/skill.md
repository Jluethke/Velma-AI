# Wire Bond Pad And Loop Design

Design bond pad geometry and wire loop profile to meet electrical, mechanical, and form factor requirements.

## Inputs

- `die-pad-specifications`: Pad size, pitch, metallization (Al or Cu), and passivation opening
- `package-constraints`: Package height limit, mold clearance, bond finger locations on substrate

## Outputs

- `loop-profile`: Wire loop shape (standard, low, ultra-low, reverse), kink height, loop height, and wire length
- `pad-design`: Bond pad size, probe mark allowance, and over-pad passivation rules

## Process

1. Select wire diameter from current requirement. Gold: 18um (0.7mil) for low current, 25um (1mil) standard, 33um (1.3mil) for power. Copper: same diameters but higher conductivity (can use thinner wire for same current).
2. Design loop profile. Standard loop: 150-250um height, suitable for most packages. Low loop: 75-125um for thin packages (QFN, TQFP). Ultra-low loop: < 75um requires specialized capillary and bonding recipe. Reverse bond (ball on substrate, stitch on die): lowest loop achievable.
3. Calculate wire length from bond-to-bond distance, loop height, and kink geometry. Longer wires have higher inductance (L approximately 1 nH/mm) and resistance, and are more susceptible to wire sweep during molding.
4. Size bond pads. Ball bond pad: minimum 1.5x to 2x ball diameter (ball is ~1.5x wire diameter). Typical: 60-80um pad for 25um wire. Stitch bond pad (on substrate): elongated for bonding tool landing, typically 50x100um minimum.
5. Account for probe marks on pads that will be probed before bonding. Probe marks create surface damage that weakens the bond. Either use separate probe pads or allocate pad area for probe mark outside the ball bond zone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
