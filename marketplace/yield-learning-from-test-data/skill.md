# Yield Learning From Test Data

Analyze manufacturing test results to identify systematic defects, correlate failures to process excursions, and feed learnings back to design and process for yield improvement.

## Inputs

- `test-results`: Pass/fail data, failing patterns, and failing scan chains from production testing
- `wafer-map-data`: Pass/fail by die position on the wafer

## Outputs

- `defect-analysis`: Identified systematic defect types, locations, and root causes
- `yield-improvement-actions`: Design or process changes to eliminate identified defects

## Process

1. Wafer map analysis: plot pass/fail by die position. Random defects scatter uniformly. Systematic defects form spatial patterns: edge failures (lithography or CMP edge effects), cluster defects (particle contamination), ring patterns (spin-on process), or quadrant patterns (reticle defects).
2. Shmoo plotting: vary test conditions (voltage, frequency, temperature) and map the pass/fail boundary. The shmoo plot reveals how much margin the design has. A design that fails at the nominal corner but passes at relaxed conditions indicates a borderline timing or noise margin issue.
3. Fail bitmap analysis for memories: map failing bit addresses to physical locations on the memory array. Random single-bit failures indicate particle defects. Row or column failures indicate decoder or word-line/bit-line defects. Adjacent-cell failures indicate coupling or lithography issues.
4. Scan diagnosis: from the failing test pattern and the failing scan chain output, the diagnosis tool traces back through the circuit to identify candidate defect locations. It narrows down to a small region of the layout where the defect likely resides. Physical failure analysis (SEM, FIB cross-section) at that location confirms the defect.
5. Volume diagnosis: aggregate diagnosis results from thousands of failing dies. The most frequently diagnosed defect locations indicate systematic design weaknesses (layout sensitivities, marginal timing paths). These are candidates for targeted design fixes (ECO).
6. Feedback loop: provide the defect data to the process team (for process excursion control) and to the design team (for design rule improvement or circuit redesign). Track yield over time: a rising yield curve confirms that corrective actions are working. A sudden yield drop triggers immediate investigation for new defect sources.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
