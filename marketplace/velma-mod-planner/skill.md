# the system Mod Planner

Plans vehicle modifications by reading current ECU calibrations, identifying which
modules need reconfiguration, and mapping the exact BCM config DID writes required.
Covers mechanical mods (lift kit, tire size, exhaust, intake), electrical mods
(lighting upgrades, accessory circuits, trailer wiring), and electronic mods
(feature enable/disable via BCM configuration). Warns about emissions compliance,
warranty impact, and safety considerations before any changes are made.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCOPE      --> Define the mod, read current vehicle config
PHASE 2: AUDIT      --> Check current calibrations against mod requirements
PHASE 3: MAP        --> Identify every ECU parameter that needs changing
PHASE 4: VALIDATE   --> Check compatibility, safety, emissions, warranty
PHASE 5: PLAN       --> Produce install plan with BCM writes and mechanical steps
```

## Inputs

- vehicle: object -- `vin` (string), `year` (int), `make` (string), `model` (string),
  `trim` (string, e.g. "Limited", "Trailhawk"), `mileage` (int). Reads VIN from
  BCM DID 0xF190 if not provided.
- desired_mod: object -- What the owner wants. `category` (string: "lift", "tires",
  "lighting", "exhaust", "intake", "feature_enable", "feature_disable", "trailer",
  "audio", "custom"), `description` (string, plain language), `parts` (array, optional:
  specific part numbers or products being considered).
- constraints: object -- (Optional) `budget` (string: "$", "$$", "$$$", "$$$$"),
  `emissions_legal` (bool: must pass state inspection), `warranty_ok` (bool: must
  preserve factory warranty), `reversible` (bool: must be able to return to stock),
  `diy_only` (bool: no dealer or shop involvement).

## Outputs

- feasibility: object -- Whether the mod is possible. `feasible` (bool), `difficulty`
  (string: "easy", "moderate", "advanced", "expert"), `requires_security_access` (bool),
  `requires_dealer` (bool, true if SGW/AutoAuth needed), `blockers` (array of show-stoppers).
- ecu_changes: array -- Every ECU parameter that needs modification. Per entry:
  `module` (string), `did` (hex string), `param_name` (string), `current_value` (string),
  `new_value` (string), `security_level` (int or null), `write_service` (string: "0x2E" or "dealer").
- bcm_config_changes: array -- Subset of ecu_changes specific to BCM 0x2E writes. Each:
  `did` (hex), `param_name` (string), `bit_position` (int), `bit_length` (int),
  `from` (int), `to` (int), `enum_label` (string).
- compatibility_warnings: array -- Each: `severity` (string: "info", "warning", "critical"),
  `category` (string: "emissions", "warranty", "safety", "legal", "functionality"),
  `description` (string), `mitigation` (string or null).
- install_plan: array -- Ordered steps. Each: `step` (int), `action` (string),
  `type` (string: "mechanical", "electrical", "ecu_write", "calibration", "verification"),
  `tools_needed` (array), `time_estimate` (string), `notes` (string).

## Execution

### SCOPE: Define Mod and Read Current Config
### Entry Criteria
Owner has described the desired modification.
### Actions
1. Classify the mod and identify affected systems:
   - **Lift/tires**: ABS wheel speed calibration, speedometer correction, TPMS thresholds,
     steering angle sensor recalibration, headlight aim.
   - **Lighting**: BCM light output config (DRL mode, fog lamp enable, courtesy lights,
     auto-headlight sensitivity, puddle lamps), wiring for aftermarket LEDs.
   - **Exhaust**: PCM O2 sensor thresholds, catalytic converter monitor enable/disable,
     rear O2 heater circuit. Cat-back = no ECU changes. Cat-delete = PCM tune required (dealer).
   - **Intake**: PCM MAF calibration if tube diameter changes. Drop-in filter = no ECU changes.
     Cold air intake with larger MAF housing = needs PCM recalibration (dealer).
   - **Feature enable**: BCM config DIDs. Examples: enable fog lights as DRL, enable auto-fold
     mirrors, enable rain-sensing wipers, change daytime running light mode, enable remote start
     confirmation horn honk, change lock/unlock behavior.
   - **Trailer**: BCM trailer wiring config, park lamp supervision, trailer TPMS if equipped.
2. Connect to vehicle via CAN-IHS (BCM) and read current BCM config:
   - Enter Extended Session (0x10 0x03), SecurityAccess L1 (0x27 0x01/0x02, w9 algorithm).
   - Read all 826 BCM config parameters across 53 config DIDs via UDS 0x22.
   - Parse each response using velma_obd_params.py BCM_CONFIG definitions.
3. If mod affects PCM/TCM (powertrain mods): note that PCM/TCM use SGW/AutoAuth.
   Local SecurityAccess is not available. These changes require dealer flash.
### Output
Current vehicle configuration snapshot, mod classification.
### Quality Gate
BCM config read successfully with at least 50 DIDs returning data.

### AUDIT: Check Current Calibrations
### Entry Criteria
Current config read; mod requirements identified.
### Actions
1. For each parameter affected by the mod, read current value and compare to target:
   - Tire size change: read current tire circumference calibration from BCM or PCM.
     Calculate speedometer error: (new_diameter / old_diameter - 1) * 100%.
     WK2 stock 265/60R18 = 30.5" diameter. Common upgrade 275/65R18 = 32.1" = +5.2% error.
   - Lighting mod: read BCM config DID for the specific light circuit.
     Example: DRL mode (DID varies by firmware, typically in first 10 config DIDs).
     Current value enumeration from BCM_CONFIG params with enum labels.
   - Feature enable: check if the hardware exists. Auto-fold mirrors: BCM config param
     for mirror fold enable. If hardware not present (base trim), enabling the config
     param does nothing. Read BCM DID for mirror module presence.
2. Check firmware version compatibility:
   - Read BCM SW version (DID 0xF195) and compare against known firmware variants.
   - BCM firmware "56077" uses alternate SecurityAccess (w8 algorithm for L1/L3/L5).
   - BCM firmware "14118"/"14119"/"14120" uses alternate w8 for L3 only.
3. Read vehicle options from BCM identification DIDs to confirm trim level and equipment.
### Output
Parameter audit with current vs desired values, firmware compatibility check.
### Quality Gate
Every parameter needed for the mod has a current reading.

### MAP: Identify Required Changes
### Entry Criteria
Audit complete with current values known.
### Actions
1. Build the change list: for each parameter that differs from target, record:
   - Module, DID, parameter name, bit position, bit length (from velma_obd_params.py).
   - Current raw value and new raw value.
   - Security level required for write: BCM config DIDs need SecurityAccess L1.
   - Write method: BCM via UDS 0x2E (WriteDataByIdentifier), PCM via dealer flash.
2. For BCM config writes, compute the full DID write payload:
   - Read the entire DID response (all params in that DID).
   - Modify only the target bits, preserving all other params in the same DID.
   - This prevents accidentally changing unrelated settings that share a DID.
3. Identify cross-dependencies:
   - Enabling fog-as-DRL: also check DRL disable timer, headlight auto mode, parking lamp config.
   - Tire size change: speedometer, odometer, ABS calibration, TPMS thresholds, cruise control
     speed tolerance, transmission shift points (speed-based).
4. Flag parameters that CANNOT be changed locally:
   - PCM calibration tables: SGW/AutoAuth only.
   - Airbag module parameters: never writable via standard UDS.
   - TCM shift tables: SGW/AutoAuth only.
### Output
ecu_changes array with complete DID write specifications.
### Quality Gate
Every change has both current and target values verified.

### VALIDATE: Compatibility and Safety
### Entry Criteria
Change list built.
### Actions
1. Emissions check: flag any change that affects emissions compliance:
   - Disabling catalytic converter monitor = automatic emissions test failure.
   - Removing secondary air injection = P0410-P0419 codes will set.
   - Cold air intake with recalibrated MAF: may shift fuel trims out of OBD-II limits.
   - DRL modification: some states require DRLs. Disabling = legal issue.
2. Warranty check: flag changes that void factory warranty:
   - Any PCM reflash = powertrain warranty void per Magnuson-Moss (manufacturer can prove causation).
   - BCM config changes: generally reversible, lower warranty risk.
   - Lift over 2": may void suspension and steering warranty claims.
   - Aftermarket exhaust before catalyst: voids emissions warranty.
3. Safety check: flag changes with safety implications:
   - Tire size change without speedometer correction: speed reads low, ABS thresholds wrong.
   - Disabling stability control permanently: track-only modification.
   - Modifying headlight aim without recalibration: blinds oncoming traffic.
   - Disabling TPMS: won't warn of flat tire.
4. Reversibility: verify each change can be undone by writing original values back.
   BCM config is fully reversible (backup before write in config_editor.py).
   PCM flash: reversible only if original calibration is saved.
### Output
compatibility_warnings array with severity classifications.
### Quality Gate
Every change assessed for emissions, warranty, safety, and reversibility.

### PLAN: Install Plan
### Entry Criteria
All changes validated.
### Actions
1. Order the install steps logically:
   - Mechanical work first (physical installation).
   - ECU changes after mechanical (calibrate to new hardware).
   - Verification last (confirm everything works).
2. For BCM config writes:
   - Step: backup current DID value (read + save hex).
   - Step: enter Extended Session (0x10 0x03).
   - Step: SecurityAccess L1 (seed/key via velma_obd_keycalc).
   - Step: WriteDataByIdentifier (0x2E + DID + new payload).
   - Step: re-read DID to verify write took.
   - Step: power cycle (ignition off 10s, then on) for some changes to take effect.
3. For each step, list required tools:
   - BCM config: CANable adapter, the systemOBD software.
   - Mechanical: torque wrench, jack stands, specific socket sizes for the WK2.
   - Electrical: multimeter, wire crimps, relay if adding circuits.
4. Include verification tests after install:
   - Drive test: confirm speedometer accuracy (GPS comparison if tire size changed).
   - Light test: confirm all lighting modes work as expected.
   - DTC check: read all modules for new DTCs introduced by the mod.
### Output
install_plan array with ordered steps, tools, and time estimates.
### Quality Gate
Every ECU write has a backup step and a verification step.

## Exit Criteria

1. Current vehicle config read and documented
2. Every required ECU change identified with write specifications
3. Compatibility warnings issued for emissions, warranty, safety
4. Install plan produced with backup, write, and verify steps
5. No BCM write attempted without explicit owner confirmation

## Error Handling

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| SCOPE | SecurityAccess L1 denied (NRC 0x35) | Algorithm mismatch; check firmware version for alternate constants |
| SCOPE | BCM config DID returns NRC 0x31 | DID not present in this firmware; note as unsupported |
| AUDIT | Parameter not found in velma_obd_params.py | Unknown param; warn that write position cannot be verified |
| MAP | Target DID has no writeable params | Config is read-only in this firmware; flag as dealer-only |
| VALIDATE | Mod requires PCM flash (SGW locked) | Inform owner: dealer-only; no local workaround for PCM/TCM |
| PLAN | Write fails (NRC 0x72 generalProgrammingFailure) | Retry once; if persistent, restore backup and report failure |

## State Persistence

- Vehicle config snapshot saved before any modification
- Change log: every write recorded with timestamp, old value, new value
- Mod history: track all modifications applied for future reference

## Reference

### Common WK2 BCM Feature Enables

| Feature | Config Area | Effect |
|---------|------------|--------|
| Fog as DRL | Exterior lighting | Fog lamps on with DRL |
| Auto-fold mirrors | Mirror config | Mirrors fold on lock |
| One-touch windows | Window config | All windows via key fob |
| Horn on lock | Lock/unlock | Confirmation honk |
| DRL brightness | Exterior lighting | Adjust DRL intensity level |
| Courtesy delay | Interior lighting | Time before interior lights off |
| Auto headlight sens | Exterior lighting | Light sensor threshold |
| Rain-sense wipers | Wiper config | Auto wiper with rain sensor |

### Tire Size Speedometer Error

| Tire Size | Diameter | Error vs Stock |
|-----------|----------|----------------|
| 265/60R18 (stock) | 30.5" | 0% |
| 265/65R18 | 31.6" | +3.6% |
| 275/65R18 | 32.1" | +5.2% |
| 275/70R18 | 33.2" | +8.9% |
| 285/65R18 | 32.6" | +6.9% |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
