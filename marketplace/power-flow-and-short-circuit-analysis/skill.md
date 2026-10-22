# Power Flow And Short Circuit Analysis

Perform power flow and short circuit studies to verify the project's impact on the grid and ensure equipment ratings are adequate.

## Inputs

- `study-results-summary`: Utility study findings and identified constraints
- `interconnection-risks`: Specific risks requiring detailed engineering analysis

## Outputs

- `power-flow-results`: Voltage profile, thermal loading, and reactive power requirements at the POI under normal and contingency conditions
- `short-circuit-analysis`: Three-phase and single-line-to-ground fault current contribution from the project, and total fault duty at the POI

## Process

1. Build or obtain the power system model. Use PSS/E, PSCAD, or PowerWorld with the utility's base case. Add the project's generator model (for inverter-based resources, use the WECC second-generation or manufacturer-specific models). Include all other projects in the queue cluster.
2. Run power flow for the key dispatch scenarios: peak load with project at full output, light load with project at full output, and peak load with project offline. Check thermal loading on all circuits between the POI and the first strong bus. Verify voltage at the POI stays within ANSI C84.1 Range A (0.95-1.05 pu) under all scenarios.
3. Analyze contingency cases (N-1 at minimum). Simulate the loss of each transmission element between the POI and the bulk system. Verify that the project can ride through the contingency without voltage collapse and that remaining elements do not exceed emergency thermal ratings.
4. Calculate short circuit contribution. Inverter-based resources contribute 1.1-1.2 times rated current during a fault (limited by inverter current capability), unlike synchronous machines that contribute 5-10 times rated current. Model the inverter's fault current response per IEEE 2800. Verify that total fault duty at the POI does not exceed the interrupting rating of existing breakers.
5. Determine reactive power requirements. IEEE 1547-2018 Category III requires the project to provide dynamic reactive power support. Size the inverter's reactive power capability to maintain power factor at the POI as specified in the interconnection agreement (typically +/- 0.95 or better). If the inverter cannot meet the requirement alone, evaluate static VAR compensators or synchronous condensers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
