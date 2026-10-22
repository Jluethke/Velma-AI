# Battery And Power Bus Design

Select and size the battery for eclipse and peak loads, design the power bus regulation topology, and perform the end-of-life analysis including cycle life and capacity fade.

## Inputs

- `solar-array-design`: Array configuration and voltage characteristics
- `eol-power-analysis`: EOL power margins

## Outputs

- `battery-design`: Cell chemistry, capacity, series/parallel configuration, mass, charge/discharge protocol
- `power-bus-architecture`: Bus topology (DET/PPT/MPPT), voltage, regulation scheme, fault protection

## Process

1. Select battery chemistry. Li-ion is standard for modern spacecraft: specific energy 150-200 Wh/kg at cell level. For missions requiring extreme cycle life (LEO with 15 eclipses per day), select cells rated for >30,000 cycles at the intended depth of discharge. LiFePO4 offers longer cycle life at lower specific energy.
2. Size the battery capacity: C_batt = E_eclipse / (DOD_max * V_bus * eta_discharge). For LEO missions, DOD is typically limited to 20-30% for long life (>5 years). For GEO with two eclipse seasons per year, DOD can be 60-80%. Verify the cell discharge rate (C-rate) during peak load does not exceed the cell rating.
3. Design the power bus topology. Direct Energy Transfer (DET) is simplest: excess solar power is shunted. Peak Power Tracking (PPT) uses a DC-DC converter to operate the array at peak power point, more efficient for varying conditions. Maximum Power Point Tracking (MPPT) is the most efficient variant. For most spacecraft above 1 kW, a regulated 28V or unregulated 22-34V bus is standard; larger spacecraft use 50V or 100V.
4. Design fault protection. Include battery charge control (constant current then constant voltage), over-discharge protection with load shedding priorities, bus under-voltage disconnect for non-essential loads, and solar array string isolation in case of short circuits. Size the bus capacitance for transient load steps.
5. Perform the end-of-life analysis. Model battery capacity fade from calendar aging (storage temperature) and cycle aging (DOD, temperature, C-rate). Use the manufacturer's capacity retention curve or an empirical model. Verify that at EOL (reduced array output plus faded battery), the power system still meets the minimum required power in the worst-case eclipse season.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
