# the system Troubleshooter

Symptom-based vehicle diagnostic that starts with plain language ("car shakes at
highway speed", "check engine light came on", "grinding noise from the front left")
and works backward to the root cause. Maps each symptom to a set of targeted
diagnostic tests, reads the relevant DTCs and live sensor data via UDS, runs a
decision tree to narrow candidates, and produces a fix plan with the most likely
cause first.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INTAKE     --> Parse symptom, classify system, build test plan
PHASE 2: CONNECT    --> Establish CAN session and read baseline data
PHASE 3: TEST       --> Execute targeted diagnostic tests from the plan
PHASE 4: NARROW     --> Decision tree to rank root-cause candidates
PHASE 5: PRESCRIBE  --> Fix plan with parts, difficulty, and next steps
```

## Inputs

- `symptom`: object -- What the driver is experiencing. `description` (string, plain language),
  `when` (string: "always", "intermittent", "cold_start", "hot", "at_speed", "idle", "braking",
  "turning", "accelerating"), `severity` (string: "minor", "annoying", "concerning", "dangerous"),
  `duration` (string: "just_started", "days", "weeks", "months"), `location` (string, optional:
  "front_left", "front_right", "rear", "engine_bay", "dashboard", "exhaust").
- `vehicle`: object -- `vin` (string), `year` (int), `make` (string), `model` (string),
  `mileage` (int, approximate odometer). Reads VIN from BCM DID 0xF190 if not provided.
- `conditions`: object -- (Optional) Additional context. `recent_work` (string: description of
  recent repairs or parts replaced), `fuel_type` (string: "regular", "premium", "E85"),
  `aftermarket` (array: list of modifications installed).

## Outputs

- `diagnosis`: object -- Top-level findings. `symptom_category` (string: powertrain, chassis,
  body, electrical, noise, vibration, warning_light), `system_affected` (string),
  `confidence` (float 0-1), `candidates` (array of possible root causes ranked by likelihood).
- `test_results`: array -- Each diagnostic test performed. Per entry: `test_name` (string),
  `method` (string: "dtc_read", "pid_read", "actuator_test", "broadcast_decode"),
  `target_module` (string), `result` (object with raw values), `pass` (bool),
  `interpretation` (string).
- `root_cause`: object -- Most likely root cause. `description` (string), `confidence` (float),
  `supporting_evidence` (array of test results that point here), `ruling_out` (array of
  alternatives eliminated and why).
- `fix_plan`: array -- Steps to fix, ordered by recommended sequence. Each: `step` (int),
  `action` (string), `part_needed` (string or null), `oem_part_number` (string or null),
  `estimated_cost` (string: "$", "$$", "$$$", "$$$$"), `difficulty` (string: "DIY_easy",
  "DIY_moderate", "shop", "dealer"), `notes` (string).

## Execution

### INTAKE: Parse Symptom and Build Test Plan
### Entry Criteria
User has described a symptom in natural language.
### Actions
1. Classify the symptom into a diagnostic category:
   - **Vibration/shake**: speed-dependent (wheels/tires/brakes) vs RPM-dependent (engine/trans).
     At highway speed = wheel balance, brake rotor warp, worn tie rod. At idle = misfire, mount.
   - **Warning light**: map lamp color and icon to module. Red = stop driving (oil, temp, brake).
     Yellow/amber = service soon (check engine, TPMS, ESC). Green/blue = informational.
   - **Noise**: grinding (brake pad worn to backing plate, wheel bearing), clicking (CV joint,
     relay), knocking (rod bearing, detonation), whining (power steering pump, alternator bearing,
     transmission pump), rattling (heat shield, exhaust, loose trim).
   - **Performance**: hesitation (fuel delivery, ignition), stalling (idle air, vacuum leak, MAF),
     rough idle (misfire, vacuum leak, dirty throttle body), poor fuel economy (O2 sensor,
     EVAP leak, injector, air filter), hard start (fuel pump, starter, battery, CKP sensor).
   - **Electrical**: no start (battery, starter, ignition switch, security), intermittent (loose
     ground, corroded connector, CAN bus fault), accessory failure (fuse, relay, BCM config).
2. For each category, build ordered test list with UDS service, target module, and DID/DTC range.
3. Estimate which CAN bus and modules are needed (IHS-only for body, C-only for powertrain,
   both for chassis or unknown).
### Output
Classified symptom, prioritized test plan with specific UDS commands.
### Quality Gate
At least 3 diagnostic tests mapped to the symptom.

### CONNECT: Establish Session and Baseline
### Entry Criteria
Test plan built; gs_usb adapter connected; ignition RUN.
### Actions
1. Initialize gs_usb on the bus(es) needed per test plan.
   CAN-IHS: brp=68 (125kbps) for BCM/IPC. CAN-C: brp=17 (500kbps) for PCM/TCM/ABS.
2. Send TesterPresent to each target module; record which respond.
3. Read baseline data that every diagnosis needs:
   - BCM DID 0xF190 (VIN), 0xF195 (SW version), 0xF191 (HW number).
   - PCM DID 0xF40C (RPM), 0xF405 (coolant temp), 0xF411 (throttle pos).
   - Battery voltage from BCM or PCM.
4. Enter Extended Diagnostic Session (0x10 0x03) on primary target module.
5. If SecurityAccess needed for specific tests (actuator control, BCM config read):
   request seed (0x27 0x01), compute key via velma_obd_keycalc bcm_key(), send key (0x27 0x02).
### Output
Active sessions, baseline readings, security access status.
### Quality Gate
Primary target module responding in extended session.

### TEST: Execute Diagnostic Tests
### Entry Criteria
CAN session active; baseline collected.
### Actions
1. Execute each test from the plan in priority order:
   - **DTC read** (0x19 sub 0x02): read DTCs from target module with status mask 0xFF.
     For each active DTC, request freeze frame (0x19 sub 0x04) to get conditions at fault time.
   - **PID read** (0x22): read specific DIDs relevant to the symptom.
     Vibration at speed: ABS wheel speeds (4 corners), compare for deviation.
     Engine misfire: PCM DIDs for misfire counters per cylinder (0xF420-0xF425 if supported),
     fuel trim bank 1/2 (STFT 0xF406/0xF408, LTFT 0xF407/0xF409), ignition timing 0xF40E.
     Warning light: read the specific DTC that triggered the MIL via 0x19 sub 0x02.
   - **Actuator test** (0x2F OutputControl): only after SecurityAccess and only for body systems.
     Light not working: command BCM to activate the specific light circuit. If ECU confirms
     activation but light stays off = bulb or wiring. If ECU rejects = internal driver fault.
   - **Broadcast decode**: capture 5 seconds of CAN traffic, decode known message types.
     Check for missing broadcasts (module offline), abnormal values, rapid state changes.
2. Log every request/response pair with timestamps for evidence.
3. Compute derived values: wheel speed delta (max - min across 4 corners at steady speed),
   fuel trim deviation (LTFT beyond +/- 10% = lean/rich issue), misfire rate per 1000 revs.
### Output
test_results array with raw data, interpretations, and pass/fail for each test.
### Quality Gate
At least 2 tests returned valid data; zero NRC 0x10 (general reject).

### NARROW: Decision Tree
### Entry Criteria
Test results collected.
### Actions
1. Apply decision tree based on symptom category and test results:
   - Vibration + wheel speed delta > 3mph at 60mph = tire balance or bent wheel.
   - Vibration + wheel speed delta < 1mph + brake rotor thickness DTC = warped rotor.
   - Check engine + P0300 (random misfire) + LTFT > +15% = vacuum leak or MAF.
   - Check engine + P0300 + LTFT normal + misfire on one cylinder = coil/plug/injector.
   - Grinding front left + C0035 (LF wheel speed) = wheel bearing or ABS sensor.
   - Grinding front left + no DTCs + speed-dependent = brake pad worn to metal.
   - No start + battery > 12.4V + no crank = starter motor or ignition switch.
   - No start + battery < 11.5V = battery dead or parasitic drain.
   - Stalling + no DTCs + idle RPM drops below 500 = dirty throttle body or idle air leak.
2. Rank candidates by evidence strength: each supporting test result adds confidence.
   Contradicting evidence subtracts. Require at least 2 supporting data points for "high" confidence.
3. For each eliminated candidate, record which test ruled it out and why.
4. If no strong candidate emerges (all below 0.5 confidence), recommend additional tests
   that would differentiate: smoke test for vacuum leaks, compression test, manual inspection.
### Output
Ranked candidates with confidence scores and supporting/contradicting evidence.
### Quality Gate
Top candidate has confidence > 0.3 with at least one supporting test.

### PRESCRIBE: Fix Plan
### Entry Criteria
Root cause identified or ranked candidates produced.
### Actions
1. For the top root cause, build step-by-step fix plan:
   - Identify the failed component by name and location on the target vehicle.
   - Look up OEM part number from ECU identification data or known target vehicle parts catalog.
   - Classify difficulty: coil pack = DIY_easy (10 min, 1 bolt). Wheel bearing = shop (press fit).
     PCM reflash = dealer (SGW cloud auth required).
2. Include prerequisite steps: "clear DTCs after repair" (UDS 0x14 0xFF 0xFF 0xFF),
   "drive 50 miles for readiness monitors to complete", "reset oil life if oil change".
3. If multiple candidates remain, present top 3 with individual fix plans.
   Recommend cheapest/easiest test-fix first (e.g., "replace spark plugs before investigating injectors").
4. Flag any safety considerations: "do not drive if ABS fault active",
   "brake grinding = stop driving and inspect immediately".
5. Note if the fix requires SecurityAccess or SGW auth (and which level):
   - BCM config change: SecurityAccess L1 (w9) via velma_obd_keycalc.
   - PCM calibration: SGW/AutoAuth cloud, dealer-only.
   - Module replacement: will need VIN programming via dealer scan tool.
### Output
fix_plan array and root_cause object.
### Quality Gate
Every recommended action has a difficulty rating and safety note if applicable.


---

## Worked Example

Illustrative only.

Given typical inputs for Symptom-based vehicle troubleshooter. Describe what's wrong in plain language an, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. Symptom classified into diagnostic category
2. At least 3 diagnostic tests executed with valid results
3. Root cause identified with confidence score and supporting evidence
4. Fix plan produced with parts, cost estimate, and difficulty
5. Safety warnings issued for any drive-limiting conditions

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| INTAKE | Symptom too vague ("something feels wrong") | Ask for specifics: when, where, what changes it |
| CONNECT | Target module not responding | Try alternate bus; check if module is on IHS vs C |
| CONNECT | NRC 0x37 (lockout) on SecurityAccess | Wait 15s, retry once; if still locked, skip secured tests |
| TEST | NRC 0x31 (requestOutOfRange) on DID | DID not supported by this firmware; try alternate DID |
| TEST | Freeze frame empty for active DTC | Module stores limited snapshots; note in results |
| NARROW | All candidates below 0.3 confidence | Recommend manual inspection; list what to look for |
| NARROW | Conflicting test results | Flag data conflict; suggest re-test after clearing DTCs |
| PRESCRIBE | Part number unknown | Provide component name and location; advise parts lookup by VIN |

## State Persistence

- Symptom history: track reported symptoms over time for pattern detection
- Test result archive: reuse previous readings to detect changes
- Fix verification: after repair, re-run relevant tests to confirm resolution

## Reference

### Common Symptom-to-DTC Mapping

| Symptom | Primary DTCs | Module | Test |
|---------|-------------|--------|------|
| Check engine light | P0300-P0306 (misfire) | PCM | Read DTCs, fuel trim, misfire counters |
| ABS light | C0035-C0054 (wheel speed) | ABS | Read DTCs, compare wheel speeds |
| Vibration at speed | No specific DTC | ABS | Wheel speed delta at steady state |
| Hard start | P0335 (CKP), P0230 (fuel pump) | PCM | Crank RPM, fuel pressure |
| Overheating | P0217 (overtemp), P0128 (thermostat) | PCM | Coolant temp trend, fan relay |
| Transmission slip | P0730-P0736 (gear ratio) | TCM | Read DTCs, line pressure |
| Battery drain | No DTC (parasitic) | BCM | Module sleep current, wake sources |
| Noise from brakes | No specific DTC | ABS | Brake pad wear sensor if equipped |

### Diagnostic DID Quick Reference

| Signal | DID | Module | Unit | Normal Range |
|--------|-----|--------|------|-------------|
| Engine RPM | 0xF40C | PCM | RPM | 650-750 idle |
| Coolant temp | 0xF405 | PCM | C | 85-105 warm |
| Throttle pos | 0xF411 | PCM | % | 0-5 idle |
| STFT bank 1 | 0xF406 | PCM | % | -10 to +10 |
| LTFT bank 1 | 0xF407 | PCM | % | -10 to +10 |
| Battery volt | varies | BCM | V | 13.5-14.5 running |
| Wheel speed FL | varies | ABS | km/h | match other corners |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
