# Via In Pad And Advanced Via Rules

Apply via-in-pad design rules for BGA and fine-pitch components, including fill requirements, cap plating, and the cost implications of each via technology.

## Inputs

- `component-library`: BGA and fine-pitch components requiring via-in-pad
- `stackup-cross-section`: Stackup for via depth and drilling capability
- `assembly-process`: Reflow profile and solder paste considerations

## Outputs

- `via-in-pad-specification`: For each BGA: via type (through, blind, microvia), fill method (copper fill, non-conductive fill, conductive fill), and cap plating requirement
- `via-technology-comparison`: Cost and capability comparison: through-hole vs blind vs microvia vs any-layer HDI, with the pitch at which each technology becomes necessary
- `drill-and-aspect-ratio-verification`: Drill size, aspect ratio (depth/diameter), and fabricator capability check for each via type

## Process

1. Determine when via-in-pad is required: for BGAs with pitch below 0.8 mm, routing between pads is not possible, and vias must be placed directly in the BGA pads. These vias must be filled and planarized so the pad surface is flat for solder paste printing. An unfilled via-in-pad will wick solder into the via during reflow, causing an open joint.
2. Choose the via fill method: non-conductive epoxy fill + copper cap plate (most common, cost-effective) provides a flat, solderable surface. Conductive fill (copper or silver-filled epoxy) provides a thermal path through the via and a flat surface. Solid copper fill (copper plating to fill the entire via) provides the best thermal and electrical path but is most expensive and limited to small via diameters.
3. Check aspect ratios: mechanical drill vias have a maximum reliable aspect ratio of 10:1 (e.g., 10 mil drill in a 100 mil board). Laser-drilled microvias are limited to about 1:1 aspect ratio (4 mil drill in 4 mil dielectric). For fine-pitch BGAs (0.4 mm pitch and below), microvias on the first layer pair are typically required, connecting to deeper layers through stacked or staggered microvias.
4. Calculate the cost impact: each additional via technology step adds cost. Through-hole vias with standard drill are baseline. Blind vias add one to two sequential lamination steps. Microvias add laser drilling. Stacked microvias add copper fill between laser drill steps. Any-layer HDI (every layer has microvias) is the most expensive but allows maximum routing density. Choose the minimum technology that meets the routing density requirement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
