# Fmea Function And Failure Identification

Decompose the system into functions and identify all credible failure modes for each function, with mechanism and cause tracing.

## Inputs

- `fmea-type`: The FMEA variant selected
- `analysis-boundary`: Defined scope of the analysis
- `ground-rules`: Assumptions for the analysis

## Outputs

- `function-list`: Every function (or component or process step) within the analysis boundary, with its performance requirement
- `failure-mode-list`: Each function mapped to its credible failure modes: complete loss, partial degradation, intermittent, unintended activation, wrong timing, wrong magnitude
- `mechanism-cause-map`: Each failure mode traced to physical mechanism (corrosion, fatigue, overstress, wear, drift) and root cause (design margin, material defect, manufacturing variation, user misuse)

## Process

1. List every function within the boundary. For functional FMEA, these are black-box functions (e.g., 'regulate voltage to 3.3V +/- 5%'). For design FMEA, list each component and its function. For process FMEA, list each manufacturing step.
2. For each function, enumerate failure modes systematically: no output, degraded output, intermittent output, unintended output, output at wrong time, output of wrong magnitude. Use field return data and prior FMEA databases to avoid missing known modes.
3. Trace each failure mode to its physical mechanism. A resistor open circuit might be caused by solder joint fatigue (mechanism) due to thermal cycling (environmental cause) or sulfur contamination (material cause). Document the chain: cause -> mechanism -> failure mode.
4. For interface FMEA, add failure modes at each boundary: signal corruption, timing mismatch, impedance mismatch, protocol violation, missing handshake. Interface failures are the most frequently missed category.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
