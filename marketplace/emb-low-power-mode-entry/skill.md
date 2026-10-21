# Low-Power Mode Entry and Current Measurement

**One-line description:** Puts a microcontroller into a chosen sleep, stop or standby mode with the required wake sources, removes the usual current leaks (debug clocks left running, floating pins, enabled peripheral clocks), restores clocks after wake, and measures the current with an instrument against the datasheet table at the same conditions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image with the low-power code.
- `reference_manual` (string, required): MCU reference manual (power control, low-power modes, debug support chapters) and datasheet electrical characteristics.
- `wake_sources` (string[], required): Events that must wake the device, for example "RTC wakeup timer", "EXTI on PA0", "LPUART RX".
- `current_meter` (string, required): Instrument used, for example Nordic Power Profiler Kit II, Joulescope, or a bench multimeter in series (record its range and burden voltage).

---

## Outputs

- `power_mode_record` (object): Chosen mode, wake source configuration, measured current with conditions, datasheet typical value at the same conditions, wake latency if measured, and leaks found.

---

## Phase 1: Choose the Mode

### Entry Criteria
- `wake_sources` known.

### Actions
1. Build a table from the reference manual "low-power modes" summary: for each mode list what stops (CPU clock, high-speed clocks, voltage regulator), what RAM and registers are retained, and which wake sources are available.
2. Choose the deepest mode whose wake list contains every item in `wake_sources` and whose retention matches the application. Cortex-M generic behavior: `WFI` with `SCB->SCR` SLEEPDEEP = 0 is sleep; SLEEPDEEP = 1 enters the vendor's deep mode selected in its power control registers.
3. Standby-class modes usually lose SRAM and restart through reset; the firmware must read the wake flags at boot (for STM32: PWR status flags such as SBF and WUF) to tell a wake from a power-on.

### Output
Chosen mode and retention notes.

### Quality Gate
- Every `wake_sources` item appears in the chosen mode's wake list (table row cited).

---

## Phase 2: Remove Leaks and Handle Wake

### Entry Criteria
- Mode chosen.

### Actions
1. Clear debug low-power bits in the MCU debug control register (STM32: `DBGMCU_CR` bits DBG_SLEEP, DBG_STOP, DBG_STANDBY). When set, they keep clocks running so a debugger stays attached, and the current reading is meaningless. IDEs often set them; read the register back in the final firmware.
2. Set every unused pin to analog mode (or the vendor's lowest-leakage state per the GPIO chapter); a floating digital input draws extra current.
3. Disable clocks of peripherals not needed in the mode.
4. After wake from stop-class modes, many parts restart on an internal oscillator; call your clock configuration again before using peripherals that depend on the PLL. SysTick does not run in deep modes; with FreeRTOS, use tickless idle (`configUSE_TICKLESS_IDLE`) and a low-power timer per the FreeRTOS low-power documentation.
5. Clear pending wake flags before entering the mode, or the device wakes immediately.

### Output
Low-power entry and wake code.

### Quality Gate
- Debug control register reads 0 in the low-power bits in the final image (GDB read-back recorded, then probe disconnected).
- A grep of the GPIO init shows every unused pin set to analog.

---

## Phase 3: Measure

### Entry Criteria
- Debug probe physically disconnected (SWD lines can back-power or leak). Board powered only through `current_meter`.

### Actions
1. Remove or bypass other loads on the board (LEDs, regulators' quiescent current, sensors) or record them separately; the datasheet figure covers the MCU only.
2. Measure current in the mode for a period long enough to include several wake events if periodic.
3. Find the datasheet electrical characteristics table for the mode, at the same supply voltage and temperature, with the same oscillators running. Record the typical and maximum values given.
4. Compare. If measured exceeds the datasheet maximum, list suspects in order: debug bits, floating pins, peripheral clocks, external components. Do not invent a pass threshold; the comparison is to the cited table.
5. Confirm each wake source works: trigger it and observe the wake (GPIO toggle or log after wake).

### Output
`power_mode_record`.

### Quality Gate
- Measured value, instrument and conditions are recorded alongside the cited datasheet value.
- Each `wake_sources` item has a test result.

---

## Worked Example

Illustrative. STM32L476, wake on RTC every 10 s and EXTI PC13, PPK2 at 3.0 V.

- Phase 1: Stop 2 keeps SRAM and wakes on RTC and EXTI; chosen.
- Phase 2: `DBGMCU->CR` read back 0x00000000; 41 unused pins set to analog; PLL reconfigured in the wake path.
- Phase 3: probe removed; PPK2 shows a few microamps between wakes. Datasheet Stop 2 table with RTC at 3.0 V and 25 C gives the typical value; measured is within the table maximum. Both wake sources toggled the LED pin after wake.

---

## Exit Criteria

DONE when the device enters the chosen mode, every wake source wakes it, and measured current is recorded next to the cited datasheet value under the same conditions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No mode supports a required wake source | **Return**: report the conflict; the wake source or the mode must change. |
| Phase 2 | Device wakes immediately | **Adjust**: clear pending wake and EXTI flags before entry. |
| Phase 3 | Debugger cannot reconnect after entering the mode | **Adjust**: connect under reset with NRST wired. |
| Phase 3 | Current far above datasheet maximum | **Retry**: re-check debug bits and pins, then remove external loads one at a time. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
