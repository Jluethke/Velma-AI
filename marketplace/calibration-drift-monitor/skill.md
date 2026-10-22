# Calibration Drift Monitor

Monitor whether ratings stay calibrated over cycles. If the independent ratings scatter less each cycle, calibration is working; if they scatter the same or more, the criteria are not being used or the examples have gone stale.

## Inputs

- `calibrated-criteria`: The documented criteria
- `anchor-examples`: The anchor examples

## Outputs

- `drift-report`: The rating spread each cycle compared against prior cycles
- `criteria-updates`: Revisions to the criteria and anchors where the same distinctions keep causing scatter

## Process

1. Each cycle, repeat the independent rating on a fresh example set and measure the spread.
2. Compare the spread against prior cycles; a narrowing spread means calibration is holding.
3. Where the same distinctions keep causing scatter, revise the criteria and anchor examples to address them.
4. Refresh the example set periodically so managers calibrate against current work, not old cases.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
