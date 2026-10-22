# Nuclear Thermal Hydraulic Design

Design the reactor core thermal-hydraulics: coolant flow distribution, hot channel analysis, departure from nucleate boiling margin, and decay heat removal.

## Inputs

- `fuel-rod-design`: Rod geometry and maximum linear heat rate
- `fuel-performance-limits`: Temperature and strain limits for thermal margin calculation

## Outputs

- `thermal-hydraulic-design`: Core flow rate, inlet/outlet temperatures, pressure drop, and hot channel factors
- `dnb-margin-analysis`: Minimum DNBR and its location, with hot channel factor components (engineering, nuclear, flow)

## Process

1. Establish the core thermal parameters. For a PWR: inlet temperature around 290C, outlet temperature around 325C, system pressure 15.5 MPa, and coolant flow rate sized to achieve the target temperature rise across the core. Core delta-T = Qcore / (m_dot x Cp), where Qcore is total thermal power and Cp is the specific heat of water at operating conditions.
2. Calculate the hot channel factors. The nuclear hot channel factor F_q (ratio of peak to average linear heat rate) typically ranges from 2.0-2.5 including axial and radial peaking. The enthalpy rise hot channel factor F_delta_H (ratio of peak to average channel enthalpy rise) is typically 1.4-1.7. These are decomposed into nuclear factors (from the power distribution) and engineering factors (from manufacturing tolerances).
3. Perform the DNB analysis. Departure from nucleate boiling occurs when a vapor film blankets the fuel rod surface, causing a rapid temperature excursion. The DNBR (departure from nucleate boiling ratio) is the ratio of the predicted critical heat flux (from a CHF correlation like W-3 or WRB-2) to the actual local heat flux. Minimum DNBR must exceed the design limit (typically 1.30 for the W-3 correlation) at the most limiting location in the core.
4. Analyze the core pressure drop. Components: lower grid plate, fuel assembly inlet nozzle, spacer grids (8-10 per assembly), fuel rods (friction and form losses), upper nozzle, and upper grid plate. Total core delta-P is typically 150-200 kPa. The pressure drop distribution must ensure adequate flow to the hottest fuel assembly without flow instability.
5. Design the decay heat removal system. After shutdown, the fuel continues to generate heat from fission product decay: approximately 6% of full power at shutdown, decaying to 1.5% after one hour and 0.4% after one day. The residual heat removal system must remove this heat using redundant, safety-grade pumps and heat exchangers. The ultimate heat sink (river, cooling tower, or passive air) must be sized for decay heat removal under the most adverse environmental conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
