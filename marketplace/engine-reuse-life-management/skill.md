# Engine Reuse Life Management

Manage engine life for reuse: track life-limited parts, predict remaining life, and define refurbishment scope.

## Inputs

- `engine-design-specs`: Engine operating conditions (chamber pressure, temperature, speed)
- `flight-history`: Number of flights and burn time per flight
- `inspection-data`: Results from post-flight inspections of critical components

## Outputs

- `life-limited-parts-list`: Components with defined life limits and remaining life
- `refurbishment-scope`: What must be inspected, cleaned, replaced, or tested between flights
- `engine-life-prediction`: Predicted number of flights before major overhaul

## Process

1. Life-limited parts in a rocket engine: turbopump bearings (fatigue, wear), turbine blades (creep, thermal fatigue), chamber throat (erosion, thermal cycling), nozzle (thermal fatigue of regenerative cooling channels), injector (erosion, coking), seals (wear, embrittlement). Each has a different failure mechanism and life prediction method.
2. Turbopump bearing life: ball bearings in cryogenic service degrade from Hertzian contact fatigue. L10 life (90% survival probability) is calculated from load, speed, and material (Si3N4 balls last longer than steel). Target: 20-100 flights per bearing set. Track bearing condition by vibration signature monitoring.
3. Thermal fatigue of the thrust chamber: each firing cycle (startup to shutdown) cycles the chamber wall from cryogenic (coolant side) to near-melting (gas side). Copper alloy walls develop fatigue cracks in the cooling channels. Life prediction uses strain range from thermal analysis and low-cycle fatigue curves. The SSME chamber liner was replaced every 20-40 flights.
4. Inspection between flights: borescope inspection of the thrust chamber and turbine, vibration signature analysis of turbopumps, leak checks of all seals and joints, visual inspection of the nozzle and injector face, data review from flight instrumentation. The inspection scope defines the turnaround time (Falcon 9 Block 5 targets less than 24 hours between flights).
5. Cost of engine refurbishment vs replacement: if refurbishment cost exceeds a threshold fraction of new engine cost (typically 30-50%), replacement is more economical. The goal is to design the engine so that routine maintenance is limited to inspection and replacement of a few low-cost consumable parts (seals, filters, pyrotechnic igniters).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
