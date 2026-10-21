# Firmware Flash and Verify

**One-line description:** Flashes firmware onto a board only after power and critical-circuit bring-up steps pass, proves the exact artifact is running with the post-flash check, and measures that every load-driving output sits de-energized through reset and boot.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `firmware_build` (object, required): Artifact path, SHA-256, and the firmware project location.
- `flash_procedure` (string[], required): Programmer, connection, command, post-flash check.
- `bringup_log` (object[], required): Must show every power and critical-circuit step passed.
- `pin_map` (object[], required): Device pins with net, function, and required reset state, from `fw-pin-map`.

---

## Outputs

- `flash_log` (object): Flash command output summary, the artifact SHA-256 observed in the post-flash check, measured pin levels for each load-driving output during reset and after boot, the watchdog reset result, and PASS or FAIL.

---

## Phase 1: Gate and Flash

### Entry Criteria
- `bringup_log` shows PASS on every power and critical-circuit step.

### Actions
1. Confirm the gate from `bringup_log`. Flashing an unproven board risks damage that masks the real fault.
2. Power the board from the current-limited bench supply as in bring-up.
3. Follow `flash_procedure` exactly: connect the programmer, run the flash command, record its result.
4. Run the post-flash check and record the observed version string or LED pattern; it must carry the artifact SHA-256 prefix from `firmware_build`.

### Output
Flash result and identity check.

### Quality Gate
- The observed identity matches the artifact SHA-256 prefix.
- Supply current after boot stays within the bring-up idle figure plus the firmware's expected load.

---

## Phase 2: Verify Safe States

### Entry Criteria
- Identity confirmed.

### Actions
1. From `pin_map`, list every output that drives a load (relay, gate, enable, standby) with its required reset state, and confirm the generated board definition in the firmware project assigns the same pins.
2. Hold the device in reset and measure each listed output; then release and measure again after boot with no command given. Every one must read the reset state `pin_map` requires both times.
3. Force a watchdog reset (a debug command or by halting the main loop in a test build) and confirm every listed output returns to the de-energized level.
4. Set PASS only when all checks pass.

### Output
`flash_log`.

### Quality Gate
- Every load-driving output reads de-energized in reset, after boot, and after a watchdog reset.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Flash firmware only after bring-up passes, prove the exact artifact runs, and me, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when the board runs the exact built artifact and every load-driving output is measured de-energized through reset, boot, and watchdog reset.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bring-up gate not passed | **Stop**: return to `hw-bench-bringup-log`. |
| Phase 1 | Flash fails to connect | **Adjust**: check programmer wiring against `flash_procedure`, power, and boot mode pins; retry once, then escalate with the error text. |
| Phase 2 | An output energizes at reset or boot | **Return**: to `fw-pin-map` as a schematic defect (missing pull) or to `fw-project-scaffold` if firmware drives it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
