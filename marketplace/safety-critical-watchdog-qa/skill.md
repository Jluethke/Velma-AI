# Safety Critical Watchdog Qa

Implement a question-and-answer watchdog protocol using an external watchdog IC for the highest diagnostic coverage in safety-critical systems.

## Inputs

- `self-test-suite`: Runtime self-tests that must pass before answering the watchdog
- `watchdog-config`: External watchdog IC specifications and communication interface

## Outputs

- `qa-watchdog-protocol`: Communication protocol with the external watchdog: seed exchange, response calculation, timing constraints, and error handling
- `safety-design-document`: Complete safety mechanism design: watchdog strategy, self-tests, diagnostic coverage calculation, and safe state definitions with verification plan

## Process

1. Select an external watchdog IC with Q&A capability (e.g., TI TPS3431, Infineon TLE9278). These ICs send a random seed to the MCU over SPI or a dedicated pin protocol. The MCU must compute the correct response (typically a CRC or polynomial calculation) and send it back within the timeout.
2. Integrate the Q&A exchange into the supervisor task flow: (1) all task check-ins verified, (2) all self-tests passed since last cycle, (3) read the seed from the watchdog IC, (4) compute the response, (5) send the response. If any step fails, do not respond, and the watchdog will reset the system.
3. The response calculation must be done by the application CPU, not a peripheral or DMA. This ensures the CPU is actually executing correct code. The calculation is typically a CRC or LFSR-based polynomial that is fast (under 100 us) but cannot be satisfied by a stuck value.
4. Handle the safe state transition: when the watchdog resets the system, the bootloader must check a flag or counter to determine if this was a watchdog reset (not a power-on reset). After N consecutive watchdog resets (e.g., 3), enter a permanent safe state (outputs de-energized, error indication active) rather than continuing to reset.
5. Document the complete safety design: fault model (what can go wrong), detection mechanism (which test or monitor catches it), reaction (safe state transition), and diagnostic coverage (per IEC 61508 or ISO 26262 methodology). This document is required for safety certification and must be maintained as the design evolves.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
