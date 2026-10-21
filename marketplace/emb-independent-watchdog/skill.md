# Independent Watchdog Configuration and Test

**One-line description:** Configures an independent watchdog (for example the STM32 IWDG) with a timeout computed over the oscillator's datasheet tolerance range, refreshes it only from a supervisor that confirms every task checked in, freezes it during debug, and proves it by hanging a task and reading the reset cause flag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image.
- `reference_manual` (string, required): MCU reference manual watchdog and reset chapters, and the datasheet table for the watchdog's oscillator.
- `max_loop_period_ms` (number, required): The longest legitimate interval between two supervisor refreshes, measured or derived from the task design. Not guessed.

---

## Outputs

- `watchdog_record` (object): Prescaler and reload values, timeout range at oscillator minimum and maximum, refresh design, debug freeze setting, and the hang test result with reset flag reading.

---

## Phase 1: Compute the Timeout Range

### Entry Criteria
- `max_loop_period_ms` is a number with a stated source.

### Actions
1. Read the watchdog timeout formula in the reference manual. For STM32 IWDG: timeout = (4 x 2^PR) x (RLR + 1) / f_LSI, where PR is the prescaler field and RLR the 12-bit reload value; confirm for your part.
2. Read the watchdog oscillator frequency range (minimum and maximum) from the datasheet table (for STM32, the LSI oscillator characteristics table). Internal RC oscillators vary widely; use both ends.
3. Compute the timeout at f_max (shortest) and f_min (longest).
4. Requirement: shortest timeout > `max_loop_period_ms`. Choose PR and RLR to satisfy it. The longest timeout is how long a hang lasts before reset; record it for the system owner.

### Output
PR, RLR, timeout range.

### Quality Gate
- Both timeout values are shown as arithmetic with cited oscillator limits.
- Shortest timeout is greater than `max_loop_period_ms`.

---

## Phase 2: Refresh Design

### Entry Criteria
- Values chosen.

### Actions
1. Never refresh from a timer interrupt or SysTick; those keep running when tasks hang.
2. Supervisor pattern: each monitored task sets its bit in a shared check-in word each cycle (atomic set or critical section). A supervisor task (or the main loop in bare metal) refreshes the watchdog only when all bits are set, then clears the word.
3. Start sequence for STM32 IWDG: write 0xCCCC to `IWDG_KR` to start, 0x5555 to unlock `PR` and `RLR`, write values, wait for the status register update flags to clear, then refresh with 0xAAAA. Read the IWDG chapter for your part's exact order. Once started, the IWDG cannot be stopped except by reset.
4. Debug freeze: set the debug control bit that stops the watchdog when the core halts (STM32: `DBG_IWDG_STOP` in the DBGMCU APB freeze register). Without it, every breakpoint causes a reset.
5. Boot code reads the reset cause flags (STM32 `RCC_CSR`: `IWDGRSTF`), logs them, then clears them (`RMVF`). Without clearing, the flag persists and later resets cannot be told apart.
6. Optional hardware-start option byte (for STM32, `IWDG_SW` cleared starts the watchdog at reset). Changing option bytes needs the vendor tool (STM32CubeProgrammer) and care; record the decision, do not change it in this flow.

### Output
Refresh code, debug freeze, reset-cause logging.

### Quality Gate
- `grep -rn "0xAAAA\|IWDG_ReloadCounter\|HAL_IWDG_Refresh" src/` shows refresh only in the supervisor (file and line recorded).
- Reset cause logging prints at boot (log line recorded).

---

## Phase 3: Hang Test

### Entry Criteria
- Test build with a command or button that makes one monitored task loop forever.
- If the device controls an actuator, this test runs on a bench with the actuator disconnected or behind an independent hardware emergency stop.

### Actions
1. Run normally for longer than the longest timeout; confirm no reset occurs (boot counter or log unchanged).
2. Trigger the hang. Confirm a reset occurs within the longest timeout.
3. At the next boot, confirm the log shows the watchdog reset flag set.
4. Repeat with the debugger halted at a breakpoint for longer than the timeout; confirm no reset (debug freeze works).

### Output
`watchdog_record`.

### Quality Gate
- Normal run: zero resets over the observation period (log recorded).
- Hang: reset observed and the watchdog reset flag logged.
- Halted debugger: no reset.

---

## Worked Example

Illustrative. STM32F411, `max_loop_period_ms` = 120 (measured supervisor cycle worst case). Datasheet LSI range used from the LSI table, for example 17 kHz to 47 kHz.

- Phase 1: PR = 3 (divider 32), RLR = 299: at 47 kHz timeout = 32 x 300 / 47000 = 204 ms; at 17 kHz = 565 ms. 204 > 120.
- Phase 2: three tasks check in; supervisor refreshes when mask = 0x7. `DBG_IWDG_STOP` set.
- Phase 3: hang command on `comms` task; reset after about 0.3 s; boot log `reset cause: IWDG`. Breakpoint held 10 s: no reset.

---

## Exit Criteria

DONE when the shortest timeout exceeds the longest legitimate refresh interval, refresh depends on every task checking in, and the hang test resets the device with the watchdog flag logged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No PR and RLR satisfy the requirement | **Return**: shorten the supervisor cycle or report the conflict. |
| Phase 2 | Resets during debugging | **Adjust**: set the debug freeze bit. |
| Phase 3 | Spurious reset in normal run | **Stop**: measure the real refresh interval; `max_loop_period_ms` was wrong. |
| Phase 3 | No reset on hang | **Adjust**: a timer interrupt or other path still refreshes; remove it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
