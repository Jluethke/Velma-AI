# Cold Chain Custody Tracker

Document chain of custody at each handoff point.

## Inputs

- `monitor-configuration`: Configured monitoring devices with alert thresholds
- `packaging-specifications`: Selected packaging and refrigerant per product

## Outputs

- `custody-log`: Chain of custody log with temperature readings at each handoff
- `excursion-record`: Record of any temperature excursions during transit

## Process

1. Record temperature at each handoff point (origin, carrier, hub, destination)
2. Document the responsible party and timestamp at each handoff
3. Log any temperature excursions with duration and severity
4. Produce the custody log and excursion record

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
