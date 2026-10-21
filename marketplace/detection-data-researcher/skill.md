# Detection Data Researcher

Research the data requirements for detecting the target technique.

## Inputs

- `coverage-gaps`: Technique to build detection for
- `gap-priority-ranking`: Priority context for the selected technique

## Outputs

- `data-requirements`: Required log sources, fields, and retention for the detection
- `data-availability-assessment`: Assessment of which required data is available and any gaps

## Process

1. Identify every log source that can observe the technique's artifacts
2. Check which of those sources are currently collected and at what retention
3. Document any data gaps that would need to be filled before the detection can work

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
