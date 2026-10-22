# Pump And Valve Selection

Select pumps and control valves for the piping system.

## Inputs

- `pipe-schedule`: Pipe sizes and pressure drops
- `process-conditions`: Flow rates and fluid properties
- `pressure-drop-summary`: System pressure drops

## Outputs

- `pump-specification`: Pump type, head, flow, NPSH required, and driver size
- `control-valve-specification`: Valve type, Cv, rangeability, and trim selection
- `system-curve`: System curve with pump curve overlay showing operating point

## Process

1. Calculate total dynamic head for the pump: TDH = static head + friction losses + velocity head difference + pressure difference. Plot the system curve (head vs flow) accounting for the quadratic increase of friction losses with flow.
2. Select pump type: centrifugal for most applications (flow above 5 m3/hr, head below 200 m), positive displacement (reciprocating or gear) for high viscosity, high pressure, or low flow. For centrifugal, select specific speed ns = N*sqrt(Q)/H^0.75 to determine impeller type.
3. Verify NPSH: NPSHa (available) = pressure head at suction + static head - vapor pressure head - friction losses in suction line. NPSHa must exceed NPSHr (required, from pump data sheet) by at least 0.5 to 1.0 m margin. If not, raise the suction vessel, lower the pump, subcool the liquid, or increase suction pipe size.
4. Size the control valve: Cv = Q * sqrt(G / delta_P) for liquid (ISA/IEC 60534). The valve should take 25% to 50% of the total system pressure drop at design flow for good controllability. Select trim: linear for constant pressure drop, equal percentage for variable pressure drop systems. Check rangeability (Cv_max / Cv_min) covers turndown.
5. Construct the system curve with the pump curve overlay. The operating point is the intersection. Verify that the pump operates within 80% to 120% of best efficiency point (BEP). At minimum flow, check for recirculation: install a minimum flow bypass if the pump may deadhead.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
