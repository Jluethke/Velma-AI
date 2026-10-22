# Runtime Self Test Design

Implement runtime self-tests for CPU, RAM, flash, and clock monitoring as required by IEC 61508 and ISO 26262 for each safety integrity level.

## Inputs

- `task-monitoring-design`: Task supervision mechanism that self-tests integrate into
- `safety-requirements`: Target SIL/ASIL level determining required diagnostic coverage

## Outputs

- `self-test-suite`: Each test: what it checks, algorithm, execution time, frequency, and diagnostic coverage contribution
- `safe-state-transition`: For each detectable fault: the safe state to enter, the transition procedure, and the maximum time from detection to safe state

## Process

1. CPU register test: verify that each CPU register can hold all-zeros and all-ones without stuck bits. For ARM Cortex-M, test R0-R12, LR, PSP, MSP, APSR flags. Run at startup and periodically. Use a checkerboard pattern and its complement. Disable interrupts during the test to prevent register corruption by ISRs.
2. RAM test: use a march test algorithm (March C- provides good fault coverage with reasonable execution time). Test RAM in sections: copy the section to a backup area, run the march test, restore from backup. Do not test the section containing the test code's stack. Test each section periodically, rotating through all RAM over time.
3. Flash integrity test: compute CRC-32 over the flash contents and compare against a reference CRC stored at a known flash address (calculated at build time and embedded by the linker). Test the full image at startup. At runtime, test in sections to spread the CPU load: verify N pages per main-loop cycle, completing a full sweep every M seconds.
4. Clock monitoring: use the MCU's clock security system (CSS on STM32) to detect external oscillator failure and automatically switch to the internal RC oscillator. Additionally, cross-check the system clock against an independent time source: compare a timer clocked from the main oscillator against the RTC (clocked from LSE or LSI). A deviation beyond the expected tolerance indicates a clock fault.
5. Program flow monitoring: verify that the software executes the expected sequence of steps. Implement with a signature variable: each critical code block XORs a unique value into the signature. At a checkpoint, compare the signature against the expected value for that execution path. A wrong signature indicates that code was skipped, repeated, or corrupted.
6. Map each self-test to the fault model in IEC 61508 Table A.1 or ISO 26262 Part 5. Calculate the overall diagnostic coverage: DC = sum(coverage_i * failure_rate_i) / total_failure_rate. SIL 2 requires DC of at least 90%, SIL 3 requires 99%.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
