# Analog Digital Floorplan Methodology

Create the die floor plan that minimizes analog-digital interference, optimizes I/O placement, and manages power distribution for a mixed-signal IC.

## Inputs

- `block-list`: All functional blocks with area estimates, I/O counts, and sensitivity classification (analog, digital, I/O)
- `package-pinout`: Package pin assignment and bonding diagram

## Outputs

- `die-floorplan`: Placed blocks with power domains, I/O ring, and routing channel allocation
- `power-distribution-plan`: Power ring and stripe layout with IR drop estimate

## Process

1. Separate analog and digital power domains completely: AVDD/AVSS and DVDD/DVSS with independent package pins and bonding wires. Connect AVSS and DVSS at one point only (star ground), at the package level, not on the die.
2. Place analog blocks in one corner or edge of the die, as far as possible from the digital core. Place the most sensitive analog (ADC input, VCO, reference) furthest from digital. High-speed I/O drivers generate the most substrate noise and should be placed on the opposite side of the die.
3. The I/O ring surrounds the core. Assign pins so that analog I/O pins are adjacent to analog blocks and digital I/O pins are adjacent to digital blocks. Do not interleave analog and digital I/O pads, as ESD clamp firing on digital pads injects current into the substrate near analog pads.
4. Power distribution: use a top-metal power grid (mesh) across the core. Calculate the required stripe width and spacing from the total current draw and the metal sheet resistance to keep IR drop below 5% of VDD. For analog blocks, use dedicated power stripes from the I/O ring with minimal sharing.
5. Allocate routing channels between blocks. Estimate the number of wires between each pair of blocks from the netlist. Ensure adequate channel width (each wire needs approximately 2x minimum pitch for comfortable routing). Reserve channels for clock and critical timing signals.
6. Verify the floorplan: run a quick place-and-route with the block placement fixed to check routability. Run a coarse IR drop analysis with estimated current maps. Iterate the floorplan until timing, routability, and power integrity are satisfactory before committing to detailed design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
