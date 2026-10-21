# SEGGER RTT Logging

**One-line description:** Adds SEGGER RTT to firmware, locates the `_SEGGER_RTT` control block from the ELF, and reads log output through J-Link tools, OpenOCD's RTT server or pyOCD, with buffer size and overflow mode chosen so logging never blocks the application.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image with RTT linked in.
- `debug_probe` (string, required): `jlink`, `stlink` or `cmsis-dap`.

---

## Outputs

- `rtt_log_record` (object): Control block address, buffer size and mode, host tool and command, and a sample of received log lines with any dropped-data observation.

---

## Phase 1: Add RTT to Firmware

### Entry Criteria
- Source access to the SEGGER RTT files (`SEGGER_RTT.c`, `SEGGER_RTT.h`, `SEGGER_RTT_Conf.h`, optional `SEGGER_RTT_printf.c`) from SEGGER's RTT repository or J-Link software package, under their license.

### Actions
1. Add the files to the build. Call `SEGGER_RTT_Init()` early in `main` (or rely on the lazy init in the write functions; check the version you use).
2. Write with `SEGGER_RTT_WriteString(0, "text\n")` or `SEGGER_RTT_printf(0, "x=%d\n", x)`.
3. In `SEGGER_RTT_Conf.h` set `BUFFER_SIZE_UP` to a size chosen from the log volume and RAM budget from the map audit.
4. Mode for up-buffer 0: keep `SEGGER_RTT_MODE_NO_BLOCK_SKIP` (default) or `NO_BLOCK_TRIM` so the application never waits on the host. `BLOCK_IF_FIFO_FULL` stalls the firmware when no host is reading; do not use it in code that runs without a debugger.
5. RTT works on any core the probe can access memory on while running (including Cortex-M0/M0+), because it uses memory reads, not trace hardware.

### Output
Firmware with RTT.

### Quality Gate
- `arm-none-eabi-nm <elf_path> | grep _SEGGER_RTT` prints one address (recorded).
- Configured buffer size and mode recorded from `SEGGER_RTT_Conf.h`.

---

## Phase 2: Read Logs on the Host

### Entry Criteria
- Firmware flashed and running.

### Actions
1. Choose by probe:

| Probe | Tool and command |
|---|---|
| jlink | `JLinkRTTViewer`, or `JLinkGDBServer` plus a telnet client to its RTT telnet port (default 19021 per SEGGER docs), or `JLinkRTTLogger` to a file; check each tool's help for device and interface options |
| stlink or cmsis-dap with OpenOCD | In the OpenOCD session: `rtt setup <_SEGGER_RTT address> <search size> "SEGGER RTT"`, `rtt start`, `rtt server start <tcp port> 0`, then connect with `nc localhost <tcp port>` (or telnet). See the OpenOCD manual "RTT" section. |
| any probe with pyOCD | `pyocd rtt -t <target>` (check `pyocd rtt --help` for options in your version) |

2. Using the exact `_SEGGER_RTT` address from `nm` with a small search size avoids slow scans and false matches.
3. Confirm the received text matches firmware output.

### Output
Live log output.

### Quality Gate
- A known firmware string appears in the host output (copied into the record).
- OpenOCD (if used) prints "rtt: Control block found at 0x..." matching the `nm` address.

---

## Phase 3: Check for Loss and Timing Impact

### Entry Criteria
- Logs flow.

### Actions
1. Add a sequence counter to each log line during this test.
2. Run the heaviest logging workload. Gaps in the counter show dropped lines (expected in NO_BLOCK_SKIP when the host reads slower than firmware writes).
3. Decision table:

| Observation | Action |
|---|---|
| No gaps | Keep settings |
| Gaps, RAM available | Increase `BUFFER_SIZE_UP` |
| Gaps, no RAM | Reduce log volume or log level |
| Application timing changed with logging | Check that `BLOCK_IF_FIFO_FULL` is not set; measure the write time with a GPIO toggle around the call |

### Output
`rtt_log_record`.

### Quality Gate
- Sequence counter result (gaps or none) recorded for the heaviest workload.

---

## Worked Example

Illustrative. nRF52832 (Cortex-M4), J-Link, and a second board STM32G031 (Cortex-M0+) with ST-Link under OpenOCD.

- Phase 1: `nm build/app.elf | grep _SEGGER_RTT` prints `20000a18 B _SEGGER_RTT`; `BUFFER_SIZE_UP` 1024, mode NO_BLOCK_SKIP.
- Phase 2 (OpenOCD): `rtt setup 0x20000a18 0x100 "SEGGER RTT"`, `rtt start` prints `rtt: Control block found at 0x20000a18`; `rtt server start 9090 0`; `nc localhost 9090` shows `seq=1 boot ok`.
- Phase 3: burst test shows gaps at seq 812 to 830; buffer raised to 4096; rerun shows no gaps.

---

## Exit Criteria

DONE when RTT output is received on the host from the address in the ELF, and dropped-line behavior under the heaviest workload is measured and handled.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `_SEGGER_RTT` missing from `nm` | **Adjust**: the files were not linked or the symbol was garbage-collected; confirm a write call exists in reachable code. |
| Phase 2 | Control block not found | **Adjust**: pass the exact address from `nm`; confirm the firmware ran past RTT init. |
| Phase 2 | Firmware stalls with no host | **Adjust**: switch to a NO_BLOCK mode. |
| Phase 3 | Persistent gaps | **Return**: reduce log volume; record the limit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
