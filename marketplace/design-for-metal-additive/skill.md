# Design For Metal Additive

Reshape the part for additive constraints: overhang angle, support strategy, orientation, minimum wall, and residual stress management.

## Inputs

- `process-selection`: The chosen additive process and its resolution and surface limits
- `functional-geometry`: The functional surfaces, load paths, fits, and datum features the part must deliver

## Outputs

- `am-ready-geometry`: The redesigned geometry with self-supporting features, machining stock on critical surfaces, and build orientation fixed
- `support-strategy`: The support plan: where supports go, their type, how they are removed, and the orientation that minimizes support on functional surfaces

## Process

1. Apply the overhang rule. Surfaces below roughly 45 degrees from horizontal need support in laser powder bed fusion; EBM tolerates shallower angles due to the sintered powder cake. Chamfer or fillet horizontal overhangs to self-supporting angles, and convert flat roofs of internal channels to diamond or teardrop cross-sections that self-support.
2. Fix build orientation to trade surface finish, support, and anisotropy together. The build direction (Z) is the weakest and roughest; downskin surfaces are rougher than upskin. Orient so that critical fits and fatigue-critical surfaces are up-facing or vertical, and so the part height (hence machine time) is reasonable.
3. Add machining stock only where it is needed. Leave 0.5 to 1.0 mm of stock on bearing bores, sealing faces, and datum surfaces for post-machining, and leave as-built surfaces everywhere tolerance allows. Blanket machining stock inflates cost and defeats the point of additive.
4. Keep walls and holes inside printable limits. Minimum reliable wall is about 0.4 to 0.5 mm for laser powder bed; vertical holes print round down to about 0.5 mm, horizontal holes need teardrop shaping below about 8 mm diameter to stay round without support, and small holes often print best as pilot holes to be drilled.
5. Manage residual stress in the geometry. Thick-to-thin transitions, large unsupported flat areas, and sharp internal corners concentrate the thermal gradients that warp parts off the plate. Add fillets, break up large flats, and plan for a stress-relief cycle on the build plate before any support or part removal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
