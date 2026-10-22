# Cdc Verification Method

Verify CDC correctness using structural analysis, formal verification, and simulation-based techniques to catch synchronization errors that functional simulation misses.

## Inputs

- `cdc-constraints`: All CDC timing constraints applied to the design
- `constraint-rationale`: Justification for each CDC constraint

## Outputs

- `cdc-verification-report`: Results from structural CDC analysis, formal CDC verification, and any simulation-based CDC checks, listing all findings and their resolution status
- `cdc-signoff`: Confirmation that all clock domain crossings are properly synchronized, constrained, and verified, or a list of accepted risks with justification

## Process

1. Run a structural CDC analysis tool (Questa CDC, Spyglass CDC, or the equivalent FPGA vendor tool). The tool traces all paths between clock domains and flags: unsynchronized crossings, reconvergence (two CDC paths that merge at a downstream register, causing potential data incoherence), multi-bit crossings without proper synchronization, and combinational logic between synchronizer flops.
2. For each structural finding, classify it: (a) real bug requiring a synchronizer, (b) false positive due to a path that is functionally impossible (document why and waive it), (c) already handled by a higher-level protocol (document the protocol and waive it).
3. Run formal CDC verification where available. Formal tools prove that the synchronization protocol is correct for all possible timing relationships, not just the ones exercised by simulation. Formal verification catches corner cases like simultaneous assertion of request and acknowledge in a handshake, or gray-code pointer values during FIFO empty-to-non-empty transitions.
4. For simulation-based CDC checking: run the design with all clock domains on independent, non-integer-related frequencies. This exposes timing relationships that a single-frequency simulation masks. Inject clock jitter in simulation to exercise the worst-case synchronizer input timing.
5. Verify that the design functions correctly after a clock is stopped and restarted (clock gating). Synchronizers must recover without data corruption or protocol deadlock.
6. Compile the signoff report: every crossing accounted for, every synchronizer verified, every waiver justified. This report is the evidence that the design will not suffer metastability-related failures in production hardware.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
