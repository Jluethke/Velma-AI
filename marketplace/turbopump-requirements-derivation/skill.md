# Turbopump Requirements Derivation

Derive turbopump performance requirements from engine cycle and operating conditions.

## Inputs

- `chamber-pressure-target-pa`: Engine chamber pressure
- `propellant-combination`: Oxidizer and fuel with density and flow rate
- `engine-cycle-type`: Gas generator, staged combustion, expander, or electric pump

## Outputs

- `pump-head-rise-requirement`: Required pressure rise per pump in Pa, from chamber pressure plus injector drop plus line losses
- `pump-flow-rate`: Volume flow rate per pump in m^3/s
- `turbine-power-requirement`: Shaft power needed to drive both pumps
- `npsh-available`: Net positive suction head available from tank pressure and propellant head

## Process

1. The pump must raise propellant pressure from tank pressure (typically 150-500 kPa) to chamber pressure plus injector pressure drop plus cooling jacket drop plus line losses. For a 20 MPa chamber: 20 MPa + 5 MPa injector drop + 3 MPa cooling + 2 MPa line losses = 30 MPa pump discharge.
2. Calculate required pump power: P = (delta_P * Q) / eta_pump, where Q is volume flow rate and eta_pump is pump efficiency (typically 65-80% for rocket turbopumps). A LOX pump for a large engine needs 10-30 MW of shaft power.
3. For gas generator cycle: the turbine exhaust is dumped overboard (Isp loss of 2-5%). Turbine inlet temperature is limited to 700-900 K to avoid exotic turbine materials. This limits chamber pressure to about 10-15 MPa. Simple, reliable (Merlin, F-1, RD-107).
4. For staged combustion cycle: turbine exhaust is injected into the main chamber. All propellant contributes to thrust (no Isp loss). Turbine can run at higher pressure than main chamber. Enables chamber pressures of 20-30 MPa (SSME, RD-180, Raptor). More complex, higher pressures throughout.
5. For expander cycle: turbine is driven by fuel heated in the regenerative cooling jacket. No separate combustion. Limited by available heat flux, which limits thrust to about 100 kN for hydrogen expanders (RL-10, Vinci). Very reliable, simple, but low thrust.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
