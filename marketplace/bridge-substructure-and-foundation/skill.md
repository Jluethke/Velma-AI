# Bridge Substructure And Foundation

Design bridge piers, abutments, and foundations for all loading including seismic.

## Inputs

- `member-forces`: Superstructure reactions at bearing locations
- `site-conditions`: Foundation soil/rock properties and seismic hazard

## Outputs

- `substructure-design`: Pier cap, columns, abutment walls, and wing walls with reinforcement
- `foundation-design`: Foundation type, size, depth, and reinforcement with bearing capacity and settlement checks

## Process

1. Design pier caps. Multi-column piers: inverted-T or rectangular cap beam. Straddle bents for wide crossings. Cap width sufficient for bearing seats with edge distance. Design for combined bending and shear from girder reactions. Check punching shear at concentrated load points.
2. Design pier columns. Slenderness check: if kl/r > 22, include second-order effects (moment magnification or P-delta analysis). Interaction diagram design: plot (Pu, Mu) for all load combinations and verify points are inside the interaction curve. Minimum reinforcement 1% of Ag, maximum 8% (but 4% practical limit for constructability). Confinement reinforcement per seismic zone.
3. Design abutments. Cantilever retaining wall type or integral abutment (eliminates expansion joints). For conventional: active earth pressure on stem (Ka * gamma * H * cos(delta)), at-rest if rigidly connected to deck. Check sliding (Fresist/Fslide > 1.5), overturning (Mr/Mo > 2.0 for service), and bearing pressure. Include live load surcharge equivalent to 0.6 m of soil behind wall.
4. Design foundations. Spread footings: bearing capacity from Terzaghi or Meyerhof (include shape, depth, inclination factors). Driven piles: static capacity from alpha method (clay) or beta method (sand), or from CPT direct methods (Eslami-Fellenius, LCPC). Drilled shafts: side resistance and base resistance per FHWA GEC 10. Group effects: efficiency factor for closely spaced piles.
5. Seismic design of substructure. Determine seismic hazard (AASHTO maps for 1000-year return period). Classify site (Site Class A through F from Vs30). Calculate elastic seismic forces. For SDC B, C: force-based design with R factors. For SDC D: displacement-based design using pushover analysis. Detail plastic hinges in columns with confining reinforcement to achieve target drift capacity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
