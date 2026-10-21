# Pre-Drive Check

Quick safety inspection before driving using live CAN bus data and UDS queries.
Takes under 60 seconds on a connected vehicle: reads battery voltage, checks for
active DTCs on safety-critical modules (ABS, airbag, stability), verifies light
operation via BCM broadcast, and samples engine parameters at idle. Adapts the
checklist to trip type (city commute vs highway vs towing) and weather (rain, snow,
extreme heat).

## Execution Pattern: Phase Pipeline

```
PHASE 1: QUICK CONNECT --> Establish CAN session, confirm ignition RUN
PHASE 2: SAFETY SWEEP  --> Check ABS, airbag, stability DTCs
PHASE 3: VITALS        --> Battery, coolant, oil, fuel, tire pressure
PHASE 4: SYSTEMS       --> Lights, wipers, locks, windows
PHASE 5: DECIDE        --> Go/no-go with warnings and context
```

## Inputs

- `vehicle`: object -- Vehicle identification. `vin` (string), `year` (int), `make` (string),
  `model` (string). If unavailable, reads VIN from BCM DID 0xF190 on connect.
- `trip_type`: string -- "commute" (under 30 miles, city), "highway" (over 30 miles, sustained speed),
  "towing" (trailer attached, check trans temp and coolant capacity), "offroad" (check 4WD,
  skid plates, ground clearance systems), or "errand" (short trip, minimal checks).
- `weather`: object -- (Optional) Current conditions. `temp_f` (int, ambient temperature),
  `precipitation` (string: "none", "rain", "snow", "ice"), `visibility` (string: "clear",
  "fog", "low"). Adjusts thresholds and adds weather-specific checks.

## Outputs

- `readiness_status`: object -- Overall vehicle readiness. `ready` (bool), `confidence` (float 0-1),
  `critical_warnings` (int), `advisory_warnings` (int), `checks_passed` (int), `checks_total` (int).
- `safety_checks`: array -- Each safety system checked. Per entry: `system` (string), `status`
  (string: "pass", "warn", "fail"), `detail` (string), `dtc_codes` (array if any active).
- `fluid_levels`: object -- Estimated fluid status from sensor data. `battery_voltage` (float, volts),
  `coolant_temp` (float, celsius at idle, proxy for level), `fuel_level` (float, percent if available),
  `oil_pressure` (string: "normal", "low", "unknown").
- `tire_status`: object -- TPMS data if available. Per corner: `pressure_psi` (float),
  `temp_f` (float), `status` (string: "ok", "low", "high", "flat", "no_sensor").
- `go_no_go`: object -- Final decision. `decision` (string: "GO", "GO_WITH_CAUTION", "NO_GO"),
  `blockers` (array of critical issues), `advisories` (array of non-critical warnings),
  `trip_specific` (array of trip-type-relevant notes).

## Execution

### QUICK CONNECT: Establish Session
### Entry Criteria
gs_usb adapter connected; ignition in RUN position.
### Actions
1. Initialize gs_usb: idVendor=0x1D50, idProduct=0x606F, CAN-IHS at brp=68 (125kbps).
2. Send TesterPresent (0x3E 0x00) to BCM at TX=0x78A, RX=0x50A. Must respond within 500ms.
3. Read key position from BCM broadcast CAN ID 0x2FA (byte 0, bits 3:0):
   - 0x0=OFF, 0x1=ACC, 0x2=RUN, 0x4=CRANK. Must be RUN (0x2) or CRANK (0x4).
4. If VIN not provided, read from BCM DID 0xF190 via UDS 0x22.
5. Start TesterPresent keepalive (4s interval, 0x3E 0x80).
6. Attempt CAN-C connection (brp=17, 500kbps) for PCM/ABS if adapter supports bus switch.
### Output
Active CAN session(s), confirmed ignition state, VIN.
### Quality Gate
BCM responds to TesterPresent; ignition is RUN.

### SAFETY SWEEP: Critical System DTCs
### Entry Criteria
CAN session active with BCM reachable.
### Actions
1. Read DTCs from safety-critical modules via UDS 0x19 sub 0x02 (mask 0x09, confirmed + active):
   - ABS/ESP (0x7E2/0x7EA on CAN-C): wheel speed faults C0035-C0054, yaw sensor C0186,
     steering angle C0455, ABS pump C0265, stability off C2104.
   - Airbag (if reachable): deployment circuit faults B0001-B0019, crash sensor B0092-B0098.
   - BCM safety: headlight faults B2AAA, brake light B2AAF, horn B2A8A.
2. Check for any U-codes (communication faults) that indicate a missing safety module:
   - U0100 lost PCM, U0121 lost ABS, U0122 lost ESP, U0155 lost IPC.
   - Any active U-code for a safety module = immediate NO_GO.
3. Check MIL (malfunction indicator lamp) status from PCM if reachable:
   - UDS 0x22 DID 0xF401 (calculated engine load) or OBD Mode 01 PID 01.
   - If MIL on, flag for powertrain review but not necessarily NO_GO.
4. Read ABS warning lamp state from IPC broadcast CAN ID 0x322 if available.
### Output
safety_checks array with per-system pass/warn/fail and any active DTCs.
### Quality Gate
At least BCM and one powertrain module (PCM or ABS) scanned.

### VITALS: Battery, Fluids, Engine
### Entry Criteria
Safety sweep complete; engine running (RPM > 0) or ignition RUN.
### Actions
1. Battery voltage: read from BCM or PCM. Expected at idle with engine running: 13.5-14.5V.
   - Below 12.0V engine off = battery weak. Below 11.5V = NO_GO for highway trips.
   - Above 15.2V = overcharging, alternator regulator fault.
2. Coolant temperature: PCM DID 0xF405. At cold start, should match ambient (+/- 10C).
   At warm idle: 85-105C normal. Above 110C = warn. Above 120C = NO_GO.
3. Engine RPM at idle: PCM DID 0xF40C. Pentastar 3.6L normal idle: 650-750 RPM.
   Below 500 or above 1000 at warm idle = rough idle flag.
4. Oil pressure: if available via PCM DID. Low oil pressure at idle = NO_GO.
5. Fuel level: BCM or IPC broadcast. Below 10% = advisory for highway trips.
   Below 5% = advisory for all trips.
6. Transmission fluid temp: TCM DID if reachable. Cold start should be near ambient.
   Above 120C at idle = warn. For towing trips: must be below 100C before departure.
7. TPMS: read tire pressures from BCM/IPC broadcast CAN IDs 0x2B0-0x2B3 if available.
   target vehicle recommended: 36 PSI front, 36 PSI rear. Warn if any corner is 4+ PSI below.
   NO_GO if any corner below 25 PSI (flat risk at speed).
### Output
fluid_levels and tire_status objects with all measured values and flags.
### Quality Gate
Battery voltage and coolant temp both read successfully.

### SYSTEMS: Lights, Wipers, Accessories
### Entry Criteria
Vitals phase complete.
### Actions
1. Exterior lights: read BCM broadcast frames for light status:
   - CAN ID 0x2D2: headlight state (low beam, high beam, DRL, fog).
   - Verify headlights respond to control. If auto-headlights on and daytime, check DRL active.
   - For night/rain/fog trips: confirm low beams operational.
2. Brake lights: BCM DID for brake switch input. If available, confirm brake switch toggles.
3. Turn signals: BCM broadcast for left/right indicator state.
4. Windshield wipers: BCM status for wiper motor. For rain/snow trips, flag if wiper fault active.
5. Door ajar: BCM broadcast CAN ID 0x2D8 for door/liftgate/hood status.
   All doors must show closed. Hood open = advisory.
6. Window status: BCM for window position if available. For rain, all windows up advisory.
7. Rear defroster: for cold/ice weather, confirm defroster circuit operational.
8. 4WD status: for offroad trips, check transfer case mode from TCM/TCCM broadcast.
### Output
Systems checklist with pass/warn for each item.
### Quality Gate
Headlights and brake lights confirmed operational for night/rain trips.

### DECIDE: Go/No-Go Verdict
### Entry Criteria
All check phases complete.
### Actions
1. Aggregate all findings into three categories:
   - BLOCKERS: any NO_GO condition (ABS fault, flat tire, overheating, safety module missing,
     battery dead, oil pressure zero). Vehicle should not be driven.
   - ADVISORIES: warnings that allow driving with caution (MIL on, low fuel, one low tire,
     minor body DTCs, rough idle). Trip-type may elevate some to blockers.
   - PASSED: systems that checked out clean.
2. Apply trip-type adjustments:
   - Highway: low fuel upgraded from advisory to blocker if under 5%. Tire pressure thresholds
     tighter (within 2 PSI of spec). Coolant/trans temp must be in range.
   - Towing: transmission temp advisory threshold drops to 90C. Battery voltage must be
     above 13.0V (charging for trailer lights). Check for trailer wiring fault DTCs.
   - Offroad: 4WD engagement confirmed. Ground clearance systems checked. Stability control
     status noted (may be intentionally off for trails).
   - Snow/ice: traction control confirmed active. All-season or snow tire advisory.
3. Compute confidence score: checks_passed / checks_total, weighted by severity.
4. Issue decision: "GO" (zero blockers, zero advisories), "GO_WITH_CAUTION" (zero blockers,
   some advisories), "NO_GO" (one or more blockers).
### Output
go_no_go object with decision, blockers, advisories, and trip-specific notes.
### Quality Gate
Decision rendered with supporting evidence for every blocker and advisory.


---

## Worked Example

Illustrative only.

Given typical inputs for Quick pre-drive safety inspection using live CAN bus data and UDS diagnostics. C, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. All safety-critical modules probed for active DTCs
2. Battery voltage and coolant temperature measured
3. Go/no-go decision rendered with zero unclassified findings
4. Total check time under 60 seconds from connect to decision

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| QUICK CONNECT | No CANable detected | Exit: "connect gs_usb adapter" |
| QUICK CONNECT | Ignition OFF (key pos 0x0) | Exit: "turn ignition to RUN" |
| SAFETY SWEEP | ABS module not responding on CAN-C | Mark ABS as "unchecked"; flag as advisory |
| SAFETY SWEEP | NRC 0x37 (lockout) on SecurityAccess | Skip protected DTCs; note in report |
| VITALS | Coolant temp DID not supported | Use ambient temp broadcast as proxy; flag unknown |
| VITALS | TPMS data not available | Mark tire_status as "no_sensor" for all corners |
| SYSTEMS | BCM light status broadcast missing | Skip light checks; flag as advisory |
| DECIDE | Fewer than 3 checks completed | Issue "INSUFFICIENT_DATA" instead of GO/NO_GO |

## State Persistence

- Previous pre-drive results saved for trend detection (battery degrading over weeks)
- Trip log: date, trip_type, decision, advisory count for pattern analysis
- Baseline readings stored per vehicle for personalized thresholds

## Reference

### Safety-Critical DTC Ranges

| Range | System | NO_GO if Active |
|-------|--------|-----------------|
| C0035-C0054 | Wheel speed sensors | Yes |
| C0186 | Yaw rate sensor | Yes |
| C0265 | ABS pump motor | Yes |
| C2104 | Stability control off | Advisory |
| B0001-B0019 | Airbag circuits | Yes |
| U0100 | Lost communication with PCM | Yes |
| U0121 | Lost communication with ABS | Yes |
| P0217 | Engine overtemp | Yes |
| P0520 | Oil pressure sensor | Yes (if confirmed) |

### CAN Broadcast IDs (target vehicle)

| CAN ID | Source | Content |
|--------|--------|---------|
| 0x2FA | BCM | Key position, door locks, ignition state |
| 0x2D2 | BCM | Exterior light status |
| 0x2D8 | BCM | Door/hood/liftgate ajar status |
| 0x2B0-0x2B3 | TPMS | Tire pressure per corner |
| 0x322 | IPC | Warning lamp states |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
