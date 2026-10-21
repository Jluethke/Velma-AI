# the system Maintenance Schedule

Generates a personalized maintenance schedule by reading ECU data (oil life monitor,
coolant condition indicators, transmission fluid temperature history), combining it
with the factory service intervals for the target vehicle platform, and adjusting for actual
driving severity. Tracks what was done when, predicts what comes next, and flags
overdue items. Reads the vehicle directly via UDS to pull mileage and monitor status
instead of relying on manual entry alone.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BASELINE  --> Read vehicle mileage, oil life, and monitor status
PHASE 2: HISTORY   --> Merge service history with ECU data
PHASE 3: CLASSIFY  --> Determine driving severity (normal vs severe)
PHASE 4: SCHEDULE  --> Generate upcoming service timeline
PHASE 5: DELIVER   --> Formatted schedule with costs and priorities
```

## Inputs

- `vehicle`: object -- `vin` (string), `year` (int), `make` (string), `model` (string),
  `engine` (string, e.g. "3.6L Pentastar"). Reads VIN from BCM DID 0xF190 if not provided.
- `current_mileage`: int -- Current odometer reading in miles. If 0, attempts to read from
  PCM or IPC via UDS 0x22. Approximate is acceptable.
- `service_history`: array -- (Optional) Previous service records. Each: `date` (ISO 8601),
  `mileage` (int), `service` (string, e.g. "oil change", "brake pads front", "trans fluid"),
  `parts` (array of strings, optional), `shop` (string, optional).
- `driving_style`: object -- (Optional) Driving pattern indicators. `commute_miles` (int, daily),
  `highway_pct` (int, 0-100), `towing` (bool), `dusty_roads` (bool), `extreme_temps` (bool),
  `short_trips` (bool, most trips under 10 miles). If not provided, estimates from telemetry
  history or defaults to "normal" schedule.

## Outputs

- `upcoming_services`: array -- Next services due, ordered by urgency. Each: `service` (string),
  `interval_type` (string: "mileage", "time", "condition"), `due_at_miles` (int),
  `due_by_date` (string), `miles_remaining` (int), `urgency` (string: "overdue", "due_now",
  "soon", "upcoming", "distant"), `estimated_cost` (string).
- `overdue_items`: array -- Services past due. Same structure as upcoming_services with
  `overdue_by_miles` (int) and `overdue_by_months` (int).
- `fluid_status`: object -- Estimated fluid condition from ECU data. `oil_life_pct` (int,
  from PCM oil life monitor), `coolant_temp_trend` (string: "stable", "rising", "erratic"),
  `trans_fluid_condition` (string: "good", "marginal", "service"), `brake_fluid` (string:
  estimated from time since last change).
- `wear_estimates`: object -- Component wear predictions. `brake_pads_front` (string: "new",
  "good", "half", "low", "replace"), `brake_pads_rear` (string), `tires` (string based on
  mileage since last replacement and driving style), `battery` (string based on age and voltage).
- `annual_plan`: array -- Month-by-month service calendar for the next 12 months. Each:
  `month` (string), `services` (array), `estimated_total_cost` (string).

## Execution

### BASELINE: Read Vehicle Data
### Entry Criteria
Vehicle accessible via CAN bus or mileage provided manually.
### Actions
1. If CAN connection available, read diagnostic data:
   - Odometer: PCM or IPC DID (varies by firmware). Try 0xF460 or IPC broadcast.
   - Oil life monitor: PCM DID for remaining oil life percentage. Pentastar uses
     algorithm based on RPM, load, and coolant temp accumulation.
   - Coolant temp at startup: PCM DID 0xF405. Cold start temp near ambient = normal.
     Cold start temp elevated = possible thermostat stuck open or recent short trip.
   - Battery voltage: BCM or PCM. Below 12.4V engine off = battery aging.
   - Transmission fluid temp at idle: TCM if reachable. Persistently above 95C at idle
     after warm-up = fluid degradation accelerated.
2. Read OBD-II readiness monitors via PCM (Mode 01 PID 01 or UDS equivalent):
   - Catalyst monitor, EVAP monitor, O2 sensor monitor, misfire monitor, fuel system.
   - Incomplete monitors after extended driving = possible sensor or circuit issue.
3. If no CAN connection, use manual mileage input and defaults.
### Output
Current mileage, oil life, fluid indicators, monitor readiness status.
### Quality Gate
Mileage obtained (from ECU or manual input).

### HISTORY: Merge Service Records
### Entry Criteria
Baseline data collected.
### Actions
1. Build service timeline from provided history and ECU indicators:
   - Last oil change: from history or estimated from oil life % and average miles/% degradation
     (Pentastar oil life algorithm: approximately 8,000-10,000 miles normal, 5,000-6,000 severe).
   - Last brake service: from history. If no record, estimate from mileage (factory pads
     last 30,000-50,000 miles depending on driving style).
   - Last transmission service: from history. target vehicle ZF 8HP45 factory interval: 60,000 miles
     or "lifetime" (ignore "lifetime" -- fluid degrades).
   - Last coolant change: from history. Factory interval: 100,000 miles or 10 years for
     OAT (Organic Acid Technology) coolant in target vehicle.
2. Calculate miles and months since each service was performed.
3. Flag gaps: services with no record and no ECU indicator get "unknown" status.
### Output
Complete service timeline with last-performed dates and mileages.
### Quality Gate
At least oil change status determined (from ECU oil life or history).

### CLASSIFY: Driving Severity
### Entry Criteria
Baseline and history merged.
### Actions
1. Apply FCA severe service criteria (from owner's manual):
   - Short trips (under 10 miles) in cold weather: severe.
   - Dusty or gravel roads: severe (air filter, oil filter, brake pads wear faster).
   - Towing or heavy loading: severe (transmission fluid, coolant, brakes).
   - Extreme temperatures (sustained above 100F or below 0F): severe.
   - Stop-and-go traffic (highway_pct < 30%): severe for brakes and transmission.
   - High-speed driving (sustained above 70 mph): severe for tires and engine oil.
2. If driving_style input not provided, estimate from ECU data:
   - Oil life degradation rate: fast degradation (< 7,000 miles to 0%) = severe driving.
   - Coolant temp frequently above 100C = harder on engine.
   - Telemetry history if available: hard braking frequency, idle percentage.
3. Classify overall as "normal" or "severe". Most real-world driving is severe by
   factory definition (city driving alone qualifies in most climates).
4. Select interval table: normal or severe for each service item.
### Output
Severity classification with supporting evidence.
### Quality Gate
Classification produced with at least one data-backed justification.

### SCHEDULE: Generate Timeline
### Entry Criteria
Severity classified; history merged.
### Actions
1. Apply target vehicle 3.6L Pentastar maintenance intervals:
   - **Oil and filter**: normal 10,000 mi / 12 mo, severe 6,000 mi / 6 mo.
     Oil life monitor overrides if reading available (change when monitor hits 0-5%).
   - **Engine air filter**: normal 30,000 mi, severe 15,000 mi.
   - **Cabin air filter**: 20,000 mi or 12 months (all conditions).
   - **Spark plugs**: 100,000 mi (platinum/iridium, normal). 60,000 mi severe.
   - **Transmission fluid**: 60,000 mi (all conditions). ZF 8HP45 uses ZF Lifeguard 8.
   - **Transfer case fluid**: 60,000 mi (if 4WD equipped).
   - **Differential fluid**: front 60,000 mi, rear 60,000 mi (severe: 30,000 mi for towing).
   - **Coolant**: 100,000 mi or 10 years (OAT, first change). Then 50,000 mi / 5 years.
   - **Brake fluid**: every 2 years regardless of mileage (hygroscopic, absorbs moisture).
   - **Brake pads front**: 30,000-50,000 mi (city driving = 30k, highway = 50k).
   - **Brake pads rear**: 40,000-60,000 mi (rears wear slower on target vehicle due to weight distribution).
   - **Brake rotors**: typically 2 pad changes = 1 rotor resurfacing or replacement.
   - **Serpentine belt**: 100,000 mi or at first sign of cracking.
   - **Battery**: 3-5 years (test annually after year 3, voltage < 12.4V = replace soon).
   - **Tires**: tread depth dependent. Average 40,000-60,000 mi for all-seasons on target vehicle.
   - **Wiper blades**: 6-12 months (inspect every oil change).
2. Compute due date for each item: last_service_mileage + interval = due_mileage.
   Also compute time-based: last_service_date + interval_months = due_date.
   Whichever comes first governs.
3. Sort by urgency: overdue first, then due_now, soon (within 2,000 miles or 2 months),
   upcoming (within 5,000 miles or 6 months), distant (everything else).
### Output
upcoming_services and overdue_items arrays.
### Quality Gate
Every maintenance item has a due mileage and due date.

### DELIVER: Formatted Schedule
### Entry Criteria
Timeline generated.
### Actions
1. Build annual plan: project services month by month based on estimated driving rate
   (commute_miles * 22 workdays + weekend miles, or 12,000 miles/year default).
2. Estimate costs for each service (parts + labor at independent shop rates):
   - Oil change (synthetic): $60-80 DIY, $80-120 shop.
   - Air filter: $15-25 DIY. Cabin filter: $15-20 DIY.
   - Spark plugs (6 cyl): $60-90 parts, $150-250 shop.
   - Trans fluid + filter: $100-150 parts, $250-400 shop.
   - Brake pads front: $40-80 parts, $200-350 shop.
   - Coolant flush: $20-30 DIY, $100-150 shop.
   - Battery: $150-250 installed.
3. Compute estimated annual maintenance cost from the 12-month plan.
4. Highlight money-saving opportunities:
   - "Combine oil change and tire rotation at 52,000 miles (both due within 1,000 miles)."
   - "Brake pads and rotors together saves labor cost vs separate visits."
### Output
annual_plan array, cost estimates, and optimization suggestions.
### Quality Gate
Annual plan covers all 12 months; cost estimates within reasonable range.


---

## Worked Example

Illustrative only.

Given typical inputs for Personalized maintenance schedule generator using ECU data, OBD-II monitor statu, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. Vehicle mileage and fluid status obtained
2. Service history merged with ECU data
3. Driving severity classified with evidence
4. Every maintenance item scheduled with due date and mileage
5. Annual plan produced with cost estimates

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| BASELINE | Odometer DID not supported | Request manual mileage input |
| BASELINE | Oil life monitor not available | Estimate from last oil change date and average interval |
| BASELINE | CAN connection unavailable | Generate schedule from manual inputs only |
| HISTORY | No service records provided | Use factory "new vehicle" intervals from current mileage |
| CLASSIFY | Insufficient data for severity | Default to "severe" (conservative; owner's manual recommends this) |
| SCHEDULE | Item interval unknown | Use factory manual specification for target vehicle 3.6L |

## State Persistence

- Complete service history with dates, mileages, and what was done
- ECU readings at each check (oil life trend, battery voltage trend)
- Driving severity classification and supporting data
- Annual cost tracking for budget planning

## Reference

### target vehicle 3.6L Pentastar Service Intervals

| Item | Normal | Severe | Notes |
|------|--------|--------|-------|
| Oil + filter | 10,000 mi / 12 mo | 6,000 mi / 6 mo | Oil life monitor overrides |
| Engine air filter | 30,000 mi | 15,000 mi | Inspect every oil change |
| Cabin filter | 20,000 mi | 20,000 mi | Same for all conditions |
| Spark plugs | 100,000 mi | 60,000 mi | Iridium, 6 required |
| Trans fluid (ZF 8HP45) | 60,000 mi | 60,000 mi | ZF Lifeguard 8 |
| Coolant (OAT) | 100,000 mi / 10 yr | Same | Then 50,000 / 5 yr |
| Brake fluid | 24 months | 24 months | Hygroscopic |
| Serpentine belt | 100,000 mi | 100,000 mi | Inspect for cracks |
| Battery | 48-60 months | 36-48 months | Test annually after yr 3 |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
