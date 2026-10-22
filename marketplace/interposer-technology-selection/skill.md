# Interposer Technology Selection

Select between silicon interposer, organic interposer, and EMIB bridge based on die-to-die requirements and cost targets.

## Inputs

- `die-to-die-requirements`: Bandwidth, latency, bump pitch, and number of die-to-die connections
- `die-count-and-size`: Number of chiplets, their dimensions, and total assembly footprint
- `cost-target`: Target packaging cost per unit

## Outputs

- `interposer-technology`: Selected technology (silicon interposer, organic interposer, EMIB, or hybrid) with rationale
- `key-design-parameters`: TSV pitch, RDL line/space, interposer thickness, and process node for the interposer

## Process

1. Silicon interposer: supports bump pitch down to 25um (micro-bump) or 10um (hybrid bond), 4-6 RDL layers at 0.4/0.4um line/space, TSV diameter 5-10um at 50um pitch. Cost: $3-8 per cm2 depending on RDL complexity.
2. Organic interposer: bump pitch limited to 80-130um, RDL line/space 2/2um to 8/8um, no TSVs (vias through organic at 50-100um diameter). Cost: $0.5-2 per cm2. Use when die-to-die pitch is relaxed.
3. EMIB bridge: small silicon bridge embedded in organic substrate, connecting adjacent dies. 55um bump pitch on bridge, organic substrate pitch everywhere else. Cost between organic-only and full silicon interposer.
4. Select based on the tightest die-to-die requirement. If any link needs sub-55um pitch or sub-2ns latency, silicon interposer or hybrid bond is required.
5. Size the interposer: die placement floor plan with minimum spacing between dies (typically 100-500um for assembly tolerance), total interposer area, and reticle limit (about 26x33mm for single-shot lithography; larger requires stitching).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
