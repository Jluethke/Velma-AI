# Debug Instrumentation Planning

Plan which signals to instrument for debug, balancing visibility against resource usage and timing impact, before synthesizing the debug build.

## Inputs

- `design-under-debug`: FPGA design exhibiting the bug or requiring validation, with a description of the observed failure symptom
- `failure-symptom`: What is happening vs what is expected: incorrect output data, protocol violation, hang condition, intermittent error, or performance degradation

## Outputs

- `debug-probe-plan`: List of signals to instrument with ILA/SignalTap, VIO controls, and any debug-specific RTL modifications (debug counters, error flags), with resource budget
- `trigger-strategy`: Trigger conditions designed to capture the failure: what event to trigger on, pre/post trigger depth, and any sequential trigger stages

## Process

1. Start from the failure symptom and work backward to identify candidate signals. If the output is wrong, instrument the output data path and the last processing stage. If the system hangs, instrument the state machine and handshake signals. If errors are intermittent, instrument error counters and the signals feeding the error detection logic.
2. Select signals at architectural boundaries: module interfaces, bus interfaces, state machine state registers, FIFO fill levels, and control signals (enables, resets, interrupt requests). These provide maximum diagnostic value per probe.
3. Budget the debug resources. An ILA core uses BRAM for sample storage and LUTs for trigger logic. Each probed signal consumes one bit of BRAM width per sample. Example: probing 128 signals at 4096 samples deep requires 128 * 4096 = 512Kbit = 14 BRAMs (18Kb each). Verify the design has this headroom after implementation.
4. Design the trigger. A simple trigger fires when a single condition is met (e.g., error_flag == 1). A sequential trigger fires when a sequence of conditions occurs in order (e.g., state == WAIT, then timeout_counter == MAX, then state != ERROR). Sequential triggers are essential for capturing the cause of a failure, not just the symptom.
5. Set the trigger position: more pre-trigger samples show what led to the event; more post-trigger samples show the consequence. For a bug where the cause precedes the symptom by an unknown amount, start with 75% pre-trigger / 25% post-trigger.
6. Consider adding RTL debug infrastructure: a free-running error counter that increments on every error (visible via VIO without triggering ILA), a timestamp counter for correlating events across multiple ILAs, and debug-only status registers accessible via a JTAG-to-AXI bridge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
