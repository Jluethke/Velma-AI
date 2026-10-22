# Debug Probe Setup

Configure the debug probe (JTAG/SWD), target connection, and debug software for reliable access to the target's memory, registers, and execution state.

## Inputs

- `target-hardware`: MCU debug interface (JTAG/SWD pins), debug probe model, and IDE or command-line debugger being used
- `debug-requirements`: What needs to be debugged: crash analysis, timing issue, data corruption, or functional bug

## Outputs

- `debug-setup`: Probe connection verified, clock speed configured, flash algorithm loaded, and breakpoint/watchpoint capabilities confirmed
- `debug-strategy`: Which debug technique to use based on the symptom: breakpoints for functional bugs, watchpoints for memory corruption, trace for timing, post-mortem for field crashes

## Process

1. Verify the physical connection: SWD requires SWDIO, SWCLK, and GND (3 wires minimum). JTAG requires TDI, TDO, TMS, TCK, and GND (5 wires). SWD is preferred for ARM Cortex-M: fewer pins, same functionality for debugging. Connect the probe's VREF to the target's VDD so the probe knows the I/O voltage level.
2. Set the debug clock speed. Start at a conservative 1 MHz. Increase to 4 MHz or higher after confirming reliable communication. Long wires, high-capacitance boards, or noisy environments may require slower clocks. SWD at 10 MHz works on short, clean connections.
3. Load the correct flash programming algorithm for the MCU. The debugger needs this to program flash and set breakpoints in flash (flash breakpoints require patching the instruction, which means writing to flash). Hardware breakpoints (limited to 4 to 8 on Cortex-M) do not require flash writes.
4. Verify debugger features: confirm the number of hardware breakpoints and watchpoints available. Cortex-M3/M4 typically have 6 breakpoints and 4 watchpoints. Watchpoints can trigger on read, write, or read/write to a specific address or address range.
5. Choose the debug strategy based on the symptom. Reproducible functional bug: set breakpoints and step through. Intermittent data corruption: set a data watchpoint on the corrupted variable to catch the write. Timing issue: use ITM timestamps or GPIO toggling with a logic analyzer. Field crash: implement post-mortem core dump to flash.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
