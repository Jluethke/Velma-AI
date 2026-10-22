# Fmea Fmeca Execution

Execute Failure Mode, Effects, and Criticality Analysis systematically from component through system level.

## Inputs

- `reliability-prediction-report`: Component failure rates
- `system-functional-diagram`: Block diagram showing functional flow between components

## Outputs

- `fmea-worksheet`: Complete FMEA with failure modes, effects, severity/occurrence/detection scores, and RPN
- `critical-items-list`: Items with RPN above threshold or severity >= 9 regardless of RPN

## Process

1. For each component in the functional diagram, enumerate failure modes: open, short, degraded, intermittent, out-of-tolerance, no output, erroneous output. Use component type failure mode distributions from FMECA handbooks.
2. For each failure mode, trace the effect through the functional chain: local effect (what happens at the component), next-higher effect (what the subsystem experiences), end effect (what the user/mission experiences). The end effect determines severity.
3. Score severity (1-10 by effect on safety and mission), occurrence (1-10 from failure rate and operating hours), and detection (1-10 by how likely current controls catch the failure before it reaches the end effect). RPN = severity * occurrence * detection.
4. Rank by RPN. For items above the threshold (typically RPN > 100 or severity >= 9), define corrective actions: design change, added redundancy, improved detection, or operational procedure. Recalculate RPN after corrective action to verify improvement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
