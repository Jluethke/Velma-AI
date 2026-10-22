# Active Thermal Control Design

Size heaters, heat pipes, louvers, or fluid loops to hold temperatures when passive control is insufficient.

## Inputs

- `heat_balance`: Residual heat loads passive design cannot handle.
- `temperature_requirements`: Setpoints and deadbands for active control.
- `conductive_paths`: Thermal network the active elements tie into.

## Outputs

- `heater_sizing`: Heater power and control setpoints by zone.
- `heat_pipe_design`: Heat-pipe transport capacity and routing.
- `active_control_plan`: Louver and fluid-loop use for variable loads.

## Process

1. Size each heater to cover the cold-case heat loss plus margin: battery and propellant-line heaters are common; add at least 25 percent heater power margin per typical thermal guidelines.
2. Control heaters by thermostat or software with a deadband (for example turn on at 5 C, off at 10 C) and verify duty cycle stays below about 80 percent.
3. Use constant-conductance ammonia heat pipes to move tens of watts along a meter-scale path with only a few degrees of gradient; variable-conductance pipes self-regulate against load swings.
4. Add louvers for highly variable loads: an open-to-closed turndown ratio near 6 to 1 lets effective emittance track dissipation without heater power.
5. For loads above about 1 kW use a pumped single-phase or two-phase fluid loop to carry heat from avionics to body-mounted or deployable radiators.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
