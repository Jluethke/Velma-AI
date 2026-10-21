# Drive Analysis

Reviews your last drive using CAN bus telemetry captured during the trip. Calculates top speed, average speed, time at speed bands, hard braking events, rapid acceleration events, fuel efficiency from MAF sensor data, idle time percentage, and flags any new DTCs that appeared mid-drive. Compares to your historical driving patterns to spot changes. Designed for the driver who wants data on how they actually drive, not how they think they drive.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INGEST       --> Load and validate the trip telemetry log
PHASE 2: SPEED        --> Analyze speed profile, acceleration, and braking events
PHASE 3: FUEL         --> Estimate fuel consumption from engine data
PHASE 4: FAULTS       --> Check for DTCs or warnings that appeared during the drive
PHASE 5: SCORE        --> Rate the drive and compare to history
```

## Inputs
- `trip_log`: object -- CAN telemetry captured during the drive. Minimum required signals: `vehicle` speed (0x286 or PID 0x0D), engine RPM (0x2FA or PID 0x0C), timestamps. Optional but valuable: MAF sensor (PID 0x10), throttle position (PID 0x11), coolant temp (PID 0x05), brake switch status, steering angle (0x2A8). Format: CSV with columns `timestamp, signal_name, value` or candump log.
- vehicle: object -- Year, make, model, engine (e.g., "3.6L Pentastar V6"), curb weight in lbs (target vehicle with V6: ~4,513 lbs), fuel tank capacity in gallons (target vehicle: 24.6 gal), tire size (for speed correction if using wheel speed sensors).
- `driver_profile`: object -- (Optional) Previous drive summaries for trend comparison. Historical averages: typical max speed, typical hard-brake count per trip, typical fuel economy.

## Outputs
- `speed_profile`: object -- Max speed, average speed, time-at-speed histogram (0-25 mph, 25-45, 45-65, 65-80, 80+), total drive time, total distance, moving time vs stopped time.
- `braking_events`: array -- Each hard braking event: timestamp, speed before, speed after, deceleration in g, duration in seconds, distance covered during braking. Sorted by severity.
- `fuel_estimate`: object -- Estimated fuel consumed (gallons), estimated MPG, fuel cost at current average price, idle fuel waste, comparison to EPA rated economy for the vehicle.
- `fault_log`: array -- DTCs that appeared during the drive (read at start and end, diff'd). Any MIL illumination. Warning lights observed.
- `drive_score`: object -- Overall score 0-100, subscores for smoothness (braking/accel), efficiency (speed band, idle), safety (hard events count), and trend vs last 5 drives.

## Execution

### Phase 1: INGEST
### Entry Criteria
Trip telemetry log provided or captured from the vehicle.
### Actions
1. Parse the telemetry log into a time-series table. Required columns: timestamp (seconds or ISO), signal name, value. Minimum signals for a useful analysis:
   - Vehicle speed: from CAN frame 0x286 (16-bit, 0.01 km/h per bit) or OBD PID 0x0D (km/h, 1 byte).
   - Engine RPM: from CAN frame 0x2FA (16-bit, 0.25 rpm per bit) or OBD PID 0x0C (rpm, 2 bytes, value/4).
2. Validate data quality:
   - Minimum duration: 60 seconds of data. Shorter trips don't produce meaningful statistics.
   - Sampling rate: speed should be sampled at least every 500 ms (2 Hz) for braking event detection. Higher is better. CAN frame 0x286 cycles at 100 ms (10 Hz) natively.
   - Gap detection: any gap >2 seconds in speed data is flagged as a potential data loss. Interpolate short gaps (<1s); mark longer gaps as unknown.
3. Convert units to standard:
   - Speed: convert to mph if in km/h. CAN frame 0x286 is km/h. OBD PID 0x0D is km/h.
   - RPM: if from CAN 0x2FA, multiply raw 16-bit value by 0.25.
   - MAF: PID 0x10 is grams/second, 2 bytes, value/100.
4. Calculate basic trip facts:
   - Trip duration: last timestamp minus first timestamp.
   - Total distance: integrate speed over time (trapezoidal rule on the speed curve).
   - Moving time: time where speed > 2 mph. Stopped time: speed <= 2 mph.
   - Idle time: engine RPM > 0 AND speed <= 2 mph.

### Output
Parsed and validated time-series, trip duration, distance, moving/stopped/idle breakdown.
### Quality Gate
Speed signal present with <5% data gaps. Duration is at least 60 seconds. Units are standardized.

### Phase 2: SPEED
### Entry Criteria
Validated time-series available.
### Actions
1. Compute speed statistics:
   - Maximum speed reached during the trip.
   - Average moving speed (exclude stopped time).
   - Median speed.
   - Time-at-speed histogram in bands: city (0-25 mph), urban (25-45), suburban (45-65), highway (65-80), excessive (80+). Report time and percentage in each band.
2. Detect hard braking events:
   - Calculate instantaneous deceleration between consecutive speed samples: `decel_g = (v1 - v2) / (t2 - t1) / 9.81 / 2.237` where speed is in mph and time in seconds. The 2.237 converts mph to m/s.
   - Thresholds:
     - Moderate braking: 0.3-0.4g. Normal traffic stop from 30 mph takes about 0.3g.
     - Hard braking: 0.4-0.6g. Emergency-adjacent, indicates late reaction or sudden obstacle.
     - Panic braking: >0.6g. ABS likely engaged. Something went wrong.
   - For each event above 0.3g: record start time, initial speed, final speed, peak deceleration, duration, and estimated stopping distance.
3. Detect rapid acceleration events:
   - Same method, forward direction. Thresholds:
     - Spirited: 0.2-0.3g. Enthusiastic but controlled.
     - Aggressive: 0.3-0.5g. WOT (wide-open throttle) territory for a V6 SUV.
     - Launch: >0.5g. Unusual for a non-performance vehicle, likely downhill or with a run-up.
4. If steering angle data is available (CAN 0x2A8, 16-bit signed, 0.1 deg per bit):
   - Detect sharp maneuvers: steering rate > 100 deg/s while speed > 30 mph.
   - Cross-reference with braking events: hard brake + sharp steer = evasive maneuver.
5. Count speed limit transitions: how many times the driver crossed 25, 35, 45, 55, 65, 75 mph thresholds. Useful for characterizing the trip type (city, highway, mixed).

### Output
Speed statistics, time-at-speed histogram, hard braking event list, rapid acceleration event list, maneuver log.
### Quality Gate
Every event has a timestamp, magnitude, and context (speed before/after). Histogram accounts for 100% of trip time.

### Phase 3: FUEL
### Entry Criteria
Speed profile complete. MAF data available (optional but needed for accurate fuel estimate).
### Actions
1. **If MAF sensor data is available** (PID 0x10, grams/second):
   - Fuel consumption = MAF / (air-fuel ratio * fuel density). For gasoline: AFR = 14.7 (stoichiometric), fuel density = 6.17 lb/gallon = 2798 g/gallon.
   - Formula: `gallons_per_second = MAF_g_s / (14.7 * 2798) = MAF_g_s / 41130.6`
   - Integrate over the trip to get total gallons consumed.
   - MPG = total_distance_miles / total_gallons.
2. **If MAF is not available**, estimate from speed and RPM:
   - Use a volumetric efficiency model: `fuel_rate = RPM * displacement * VE * fuel_density / (2 * AFR * 60)`.
   - For the 3.6L Pentastar: displacement = 3.604 liters, typical VE at cruise = 80-85%, at WOT = 90%.
   - This is a rough estimate (accuracy: +/- 15%). Flag it as estimated.
3. Calculate fuel cost:
   - Use current average fuel price (user-provided or default to national average).
   - Total cost = gallons * price_per_gallon.
4. Idle fuel waste:
   - A typical V6 idles at 0.3-0.5 gallons per hour.
   - Idle fuel = idle_time_hours * 0.4 gal/hr (midpoint estimate for 3.6L).
   - Report: "You spent X minutes idling, burning approximately Y gallons ($Z)."
5. Compare to EPA ratings:
   - target vehicle 3.6L 4WD: EPA city 18 mpg, highway 25 mpg, combined 21 mpg (2020 model year).
   - If the trip was primarily city (>60% time in 0-45 band), compare to city. Primarily highway (>60% time in 45+ band), compare to highway. Mixed: compare to combined.
   - Report: "Your estimated X mpg vs EPA rated Y mpg. Z% above/below rated."

### Output
Fuel consumed (gallons), trip MPG, fuel cost, idle waste, EPA comparison.
### Quality Gate
If MAF-based, accuracy note included. If estimated, flagged as approximate. Idle waste calculated separately.

### Phase 4: FAULTS
### Entry Criteria
Trip telemetry includes DTC snapshots (pre-drive and post-drive) or continuous monitoring.
### Actions
1. If DTCs were read before the drive started (pre-drive snapshot from vehicle-health or pre-drive-check), compare to the post-drive DTC state.
   - **New DTCs:** codes that appeared during the drive. These are directly related to drive conditions.
   - **Cleared DTCs:** codes present before that are now gone. Possible: intermittent fault that didn't recur, or a pending code that timed out.
2. If continuous telemetry includes MIL (malfunction indicator lamp) status (OBD PID 0x01, bit A7):
   - Detect MIL on/off transitions. A MIL that turned ON during the drive pinpoints the moment of fault.
   - Cross-reference the MIL-on timestamp with speed, RPM, and other parameters to identify conditions that triggered the fault.
3. Check for warning-level sensor readings during the drive:
   - Coolant temp exceeded 110C at any point: overheating event.
   - Battery voltage dropped below 13.0V while running: alternator issue.
   - Oil pressure dropped below threshold (if monitored): stop immediately.
4. If no DTC data is available, skip this phase and note "no fault monitoring data for this trip."

### Output
New DTCs with timestamp and conditions, cleared DTCs, warning events with timestamps.
### Quality Gate
If DTC data exists, every new code is reported with the drive conditions at the time it set. If no data, clearly stated.

### Phase 5: SCORE
### Entry Criteria
All analysis phases complete.
### Actions
1. Calculate subscores (each 0-100):
   - **Smoothness (40% of total):** Based on hard braking and rapid acceleration event count, normalized to trip distance. Zero events on a 30-mile trip = 100. One hard brake per 5 miles = 70. More than one per mile = 30.
   - **Efficiency (30% of total):** Based on actual MPG vs EPA rated. At or above EPA = 100. 10% below = 80. 20% below = 60. More than 30% below = 40. Idle time >20% of trip time deducts 10 points.
   - **Safety (30% of total):** Based on panic braking events (>0.6g), evasive maneuvers, and excessive speed time (>80 mph). Zero critical events = 100. Each panic brake = -15. Each evasive maneuver = -10. More than 5 minutes at 80+ mph = -10.
2. Compute overall drive score: weighted average of subscores.
3. Compare to driver history (if available):
   - Is this score above or below the 5-drive rolling average?
   - Trend: improving, stable, or declining?
   - Callout: "Your smoothness score improved 12 points since last week. Fewer hard brakes."
4. Generate the trip summary card:
   - One-line headline: "42-minute drive, 28.3 miles, 22.1 mpg estimated, score 78/100."
   - Top finding: the single most notable thing about this drive (e.g., "2 hard braking events over 0.5g on the highway segment" or "15% idle time in stop-and-go traffic").
5. Recommendations (1-2 max):
   - If smoothness is low: "Leave more following distance. Most hard braking events happen because the gap closed too fast."
   - If efficiency is low: "Your highway segment averaged 72 mph. Dropping to 65 would improve fuel economy by approximately 10-15%."
   - If a new DTC appeared: "A new fault code [code] appeared at mile 18.4. See the troubleshooter flow for diagnosis."

### Output
Drive score (total and subscores), historical comparison, trip summary card, recommendations.
### Quality Gate
Score is internally consistent (subscores add up). Recommendations are specific, not generic. Summary card is one screen.


---

## Worked Example

Illustrative only.

Given typical inputs for Post-drive telemetry review from CAN bus data. Calculates max and average speed,, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) trip telemetry is parsed and validated, (2) speed profile with event detection is complete, (3) fuel estimate is calculated with source noted (MAF or estimated), (4) fault check is complete or noted as unavailable, (5) drive score is computed with at least one specific recommendation.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INGEST | No speed signal in the telemetry | Cannot analyze. Speed is the minimum required signal. Check that the telemetry logger was capturing PID 0x0D or CAN frame 0x286 |
| INGEST | Very short trip (<60 seconds) | Produce basic stats only: max speed, distance. Skip scoring and fuel estimate (too little data for meaningful results) |
| SPEED | Speed data has large gaps (>30% missing) | Flag data quality warning. Calculate stats only on valid segments. Note: "Results based on X% of trip data" |
| FUEL | No MAF data and no RPM data | Cannot estimate fuel. Report distance and speed only. Recommend adding MAF (PID 0x10) to the telemetry capture list |
| FAULTS | No DTC snapshots available | Skip fault phase. Note: "No fault data for this trip. Run pre-drive-check before and vehicle-health after future drives for fault tracking" |
| SCORE | No historical data for comparison | Score the current trip on absolute scale only. Note this is the first scored trip and future scores will include trends |

## State Persistence
- Trip history (date, distance, duration, score, MPG, event counts per trip)
- Rolling averages (5-trip and 30-trip averages for score, MPG, braking events)
- Personal benchmarks (best MPG trip, highest score, longest trip without a hard brake)
- Fuel price history (for cost trend tracking)
- Seasonal patterns (winter vs summer MPG difference, which is typically 10-15% for northern climates)

## Reference

### Deceleration Reference

| Deceleration | Category | Typical Scenario |
|---|---|---|
| 0.1-0.2g | Normal | Easing to a stop at a known light |
| 0.2-0.3g | Firm | Standard traffic stop from 35 mph |
| 0.3-0.4g | Moderate | Late yellow light, slowing traffic |
| 0.4-0.6g | Hard | Surprise obstacle, cut-off in traffic |
| 0.6-0.8g | Panic | Emergency stop, ABS likely active |
| 0.8-1.0g | Maximum | Full emergency braking on dry pavement |

### Fuel Consumption Reference (3.6L Pentastar V6)

| Condition | Fuel Rate | Notes |
|---|---|---|
| Idle (park) | 0.3-0.5 gal/hr | Higher with HVAC running |
| City cruise (30 mph) | 1.0-1.5 gal/hr | ~20 mpg equivalent |
| Highway cruise (65 mph) | 2.4-2.8 gal/hr | ~24 mpg equivalent |
| Highway cruise (75 mph) | 3.0-3.5 gal/hr | ~21 mpg equivalent |
| WOT acceleration | 6-10 gal/hr | Transient, not sustained |

### EPA Fuel Economy (2020 vehicle platform Grand Cherokee 3.6L 4WD)

| Cycle | Rating |
|---|---|
| City | 18 mpg |
| Highway | 25 mpg |
| Combined | 21 mpg |

Aerodynamic drag increases with the square of speed. Going from 65 to 75 mph increases drag by 33%, which typically costs 3-4 mpg on this vehicle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
