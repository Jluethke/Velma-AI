# Bridge Type Selection

Select the optimal bridge type based on span, site conditions, constructability, and cost.

## Inputs

- `crossing-requirements`: Required clear spans, vertical clearances, roadway width, design speed, and loading
- `site-conditions`: Foundation conditions, navigational clearance, environmental constraints, access for construction

## Outputs

- `selected-bridge-type`: Bridge type with span arrangement, structural system, material, and construction method
- `preliminary-dimensions`: Approximate girder depths, pier heights, and foundation types

## Process

1. Match span range to bridge type. Up to 12 m: precast slab or box culvert. 12 to 40 m: precast prestressed girders (I, bulb-T, or box). 40 to 80 m: steel plate girders, segmental concrete box, or post-tensioned cast-in-place. 80 to 250 m: cable-stayed. Above 250 m to 2000 m: suspension. These ranges overlap; economy depends on local construction capability and material costs.
2. Select girder depth from span-to-depth ratios. Steel composite: L/25 for simple span, L/30 for continuous. Prestressed concrete: L/18 to L/22. Post-tensioned box: L/18 simple, L/20 to L/22 continuous. Cable-stayed: L/45 to L/60 for main span. These set preliminary section sizes for cost comparison.
3. Evaluate construction methods. Precast: crane erection (limited by crane reach and capacity, typically up to 60 to 80 ton girders), launched girders for viaducts. Segmental: balanced cantilever (no falsework below), span-by-span erection. Steel: erection by crane or launched. Site access and traffic staging often drive the choice more than structural efficiency.
4. Assess foundation requirements. Spread footings in rock or dense soil. Driven piles in soft ground (H-piles, pipe piles, precast concrete). Drilled shafts for high loads or hard driving conditions. Estimate foundation costs for each bridge type option.
5. Compare alternatives. Construct a cost comparison matrix: superstructure material and fabrication, erection, substructure, foundations, bearings and joints, maintenance over 75-year design life. Include non-cost factors: aesthetics (community input), constructability, schedule, environmental impact, resilience. Select the type with lowest life-cycle cost meeting all constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
