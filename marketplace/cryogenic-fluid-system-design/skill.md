# Cryogenic Fluid System Design

Design the cryogenic fluid storage, transfer, and distribution system: tank insulation, valve selection, and boil-off management.

## Inputs

- `fluid-type`: Cryogenic fluid (LH2, LOX, LN2, LHe, LCH4) with required storage volume and duration
- `operating-environment`: Ground (ambient heat leak) or space (solar, albedo, earth IR heating)
- `flow-requirements`: Mass flow rate, pressure, and temperature at delivery point

## Outputs

- `tank-and-insulation-design`: Tank geometry, insulation type and thickness, and predicted boil-off rate
- `fluid-system-schematic`: Piping, valves, vents, and pressurization system layout
- `thermal-performance`: Heat leak budget and storage duration before exceeding temperature or pressure limits

## Process

1. Characterize the cryogenic fluid properties at storage conditions: LH2 at 20K (density 70 kg/m^3, boiling point 20.3K at 1 atm, heat of vaporization 446 kJ/kg, specific heat 9.7 kJ/kg-K). LOX at 90K (density 1140 kg/m^3, boiling point 90.2K). LCH4 at 111K (density 422 kg/m^3). The huge density difference between LH2 and LOX drives very different tank sizes.
2. Design insulation: for ground systems, use vacuum-jacketed piping with multilayer insulation (MLI: alternating layers of aluminized Mylar and Dacron net, effective thermal conductivity ~ 0.05 mW/m-K in vacuum) or spray-on polyurethane foam (k ~ 20 mW/m-K, simpler but much less effective). For launch vehicle tanks, spray-on foam (SOFI: spray-on foam insulation) on the tank exterior is standard (Space Shuttle ET heritage). For in-space, MLI blankets with 20 to 60 layers.
3. Calculate boil-off rate: Q_leak = (T_ambient - T_fluid) / R_total where R_total includes insulation, support structure conduction, penetration conduction (fill/drain lines, instrumentation), and radiation. Boil-off rate = Q_leak / h_fg. For LH2 with good MLI in LEO, boil-off is typically 0.1 to 0.5% per day. Without insulation, LH2 in LEO boils off in hours.
4. Design pressurization system: autogenous pressurization (warm the cryogen itself: gaseous hydrogen for LH2 tank, gaseous oxygen for LOX tank) is preferred for simplicity but requires heat exchangers. Helium pressurization (inert, does not condense) is used when autogenous is not practical. Calculate pressurant mass: pV = nRT applied to the ullage volume as liquid is expelled, accounting for heat transfer between the warm pressurant gas and the cold tank walls (collapse factor: the gas cools and contracts, requiring more pressurant than the ideal gas calculation).
5. Select cryogenic valves: material compatibility is critical (many metals become brittle below their ductile-to-brittle transition temperature; use austenitic stainless steel, Inconel, or aluminum alloys). Valve seats must seal at cryogenic temperatures despite differential thermal contraction. Ball valves are common for on/off (fast actuation); globe valves for throttling. Bellows-sealed valves eliminate packing leaks. All joints must accommodate thermal contraction (flex hoses, expansion bellows, slip joints).
6. Design the vent system: as heat leaks into the tank, the liquid warms and the pressure rises. A pressure relief valve (set at the maximum allowable working pressure) vents excess boil-off gas. In microgravity, the liquid and gas are not separated by gravity: a thermodynamic vent system (TVS) uses a Joule-Thomson valve to expand liquid to a lower pressure (and temperature), routing the cold two-phase fluid through a heat exchanger in the tank to intercept heat leak and vent only gas.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
