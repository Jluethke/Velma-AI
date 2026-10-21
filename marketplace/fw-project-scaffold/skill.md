# Firmware Project Scaffold

**One-line description:** Creates the firmware project for a board with one generated board definition file from the pin map, hardware-independent logic separated from hardware access, one driver per interface, and a watchdog, and with no code path able to override a hardware interlock.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pin_map` (object[], required): Pin map from `fw-pin-map` with no unresolved defects.
- `board_spec` (object, required): Interfaces with protocols, rates, and roles.
- `critical_circuits` (object[], required): Circuits whose control the hardware reserves.
- `project_dir` (string, required): User project directory where the firmware source lives.
- `firmware_framework` (string, optional): "zephyr", "esp-idf", "stm32cube", "pico-sdk", or "arduino". Default: the device vendor's framework (esp-idf for Espressif, stm32cube for STM32, pico-sdk for RP2040/RP2350), else zephyr when the device is supported there.

---

## Outputs

- `firmware_source` (string): Path to the firmware project in `project_dir`, containing the generated board definition, the logic modules, one driver stub per interface, the watchdog setup, and a host test target.

---

## Phase 1: Create the Project

### Entry Criteria
- `pin_map` present and `schematic_defects` empty.

### Actions
1. Resolve the framework from `firmware_framework` or the default rule, and confirm its toolchain is installed (`west --version`, `idf.py --version`, or `pio --version`). If missing, list install steps and stop for the user's approval.
2. Create the project in `project_dir/firmware` with the framework's standard layout.
3. Generate the board definition from `pin_map` into one file: a devicetree overlay for Zephyr, a `board_pins.h` header for the other frameworks. Every pin assignment in the firmware comes from this file.

### Output
Project skeleton with the generated board definition.

### Quality Gate
- Every `pin_map` row appears in the board definition file and nowhere else in source.
- The empty project builds once with the framework command.

---

## Phase 2: Lay Out Modules

### Entry Criteria
- Skeleton builds.

### Actions
1. Create a `logic/` directory for hardware-independent code (protocol framing, parsers, state machines) that includes no framework or vendor headers.
2. Create a `drivers/` directory with one driver per interface in `board_spec`, each exposing a small API the logic calls.
3. Create a `test/` host target that compiles `logic/` with the host compiler and a unit test framework (Unity, or ztest under native_sim for Zephyr).
4. Enable the hardware watchdog in startup code with a timeout of at most 3x the main loop period. On watchdog reset every output returns to its reset state from `pin_map`.

### Output
Module layout, host test target, watchdog setup.

### Quality Gate
- `logic/` compiles for the host with no hardware headers.
- Watchdog is enabled and its timeout is recorded.

---

## Phase 3: Bound the Firmware's Authority

### Entry Criteria
- Module layout complete.

### Actions
1. For each entry in `critical_circuits`, record the firmware's allowed role: read status, and request a safe state.
2. Confirm no driver writes a pin or bus command that can hold an interlock or emergency stop in its run state against the hardware. Firmware drives a stop request line only in the direction that stops.
3. Write these limits as a comment block at the top of each affected driver.

### Output
Final `firmware_source`.

### Quality Gate
- Every critical circuit has a recorded firmware role limited to status and stop request.
- Zero driver code paths can block a hardware stop.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Create a firmware project with one generated board definition from the pin map, , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when the project builds, pin assignments live in one generated file, logic compiles on the host, the watchdog is on, and firmware authority over critical circuits is limited to status and stop requests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework toolchain missing | **Stop**: list install steps, wait for user approval. |
| Phase 1 | `schematic_defects` not empty | **Stop**: return to the schematic flow. |
| Phase 2 | Device has no hardware watchdog | **Adjust**: use an external watchdog if the schematic has one; otherwise report as a schematic defect. |
| Phase 3 | Interface design requires firmware to hold a run state | **Escalate**: report it; the hardware must own the run state. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
