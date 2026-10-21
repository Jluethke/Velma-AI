# Mod Planner

Plans and executes BCM configuration changes on your vehicle. Takes a desired modification in plain language ("enable daytime running lights", "change horn chirps on lock to 1", "disable auto-lock at 15 mph"), maps it to the exact BCM DID and parameter value in the the systemOBD database (826 configurable parameters for device 14165), assesses risk, creates a backup of current settings, writes the change, and verifies. Designed for the owner who wants to customize their vehicle's behavior without guessing which of 826 parameters to touch.

## Execution Pattern: Phase Pipeline

```
PHASE 1: RESEARCH    --> Map the desired mod to specific BCM DID(s) and parameter(s)
PHASE 2: RISK ASSESS --> Evaluate safety, warranty, legal, and reversibility implications
PHASE 3: BACKUP      --> Read and save current value of every parameter being changed
PHASE 4: EXECUTE     --> Write the new value via UDS WriteDataByIdentifier (0x2E)
PHASE 5: VERIFY      --> Re-read the parameter and confirm the change took effect
```

## Inputs
- `vehicle`: object -- Year, make, model, VIN (determines exact BCM hardware and firmware version, which selects the correct parameter set). BCM device_id (14165 for the target vehicle platform, read from DID 0xFD10 or known from prior scans).
- `desired_mod`: string -- Plain-language description of what the user wants to change. Examples: "make the horn chirp once when I lock instead of twice", "enable daytime running lights", "turn off the seatbelt chime", "change the auto-lock speed", "disable the welcome lights when unlocking."
- `constraints`: object -- (Optional) User preferences: "no safety-related changes", "reversible only", "don't touch lighting if it affects inspection." Default: all safety-critical parameters are locked unless explicitly overridden.

## Outputs
- `feasibility`: object -- Whether the mod is possible, which parameter(s) it requires, and any caveats. If not possible, why (parameter not configurable, not present for this hardware, requires a flash rather than config write).
- `bcm_config_changes`: array -- Each change: DID (hex), parameter name, current value, new value, bit position, bit length, description of what changes.
- risk_assessment: object -- Risk level (low/medium/high), what could go wrong, whether the change is reversible with a config write, whether it affects safety systems, emissions, or state inspection.
- backup: object -- Complete snapshot of current values for every DID being modified. JSON format. Restorable.
- verification: object -- Post-write read of each changed parameter, confirming new value matches intended value.
- `ecu_changes`: (from manifest)
- `compatibility_warnings`: (from manifest)
- `install_plan`: (from manifest)

## Execution

### Phase 1: RESEARCH
### Entry Criteria
Desired mod described. Vehicle BCM device_id known or determinable.
### Actions
1. Parse the desired modification and identify the BCM function area:
   - **Lighting:** DRL enable/disable, headlight auto-off delay, courtesy light duration, welcome light behavior, fog light with high beam, turn signal flash count for lane change.
   - **Locking:** Horn chirp count on lock (0, 1, 2), auto-lock speed threshold (0 = disabled, 15/20/25 mph), auto-unlock on park, re-lock timeout, lock confirmation flash count.
   - **Wipers:** Rain-sensing sensitivity, intermittent delay range, speed-proportional wipe.
   - **Chimes:** Seatbelt chime delay/disable, key-in-ignition chime, headlights-on chime, door-ajar chime volume.
   - **Windows:** One-touch up enable (driver only vs all), auto-close on lock (if equipped), rain-close.
   - **Mirrors:** Auto-fold on lock, auto-dim sensitivity, reverse tilt-down angle.
   - **Remote start:** Run time (10, 15, 20 min), climate control auto-on, heated seat auto-on.
2. Search the BCM parameter database (826 params for device 14165, organized across 53 DIDs) for the matching parameter(s). Each parameter is defined by:
   - DID: the 2-byte identifier used in UDS ReadDataByIdentifier (0x22) and WriteDataByIdentifier (0x2E).
   - Bit position: starting bit within the DID response payload.
   - Bit length: number of bits (1 = boolean on/off, 2+ = enumerated value).
   - Allowed values: the enumeration or range of valid values.
   - Group name: the functional group (e.g., "LOCKING FEATURES", "EXTERIOR LIGHTING").
3. If the mod maps to more than one parameter, list all of them. Some mods require multiple changes:
   - "Enable DRL" might require: DRL master enable (1 bit) + DRL brightness level (2-4 bits) + DRL source selection (headlamp vs dedicated).
4. If the mod is not possible via BCM configuration:
   - The parameter doesn't exist in the database: "This vehicle's BCM does not expose a configuration option for [feature]. The behavior may be hardcoded in firmware."
   - The parameter exists but is read-only: "This parameter can be read but not written. It may require dealer-level flash reprogramming."
   - The mod requires hardware: "Enabling heated mirrors requires the heated mirror hardware to be installed. The BCM config controls the feature, but the physical heater elements must be present."
5. Present the proposed changes to the user before proceeding: "To change horn chirps on lock from 2 to 1, I'll write DID 0xNNNN parameter 'LOCK_HORN_CHIRPS' from value 0x02 to 0x01 (bit offset N, length N bits)."

### Output
Proposed parameter change list with DID, parameter name, current value, new value, and user-readable description.
### Quality Gate
Every proposed change maps to a specific DID, bit position, and valid value. User has confirmed the intent before proceeding.

### Phase 2: RISK ASSESS
### Entry Criteria
Proposed changes identified.
### Actions
1. Classify each parameter change by risk:
   - **Low risk:** Cosmetic or convenience changes with no safety impact. Examples: horn chirp count, courtesy light duration, welcome light enable, auto-lock speed, wiper sensitivity.
   - **Medium risk:** Changes that affect vehicle behavior but are easily reversible and don't impair safety. Examples: DRL enable (changes light behavior that other drivers see), auto-dim mirror sensitivity, one-touch window enable.
   - **High risk:** Changes that touch safety-adjacent systems. Examples: seatbelt chime disable (legal in some states, not others), headlight auto-off delay to "never" (drains battery if forgotten), any parameter that affects ABS, airbag, or stability control behavior.
2. For each change, evaluate:
   - **Reversibility:** Can the original value be restored with another config write? Almost all BCM config parameters are reversible. Flag any that are one-way.
   - **State inspection impact:** Would this change cause the vehicle to fail a state inspection? DRL disable is fine in most states. Seatbelt chime disable varies. Headlight modifications may affect inspection.
   - **Warranty impact:** Under the Magnuson-Moss Warranty Act, a dealer must prove that a modification caused the failure being claimed. BCM config changes do not void the entire warranty, but a dealer might flag them. Restoring to factory settings before service is prudent.
   - **Insurance impact:** Most BCM config changes have zero insurance impact. Lighting changes that affect visibility could theoretically be raised in an accident investigation.
3. Check the CRITICAL SAFETY GUARDRAIL: the following parameter groups are blocked by default:
   - Anything in the ABS/ESP parameter space.
   - Anything that disables airbag functionality.
   - Anything that affects brake light behavior.
   - Anything that disables stability control indicators.
   - The user must explicitly acknowledge and override this block. Even then, the flow recommends against it.
4. Produce a risk summary: "This is a LOW RISK change. It affects convenience only (horn chirp count). Fully reversible. No safety, inspection, warranty, or insurance implications."

### Output
Risk classification per parameter, reversibility confirmation, regulatory notes, safety guardrail check.
### Quality Gate
Every change has a risk level. Safety guardrail evaluated. User informed of any medium or high risk items before proceeding.

### Phase 3: BACKUP
### Entry Criteria
User has approved the changes after risk assessment.
### Actions
1. Connect to the BCM on CAN-IHS (125 kbps, TX=0x78A, RX=0x50A).
2. Switch to extended diagnostic session (UDS DiagnosticSessionControl, service 0x10, sub-function 0x03).
3. For each DID being modified, read the current value using ReadDataByIdentifier (service 0x22):
   - Send: `22 [DID high byte] [DID low byte]`
   - Receive: `62 [DID high byte] [DID low byte] [payload bytes]`
   - Store the complete payload (all bytes in the DID response, not just the target parameter). BCM DIDs contain multiple parameters packed into the same response.
4. Save the backup as a timestamped JSON file:
   ```
   {
     "date": "2026-10-20T15:30:00",
     "vehicle_vin": "1C4RJFBG9LC310409",
     "bcm_device_id": 14165,
     "bcm_firmware": "19213F",
     "changes": [
       {
         "did": "0xNNNN",
         "did_name": "LOCKING FEATURES",
         "full_payload_hex": "0A3F...",
         "target_param": "LOCK_HORN_CHIRPS",
         "original_value": 2,
         "new_value": 1
       }
     ]
   }
   ```
5. Verify the backup file is written and parseable before proceeding. This is the undo mechanism.

### Output
Backup JSON file with timestamped complete DID payloads for every modified parameter.
### Quality Gate
Every DID involved has its full payload backed up (not just the target bits). Backup file is valid JSON and confirmed written to disk.

### Phase 4: EXECUTE
### Entry Criteria
Backup confirmed. User has given final approval.
### Actions
1. If the BCM requires SecurityAccess for writes (level depends on the parameter group):
   - Request seed: `27 01` (level 1, most config writes).
   - Compute key using the the systemOBD keycalc (w9 algorithm with BCM constants for the detected firmware version).
   - Send key: `27 02 [key bytes]`.
   - Verify positive response `67 02`. If NRC 0x35 (invalidKey): do NOT retry more than once. Two failures trigger a ~12-second lockout. Power-cycle the BCM (disconnect battery for 30 seconds) before trying again.
2. For each parameter change:
   - Read the current full DID payload (to get the latest state, in case anything changed since backup).
   - Modify only the target bits within the payload. Do NOT write the entire DID from scratch. The DID contains other parameters that must remain untouched.
   - Write using WriteDataByIdentifier (service 0x2E):
     - Send: `2E [DID high byte] [DID low byte] [modified payload]`
     - Expect positive response: `6E [DID high byte] [DID low byte]`
   - If NRC 0x31 (requestOutOfRange): the DID is read-only or the value is outside allowed range.
   - If NRC 0x72 (generalProgrammingFailure): the write failed at the EEPROM level. Do not retry immediately.
   - If NRC 0x33 (securityAccessDenied): SecurityAccess is required for this DID and was not obtained or expired.
3. Maintain TesterPresent (service 0x3E, sub-function 0x00) every 2 seconds during the session to prevent timeout.
4. After all writes, exit the diagnostic session or let it timeout naturally.

### Output
Write results per parameter: success or failure with NRC code.
### Quality Gate
Every write has a confirmed positive response. Any failure stops the sequence (don't continue writing if one fails). Backup is still intact for rollback.

### Phase 5: VERIFY
### Entry Criteria
All writes reported success.
### Actions
1. Wait 1 second after the last write to allow EEPROM commit.
2. Re-read each modified DID using ReadDataByIdentifier (0x22).
3. Compare the read-back value to the intended value:
   - Extract the specific bits at the target parameter's bit position and length.
   - If the read-back matches the intended value: CONFIRMED.
   - If the read-back matches the ORIGINAL value: the write did not take effect. The parameter may require a BCM reset (ignition cycle) to commit.
   - If the read-back is a different unexpected value: something went wrong. Restore from backup immediately.
4. If the change requires a vehicle restart to take effect (some parameters apply only on next ignition cycle):
   - Note: "Change written and verified in BCM memory. Turn the ignition off and back on to activate."
   - Some changes (like horn chirps) take effect immediately. Others (like auto-lock speed) activate on next key cycle.
5. Produce the verification report:
   - "LOCK_HORN_CHIRPS: was 2, now 1. VERIFIED. Change will take effect immediately."
6. Log the change to the modification history.

### Output
Verification report: parameter, old value, new value, read-back confirmed, activation notes.
### Quality Gate
Every changed parameter read back and confirmed. Any mismatch triggers an alert and rollback offer.


---

## Worked Example

Illustrative only.

Given typical inputs for Vehicle modification planner that checks ECU calibrations, identifies which modu, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) desired mod mapped to specific BCM parameters, (2) risk assessed and user approved, (3) current values backed up to JSON, (4) new values written and positive responses received, (5) read-back verification confirms the change.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| RESEARCH | Desired mod doesn't map to any known BCM parameter | Report as not configurable via BCM. Suggest checking if the mod requires ECU flash, aftermarket module, or physical modification instead |
| RESEARCH | Parameter exists but vehicle hardware doesn't support the feature | Explain: "The BCM has a config option for heated mirrors, but this trim level doesn't have heated mirror hardware. Enabling it in software won't create the heaters" |
| RISK ASSESS | Change touches a safety-critical parameter | Block by default. Require explicit user override with acknowledgment: "I understand this affects [safety system] and accept the risk." Log the override |
| BACKUP | Cannot read the DID (NRC 0x31 or timeout) | Do not proceed with writes. Diagnose the communication issue first. May need to check CAN bus connection, BCM power, or session state |
| EXECUTE | SecurityAccess denied (NRC 0x35 invalidKey) | Single retry after verifying firmware version matches keycalc constants. If second failure, power-cycle BCM and try once more. If still failing, the firmware version may not match any known algorithm variant |
| EXECUTE | Write fails (NRC 0x72 generalProgrammingFailure) | Do not retry. This indicates an EEPROM issue. All values should still be at their pre-write state. Verify by reading back. If other parameters were already written successfully, offer to restore them from backup |
| VERIFY | Read-back doesn't match intended value | Offer immediate rollback from backup. If the read-back matches the original value, the write likely needs an ignition cycle. Instruct user to cycle ignition and re-verify |
| ACT | User wants to undo the change | Restore from the backup JSON: write the original payload back to each modified DID. Re-verify |

## State Persistence
- Modification history (date, parameter, old value, new value, backup file path)
- BCM firmware version (determines which SecurityAccess algorithm variant to use)
- Backup archive (all backup JSONs retained, never overwritten, for complete rollback to any previous state)
- Known working configurations (user-confirmed good combinations that can be applied as presets)
- Failed write log (parameters that refused writes, to avoid re-attempting known failures)

## Reference

### Popular target vehicle BCM Mods

| Mod | Parameter | DID Group | Risk | Notes |
|---|---|---|---|---|
| Horn chirp count on lock | LOCK_HORN_CHIRPS | Locking | Low | Values: 0 (none), 1, 2 |
| Auto-lock at speed | AUTO_LOCK_SPEED | Locking | Low | 0=disabled, 15/20/25 mph |
| Auto-unlock in park | UNLOCK_ON_PARK | Locking | Low | Enable/disable |
| DRL enable | DRL_ENABLE | Exterior Lighting | Medium | Requires brightness param too |
| Headlight off delay | HEADLIGHT_OFF_DELAY | Exterior Lighting | Low | 0/30/60/90/120 seconds |
| Courtesy light duration | COURTESY_LIGHT_TIME | Interior Lighting | Low | 15/30/60/120 seconds |
| Rain-sense wiper sensitivity | RAIN_SENSE_DEFAULT | Wipers | Low | 1-5 scale |
| One-touch window up | ONE_TOUCH_UP | Windows | Low | Driver only or all windows |
| Seatbelt chime delay | BELT_CHIME_DELAY | Chimes | Medium | Seconds before chime starts |
| Mirror fold on lock | MIRROR_FOLD_LOCK | Mirrors | Low | Enable/disable (needs fold motors) |

### UDS Write Sequence (BCM Config)

```
1. 10 03              --> ExtendedDiagnosticSession
2. 27 01              --> SecurityAccess requestSeed (Level 1)
3. 27 02 XX XX XX XX  --> SecurityAccess sendKey
4. 22 NN NN           --> ReadDataByIdentifier (read current)
5. 2E NN NN DD DD ... --> WriteDataByIdentifier (write modified)
6. 22 NN NN           --> ReadDataByIdentifier (verify)
7. 3E 00              --> TesterPresent (keepalive, every 2s)
```

### NRC (Negative Response Code) Reference

| NRC | Hex | Meaning | Action |
|---|---|---|---|
| subFunctionNotSupported | 0x12 | DID doesn't support this operation | Check DID is writable |
| requestOutOfRange | 0x31 | DID not recognized or value invalid | Verify DID exists for this BCM version |
| securityAccessDenied | 0x33 | Not unlocked or session expired | Re-run SecurityAccess sequence |
| invalidKey | 0x35 | Wrong key computed | Check firmware version, try once more |
| exceededNumberOfAttempts | 0x36 | Too many failed key attempts | Wait 12s or power-cycle BCM |
| generalProgrammingFailure | 0x72 | EEPROM write failed | Do not retry, check backup |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
