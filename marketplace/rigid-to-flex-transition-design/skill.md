# Rigid To Flex Transition Design

Design the transition zone where rigid and flex sections meet, preventing stress concentration and delamination.

## Inputs

- `flex-stackup`: Flex region layer stack
- `minimum-bend-radius`: Bend radius driving transition zone length
- `rigid-stackup`: Rigid section layer stack (more layers than flex)

## Outputs

- `transition-zone-design`: Geometry of the rigid-to-flex transition: taper angle, stiffener overlap, strain relief features
- `copper-routing-in-transition`: How traces are routed through the transition: staggered via placement, tear-stop features, keepout zones
- `stiffener-specification`: Stiffener material, thickness, and adhesive for areas requiring mechanical support in the flex region

## Process

1. The transition zone is the highest-stress area in a rigid-flex board. The abrupt change from rigid (thick, stiff) to flex (thin, flexible) creates a stress concentration at the boundary. All cracking failures in rigid-flex start here.
2. Design the transition with a gradual taper: the rigid section should taper toward the flex over a distance of at least 2.5 mm (IPC-2223 minimum). The taper can be achieved by stepping the rigid layers back from the flex boundary, so each layer ends at a different point.
3. Add tear-stop features: anchor the flex layers to the rigid section with tear-stop vias or slots at the transition boundary. These prevent the flex material from tearing or delaminating at the stress concentration. Place a row of vias 0.5 mm inside the rigid section, parallel to the flex boundary.
4. Route traces through the transition zone perpendicular to the flex boundary (not at an angle). Avoid vias within 1 mm of the transition boundary on the flex side. Stagger via locations (not in a straight line across the transition) to avoid creating a perforation line that could crack. In the flex region adjacent to the transition, do not place components for at least 2 mm to allow the flex to bend freely.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
