# Clock Distribution Design

Design the clock distribution network to meet skew and insertion delay targets, selecting between H-tree, mesh, and hybrid approaches based on die area and clock domain count.

## Inputs

- `logic-style-assignments`: Logic style map showing which blocks need clock and at what phase
- `target-clock-frequency`: System clock frequency

## Outputs

- `clock-tree-topology`: Clock distribution architecture with buffer stages and routing plan
- `skew-insertion-estimates`: Estimated clock skew and insertion delay across the die

## Process

1. Calculate total clock load: sum the input capacitance of all clocked elements (flip-flops, latches, domino precharge transistors). Group loads by physical region.
2. For moderate die sizes with localized clock loads, use a balanced H-tree. Each branching level splits the load evenly. Size buffers at each level so each drives approximately 4x its input capacitance (optimal fan-out for minimum delay).
3. For large dies or when skew must be less than 5% of the clock period, use a clock mesh. The mesh shorts all H-tree endpoints together, averaging out local variations. The mesh consumes more power (short-circuit current in the mesh wires) but reduces skew to sub-picosecond levels.
4. For multiple clock domains, design each domain's tree independently. Place clock domain crossing synchronizers at domain boundaries. Minimize the number of domain crossings by careful floor planning.
5. Estimate insertion delay: count buffer stages, multiply by buffer delay, add wire RC delay for each segment. Typical insertion delay is 200-500 ps. Estimate skew as the maximum difference in insertion delay between any two endpoints.
6. Verify that skew plus jitter is within the clock uncertainty budget from the timing specification. If not, increase mesh density or add local clock buffers to equalize loads.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
