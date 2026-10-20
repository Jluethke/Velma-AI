# Firmware Target Build

**One-line description:** Builds tested firmware for the target device headless with warnings as errors, checks flash and RAM against capacity, and writes the exact flash procedure with a post-flash check observable without a debugger.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `firmware_source` (string, required): Implemented firmware project.
- `firmware_tests` (object, required): Host test results; all must pass.
- `bom` (object[], required): BOM, for the device part number, its flash and RAM capacity, and the programming interface.

---

## Outputs

- `firmware_build` (object): Build command, toolchain version, artifact path, artifact SHA-256, flash and RAM use with percent of capacity, and warning count (zero).
- `flash_procedure` (string[]): Programmer, physical connection, flash command, and the post-flash check.

---

## Phase 1: Build

### Entry Criteria
- `firmware_tests` shows every test passing.

### Actions
1. Enable warnings as errors in the build configuration (`-Wall -Wextra -Werror` or the framework equivalent).
2. Build for the target headless: `west build -b <board>`, `idf.py build`, or `pio run -e <env>`.
3. Fix every warning at its cause; rebuild until clean.
4. Record the toolchain version, artifact path, and the artifact's SHA-256.

### Output
Clean build artifact.

### Quality Gate
- Build completes with zero warnings.
- Artifact SHA-256 recorded.

---

## Phase 2: Check Resources

### Entry Criteria
- Clean artifact exists.

### Actions
1. Read flash and RAM use from the build output or the linker map.
2. Compare against the device capacity from the datasheet.
3. If either exceeds 80%, enable size optimization (`-Os`) and remove unused features, then rebuild and recheck.

### Output
Resource figures in `firmware_build`.

### Quality Gate
- Flash and RAM use each stay under 80% of capacity.

---

## Phase 3: Write the Flash Procedure

### Entry Criteria
- Resources within limits.

### Actions
1. Identify the programming interface from the schematic (SWD, JTAG, USB DFU, UART bootloader) and the programmer that fits it.
2. Write the physical connection, pin by pin, to the board's programming header.
3. Write the flash command (`west flash`, `idf.py -p <port> flash`, `pio run -t upload`, or the vendor CLI).
4. Define a post-flash check visible without a debugger: a version string with the artifact SHA-256 prefix on a serial console, or a defined LED pattern.

### Output
`flash_procedure`.

### Quality Gate
- Every step names exact pins, tool, and command.
- The post-flash check identifies this exact artifact.

---

## Exit Criteria

DONE when the target build is clean, resources sit under 80%, and the flash procedure ends in a check that proves this artifact is running.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Host tests not passing | **Stop**: return to `fw-drivers-logic`. |
| Phase 1 | Target toolchain missing | **Stop**: list install steps, wait for user approval. |
| Phase 2 | Over 80% after optimization | **Escalate**: report the device as undersized with the figures. |
| Phase 3 | No programming header in schematic | **Record defect**: return to the schematic flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
