# Turbine Design And Power Balance

Design the turbine to extract required shaft power from the drive gas within allowable temperature and speed limits.

## Inputs

- `turbine-power-requirement`: Required shaft power in watts
- `engine-cycle-type`: Determines turbine inlet conditions and exhaust disposition
- `shaft-speed`: Pump-driven shaft speed requirement

## Outputs

- `turbine-design`: Turbine configuration (axial impulse, reaction, radial), stage count, blade geometry
- `turbine-inlet-conditions`: Temperature, pressure, and flow rate of drive gas
- `power-balance`: Closed power balance: turbine power = pump power at operating point
- `turbine-efficiency`: Expected turbine efficiency and off-design characteristics

## Process

1. For gas generator cycle, the turbine sees fuel-rich gas at 700-900 K and moderate pressure ratio (2-4:1). An axial impulse turbine (velocity-compounded Curtis stage) handles the full expansion in one or two stages. Efficiency is 40-60% but the turbine is compact.
2. For staged combustion, the turbine sees very high pressure but low pressure ratio (1.2-1.8:1 since exhaust goes to the high-pressure combustion chamber). This requires a reaction turbine (often two stages) operating at 50-70% efficiency. Turbine inlet temperature can be 700-1100 K depending on material.
3. The power balance must close: turbine power output = oxidizer pump power + fuel pump power + mechanical losses. For a gas generator cycle, increasing GG flow increases turbine power but reduces overall Isp. The operating point is where the pump and turbine power curves intersect.
4. Turbine blade material selection: single-crystal nickel superalloys (MAR-M246, PWA1480) for highest temperature capability. Uncooled turbine blades limit inlet temperature to about 900 K for Inconel, 1100 K for single-crystal. Cooled blades (as in SSME) allow higher temperatures but add complexity.
5. Verify rotordynamic stability: the turbopump shaft runs at 10,000-100,000 rpm in a fluid environment. Critical speeds must not coincide with operating speed. Bearing stiffness and damping (often from the fluid itself in hydrostatic bearings) determine the critical speed map.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
