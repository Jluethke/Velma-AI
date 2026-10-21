# SWO and ITM Trace Logging

**One-line description:** Sends printf-style logs over the Cortex-M ITM stimulus port 0 and the single-wire SWO pin, configures the trace port clock and SWO baud from the real core clock in OpenOCD or the vendor tool, and confirms readable output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image with ITM output code.
- `debug_probe` (string, required): Probe with SWO capture support (for example ST-Link V2-1/V3, J-Link; check that your CMSIS-DAP probe supports SWO).
- `core_clock_hz` (number, required): The actual trace clock input frequency, normally the core clock after PLL setup (measured or printed by firmware, not assumed).

---

## Outputs

- `swo_log_record` (object): Core and SWO pin check, tool command, configured SWO frequency, and a sample of decoded log lines.

---

## Phase 1: Confirm Hardware Support

### Entry Criteria
- None beyond inputs.

### Actions
1. Core check: ITM and SWO exist on Cortex-M3, M4, M7, M33 and M55 implementations that include them. Cortex-M0 and M0+ have no ITM; use RTT instead (see the RTT logging flow).
2. Pin check: find the SWO (TRACESWO) pin in the datasheet pinout (for example PB3 on many STM32 parts). Confirm the pin is wired to the debug connector's SWO line and that firmware does not reconfigure it as GPIO.
3. Confirm the probe supports SWO capture (vendor documentation).

### Output
Support confirmed.

### Quality Gate
- Core name, SWO pin and connector pin are recorded with datasheet and schematic citations.

---

## Phase 2: Firmware Side

### Entry Criteria
- Support confirmed.

### Actions
1. Use CMSIS `ITM_SendChar(ch)` (from `core_cm*.h`); it writes stimulus port 0 when ITM and port 0 are enabled and returns without output otherwise.
2. Redirect printf: implement `int _write(int fd, char *ptr, int len)` to loop over `ITM_SendChar` for `fd` 1 and 2.
3. The debugger normally sets `DEMCR.TRCENA`, the TPIU and the ITM enables. Do not hard-code TPIU baud in firmware unless the host tool requires it; mismatched settings produce garbage.
4. Print `SystemCoreClock` once over another channel (UART or GDB `p SystemCoreClock`) to confirm `core_clock_hz`.

### Output
Firmware with ITM printf.

### Quality Gate
- GDB `p SystemCoreClock` equals `core_clock_hz` (value recorded).

---

## Phase 3: Host Capture

### Entry Criteria
- Firmware flashed.

### Actions
1. Choose a tool:

| Tool | Configuration |
|---|---|
| OpenOCD 0.12 or newer | After init: `<chip>.tpiu configure -protocol uart -traceclk <core_clock_hz> -pin-freq <swo_hz> -output swo.bin -formatter off`, then `<chip>.tpiu enable` and `itm port 0 on`. The TPIU object name comes from the target config (for example `stm32f4x.tpiu`); check the OpenOCD manual "ARMv7-M specific commands" and "tpiu" sections. Older releases use `tpiu config internal ...`. |
| STM32CubeIDE or STM32CubeProgrammer | SWV ITM data console with core clock = `core_clock_hz`; check `STM32_Programmer_CLI --help` for the SWV options. |
| SEGGER J-Link | J-Link SWO Viewer with CPU frequency = `core_clock_hz`; check its command-line help for option names. |

2. SWO frequency must divide the trace clock exactly by an integer (SWO prescaler + 1). Pick a frequency the probe supports; the tool usually reports the actual rate.
3. The OpenOCD output file contains ITM packets, not plain text. For port 0 byte writes each character is preceded by a header byte 0x01; decode with a tool that understands ITM framing (for example `itmdump` from the Rust `itm` tools; check its `--help`) or strip the 0x01 headers for a quick look.
4. Confirm the decoded text matches what firmware printed.

### Output
`swo_log_record`.

### Quality Gate
- Decoded output contains a known string printed by firmware (copied into the record).
- Configured trace clock equals `core_clock_hz`.

---

## Worked Example

Illustrative. STM32F407 at 168 MHz, ST-Link V2-1, OpenOCD 0.12.

- Phase 1: Cortex-M4, SWO on PB3, connected to pin 6 of the board's SWD header.
- Phase 2: `p SystemCoreClock` prints 168000000.
- Phase 3: `stm32f4x.tpiu configure -protocol uart -traceclk 168000000 -pin-freq 2000000 -output swo.bin -formatter off`; `stm32f4x.tpiu enable`; `itm port 0 on`. `xxd swo.bin | head` shows `01 62 01 6f 01 6f 01 74` = "boot" with 0x01 headers.

---

## Exit Criteria

DONE when ITM output from firmware is captured over SWO and decoded to the expected text with the trace clock set to the measured core clock.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Core is M0/M0+ | **Return**: use the RTT logging flow. |
| Phase 2 | SystemCoreClock differs from expectation | **Adjust**: use the measured value as `core_clock_hz`. |
| Phase 3 | Garbage output | **Adjust**: trace clock wrong or SWO frequency not an integer division; recompute. |
| Phase 3 | No output at all | **Adjust**: check SWO pin wiring and that firmware does not remap it; confirm `itm port 0 on`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
