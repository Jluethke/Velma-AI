# Hass Screen Design

Design a production screening profile (HASS) that detects manufacturing defects without consuming product life, based on the design margins found in HALT.

## Inputs

- `operating-limits`: Design margins from HALT
- `vibration-limits`: Vibration margins from HALT
- `failure-modes-found`: Failure modes and root causes from HALT

## Outputs

- `screening-profile`: HASS profile: temperature range (within operating limits, not destruct limits), ramp rate, vibration level, number of cycles, and functional test points during screening
- `proof-of-screen`: Evidence that the screen detects the target defect types without damaging good units: based on HALT margins, the screen stress is above the defect precipitation threshold but below the design destruct limit
- `screen-effectiveness-measurement`: Method to measure ongoing screen effectiveness: track defect escape rate in the field, yield at screening, and whether screen-induced failures occur

## Process

1. Set the HASS temperature range between the specification limits and the operating limits found in HALT. A typical screen uses 80% of the difference between the specification and the operating limit. If HALT found the upper operating limit at +95C and the specification is +70C, the HASS upper temperature might be +90C. This stresses defective units past their weakened threshold while remaining below the design margin.
2. Set the vibration level similarly: below the level that caused the first relevant failure in HALT, but above the level that would stress manufacturing defects (typically solder defects, connector issues, cracked components). Start at 50% of the HALT first-failure vibration level and adjust based on defect detection results.
3. Limit the number of thermal cycles to avoid consuming product fatigue life. Calculate the fatigue damage of the screen profile using Coffin-Manson and verify it consumes less than 2-5% of the total fatigue life. A screen that damages good product is worse than no screen.
4. Run a proof-of-screen by intentionally introducing known defects into sample units and verifying the HASS profile detects them. Seed defects that represent the most common manufacturing issues: cold solder joints, cracked ceramic capacitors, contamination under BGAs, loose fasteners. If the screen does not catch a seeded defect, increase the stress level or duration for that defect type.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
