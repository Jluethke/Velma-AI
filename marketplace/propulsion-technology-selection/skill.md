# Propulsion Technology Selection

Select the propulsion technology by trading specific impulse against thrust and power.

## Inputs

- `delta_v_budget`: Total delta-v that favors high specific impulse when large.
- `thrust_requirements`: Thrust floor that may rule out low-thrust options.
- `power_available`: Electrical power the bus can give to electric propulsion.

## Outputs

- `technology_selection`: Chosen propulsion type.
- `isp_thrust_tradeoff`: Specific-impulse versus thrust and power trade.

## Process

1. Cold gas gives a specific impulse of 50 to 70 s and is simple and clean, suited to small momentum and proximity tasks.
2. Monopropellant hydrazine gives 220 to 235 s with simple feed and fast response, common for stationkeeping and small burns.
3. Bipropellant (for example monomethylhydrazine with nitrogen tetroxide) gives 300 to 320 s for larger orbit-insertion burns.
4. Hall-effect and gridded-ion electric propulsion give 1500 to 2000 s and 3000 to 4000 s respectively, at milli-newton thrust and kilowatt power, trading time for much less propellant.
5. Select by total impulse and schedule: electric propulsion saves large propellant mass when power and transfer time allow, chemical wins when thrust and quick maneuvers dominate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
