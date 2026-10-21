# the system Parts Finder

Given a DTC code, symptom, or failed component name, identifies the exact part
needed for a 2020 target vehicle repair. Reads ECU identification DIDs to determine which
factory hardware revision is installed, maps the fault to a specific component,
lists common failure modes for that part on the target vehicle platform, and rates the
replacement difficulty with tool lists and estimated time. Distinguishes OEM Mopar
parts from aftermarket alternatives.

## Execution Pattern: Phase Pipeline

```
PHASE 1: IDENTIFY   --> Map DTC/symptom to the failed component
PHASE 2: LOOKUP     --> Get part numbers from ECU data and catalog
PHASE 3: DIAGNOSE   --> Common failure modes for this part on target vehicle
PHASE 4: PLAN       --> Replacement guide with tools and difficulty
```

## Inputs

- `vehicle`: object -- `vin` (string), `year` (int), `make` (string), `model` (string),
  `trim` (string), `engine` (string). VIN determines exact build configuration
  (country, plant, options) which affects part number selection.
- `symptom_or_dtc`: object -- Either `dtc_code` (string, e.g. "P0300", "C0035", "B2AAA")
  or `symptom` (string, plain language, e.g. "front left wheel speed sensor", "ignition coil
  cylinder 3", "driver window motor"). Can also be `component` (string, exact part name).
- `preferences`: object -- (Optional) `brand_preference` (string: "oem_only", "aftermarket_ok",
  "budget"), `source_preference` (string: "dealer", "online", "local_store"),
  `used_ok` (bool, salvage/recycled parts acceptable).

## Outputs

- `identified_part`: object -- The component identified as failed or needed. `name` (string),
  `location` (string, where on the vehicle), `system` (string: powertrain, body, chassis,
  electrical), `function` (string, what it does in one sentence).
- `oem_info`: object -- Factory part data. `mopar_pn` (string, Mopar part number),
  `fca_pn` (string, FCA/Stellantis internal number if different), `superseded_by` (string
  or null, replacement part number if original is discontinued), `msrp` (string, estimated
  OEM price range), `dealer_only` (bool, some parts only sold through dealer).
- `failure_modes`: array -- Common ways this part fails on target vehicle. Each: `mode` (string),
  `symptoms` (array of strings), `typical_mileage` (string, when it usually fails),
  `root_cause` (string), `dtc_codes` (array of associated DTCs).
- `replacement_guide`: object -- `difficulty` (string: "easy", "moderate", "difficult", "expert"),
  `time_estimate` (string), `tools_required` (array), `torque_specs` (object, bolt sizes and
  ft-lbs), `steps` (array of strings), `tips` (array of target vehicle-specific notes),
  `requires_programming` (bool, needs scan tool after install).
- `alternatives`: array -- Aftermarket and remanufactured options. Each: `brand` (string),
  `part_number` (string), `estimated_price` (string), `quality` (string: "premium",
  "standard", "budget"), `notes` (string).

## Execution

### IDENTIFY: Map Fault to Component
### Entry Criteria
DTC code, symptom, or component name provided.
### Actions
1. If DTC code provided, map to component:
   - P0300 (random misfire): multiple candidates -- spark plugs, ignition coils, injectors,
     vacuum leak. Narrow by additional DTCs (P0301 = cylinder 1 specific = coil or plug #1).
   - P0335 (CKP sensor A): crankshaft position sensor, passenger side of engine block.
   - P0340 (CMP sensor A): camshaft position sensor, bank 1 (passenger) cylinder head.
   - P0128 (thermostat): coolant thermostat, housing on front of engine.
   - C0035 (LF wheel speed): left front ABS wheel speed sensor, on steering knuckle.
   - C0050 (RR wheel speed): right rear ABS wheel speed sensor, on rear axle.
   - B2AAA (headlamp left): left headlamp assembly or bulb, driver side.
   - U0100 (lost PCM): PCM itself, PCM wiring harness, or CAN-C bus fault.
   - U0121 (lost ABS): ABS module, wiring to ABS module, or CAN-C bus fault.
2. If symptom provided, use the troubleshooter mapping (see velma-troubleshooter):
   - "Grinding front left" -> front left brake pads, wheel bearing, or CV joint.
   - "Window won't go up" -> window motor, regulator, or BCM config (one-touch disabled).
   - "No start, clicks" -> starter motor, battery terminals, or starter relay.
3. If component name provided directly, validate it exists on the target vehicle platform.
4. Read vehicle VIN (DID 0xF190) to determine exact build:
   - Digit 4-5: engine (G = 3.6L Pentastar). Digit 7: restraint system. Digit 8: transmission.
   - Production plant and date affect part revisions.
### Output
identified_part object with name, location, system, and function.
### Quality Gate
Component identified with location on the vehicle.

### LOOKUP: Part Numbers
### Entry Criteria
Component identified.
### Actions
1. Read ECU identification DIDs to determine installed hardware revision:
   - If component is an ECU: read its own DID 0xF191 (hardware PN), 0xF195 (SW version),
     0xF18A (supplier ID). These give the exact revision installed.
   - If component is a sensor or actuator: the controlling ECU's hardware PN determines
     which generation of sensor is compatible.
2. Map to Mopar part number using VIN decode:
   - target vehicle 2020 3.6L common parts:
   - CKP sensor: Mopar 5149142AB (Pentastar 3.6L all years).
   - CMP sensor: Mopar 5184231AF (bank 1), 5184232AF (bank 2).
   - Ignition coil: Mopar 5149168AI (Pentastar 3.6L 2016+).
   - Spark plug: Mopar SPZFR6F11G (NGK, gapped at 0.043").
   - Thermostat: Mopar 5184651AH (195F rating).
   - Front brake pads: Mopar 68225170AC (includes wear sensor).
   - Front wheel bearing: Mopar 5154262AA (hub assembly, pressed).
   - ABS wheel speed sensor (front): integrated into hub assembly.
   - Battery: Mopar H7 / group 94R, 800 CCA.
3. Check for superseded part numbers (FCA frequently revises part numbers;
   the latest suffix letter indicates the current revision).
4. Note if the part is dealer-only (airbag components, PCM, SGW module).
### Output
oem_info with Mopar PN, pricing, supersession.
### Quality Gate
At least one part number identified (OEM or cross-reference).

### DIAGNOSE: Failure Modes
### Entry Criteria
Part identified with OEM part number.
### Actions
1. List common failure modes for this part on the target vehicle platform:
   - CKP sensor: heat degradation at high mileage (80k+), connector corrosion from road
     salt, wiring chafe against engine block. Symptoms: intermittent no-start, random stall,
     P0335/P0339. Typical failure: 80,000-120,000 miles.
   - Ignition coil: boot deterioration from heat cycling, internal winding short.
     Symptoms: misfire on specific cylinder, rough idle, P030x. Typically fails one at a time.
     target vehicle Pentastar known issue: coils over cylinder 2 and 4 (rear bank, hotter location).
   - Thermostat: stuck open (P0128, slow warm-up, poor heater) or stuck closed (overheating,
     P0217). Pentastar thermostat housing also prone to coolant leak at gasket.
   - Front wheel bearing: road noise increasing with speed, play in wheel, C0035/C0045 wheel
     speed erratic. Typically 60,000-100,000 miles, accelerated by potholes and curb impacts.
   - Window motor: regulator cable frays, motor brushes wear. Common on target vehicle driver side
     due to higher usage. Symptom: slow operation then failure.
2. Note any target vehicle-specific TSBs (Technical Service Bulletins) or recalls related to the part.
3. Rate reliability: how often this part fails on target vehicle compared to platform average.
### Output
failure_modes array with modes, symptoms, typical mileage, root causes.
### Quality Gate
At least one failure mode documented with symptoms and typical mileage.

### PLAN: Replacement Guide
### Entry Criteria
Part and failure modes documented.
### Actions
1. Rate replacement difficulty:
   - Easy: accessible without removing other components, basic tools, under 30 minutes.
     Examples: air filter, cabin filter, battery, spark plugs (top of engine on Pentastar),
     wiper blades, light bulbs (some).
   - Moderate: some disassembly required, specialty tools helpful, 30-120 minutes.
     Examples: ignition coil (intake manifold may obstruct rear bank), thermostat (coolant
     drain required), brake pads (caliper removal), O2 sensor (may be seized).
   - Difficult: significant disassembly, lift required, 2-4 hours.
     Examples: front wheel bearing (press fit, hub removal), starter motor (under intake
     manifold on Pentastar), water pump, alternator.
   - Expert: requires special equipment or ECU programming after install.
     Examples: transmission valve body, PCM replacement (needs VIN programming via dealer),
     ABS module (needs initialization), headlight assembly (needs aim calibration).
2. List specific tools:
   - Socket sizes common on target vehicle: 10mm, 13mm, 15mm, 18mm, 21mm. T20, T25, T30 Torx.
   - Brake work: 18mm caliper bolts, C-clamp for piston, torque wrench (90 ft-lbs lugs).
   - Spark plugs: 5/8" spark plug socket, 6" extension, torque wrench (13 ft-lbs).
3. Provide torque specifications for all fasteners touched during the repair.
4. Note if ECU programming is required after part replacement:
   - New PCM: must be VIN-programmed and calibrated (dealer only, SGW auth).
   - New ABS module: must be initialized with calibration data.
   - New steering angle sensor: requires zero-point calibration (straight ahead learning).
   - New battery: no programming needed, but radio and window one-touch may need relearn.
5. target vehicle-specific tips:
   - Rear bank spark plugs: remove intake manifold beauty cover and throttle body duct
     for access. Do not drop plugs into plug wells.
   - Thermostat: drain only 2 quarts of coolant (not full system). Bleed air at bleed
     screw on upper radiator hose.
### Output
replacement_guide with difficulty, tools, steps, torque specs, and tips.
### Quality Gate
Every step has specific tool sizes; torque specs for all fasteners.


---

## Worked Example

Illustrative only.

Given typical inputs for Identifies the exact part needed for a repair from a DTC code or symptom descrip, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. Failed component identified from DTC or symptom
2. OEM part number located with current revision
3. At least one failure mode documented
4. Replacement guide with difficulty rating and tool list
5. Aftermarket alternatives listed if available

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| IDENTIFY | DTC not in lookup table | Use generic DTC description; ask for symptom details |
| IDENTIFY | Multiple components possible | List top 3 candidates; recommend diagnostic test to narrow |
| LOOKUP | VIN decode fails | Use generic target vehicle 2020 3.6L part number (covers most builds) |
| LOOKUP | Part number superseded | Show both old and new PN; note that dealer stocks new revision |
| DIAGNOSE | No known failure data for part | Provide general failure modes for the component type |
| PLAN | Torque spec unknown | Note "refer to factory service manual" for that fastener |

## State Persistence

- Parts previously looked up (avoid redundant research)
- Repair history: what was replaced, when, which part number
- Cross-reference cache: OEM to aftermarket mappings

## Reference

### Common target vehicle 3.6L Pentastar Part Numbers

| Component | Mopar PN | Qty | Notes |
|-----------|----------|-----|-------|
| Spark plug | SPZFR6F11G | 6 | 0.043" gap, 13 ft-lbs |
| Ignition coil | 5149168AI | 6 | 2016+ Pentastar |
| CKP sensor | 5149142AB | 1 | Passenger side block |
| CMP sensor (B1) | 5184231AF | 1 | Bank 1 cylinder head |
| Thermostat | 5184651AH | 1 | 195F, includes gasket |
| Oil filter | 68191349AC | 1 | Cartridge type |
| Air filter | 4861756AA | 1 | Panel type |
| Front brake pads | 68225170AC | 1 set | Includes wear sensor |
| Front rotor | 68247979AA | 2 | 350mm vented |
| Battery | H7 / 94R | 1 | 800 CCA, AGM |

### DTC to Component Quick Map

| DTC | Component | Location |
|-----|-----------|----------|
| P0300-P0306 | Spark plug or coil | Engine top |
| P0335 | CKP sensor | Engine block, passenger side |
| P0128 | Thermostat | Front of engine |
| P0456 | EVAP purge valve | Intake manifold |
| C0035 | LF wheel speed (hub) | LF steering knuckle |
| C0050 | RR wheel speed sensor | Rear axle |
| B2AAA | LF headlamp | Driver side |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
