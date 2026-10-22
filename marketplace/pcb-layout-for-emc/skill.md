# Pcb Layout For Emc

Apply PCB layout techniques to minimize radiated emissions and improve immunity, because layout errors cause more EMC failures than missing filters.

## Inputs

- `system-block-diagram`: Block placement, signal routing requirements, power distribution
- `risk-ranking`: EMI sources ranked by contribution to emissions

## Outputs

- `layout-rules`: Specific layout rules for this design: ground plane strategy, high-speed signal routing, power loop minimization, connector placement, and shield grounding
- `layout-review-checklist`: A checklist of EMC-critical layout items to verify before fabrication

## Process

1. Minimize loop area for all high-frequency current paths. Every current flows in a loop (outgoing path + return path). The loop radiates as a magnetic dipole: E proportional to f^2 * I * A where A is the loop area. For a switching converter, the hot loop (switch, inductor, capacitor, return) must be as small as possible. Place the input capacitor directly adjacent to the switch with the shortest trace length.
2. Provide a continuous ground plane on at least one inner layer. The ground plane provides a low-impedance return path for all signals. High-frequency return current flows directly under the signal trace (path of least inductance), so a continuous plane under the signal trace keeps the loop area equal to the trace length times the dielectric thickness (small). Any slot or gap in the ground plane forces the return current to detour around the gap, creating a large loop that radiates.
3. Route high-speed signals on inner layers (stripline) when possible. Stripline is shielded by ground planes above and below, reducing radiated emissions by 20+ dB compared to microstrip on an outer layer. If microstrip must be used, keep the traces short and away from board edges (edge radiation).
4. Separate analog, digital, and power sections physically. Place the switching converter as far as possible from sensitive analog circuits. Route the switching converter's hot loop on the side of the board closest to the ground plane. Never route a high-speed digital signal under or near an analog signal trace.
5. Ground stitching vias: place ground vias every lambda/20 around the board perimeter and around any ground plane split to prevent slot antenna effects. At 1 GHz (lambda = 30 cm), this means a via every 15 mm. Along the edge of a shield can or connector ground pad, vias should be spaced even closer (lambda/40) to provide a low-impedance connection to the ground plane.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
