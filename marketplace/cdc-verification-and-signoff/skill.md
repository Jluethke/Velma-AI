# Cdc Verification And Signoff

Verify all clock domain crossings are properly synchronized, run a structural CDC check, and sign off the design for timing closure with documentation.

## Inputs

- `rtl-modifications`: Finalized RTL with all timing fixes
- `timing-improvement-verification`: Timing reports showing all paths pass

## Outputs

- `cdc-verification-report`: Structural CDC analysis results: all crossings identified, synchronizer structure verified (2-register minimum, no combinational logic between stages), and any unsynchronized crossings flagged as bugs
- `timing-signoff-package`: Complete timing closure documentation: SDC file, timing summary at worst-case PVT corner (slow process, low voltage, high temperature), CDC report, and list of any timing waivers with justification

## Process

1. Run a structural CDC analysis. Tools (Synopsys SpyGlass, Cadence Conformal, or open-source ClocknWork) parse the RTL and identify every signal that crosses between clock domains. For each crossing, verify: a 2-stage synchronizer exists (two back-to-back flip-flops on the destination clock), no combinational logic between the synchronizer stages, and multi-bit buses use FIFO or handshake (not just synchronizers on each bit).
2. Check for common CDC bugs. Reconvergence: if two synchronized versions of the same signal reconverge in combinational logic, they can glitch because the synchronizers may resolve metastability at different times. Gray coding for counters: only one bit changes per transition, so a single synchronizer per bit is safe. Binary counters across domains need a FIFO.
3. Verify timing at worst-case PVT (Process, Voltage, Temperature) corner. For setup: slow process, low voltage (Vmin), high temperature (125C). For hold: fast process, high voltage (Vmax), low temperature (-40C or 0C). The final timing report must show positive slack at both corners for all constrained paths.
4. Generate the signoff package. Include: the final SDC constraint file with comments explaining each exception (false path, multicycle), the timing summary report at worst-case corners, the CDC report with all crossings classified and verified, and any timing waivers (paths that fail timing with explanation of why it is acceptable, e.g., a test-only path).
5. Final verification. Run a gate-level simulation with timing annotation (SDF back-annotation) to verify functional correctness at the actual delays. This catches timing issues that static analysis may miss, such as glitches on asynchronous resets or metastability effects. Run at worst-case and best-case corners.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
