# Pack Thermal Management Design

Design the pack-level thermal management system to keep cells within their operating temperature range, using thermal modeling, cooling path design, and heating for cold-start conditions.

## Inputs

- `protection-circuit-schematic`: Protection circuits with temperature sensor placement
- `protection-thresholds`: Temperature thresholds for warning and shutdown

## Outputs

- `thermal-management-design`: Cooling/heating system: air-cooled (fan sizing, duct design) or liquid-cooled (cold plate, coolant flow rate, pump sizing), plus PTC heater for cold-start pre-heating
- `temperature-uniformity-analysis`: Predicted temperature variation across the pack: maximum cell-to-cell temperature difference (target less than 5C to minimize aging mismatch), hot spot identification, and thermal runaway containment measures

## Process

1. Calculate the heat generation rate. Each cell dissipates: Pcell = I^2 * Rint + Pside_reactions. Rint is the total internal resistance at the operating SOC and temperature. At 1C discharge for a 50Ah cell with 2 milliohm internal resistance: Pcell = 50^2 * 0.002 = 5W. For the full pack: Ptotal = N_cells * Pcell.
2. Air cooling design. Forced air: size the fan for the required airflow. The temperature rise of the cooling air: delta_T_air = Ptotal / (m_dot * cp_air). For 200W total dissipation and 5C air temperature rise: m_dot = 200 / (5 * 1005) = 0.04 kg/s = 33 CFM. Duct the air across the cells for uniform cooling. The cells nearest the air inlet run coolest; stagger the airflow path to reduce the temperature gradient.
3. Liquid cooling design. A cold plate under or between cells with coolant (water-glycol) flowing through channels. The thermal resistance from cell surface to coolant: Rth = 1/(h*A) where h depends on flow rate and channel geometry. Size the pump for the pressure drop through the cold plate. Typical: 5-10 LPM for a 10kWh pack. Liquid cooling provides much lower temperature gradients (under 3C across the pack) compared to air (5-10C).
4. Cold-start heating. Below 0C, charge current must be limited. A PTC heater (self-regulating, cannot overheat) warms the cells before charging. Size: the heater must bring the coldest cell above 5C within the target time. Energy: Q = m_cells * cp_cell * delta_T. For a 10kg pack of cells (cp ~ 1000 J/(kg*K)) heated 20C: Q = 200kJ. At 500W heater power: 400 seconds (6.7 minutes).
5. Thermal runaway containment. If one cell enters thermal runaway (internal short, venting, fire), the design must prevent propagation to adjacent cells. Measures: thermal barriers (aerogel, mica) between cells, vent paths to direct hot gases away from other cells, cell spacing to limit radiative heat transfer, and fuses or disconnect switches to isolate the faulted cell. Test per UL 2580 or IEC 62619 to verify no propagation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
