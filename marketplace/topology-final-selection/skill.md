# Topology Final Selection

Make the final topology decision by weighing component stress, dynamic limitations, thermal feasibility, cost, and size against requirements. Produce a topology specification document.

## Inputs

- `plant-transfer-function`: Small-signal model of candidate topology
- `bandwidth-limit`: Maximum control bandwidth achievable

## Outputs

- `selected-topology`: Final topology choice with complete rationale including stress, dynamics, cost, and size trade-offs
- `topology-specification`: Complete topology specification: schematic block diagram, key component ratings, switching frequency, expected efficiency, control mode, and critical design parameters

## Process

1. Score each remaining candidate on five axes: semiconductor cost (proportional to VA rating), magnetics size (proportional to energy storage), capacitor stress (proportional to RMS ripple current), control complexity (number of control loops, need for slope compensation), and thermal challenge (total power dissipation at worst case).
2. Check that the achievable bandwidth meets transient response requirements. If load steps require faster response than the RHP zero allows, either select a topology without RHP zero or move to current-mode control. If neither works, add output capacitance to slow the voltage excursion during transient.
3. Estimate efficiency at full load and 10% load. Switch conduction loss: Pcond = Irms^2 * Rds(on). Switch loss: Psw = 0.5 * Vds * Id * (tr + tf) * fsw. Inductor loss: core + copper. Capacitor ESR loss. If efficiency falls below target, consider lower fsw (larger magnetics but lower switching loss) or better switches (GaN, SiC).
4. Calculate approximate board area from component sizes. Inductor area dominates at low frequency, capacitor count dominates when high ripple current requires paralleling.
5. Write the topology specification with block-level schematic, all key parameters, and the numerical justification for each design decision. This is the input to detailed schematic design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
