# Nuclear Reactivity Control Systems

Design the reactivity control systems: control rods, soluble boron, and burnable absorbers, ensuring adequate shutdown margin and power distribution control.

## Inputs

- `thermal-hydraulic-design`: Core parameters that determine moderator temperature feedback
- `dnb-margin-analysis`: Power distribution limits that constrain control rod patterns

## Outputs

- `reactivity-control-design`: Control rod bank layout, boron letdown curve, and burnable absorber loading pattern
- `shutdown-margin-analysis`: Shutdown margin verification with the most reactive rod stuck out, including temperature defects and xenon effects

## Process

1. Design the control rod system. Rod cluster control assemblies (RCCAs) use 24 Ag-In-Cd or B4C absorber rodlets per cluster, inserted into guide tubes in the fuel assembly. Divide rods into shutdown banks (for reactor trip) and control banks (for power maneuvering). The worth of each bank depends on the neutron flux at the rod tip locations.
2. Size the soluble boron concentration. At beginning of cycle, soluble boron (boric acid in the coolant) holds down the excess reactivity that control rods cannot economically suppress. Typical BOC boron concentration is 1000-1600 ppm. The boron letdown curve (concentration vs burnup) tracks the reactivity decrease as fuel depletes. The moderator temperature coefficient must remain negative, which limits maximum boron concentration (boron makes the MTC less negative).
3. Design the burnable absorber loading. Integral fuel burnable absorbers (IFBA: ZrB2 coating on fuel pellets) or gadolinia (Gd2O3 mixed with UO2) deplete over the cycle, releasing reactivity to offset fuel depletion. This reduces the required soluble boron concentration (improving MTC) and flattens the radial power distribution. The absorber loading pattern is optimized cycle by cycle using a core design code.
4. Verify shutdown margin. With the reactor tripped and the most reactive control rod stuck fully withdrawn (single failure criterion), the core must remain subcritical by at least 1.3% delta_k/k. This must hold at the most reactive condition in the cycle, accounting for the moderator temperature defect (reactivity increase as coolant cools from operating to cold shutdown temperature) and xenon decay (reactivity increase as Xe-135 decays after shutdown).
5. Analyze power distribution control. Control rod insertion limits (rod insertion limits or RILs) prevent excessive axial peaking that could violate DNB limits. The operator maintains the axial offset (difference between top and bottom half power) within a target band using control bank stepping. Load-follow operations require coordinating rod movement, boron dilution/boration, and xenon transient management.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
