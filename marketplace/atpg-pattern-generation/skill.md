# Atpg Pattern Generation

Generate automatic test patterns to detect stuck-at, transition, and bridging faults, measuring fault coverage and diagnosing untestable faults.

## Inputs

- `scan-inserted-netlist`: Scan-inserted design
- `test-requirements`: Target fault coverage (typically 95-99%)

## Outputs

- `test-patterns`: ATPG pattern set in STIL or WGL format
- `fault-coverage-report`: Fault coverage breakdown: detected, possibly detected, untestable, not detected

## Process

1. Stuck-at fault model: each net is assumed stuck at 0 or stuck at 1. For N nets, there are 2N faults. ATPG generates patterns that sensitize each fault (create a condition where the faulty value propagates to an observable output). Target: >98% stuck-at coverage.
2. Transition (delay) fault model: each net has a slow-to-rise and slow-to-fall fault. The pattern must launch a transition at the fault site and capture the result one clock cycle later at-speed. Two launch methods: launch-off-shift (last shift clock launches the transition, capture clock captures) and launch-off-capture (a functional clock edge launches, next edge captures).
3. Launch-off-capture is preferred for delay testing because it exercises functional timing paths. Launch-off-shift may create false paths (the shift data does not represent a functional state). However, launch-off-capture requires two-cycle patterns and may have lower coverage for combinational paths.
4. Run ATPG: the tool generates patterns, reports fault coverage, and classifies undetected faults. Untestable faults include: redundant logic (the fault cannot be observed because the logic is redundant by design), blocked faults (no path to an observable point), and faults on test-mode-only logic.
5. For undetected non-untestable faults: analyze why ATPG could not find a pattern. Common causes: insufficient controllability (add test points: control points inject values, observe points add output paths), incomplete scan (some flip-flops not in scan), or ATPG tool limits (increase effort level).
6. Pattern count vs test time: each pattern requires shifting all scan chains (shift_count = chain_length cycles) plus one or two capture cycles. Total test time = N_patterns * (shift_count + capture_cycles) / test_clock_frequency. If test time exceeds the ATE budget, reduce patterns (accept slightly lower coverage) or use compression.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
