# Independent Hardware Watchdog on a Microcontroller (STM32 HAL or Zephyr)

**One-line description:** Configures an independent hardware watchdog clocked from a separate oscillator (STM32 IWDG through the HAL, or the Zephyr watchdog API), refreshes it only after every safety-relevant task has proven progress in the current cycle, makes the reset reaction leave actuators de-energized, and verifies timeout and reset cause on the target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`; supplies the detection-plus-reaction budget.
- `mcu_part` (string, required): Exact part number (for example `STM32F407VGT6`) used to open the right reference manual and datasheet.
- `firmware_dir` (string, required): Path to the firmware project (STM32Cube project or Zephyr application).

---

## Outputs

- `watchdog_config` (object): `stack`, `mechanism` (IWDG, WWDG, external IC, Zephyr driver), `clock_source`, `timeout_ms_computed` (with formula and datasheet clock range), `refresh_location` (file:line), `task_check_scheme`, `debug_freeze_setting`, `reset_cause_check` (file:line), `test_results`.

---

## Phase 1: Compute the Timeout

### Entry Criteria
- A TSR states the watchdog's detection budget, or an open question about it exists.
- The reference manual and datasheet for `mcu_part` are open.

### Actions
1. Identify the watchdog with its own clock. On STM32 this is the IWDG, clocked by the LSI RC oscillator. Read the LSI minimum and maximum frequency from the datasheet electrical characteristics table, not the nominal value.
2. Compute the timeout from the reference manual formula. For STM32 IWDG: `t = (4 * 2^PR) * (RLR + 1) / f_LSI`, where PR is the prescaler register value and RLR is the 12-bit reload value. Compute at both f_LSI min and max; the slowest clock gives the longest timeout.
3. The longest timeout must be inside the detection budget from the TSR. The shortest timeout must be longer than the worst-case refresh interval measured in Phase 3. If the budget is missing, keep the open question and do not choose a value.
4. If the TSR requires detecting a refresh that comes too early (a runaway loop that refreshes too often), use a window watchdog (STM32 WWDG or an external window watchdog IC) in addition; note that WWDG runs from the APB clock and is therefore not clock-independent.

### Output
PR, RLR (or Zephyr `window.max`) with the computed timeout range.

### Quality Gate
- The timeout range is written with both f_LSI min and max values and the datasheet table number.
- Maximum timeout is at or below the TSR budget, or an open question is recorded.

---

## Phase 2: Implement Refresh with Task Checks

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. STM32 HAL: in `main.c`, initialize with
   ```c
   hiwdg.Instance = IWDG;
   hiwdg.Init.Prescaler = IWDG_PRESCALER_32;   /* from Phase 1 */
   hiwdg.Init.Reload = 1249;                  /* from Phase 1 */
   if (HAL_IWDG_Init(&hiwdg) != HAL_OK) { Error_Handler(); }
   ```
   Some families have a `Window` field in `IWDG_InitTypeDef`; set it to `IWDG_WINDOW_DISABLE` unless Phase 1 requires a window.
   Zephyr: enable `CONFIG_WATCHDOG=y`, get the device with `DEVICE_DT_GET(DT_ALIAS(watchdog0))`, then
   ```c
   struct wdt_timeout_cfg cfg = { .window = { .min = 0U, .max = WDT_MAX_MS }, .callback = NULL, .flags = WDT_FLAG_RESET_SOC };
   int ch = wdt_install_timeout(wdt, &cfg);
   wdt_setup(wdt, WDT_OPT_PAUSE_HALTED_BY_DBG);
   ```
2. Never refresh from a timer interrupt or a dedicated "kick" task that runs regardless of the rest of the system. Use a task-check scheme: each safety-relevant task sets its own bit in an alive mask at the end of a successful cycle; one monitor point refreshes (`HAL_IWDG_Refresh(&hiwdg)` or `wdt_feed(wdt, ch)`) only when all bits are set, then clears the mask.
3. Read the reset cause at startup before clearing it: STM32 `__HAL_RCC_GET_FLAG(RCC_FLAG_IWDGRST)` then `__HAL_RCC_CLEAR_RESET_FLAGS()`; Zephyr `hwinfo_get_reset_cause()` with `CONFIG_HWINFO=y`, checking `RESET_WATCHDOG`. After a watchdog reset, the firmware keeps actuator outputs de-energized and the software stop request relay open until an operator reset, never resuming motion automatically.
4. Debug freeze: on STM32 the DBGMCU freeze bit for IWDG decides whether the watchdog stops when the core halts. Set it for debugging only in debug builds and record the setting; release builds must leave the watchdog running.
5. Build: `cmake --build build` (STM32Cube CMake) or `west build -b <board> <app_dir>`.

### Output
Firmware with watchdog init, task-check refresh and reset-cause handling.

### Quality Gate
- `rg -n "HAL_IWDG_Refresh|wdt_feed" <firmware_dir>` shows exactly one call site, inside the monitor point.
- `rg -n "HAL_IWDG_Refresh|wdt_feed" <firmware_dir>` shows no hit inside a function whose name ends in `IRQHandler` or `_isr`.
- The build exits 0.

---

## Phase 3: Verify on Target

### Entry Criteria
- Phase 2 gate passed.
- Bench only, actuator power disconnected or behind the independent hardware emergency stop with the stop pressed.

### Actions
1. Measure the real refresh interval: toggle a spare GPIO at the refresh point and measure the period with a logic analyzer for at least the longest operating mode cycle. Record the worst case.
2. Starve one task (test build flag that skips its alive bit) and measure time from the last refresh to reset (watch the reset pin or a GPIO set high at boot). It must fall inside the computed range.
3. Confirm the reset cause handling: after the induced reset, the firmware reports IWDG or `RESET_WATCHDOG` and outputs stay de-energized.
4. Record all results in `watchdog_config.test_results`.

### Output
`watchdog_config`.

### Quality Gate
- Measured timeout lies between the computed minimum and maximum.
- Measured worst-case refresh interval is below the computed minimum timeout.
- After the induced reset, a logged reset cause equals watchdog and actuator enable outputs read low.

---

## Worked Example

Illustrative only. STM32F4, LSI datasheet range 17 kHz to 47 kHz, TSR budget 2.5 s.

- Phase 1: PR = 3 (divide by 32), RLR = 1249: t = 32 x 1250 / f. At 47 kHz: 0.85 s; at 17 kHz: 2.35 s. Max 2.35 s is under 2.5 s.
- Phase 2: alive mask bits for `can_rx_task`, `control_task`, `adc_task`; one refresh in `monitor_task`.
- Phase 3: logic analyzer shows refresh every 10 ms worst case 14 ms; starving `adc_task` gives reset after 1.31 s; boot log prints `reset_cause=IWDG`, enables low.

---

## Exit Criteria

DONE when the watchdog runs from an independent clock with a timeout computed over the clock tolerance, refresh depends on all safety tasks, the reset leaves actuators off, and timeout and reset cause are measured on the target.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Budget shorter than the minimum achievable timeout spread | **Adjust**: use an external watchdog IC with a tighter oscillator; record it. |
| Phase 2 | Existing code refreshes in an interrupt | **Adjust**: move the refresh to the monitor point; remove the interrupt refresh. |
| Phase 3 | No reset when a task starves | **Stop**: check the debug freeze bit and that the starved task is in the mask. |
| Phase 3 | Reset resumes motion | **Stop**: fix startup so outputs stay off until operator reset. |

**Do not:** raise the timeout to stop spurious resets without measuring why, refresh in more than one place, or treat a watchdog reset as a safe state for an actuator that is still powered.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
