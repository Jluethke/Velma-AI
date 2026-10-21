# Cause Classifier

Classify each breakpoint's probable cause by cross-referencing with station metadata: instrument changes, site moves, land-use changes, or observer changes.

## Inputs

- `breakpoint-list`: Detected breakpoints with dates
- `target-station-data`: Station metadata including instrument history and site history

## Outputs

- `classified-breakpoints`: Each breakpoint with its probable cause and confidence
- `undocumented-breaks`: Breakpoints with no metadata explanation (potentially real climate signals)

## Process

1. Match each breakpoint date to the station's metadata log (instrument changes, site relocations).
2. If a metadata event falls within the breakpoint's confidence interval, classify it as documented.
3. For undocumented breakpoints, check if multiple detection methods agree (higher confidence of real inhomogeneity).
4. Flag undocumented breaks that might be real climate shifts rather than artifacts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
