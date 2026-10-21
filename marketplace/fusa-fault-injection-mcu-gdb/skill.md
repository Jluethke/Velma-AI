# MCU Fault Injection with OpenOCD and GDB

**One-line description:** Executes the embedded rows of a fault injection plan on a microcontroller bench setup by writing to test-build fault hook variables and RAM through OpenOCD and `arm-none-eabi-gdb`, halting the core to emulate a lockup, and confirming detection, reaction time and reset cause, with the debug watchdog freeze setting checked first so the watchdog is not silently paused.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fault_injection_plan` (object[], required): Output of `fusa-fault-injection-campaign-plan`; this flow runs rows with `stack == "embedded-c"`.
- `firmware_dir` (string, required): Firmware project with a test build configuration.
- `debug_probe` (string, required): OpenOCD interface and target config names, for example `interface/stlink.cfg` and `target/stm32f4x.cfg`.

---

## Outputs

- `fault_injection_results` (object[]): `fi_id`, `build_id` (git hash plus test flag), `injection_command`, `detected` (true or false), `reaction_time_ms`, `reset_cause`, `pass`, `capture_file`, `notes`.

---

## Phase 1: Test Build and Debug Session

### Entry Criteria
- Bench only: actuators uncoupled or wheels off the ground, actuator power behind the independent hardware emergency stop.
- `fault_injection_plan` has at least one `embedded-c` row.

### Actions
1. Add fault hooks guarded by a compile flag so they never exist in release builds:
   ```c
   #ifdef FUSA_FI_BUILD
   volatile uint32_t g_fi_mode = 0;   /* 0 none, 1 starve adc_task, 2 corrupt cmd, 3 infinite loop in ISR */
   #endif
   ```
   Insert checks at the locations named in each plan row, for example in `adc_task`: `#ifdef FUSA_FI_BUILD if (g_fi_mode == 1) { for (;;) { vTaskDelay(1); } } #endif`.
2. Build the test variant: `cmake -B build-fi -DCMAKE_C_FLAGS=-DFUSA_FI_BUILD && cmake --build build-fi` (or `west build -b <board> -- -DEXTRA_CFLAGS=-DFUSA_FI_BUILD`; check the option name in your Zephyr version). Record `git rev-parse --short HEAD` plus `FI` as `build_id`.
3. Confirm the release build has no hook: `arm-none-eabi-nm build/<app>.elf | grep -c g_fi_mode` prints 0, and the FI build prints 1.
4. Start OpenOCD: `openocd -f <interface cfg> -f <target cfg>`. In another terminal: `arm-none-eabi-gdb build-fi/<app>.elf`, then `target extended-remote :3333`, `monitor reset halt`, `load`, `monitor reset run`.
5. Check the watchdog debug freeze: read the DBGMCU freeze register for your family (address from the reference manual) with `monitor mdw <address>`. The IWDG stop bit must be 0 for watchdog tests, or a halted core will never reset.

### Output
Running FI build with an attached debugger.

### Quality Gate
- `nm` shows `g_fi_mode` only in the FI build.
- The DBGMCU IWDG stop bit reads 0, recorded with the address and value.

---

## Phase 2: Inject and Measure

### Entry Criteria
- Phase 1 gate passed.
- Logic analyzer connected: CH1 a GPIO the FI code toggles at injection, CH2 the stop request output, CH3 the reset line.

### Actions
1. For each plan row, from GDB: interrupt with Ctrl-C, set the fault, continue:
   ```
   (gdb) set var g_fi_mode = 1
   (gdb) continue
   ```
2. For a lockup row, halt the core and leave it halted: `monitor halt`. With the freeze bit 0, the independent watchdog resets the MCU after its timeout.
3. For a data corruption row, write the variable named in the plan: `set var steer_cmd_filtered = 32767`, then continue. Expected: the plausibility check rejects it.
4. Measure from CH1 (or the halt time) to CH2 reaching the stop level. Save the capture.
5. After any reset, read the reset cause: either the firmware's boot log line or `monitor mdw <RCC_CSR address>` and decode the flag bits from the reference manual.
6. Return to normal: `set var g_fi_mode = 0`, `monitor reset run`. Run one row at a time.

### Output
Observed detection, reaction time and reset cause per row.

### Quality Gate
- Every row has a capture file and a measured time or a "not detected" result.
- Every row that expected a watchdog reset records a reset cause decoded from the register or boot log.

---

## Phase 3: Judge and Record

### Entry Criteria
- Phase 2 complete.

### Actions
1. Apply each row's `pass_rule` exactly. A detection that comes later than `time_budget` is a fail.
2. For each fail, write a note naming the mechanism and the measured gap, and return it to the requirement or code owner. Do not change thresholds in this flow.
3. Emit `fault_injection_results` as JSON.

### Output
`fault_injection_results`.

### Quality Gate
- Count of results equals count of `embedded-c` plan rows.
- `jq '[.[]|select(.pass==null)]|length' fault_injection_results.json` prints 0.

---

## Worked Example

Illustrative only.

```
$ arm-none-eabi-nm build-fi/steer.elf | grep g_fi_mode
20000a14 B g_fi_mode
(gdb) monitor mdw 0xE0042008
0xe0042008: 00000000
(gdb) set var g_fi_mode = 1
(gdb) continue
```
`FI-012` (starve `adc_task`): CH2 low 1.29 s after injection; boot log `reset_cause=IWDG`. Plan budget 2.5 s: pass. (The DBGMCU address shown is the STM32F4 APB1 freeze register; confirm for your part.)

---

## Exit Criteria

DONE when every embedded plan row has been injected on the FI build with a capture, measured reaction, decoded reset cause where expected, and a pass or fail against its rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hook symbol present in release build | **Stop**: fix the guard; release builds must not contain hooks. |
| Phase 1 | Freeze bit set by startup code | **Adjust**: clear it in the FI build only and record that. |
| Phase 2 | No reset after halting the core | **Stop**: recheck the freeze bit; do not report watchdog coverage. |
| Phase 2 | Debugger loses connection after reset | **Retry**: reattach with `target extended-remote :3333`. |
| Phase 3 | Fail result | **Return**: send the row to the owner with the capture. |

**Do not:** inject faults with actuators powered outside the bench conditions, ship a build with `FUSA_FI_BUILD`, or edit the plan's pass rule to turn a fail into a pass.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
