# Chiplet Thermal Analysis

Analyze thermal behavior of a multi-die package, identify hot spots from overlapping heat sources, and design the thermal solution.

## Inputs

- `interface-selection`: Chiplet links and integration technology
- `integration-technology`: Interposer, bridge, fan-out, or direct bonding
- `power-map`: Power dissipation per chiplet and per functional block within each chiplet

## Outputs

- `thermal-model`: Thermal resistance network for the multi-die assembly with junction temperatures per chiplet
- `thermal-solution`: Heat spreader, TIM, and heat sink specification to meet junction temperature targets

## Process

1. Build a thermal resistance network from each chiplet junction through die, die attach (TIM1), interposer or substrate, solder balls, and board (bottom path) and through TIM2 and heat sink (top path).
2. For stacked dies or interposer-mounted dies, calculate inter-die thermal resistance. A silicon interposer conducts heat laterally but also creates a thermal barrier between die and heat sink.
3. Identify hot spot interactions: when two high-power chiplets are adjacent on an interposer, their thermal fields overlap. Model using superposition of point heat sources or FEA.
4. Size the heat spreader (copper or vapor chamber) to spread heat from the multi-die footprint. Calculate the spreading resistance from the concentrated die area to the larger heat sink base.
5. Verify junction temperatures for each chiplet under worst-case workload (all chiplets at maximum power simultaneously). If any chiplet exceeds its Tj_max, redesign: increase heat sink, improve TIM, or throttle workload.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
