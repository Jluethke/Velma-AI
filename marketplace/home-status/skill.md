# Home Status

Generates a daily briefing on the state of your home: security system armed/disarmed, thermostat settings, lights left on, doors and windows open or unlocked, water leak sensor alerts, smoke/CO detector status, and camera motion alerts. Takes your smart home device inventory, notification preferences, and household schedule, then produces a priority-sorted status board that highlights anything that needs immediate attention versus things that are fine. Designed for the person who leaves the house and wonders ten minutes later if they left the garage open.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY     --> Catalog all smart home devices, zones, and sensors
PHASE 2: STATUS PULL   --> Check current state of every device and sensor
PHASE 3: ANOMALY CHECK --> Flag anything abnormal for time of day or occupancy
PHASE 4: BRIEF         --> Generate priority-sorted home status report
```

## Inputs
- `devices`: object -- Smart home inventory: thermostats (brand, zones), smart locks (which doors), cameras (locations, indoor/outdoor), leak sensors (locations), smoke/CO detectors (locations and battery dates), smart lights (rooms, schedules), garage door controller, security system (provider, zones), smart plugs (what they control)
- `schedule`: object -- Household occupancy patterns: who leaves when, who arrives when, typical away times, vacation mode trigger, work-from-home days, overnight guests expected
- `preferences`: object -- Notification thresholds: temperature range (e.g., 68-76F occupied, 60-80F away), which cameras to check, motion sensitivity, water sensor locations that matter most (basement, under sinks, near water heater)
- `recent_alerts`: array -- (Optional) Any alerts received in the last 24 hours from smart home apps: motion events, door openings, temperature changes, battery warnings

## Outputs
- `status_board`: object -- Every device current state, grouped by zone (kitchen, bedroom, garage, etc.), color-coded: green (normal), yellow (attention), red (immediate)
- `anomalies`: array -- Anything unexpected: lights on in empty rooms, thermostat set outside normal range, door unlocked during away hours, camera offline, sensor battery low
- `action_items`: array -- Specific things to do now: lock the back door, turn off the basement light, replace smoke detector battery in hallway, investigate garage camera offline
- `efficiency_note`: object -- Quick energy observation: estimated cost of current settings vs optimal, HVAC running while windows open, lights on in daylight

## Execution

### Phase 1: INVENTORY
### Entry Criteria
User provides device list or describes their smart home setup.
### Actions
1. Catalog every smart device by zone:
   - **Entry points:** Front door lock, back door lock, garage door, side gate. For each: smart lock brand, auto-lock timer (if any), current lock state.
   - **Climate:** Thermostat(s) per zone. Note whether they have occupancy sensors, geofencing, or schedule-only.
   - **Water:** Leak sensors mapped to risk areas. High-priority: water heater, washing machine, under kitchen sink, basement sump. Medium: bathroom fixtures, dishwasher.
   - **Safety:** Smoke detectors (interconnected?), CO detectors, security system zones (perimeter, interior motion, glass break).
   - **Cameras:** Indoor vs outdoor, recording vs live-only, motion zone configuration.
   - **Lighting:** Smart bulbs/switches by room, automated schedules, vacation mode capability.
   - **Other:** Smart plugs (space heaters, window AC units -- fire risk if left on), smart sprinklers, smart garage.
2. Map each device to its zone and assign a monitoring priority: critical (locks, leak sensors, smoke/CO, security), important (cameras, thermostat, garage), informational (lights, plugs, sprinklers).
3. Record last-known battery replacement dates for battery-powered devices: smoke detectors (replace every 10 years, test monthly, batteries every 6 months for 9V models), leak sensors (typical 2-year battery), door/window sensors (1-3 year battery).
4. Note any devices that are offline, disconnected, or unreachable.

### Output
Complete device inventory with zones, priorities, battery status, and connectivity state.
### Quality Gate
Every device the user listed is accounted for. Priority assignments match risk profile. Battery dates are recorded.

### Phase 2: STATUS PULL
### Entry Criteria
Inventory complete.
### Actions
1. Check security system: armed (home/away/night) or disarmed. If disarmed during expected away hours, flag yellow.
2. Check all entry points: locked/unlocked, open/closed. Cross-reference with schedule -- if household is away and any door is unlocked, flag red.
3. Check thermostat: current temperature, set point, mode (heat/cool/auto/off), schedule active or overridden. Compare to user preference range.
4. Check all cameras: online/offline, recent motion events in last 4 hours, storage status (cloud full, SD card full).
5. Check leak sensors: all clear or triggered. Any triggered sensor is an immediate red flag regardless of context.
6. Check smoke/CO detectors: last test date, battery level if smart-connected, any active alerts.
7. Check lighting: which lights are currently on, which rooms are occupied vs empty based on schedule.
8. Check smart plugs: what's drawing power, anything left on that shouldn't be (space heater, iron, curling iron via smart plug).
9. Check garage door: open or closed. Open garage during away hours is red.

### Output
Raw status for every device, timestamped.
### Quality Gate
Every device in inventory has a current status. No device left unchecked.

### Phase 3: ANOMALY CHECK
### Entry Criteria
Full status data collected.
### Actions
1. Cross-reference device states against occupancy schedule:
   - Lights on in empty rooms during daytime: yellow (wasted energy).
   - Lights on in empty rooms at night: yellow (energy) or green (security deterrent, depends on user preference).
   - Thermostat heating/cooling an empty house outside the away setback range: yellow.
   - Doors unlocked while household is away: red.
   - Garage open while away: red.
   - Security disarmed while away: red.
2. Check for safety anomalies:
   - Leak sensor triggered: red, always.
   - Smoke/CO detector battery below 20%: yellow. Below 10%: red.
   - Smoke/CO detector last tested over 30 days ago: yellow.
   - Camera offline for more than 1 hour: yellow. More than 24 hours: red.
   - Smart plug controlling a heating device left on for more than 4 hours: yellow.
3. Check for pattern breaks:
   - Door opened at unusual time (2 AM front door opening when nobody is expected): red with camera cross-reference.
   - Temperature spike or drop exceeding 5F in 30 minutes (possible HVAC failure or window left open): yellow.
   - Multiple motion events in a zone that should be empty: yellow with camera check.
4. Generate efficiency observations:
   - HVAC running while windows/doors are detected open (if sensors exist): flag waste.
   - Lights on in rooms with daylight sensors showing bright: flag waste.
   - Thermostat set more than 3F from the efficient target for the season: note monthly cost delta.

### Output
Anomaly list sorted by severity (red, yellow, green), with specific device, location, and recommended action.
### Quality Gate
Every anomaly has a severity level, specific location, and a concrete action. No false alarms from scheduled activities (e.g., cleaning crew expected at 10 AM doesn't flag as intrusion).

### Phase 4: BRIEF
### Entry Criteria
Anomaly analysis complete.
### Actions
1. Generate the status board: one section per zone, each device listed with its state and color code.
2. Lead with red items (immediate action needed), then yellow (attention when convenient), then green (all good).
3. Produce action items as a checklist:
   - "Lock the back door (currently unlocked, household is away)"
   - "Replace smoke detector battery in upstairs hallway (below 15%)"
   - "Check basement camera (offline since 6:42 AM)"
   - "Turn off kitchen lights (on for 3 hours, room unoccupied)"
4. Include the efficiency note: "Thermostat is set to 74F while away; dropping to 68F would save approximately $8-12/month in heating."
5. End with an all-clear summary if everything checks out: "All doors locked. Security armed (away). No leaks. No alerts. Thermostat at 68F (away mode). All cameras online."
6. Timestamp the brief.

### Output
Formatted status brief with priority-sorted action items, efficiency note, and all-clear summary.
### Quality Gate
Brief is scannable in under 30 seconds. Red items are unmissable. Action items are specific enough to act on without opening a smart home app.


---

## Worked Example

Illustrative only.

Given typical inputs for Daily smart home status briefing: security, locks, thermostat, leak sensors, cam, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) every smart device has a current status, (2) anomalies are identified and severity-ranked, (3) action items are concrete and actionable, (4) efficiency note includes at least one observation, (5) brief is timestamped and priority-sorted.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | User doesn't know exact device models | Adjust -- work with what they know (brand, location, type). Model specifics affect battery life estimates but not status checking |
| STATUS PULL | Device is offline or unreachable | Flag as yellow/red anomaly itself. "Garage camera: OFFLINE (last seen 3h ago)" is a finding, not a failure |
| ANOMALY CHECK | Schedule not provided, can't determine expected occupancy | Adjust -- use time-of-day heuristics: weekday 8AM-5PM assume away, evenings assume home, weekends assume variable. Ask user to confirm |
| BRIEF | No anomalies found | Generate all-clear brief. This is a valid and good outcome, not a failure |
| ACT | User says a flagged item is intentional | Acknowledge and add to known exceptions for future runs (e.g., "back door left unlocked for dog walker 10-11 AM Tuesdays") |

## State Persistence
- Device inventory (added/removed devices between runs)
- Known exceptions (intentional states that shouldn't be flagged: dog walker schedule, cleaning crew, expected guests)
- Battery replacement log (track when batteries were last changed, predict next replacement)
- Historical anomaly patterns (recurring issues suggest a fix: if the garage door is flagged open every Tuesday, maybe the auto-close timer needs adjustment)
- Efficiency trend (month-over-month energy observations)

## Reference

### Smart Device Battery Life Reference

| Device Type | Typical Battery Life | Replace/Test Frequency |
|---|---|---|
| Smoke detector (9V) | 1 year | Test monthly, replace battery every 6 months |
| Smoke detector (10-year sealed) | 10 years | Test monthly, replace entire unit at 10 years |
| CO detector | 5-7 years | Test monthly, replace unit at expiration |
| Door/window sensor | 1-3 years | Check quarterly |
| Leak sensor | 2-3 years | Test quarterly, check battery annually |
| Smart lock (AA batteries) | 6-12 months | Replace when app warns (<20%) |
| Motion sensor | 2-5 years | Check annually |
| Thermostat (battery backup) | 1 year | Replace annually |

### Anomaly Severity Guide

| Severity | Examples | Response Time |
|---|---|---|
| RED | Leak sensor triggered, door unlocked while away, smoke/CO alert, camera offline >24h | Immediate |
| YELLOW | Light left on, thermostat outside range, battery below 20%, camera offline <24h | Same day |
| GREEN | All normal, minor efficiency notes | Next convenience |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
