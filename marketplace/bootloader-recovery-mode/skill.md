# Bootloader Recovery Mode

Design the recovery mode: entry conditions, fail-safe communication interface, factory reset capability, and brick prevention.

## Inputs

- `boot-time-breakdown`: Boot timing analysis showing where failures can occur
- `optimization-actions`: Optimized boot path that recovery must be independent of

## Outputs

- `recovery-design`: Recovery entry conditions (button hold, magic byte, boot failure counter), recovery communication interface, and factory reset procedure
- `bootloader-design-document`: Complete bootloader specification: boot stages, secure boot, update mechanism, boot time budget, recovery mode, and test plan

## Process

1. Define recovery entry conditions. Primary: hardware button held during reset (check GPIO state in bootloader before jumping to app). Secondary: boot failure counter (increment on each boot attempt, clear on successful app confirmation; enter recovery after 3 consecutive failures). Tertiary: magic value written to a specific RAM address that survives reset (warm reset recovery trigger).
2. The recovery communication interface must be independent of the application firmware. Use the ROM bootloader's built-in UART/USB bootloader if available, or implement a minimal protocol in the first-stage bootloader. This interface must work even if the application and second-stage bootloader are both corrupted.
3. Implement factory reset: erase the application slots and configuration, then load the factory image from a write-protected flash region. The factory image must be old enough to be stable but new enough to include the update mechanism for field upgrades.
4. Prevent bricking by design. The first-stage bootloader must be in write-protected flash (use option bytes or flash protection bits). It must be small enough to be thoroughly tested and rarely updated. If it must be updated, the ROM bootloader serves as the last-resort recovery.
5. Document the complete bootloader design: flash map, boot sequence with timing, secure boot chain, update state machine, recovery procedures, and a test matrix covering every state transition including power loss at each step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
