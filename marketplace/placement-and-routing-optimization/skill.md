# Placement And Routing Optimization

Optimize standard cell placement for timing and congestion, then route the design, resolving DRC violations and timing degradation from routing parasitics.

## Inputs

- `clock-tree`: Design with CTS completed
- `floorplan`: Macro placement and power plan

## Outputs

- `routed-design`: Fully routed layout passing DRC
- `routing-report`: Wire length, via count, congestion, and timing after routing

## Process

1. Placement optimization: the placer positions standard cells to minimize wirelength (half-perimeter bounding box), meet timing (place connected cells closer together on critical paths), and reduce congestion (spread cells in dense regions). Run incremental placement after CTS to refine.
2. Timing-driven placement: cells on critical paths are pulled together. Cells with high fanout are placed centrally relative to their loads. The placer uses estimated wire delays (based on wire length and layer assignment) to optimize timing before routing.
3. Global routing: assigns each net to routing channels (gcells) across the chip without specifying exact tracks. This determines the routing congestion map. If any gcell is over-capacity (more nets than available tracks), the placer must spread cells or the router will detour wires (adding delay).
4. Detailed routing: assigns each wire to a specific metal track and layer, inserts vias for layer transitions, and resolves DRC violations (minimum spacing, minimum width, via enclosure). The router optimizes for minimum wirelength and via count while meeting DRC.
5. Post-route optimization: after initial routing, some timing paths degrade due to routing detours or coupling capacitance. Run post-route optimization: the tool can upsize drivers, insert buffers, and reroute critical nets on preferred (less congested, lower-resistance) layers.
6. DRC cleanup: after routing, run a full DRC check. Common violations: metal spacing (fix by jog or reroute), via enclosure (fix by shifting via placement), antenna ratio (fix by adding jumper to higher metal or antenna diode). Iterate until zero DRC violations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
