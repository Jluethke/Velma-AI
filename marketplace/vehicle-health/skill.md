# Vehicle Health

Full vehicle health scan across all ECU modules using UDS diagnostics and CAN bus
telemetry. Connects to the vehicle on both CAN-IHS (125kbps, pins 3/11) and CAN-C
(500kbps, pins 6/14), reads DTCs from every reachable module, samples live sensor
data, and classifies each finding by severity. Produces a prioritized action plan
with root-cause grouping so related symptoms point to one fix.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CONNECT   --> Establish CAN bus sessions on IHS and C buses
PHASE 2: DISCOVER  --> Enumerate all responding ECU modules
PHASE 3: SCAN      --> Read DTCs, freeze frames, and identification DIDs
PHASE 4: SAMPLE    --> Capture live sensor data and CAN broadcast signals
PHASE 5: ANALYZE   --> Classify, cross-reference, and prioritize findings
PHASE 6: REPORT    --> Produce structured health report with action plan
```

## Inputs

- `vehicle`: object -- Vehicle identification. Includes `vin` (string, 17-char VIN),
  `year` (int), `make` (string), `model` (string), `engine` (string, e.g. "3.6L Pentastar").
  If VIN is unknown, reads it from BCM DID 0xF190.
- `scan_scope`: string -- "full" (all modules, both buses), "quick" (BCM + PCM DTCs only),
  or "module:<name>" (single module deep scan, e.g. "module:ABS").
- `history`: array -- (Optional) Previous scan results for trend comparison. Each entry
  has `date` (ISO 8601), `dtc_count` (int), `dtcs` (array of code strings).

## Outputs

- `module_status`: object -- Per-module connectivity and identification. Keys are module
  names (BCM, PCM, TCM, ABS, IPC, ESM). Each value has `reachable` (bool), `bus` (string),
  `hardware_pn` (string from DID 0xF191), `sw_version` (string from DID 0xF195),
  `supplier` (string from DID 0xF18A).
- `dtc_report`: array -- Every DTC found, each with `module` (string), `code` (string,
  e.g. "U0100"), `description` (string), `status_byte` (int), `confirmed` (bool),
  `freeze_frame` (object or null with RPM, VSS, ECT, load at time of fault).
- `signal_health`: object -- Live data samples from key sensors. Keys are signal names
  (e.g. "engine_rpm", "coolant_temp", "battery_voltage"). Each has `value` (float),
  `unit` (string), `in_range` (bool), `expected_range` (array of [min, max]).
- `trend_analysis`: object -- Comparison against history if provided. Has `new_dtcs`
  (array), `cleared_dtcs` (array), `recurring_dtcs` (array), `degrading_signals`
  (array of signals trending out of range).
- `action_plan`: array -- Prioritized list of recommended actions. Each has `priority`
  (1-5, 1=critical), `category` (string: safety, drivetrain, body, comfort, info),
  `description` (string), `related_dtcs` (array), `estimated_difficulty` (string:
  DIY, shop, dealer).

## Execution

### CONNECT: Establish CAN Bus Sessions
### Entry Criteria
CANable gs_usb adapter connected via USB; vehicle ignition on (ACC or RUN).
### Actions
1. Initialize gs_usb with libusb backend. Probe for device at idVendor=0x1D50, idProduct=0x606F.
2. Configure CAN-IHS: brp=68, prop_seg=1, phase_seg1=15, phase_seg2=3, sjw=1 (125kbps).
3. Send TesterPresent (0x3E 0x00) to BCM at TX=0x78A, RX=0x50A. Confirm response 0x7E.
4. If CAN-C needed (scope != "module:BCM"): configure second channel or note single-adapter
   limitation. CAN-C: brp=17, same seg values (500kbps). PCM at TX=0x7E0, RX=0x7E8.
5. Start TesterPresent keepalive thread (4-second interval, 0x3E 0x80 suppress positive response).
### Output
Bus connection objects for IHS and C, confirmed module presence.
### Quality Gate
At least one module responds to TesterPresent.

### DISCOVER: Enumerate ECU Modules
### Entry Criteria
At least one CAN bus session active.
### Actions
1. Probe known target vehicle module addresses with TesterPresent:
   - CAN-IHS (125kbps): BCM 0x78A/0x50A, IPC 0x782/0x502
   - CAN-C (500kbps): PCM 0x7E0/0x7E8, TCM 0x7E1/0x7E9, ABS 0x7E2/0x7EA, ESM 0x7E4/0x7EC
2. For each responding module, read identification DIDs:
   - 0xF190 VIN, 0xF191 ECU Hardware Number, 0xF18A Supplier ID
   - 0xF195 SW Version, 0xF193 Boot SW Version, 0xF187 Spare Part Number
   - 0xF1A0 Serial Number, 0xF1B0 ECU Manufacturing Date
3. Request DiagnosticSessionControl 0x10 0x01 (default session) to confirm UDS support.
4. Build module map with bus assignment, addressing, and firmware identifiers.
### Output
module_status object with reachability and identification for all modules.
### Quality Gate
Module map has at least BCM entry with valid hardware part number.

### SCAN: Read DTCs and Freeze Frames
### Entry Criteria
Module map built with at least one reachable module.
### Actions
1. For each reachable module, request DTCs via UDS 0x19 (ReadDTCInformation):
   - Sub-function 0x02: reportDTCByStatusMask with mask 0xFF (all statuses).
   - Parse response: 3-byte DTC + 1-byte status per entry.
   - Decode DTC bytes to standard format (P/C/B/U + 4 hex digits).
2. For each confirmed DTC (status bit 0 set), request freeze frame:
   - UDS 0x19 sub-function 0x04: reportDTCSnapshotRecordByDTCNumber.
   - Extract RPM (PID 0x0C), vehicle speed (PID 0x0D), coolant temp (PID 0x05),
     engine load (PID 0x04), battery voltage, ambient temp if available.
3. Cross-reference each DTC code against the 11,389-entry DTC description table
   from velma_obd_params.py to get human-readable fault descriptions.
4. Classify DTCs by system:
   - P0xxx/P2xxx: powertrain (PCM, fuel, ignition, emissions)
   - P0700-P0799: transmission (TCM)
   - C0xxx-C2xxx: chassis (ABS, stability, steering)
   - B0xxx-B3xxx: body (BCM, lighting, HVAC, seats)
   - U0xxx-U3xxx: network (CAN communication, lost modules)
### Output
dtc_report array with all DTCs, descriptions, statuses, freeze frames.
### Quality Gate
Every DTC has a description (lookup succeeded or raw hex fallback).

### SAMPLE: Capture Live Sensor Data
### Entry Criteria
At least PCM or BCM reachable for live data.
### Actions
1. Read critical sensor DIDs via UDS 0x22 (ReadDataByIdentifier):
   - PCM: engine RPM (0xF40C), coolant temp (0xF405), intake air temp (0xF40F),
     MAF (0xF410), throttle position (0xF411), O2 sensors (0xF414-0xF41B),
     fuel pressure (0xF40A), timing advance (0xF40E), STFT/LTFT (0xF406-0xF409).
   - BCM: battery voltage, ambient temp, key position, door states, light states.
   - ABS: wheel speeds (4 corners), yaw rate, lateral acceleration.
2. Decode raw bytes using parameter definitions from velma_obd_params.py and
   velma_obd_params_ext.py (17,298 + 6,434 named parameters with slope/offset/unit).
3. Validate each reading against expected ranges:
   - Coolant temp: -40 to 215 C (warn above 110 C, critical above 120 C)
   - Battery voltage: 11.5 to 14.8 V (warn below 12.0, above 15.0)
   - RPM at idle: 600-900 (warn outside 500-1000)
   - O2 sensor voltage: 0.1-0.9 V (stuck low or high = sensor fault)
4. Sample CAN broadcast frames for 5 seconds to check bus health:
   - Decode 29 known target vehicle broadcast message types (65+ signals).
   - Check for missing expected broadcasts (staleness > 2 seconds = fault).
### Output
signal_health object with values, units, ranges, and in-range flags.
### Quality Gate
At least 5 key signals sampled (RPM, coolant, voltage, speed, throttle).

### ANALYZE: Classify and Cross-Reference
### Entry Criteria
DTC report and signal health data collected.
### Actions
1. Group related DTCs by root cause:
   - U0100 (lost communication with PCM) + P-codes = likely PCM issue, not N separate problems.
   - Multiple wheel speed DTCs = likely one ABS sensor or wiring harness, not four bad sensors.
   - B-codes for multiple door modules = possible BCM firmware or CAN-IHS bus issue.
2. Classify severity for each finding group:
   - CRITICAL (priority 1): safety-related. ABS faults, airbag DTCs, stability control off,
     brake pressure sensor faults, coolant temp above 120 C, oil pressure below threshold.
   - HIGH (priority 2): drivetrain. Misfire codes, transmission slip, fuel system faults,
     O2 sensor failures, catalytic converter below threshold.
   - MEDIUM (priority 3): emissions/efficiency. EVAP codes, secondary air, EGR, minor fuel trim drift.
   - LOW (priority 4): body/comfort. Window motor, seat memory, interior lighting, HVAC blend door.
   - INFO (priority 5): communications. Intermittent U-codes that self-cleared, history-only DTCs.
3. If history provided, compute trends:
   - New DTCs not in previous scan = developing issue.
   - DTCs present in 3+ consecutive scans = chronic unresolved fault.
   - Signal values drifting toward range boundary = degrading component.
4. Estimate repair difficulty:
   - DIY: sensor replacement, bulb, fuse, battery, air filter, O2 sensor.
   - Shop: brake work, suspension, A/C compressor, alternator, wheel bearing.
   - Dealer: TCM reflash, PCM calibration, airbag module, SGW-locked operations.
### Output
Grouped findings with severity, trend flags, and difficulty estimates.
### Quality Gate
Every DTC assigned to exactly one root-cause group and one severity level.

### REPORT: Produce Health Report
### Entry Criteria
Analysis complete with all findings classified.
### Actions
1. Build structured report:
   - Header: VIN, date, mileage (if available from DID), scan scope, module count.
   - Summary: total DTCs found (confirmed vs history), critical count, high count.
   - Per-module section: identification, DTCs with descriptions, live data readings.
   - Action plan: prioritized list with what to fix, why, and estimated difficulty.
2. Format action plan entries:
   - Each item: priority number, category, plain-language description, related DTC codes,
     DIY/shop/dealer classification.
   - Group by vehicle system (safety first, then drivetrain, then body, then info).
3. If history available, include trend section showing progression over time.
4. Save report as JSON (machine-readable) and plain text (human-readable).
### Output
Complete health report with all sections populated.
### Quality Gate
Action plan has zero unclassified findings; every DTC appears in at least one action item.


---

## Worked Example

Illustrative only.

Given typical inputs for Full vehicle health scan across all ECU modules via UDS diagnostics and CAN bus , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. All modules in scan scope probed and results recorded
2. Every DTC has a description and severity classification
3. Live data sampled with range validation
4. Action plan produced with at least one entry per root-cause group
5. Report saved in both JSON and text format

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| CONNECT | No CANable detected (USB) | Exit with "connect gs_usb adapter" message |
| CONNECT | BCM not responding on CAN-IHS | Check ignition state; retry with 1s delay; verify pins 3/11 |
| DISCOVER | Module NRC 0x11 (serviceNotSupported) | Mark module as non-UDS; skip DTC read |
| SCAN | NRC 0x33 (securityAccessDenied) on DTC read | Note requires SecurityAccess; attempt L1 unlock if BCM |
| SCAN | NRC 0x31 (requestOutOfRange) on freeze frame | Module does not store freeze frames; continue without |
| SAMPLE | NRC 0x14 (responseTooLong) on DID read | Reduce DID batch size; read one at a time |
| SAMPLE | Timeout on CAN-C module | Adapter may be on wrong bus; note and continue |
| ANALYZE | DTC code not in lookup table | Use raw hex code with "unknown fault" description |

## State Persistence

- Last scan results saved as JSON with timestamp for trend tracking
- Module identification cached (hardware part numbers rarely change)
- DTC history maintained across scans for recurring fault detection

## Reference

### target vehicle Module Addresses

| Module | Bus | TX | RX | Bitrate |
|--------|-----|------|------|---------|
| BCM | CAN-IHS | 0x78A | 0x50A | 125kbps |
| IPC | CAN-IHS | 0x782 | 0x502 | 125kbps |
| PCM | CAN-C | 0x7E0 | 0x7E8 | 500kbps |
| TCM | CAN-C | 0x7E1 | 0x7E9 | 500kbps |
| ABS | CAN-C | 0x7E2 | 0x7EA | 500kbps |
| ESM | CAN-C | 0x7E4 | 0x7EC | 500kbps |

### DTC Status Byte Bits

| Bit | Name | Meaning |
|-----|------|---------|
| 0 | testFailed | DTC is currently active |
| 1 | testFailedThisOp | Failed since last clear |
| 2 | pendingDTC | Pending confirmation |
| 3 | confirmedDTC | Confirmed and stored |
| 4 | testNotCompletedSinceLastClear | Monitor incomplete |
| 5 | testFailedSinceLastClear | Failed at least once |
| 6 | testNotCompletedThisOp | Not run this cycle |
| 7 | warningIndicatorRequested | MIL requested |

### Key UDS Services

| Service | ID | Use |
|---------|-----|-----|
| DiagnosticSessionControl | 0x10 | Enter extended session (0x03) |
| ReadDataByIdentifier | 0x22 | Read sensor/config DIDs |
| ReadDTCInformation | 0x19 | Read stored DTCs and freeze frames |
| SecurityAccess | 0x27 | Unlock protected operations |
| TesterPresent | 0x3E | Keepalive for diagnostic session |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
