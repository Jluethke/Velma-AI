# Solar Array Sizing And Design

Size the solar array to meet the power budget, accounting for cell efficiency, packing factor, temperature, radiation degradation, off-pointing losses, and end-of-life performance.

## Inputs

- `power-budget`: Power budget with required array output
- `energy-storage-requirement`: Eclipse energy needs

## Outputs

- `solar-array-design`: Array area, cell type, string/parallel configuration, deployed geometry, mass estimate
- `eol-power-analysis`: End-of-life power output accounting for all degradation factors

## Process

1. Select the solar cell technology. Triple-junction GaAs (InGaP/GaAs/Ge) gives 30-32% BOL efficiency. Newer four-junction and inverted metamorphic cells reach 33-35%. Calculate the cell output power per unit area: P_cell = eta_cell * S * cos(theta), where S is the solar constant (1361 W/m^2) and theta is the sun angle.
2. Apply degradation factors to get from BOL to EOL power. Radiation degradation: use the equivalent 1 MeV electron fluence from the orbit radiation environment and the cell's remaining factor curve (typically 0.85-0.95 for 5-year LEO, 0.70-0.85 for 15-year GEO). Temperature coefficient: GaAs loses about 0.07-0.10% per degree C above 28C. UV degradation of coverglass: 1-2% over life. Micrometeoroid loss: 0.5-1% per year for large arrays.
3. Calculate the required array area: A = P_required / (P_cell_per_area * packing_factor * cos_losses * harness_losses * degradation_product), where packing factor is typically 0.85-0.90 for body-mounted and 0.90-0.95 for deployed panels.
4. Design the string architecture. Series strings set the bus voltage; parallel strings provide the current. Each string has cells in series to exceed the bus voltage plus diode and harness drops under worst-case (hot) conditions. Calculate the number of strings needed to meet EOL current requirements.
5. Determine the array geometry and deployment mechanism. Body-mounted arrays are simple but area-limited. Deployed rigid panels use hinged deployments. Flexible roll-out arrays save mass for large arrays. Calculate the array mass from the specific power (W/kg) of the selected technology: 40-80 W/kg for rigid panels, 100-200 W/kg for flexible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
