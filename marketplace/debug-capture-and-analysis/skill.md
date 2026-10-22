# Debug Capture And Analysis

Capture signal data from the running FPGA, analyze the waveforms to identify the root cause, and correlate hardware observations with RTL simulation.

## Inputs

- `debug-probe-plan`: Instrumented signals and resource budget
- `trigger-strategy`: Trigger conditions and sample depth configuration

## Outputs

- `capture-data`: ILA/SignalTap waveform captures showing the failure event with sufficient context to identify the cause
- `root-cause-hypothesis`: Identified or hypothesized root cause based on the captured data, with the evidence supporting the diagnosis

## Process

1. Build the design with debug instrumentation. Enable incremental compilation if supported (Vivado: incremental implementation; Quartus: incremental compilation) to minimize the build time and reduce the chance that adding debug probes perturbs the timing enough to mask the bug.
2. Program the FPGA and arm the trigger. Run the system under the conditions that reproduce the failure. If the trigger fires, download the captured data. If the trigger does not fire, verify the trigger condition is correct and the failure is actually occurring (check error counters via VIO).
3. Analyze the waveform. Look for: (a) the first signal that deviates from expected behavior (this is the temporal root cause), (b) the state of control signals at the time of deviation, (c) handshake protocol violations (valid without ready, data changing while valid is asserted), (d) metastable-looking signals (signals that are in an intermediate state for one or more cycles, indicating a CDC issue).
4. If the root cause is not visible in the current probe set: identify which signals would resolve the ambiguity, add them to the probe plan, rebuild, and capture again. This iterative cycle is the core of hardware debug.
5. Correlate with simulation. Take the input conditions observed in the ILA capture and apply them in RTL simulation. If simulation reproduces the bug, the root cause is in the RTL and can be analyzed with full visibility. If simulation does not reproduce the bug, the root cause is likely a timing issue, a CDC issue, or a physical implementation artifact (these are not visible in behavioral RTL simulation).
6. For timing-related bugs: check the timing report for paths involving the failing signals. A path with marginal positive slack may fail intermittently due to temperature or voltage variation. For CDC bugs: check if the failing signals cross clock domains and whether the synchronization structure is correct.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
