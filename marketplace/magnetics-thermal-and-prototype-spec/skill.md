# Magnetics Thermal And Prototype Spec

Verify thermal performance of the magnetic design, calculate total temperature rise, and produce a complete specification for prototype build.

## Inputs

- `gap-specification`: Gap length and placement details
- `verified-inductance`: Inductance at operating conditions

## Outputs

- `thermal-verification`: Estimated surface temperature rise from total power dissipation (core + copper loss), using thermal resistance model or empirical formula
- `prototype-specification`: Complete build specification: core P/N, wire type and gauge, turns count per winding, winding order, insulation layers, gap spacer thickness, expected L at zero and peak current, total loss budget

## Process

1. Sum total magnetic component loss: Ptotal = Pcore + Pcu. Verify the ratio: for a balanced design, Pcore should be roughly equal to Pcu (equal loss allocation minimizes total size). If one dominates, the design is suboptimal.
2. Estimate temperature rise. For ungapped ferrite cores, use the empirical formula: delta_T = Ptotal / (surface_area * h_conv). For natural convection, h_conv = 7-12 W/(m^2*K). Alternatively, use the core manufacturer's thermal resistance curve: Rth = 40 to 60 K/W for small cores (E25), 15-25 K/W for medium (E42), down to 5-10 K/W for large (E65).
3. Check that core temperature stays below the Curie temperature (typically 200-220C for MnZn ferrite) with adequate margin. Operating temperature should stay below 100-120C for standard grades. High-temperature grades (e.g., 3C97) allow operation to 150C.
4. For Litz wire, verify that the temperature rise does not cause strand-to-strand short circuits due to insulation breakdown. Polyurethane insulation (Grade 1): 130C. Polyester-imide (Grade 2): 155C. Polyamide-imide (Grade 3): 200C.
5. Compile the complete prototype specification. Include: core part number, bobbin or former, wire specification (type, AWG, number of strands for Litz), turns per winding, winding direction and order, insulation tape layers and voltage rating, gap spacer material and thickness, assembly notes (glue, banding, mounting). Record expected performance: L at 0A and at Ipk, Rdc, estimated Rac at fsw, core loss, total loss, temperature rise.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
