# Maintenance Schedule

Generates a complete vehicle maintenance calendar from your current mileage, service history, and driving habits. Maps every scheduled service item to its manufacturer-recommended interval, adjusts for severe conditions (frequent towing, short trips, dusty roads, extreme temperatures), identifies what's overdue, what's due now, and what's coming in the next 5,000 miles. Not a generic "change your oil" reminder -- a specific calendar tied to your actual vehicle with real part numbers and cost ranges.

## Execution Pattern: Phase Pipeline

```
PHASE 1: VEHICLE PROFILE  --> Identify powertrain, fluids, and service schedule
PHASE 2: INTERVAL MAP     --> Build complete interval table adjusted for conditions
PHASE 3: CURRENT STATUS   --> Calculate what's due based on mileage and time
PHASE 4: CALENDAR         --> Generate month-by-month service plan with costs
```

## Inputs
- `vehicle`: object -- Year, make, model, engine (e.g. "3.6L Pentastar V6"), transmission type (auto/manual/CVT), drivetrain (FWD/RWD/AWD/4WD), VIN (optional, for exact spec lookup)
- `mileage`: object -- Current odometer reading, average miles driven per month (or per year)
- `service_history`: array -- (Optional) Known past services: what was done, mileage at service, date. If unknown, assume worst case (nothing done since factory)
- `driving_conditions`: object -- Normal or severe. Severe includes any of: frequent towing or hauling, mostly short trips under 10 miles, dusty or gravel roads, extreme hot (>100F regularly) or cold (<0F regularly), mountainous terrain, taxi/rideshare/delivery use, trailer towing, frequent stop-and-go traffic over 50% of driving

## Outputs
- `interval_map`: object -- Every maintenance item with normal and severe intervals in miles and months, whichever comes first
- `current_status`: object -- Each item's status: last service mileage/date if known, next due mileage/date, miles remaining, status (overdue, due now, upcoming, good)
- `calendar`: object -- Month-by-month schedule for the next 12 months and mile-by-mile for the next 30,000 miles, grouped by service visit to minimize trips
- `cost_forecast`: object -- Estimated cost per service item (parts + labor), total annual maintenance cost, comparison to industry average for the vehicle class

## Execution

### Phase 1: VEHICLE PROFILE
### Entry Criteria
Vehicle year, make, model, and engine provided.
### Actions
1. Identify the powertrain configuration:
   - Engine family: determines oil type, filter, spark plug type, timing chain vs belt, coolant type.
   - Transmission: automatic (ATF type and capacity), manual (gear oil), CVT (CVT-specific fluid -- never use regular ATF).
   - Drivetrain: FWD (no transfer case or rear diff), RWD (rear differential), AWD/4WD (transfer case + front and rear differentials).
2. Identify oil specification: Chrysler/Stellantis Pentastar 3.6L requires 0W-20 full synthetic (MS-6395 spec), 6 quarts with filter. GDI engines may need more frequent changes due to fuel dilution.
3. Identify coolant type: OAT (Organic Acid Technology) for most modern Chrysler/Stellantis, purple or orange. Never mix OAT with conventional green coolant -- causes gel formation and cooling system failure.
4. Identify transmission fluid type: ZF 8HP and 9HP use ATF+4 or ZF Lifeguard 8. "Lifetime fill" is a marketing claim -- fluid degrades and should be changed at 60,000-80,000 miles regardless.
5. Note the timing system: Pentastar 3.6L uses a timing chain (not a belt). Chains don't have a replacement interval but can stretch. Listen for rattle on cold start after 100K+ miles.
6. Check for model-specific maintenance items: vehicle platform Grand Cherokee target vehicle 3.6L has known issues with rocker arm failures (2011-2013 mostly, updated in 2014+), water pump weeping (inspect at 80K+), and PCV valve fouling on GDI engines.

### Output
Vehicle profile with engine specs, fluid types, filter part numbers, and model-specific notes.
### Quality Gate
Oil spec is exact (not just "synthetic"). Fluid types are specific to the transmission model. Model-specific issues are noted.

### Phase 2: INTERVAL MAP
### Entry Criteria
Vehicle profile complete.
### Actions
1. Build the complete maintenance interval table. Each item has a normal interval and a severe interval (whichever applies based on driving conditions input). The rule is always "miles OR months, whichever comes first":

   **Engine oil and filter:**
   - Normal: 10,000 miles or 12 months (full synthetic 0W-20).
   - Severe: 5,000 miles or 6 months. Towing, short trips, and extreme temps accelerate breakdown.

   **Tire rotation:**
   - Normal: 7,500 miles or every other oil change.
   - Severe (aggressive driving, uneven wear): 5,000 miles.
   - AWD/4WD: 5,000-6,000 miles regardless -- uneven tire wear causes driveline binding.

   **Engine air filter:**
   - Normal: 30,000 miles.
   - Severe (dusty conditions): 15,000 miles. Inspect at every oil change.

   **Cabin air filter:**
   - Normal: 20,000 miles or 2 years.
   - Severe (dusty, pollen, urban pollution): 15,000 miles or annually.

   **Brake fluid:**
   - Every 2 years regardless of mileage. Brake fluid is hygroscopic (absorbs water from air), and water in brake fluid lowers boiling point. A 3% water content drops boiling point from 400F to 300F.

   **Brake pads:**
   - Inspection: every 15,000 miles or annually. Replace when pad thickness reaches 3mm (most vehicles have a wear indicator that squeals at 2-3mm).
   - Typical life: 30,000-70,000 miles (city driving shortens, highway extends).

   **Transmission fluid (automatic):**
   - Normal: 60,000 miles.
   - Severe (towing, mountain driving): 30,000 miles.
   - Never flush an automatic transmission -- drain and fill only. Flushing can dislodge debris and cause valve body damage.

   **Coolant:**
   - OAT coolant: 100,000 miles or 5 years (first change), then 50,000 miles or 3 years.
   - Conventional green: 30,000 miles or 2 years. Almost no modern vehicle uses this anymore.

   **Spark plugs:**
   - Iridium: 100,000 miles (Pentastar 3.6L uses NGK DILKAR7G11GS or equivalent, 6 plugs).
   - Copper: 30,000 miles (rare on modern engines).
   - Platinum: 60,000 miles.

   **Serpentine belt:**
   - Inspect: every 30,000 miles.
   - Replace: 60,000-100,000 miles or at first sign of cracking, glazing, or noise. Belt failure disables alternator, A/C, power steering, and water pump simultaneously.

   **Battery:**
   - Test: annually after year 3.
   - Replace: 3-5 years. Hot climates shorten battery life (heat damages plates faster than cold).

   **Transfer case fluid (4WD/AWD):**
   - Normal: 60,000 miles.
   - Severe: 30,000 miles.

   **Differential fluid (front and/or rear):**
   - Normal: 60,000 miles.
   - Severe: 30,000 miles.

   **Power steering fluid:**
   - Inspect: every 30,000 miles.
   - Replace: 60,000-100,000 miles or when dark/burnt smelling. Electric power steering vehicles have no fluid.

   **Wiper blades:**
   - Every 6-12 months. Rubber degrades from UV and heat regardless of use.

2. Adjust all intervals based on user's driving conditions. If any severe condition applies, use the severe interval for all items affected by that condition.
3. Note items that are one-time or age-based rather than mileage-based: timing belt (not applicable if chain), water pump (inspect, not scheduled), ball joints and tie rods (inspect), CV boots (inspect).

### Output
Complete interval table with normal and severe columns, adjusted for user's conditions.
### Quality Gate
Every fluid type matches the specific vehicle. Severe intervals are applied where conditions warrant. No generic "check owner's manual" cop-outs.

### Phase 3: CURRENT STATUS
### Entry Criteria
Interval map complete and current mileage provided.
### Actions
1. For each maintenance item, calculate status:
   - If service history is provided: miles since last service, months since last service, next due at what mileage and date.
   - If no history: assume factory-fresh (0 miles, build date). Then subtract current mileage. If the vehicle has 85,000 miles and no known oil change history, everything is flagged.
2. Classify each item:
   - **OVERDUE (RED):** Past the interval by more than 10% in miles or 2 months in time.
   - **DUE NOW (ORANGE):** Within 500 miles or 1 month of the interval.
   - **UPCOMING (YELLOW):** Within 3,000 miles or 3 months.
   - **GOOD (GREEN):** More than 3,000 miles and 3 months until due.
3. Flag safety-critical overdue items separately: brake fluid, brake pads, tires (if tread depth is known), serpentine belt (if age is known).
4. Group items that can be done together to minimize shop visits. Oil change + tire rotation at the same visit. Coolant + spark plugs at the same mileage tier. Transmission fluid + differential fluid together.
5. If unknown service history: recommend a "catch-up" service visit that covers the highest-risk unknowns first -- brake fluid, transmission fluid, coolant, and spark plugs if mileage exceeds 80,000.

### Output
Status table: item, last service (mileage/date), next due (mileage/date), miles remaining, status color.
### Quality Gate
Every item has a status. Unknowns are flagged, not ignored. Safety items are highlighted.

### Phase 4: CALENDAR
### Entry Criteria
Current status calculated.
### Actions
1. Project service events onto a 12-month calendar using current mileage and monthly driving rate:
   - Example: if driving 1,200 miles/month and next oil change is due in 3,000 miles, that's approximately 2.5 months out.
   - For time-based items (brake fluid every 2 years, battery test annually), use calendar dates directly.
2. Group services into shop visits:
   - **Tier 1 (every oil change):** Oil + filter, tire rotation, multi-point inspection. Cost: $60-100 (DIY oil) or $80-150 (shop with rotation).
   - **Tier 2 (annual):** Add cabin air filter, brake inspection, battery test. Cost: $30-60 additional.
   - **Tier 3 (30K service):** Add engine air filter, inspect belts/hoses, transmission fluid inspection. Cost: $150-300 additional.
   - **Tier 4 (60K service):** Add spark plugs, transmission fluid change, differential fluid, coolant flush. Cost: $500-900 additional.
   - **Tier 5 (100K service):** Add serpentine belt, water pump inspection, suspension inspection, timing chain inspection. Cost: $300-800 additional.
3. Estimate cost per visit:
   - Parts cost: use common part numbers (Mopar, OEM equivalent, quality aftermarket).
   - Labor cost: use $100-150/hour shop rate (national average). Estimate hours per job.
   - DIY savings: note which jobs are DIY-friendly (oil change, air filters, wipers, battery) vs shop-required (transmission fluid, coolant flush, spark plugs on some engines).
4. Calculate annual maintenance forecast: sum all projected services for the next 12 months.
5. Compare to benchmark: average annual maintenance cost for a mid-size SUV (5-10 years old) is $800-1,200. If the forecast significantly exceeds this, explain why (catch-up work, high-mileage items coming due, severe duty cycle).

### Output
12-month calendar with grouped service visits, itemized cost per visit, annual total, and DIY vs shop recommendations.
### Quality Gate
Services are grouped to minimize trips. Costs are itemized (not just a lump sum). Annual total includes everything due, not just the next service.


---

## Worked Example

Illustrative only.

Given typical inputs for Generates a vehicle maintenance calendar from current mileage, service history, , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) every maintenance item has a current status, (2) overdue items are flagged with severity, (3) 12-month calendar is generated with grouped service visits, (4) cost forecast is itemized with DIY options noted, (5) vehicle-specific fluid types and part numbers are included.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| VEHICLE PROFILE | Unknown engine or transmission variant | Use the most common configuration for that model year. Flag the assumption and recommend verifying with the door jamb sticker or VIN decode |
| INTERVAL MAP | Vehicle uses a maintenance minder system instead of fixed intervals (Honda, BMW) | Note that the car's own computer adapts intervals based on driving patterns. Provide fixed intervals as a cross-check -- the minder can be overly optimiztic on severe-duty vehicles |
| CURRENT STATUS | No service history available | Assume no services performed. Recommend a full inspection first: brake fluid test strip ($3), coolant test strip ($3), transmission fluid color check (pink = good, brown = change, black = overdue). These three checks take 10 minutes and tell you a lot |
| CURRENT STATUS | Mileage seems wrong (e.g., 200,000 miles on a 2-year-old car) | Flag and ask for verification. If confirmed (fleet/delivery vehicle), adjust intervals to severe duty across the board |
| CALENDAR | Too many items due at once (deferred maintenance catch-up) | Prioritize by safety impact: (1) brake fluid, (2) tires/brakes, (3) coolant, (4) transmission fluid, (5) everything else. Spread across 2-3 visits over 1-2 months rather than one massive bill |
| ACT | User says they already did a service | Update status for that item, recalculate next due date, adjust calendar. Add to service history for future runs |

## State Persistence
- Vehicle profile (year/make/model/engine, doesn't change but stored for consistency)
- Service history log (every service recorded: what, when, mileage, cost, shop or DIY, part numbers used)
- Mileage log (odometer readings over time, used to calculate average monthly driving rate and project future due dates)
- Cost history (actual spend per service, tracks parts price trends and identifies shops that overcharge)
- Driving condition profile (updated if habits change: started towing, moved to dusty area, switched to highway commute)

## Reference

### Mopar-Recommended Intervals: 2020 vehicle platform Grand Cherokee 3.6L Pentastar

| Service Item | Normal (miles) | Normal (months) | Severe (miles) | Severe (months) |
|---|---|---|---|---|
| Engine oil 0W-20 synthetic + filter | 10,000 | 12 | 5,000 | 6 |
| Tire rotation | 7,500 | -- | 5,000 | -- |
| Engine air filter | 30,000 | -- | 15,000 | -- |
| Cabin air filter | 20,000 | 24 | 15,000 | 12 |
| Brake fluid | -- | 24 | -- | 24 |
| Transmission fluid (ZF 8HP, drain+fill) | 60,000 | -- | 30,000 | -- |
| Coolant (OAT) first change | 100,000 | 60 | 100,000 | 60 |
| Coolant subsequent | 50,000 | 36 | 50,000 | 36 |
| Spark plugs (iridium) | 100,000 | -- | 100,000 | -- |
| Serpentine belt | 100,000 | -- | 60,000 | -- |
| Transfer case fluid (4WD/AWD) | 60,000 | -- | 30,000 | -- |
| Front differential fluid | 60,000 | -- | 30,000 | -- |
| Rear differential fluid | 60,000 | -- | 30,000 | -- |
| Battery | -- | 48 | -- | 36 |
| Wiper blades | -- | 12 | -- | 6 |

### DIY Difficulty Guide

| Service | Difficulty | Time | Tools Needed |
|---|---|---|---|
| Oil + filter change | Easy | 30 min | Jack, drain pan, 13mm socket, filter wrench |
| Tire rotation | Easy | 20 min | Jack, lug wrench, torque wrench (100 ft-lb) |
| Engine air filter | Easy | 5 min | None (clamp release) |
| Cabin air filter | Easy | 10 min | None (glove box removal) |
| Wiper blades | Easy | 5 min | None (hook arm) |
| Battery replacement | Easy | 15 min | 10mm wrench |
| Brake pads | Moderate | 1-2 hr | Jack, C-clamp, socket set, torque wrench |
| Serpentine belt | Moderate | 30 min | 15mm wrench or breaker bar |
| Spark plugs (3.6L) | Moderate | 1-2 hr | 5/8" spark plug socket, extension, torque wrench (13 ft-lb) |
| Trans fluid drain+fill | Moderate | 45 min | T-50 Torx, 8mm hex, drain pan, correct fluid |
| Coolant flush | Moderate | 1 hr | Drain pan, distilled water, correct coolant |
| Differential fluid | Moderate | 30 min per diff | Hex key, drain pan, pump bottle for fill |

### Cost Benchmarks (2024 US Average, Independent Shop)

| Service | Parts | Labor | Total |
|---|---|---|---|
| Oil change (synthetic) | $35-50 | $30-50 | $65-100 |
| Tire rotation | $0 | $25-40 | $25-40 |
| Engine air filter | $15-25 | $10 | $25-35 |
| Cabin air filter | $15-25 | $10-20 | $25-45 |
| Brake fluid flush | $15-20 | $80-120 | $95-140 |
| Brake pads (front, per axle) | $40-80 | $100-150 | $140-230 |
| Trans fluid (drain+fill) | $40-60 | $80-120 | $120-180 |
| Coolant flush | $20-30 | $80-120 | $100-150 |
| Spark plugs (V6, 6 plugs) | $40-70 | $120-200 | $160-270 |
| Serpentine belt | $25-40 | $60-100 | $85-140 |
| Battery | $150-220 | $0-30 | $150-250 |
| Differential fluid (per diff) | $20-40 | $60-80 | $80-120 |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
