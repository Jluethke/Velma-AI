# Floorplanning And Power Planning

Create the physical floorplan with macro placement, blockage definition, I/O placement, and power ring/stripe design to meet IR drop and routability targets.

## Inputs

- `synthesized-netlist`: Gate-level netlist with area and pin information
- `die-size-target`: Target die dimensions and I/O ring configuration

## Outputs

- `floorplan`: Placed macros, I/O pads, and blockage definitions
- `power-plan`: Power rings and stripes with estimated IR drop

## Process

1. Place hard macros (SRAMs, analog blocks, PLLs): locate close to their I/O connections to minimize wire length. Maintain minimum spacing between macros for routing channels. Add placement and routing blockages around macros to prevent standard cells from being placed too close (cell-to-macro spacing rule).
2. Create power rings around the core and around each macro. Ring width is set by the EM current limit and the current draw of the enclosed region. Typical top-metal ring width: 5-20 um. Add power stripes across the core connecting the rings, spaced to meet the IR drop target.
3. Via down from the power stripes to the standard cell power rails (typically on metal-1). Each via stack must be sized to carry the local current demand. Use via arrays, not single vias, for power connections.
4. Define placement regions: group related logic (clock domain, pipeline stage, data-path slice) into soft regions to guide placement for better timing and lower wire length. Do not over-constrain: leave the placer freedom to optimize globally.
5. Run trial placement (coarse): check congestion (regions where routing demand exceeds available tracks), timing (are macro placements creating long wire detours?), and power grid IR drop with estimated switching activity. Iterate the floorplan to resolve congestion hot spots.
6. Finalize I/O pad placement: pads are typically placed on a fixed pitch on the die perimeter. Assign signal pins to minimize wirelength to their internal logic. Place power and ground pads at regular intervals (every 5-10 signal pads) to maintain low supply impedance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
