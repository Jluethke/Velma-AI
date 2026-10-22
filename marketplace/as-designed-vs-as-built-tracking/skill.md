# As Designed Vs As Built Tracking

Track the as-built configuration against the as-designed definition, capturing deviations and waivers so each unit's true configuration is known.

## Inputs

- `change-package`: The released definition and change history that defines the as-designed configuration
- `build-records`: The manufacturing records of what was actually built on each unit: parts installed, revisions, and any departures

## Outputs

- `as-built-record`: The per-unit as-built configuration: the part numbers and revisions actually installed, against the as-designed baseline
- `deviation-log`: The authorized deviations and waivers on each unit, with the nonconformance, the disposition, and the approval

## Process

1. Baseline the as-designed configuration for each unit's effectivity. The as-designed configuration is the set of released part numbers and revisions that a given unit is supposed to have, driven by the effectivity point from the change orders. Establish it before the build so there is a defined expectation to build against and check.
2. Record the as-built configuration as the unit is built, not after. Capture the actual part number and revision of every item installed, the lot or serial of traceable parts, and the operator and date. An as-built record reconstructed from memory after delivery is unreliable; it must be captured at the point of installation.
3. Document every departure as an authorized deviation or waiver. A deviation is a pre-build authorization to depart from the definition for specific units; a waiver accepts a nonconformance found after the fact. Each needs the nonconformance described, the engineering disposition (use-as-is with rationale, rework, scrap), and the approval. Undocumented departures destroy configuration integrity.
4. Reconcile as-built against as-designed and resolve every gap. Compare the as-built record to the as-designed baseline for each unit; every difference is either a documented deviation/waiver or an escape to be investigated. The reconciliation is what makes the as-built record trustworthy, not just present.
5. Keep the per-unit record retrievable for the life of the unit. Field support, failure investigation, and retrofit all need to know a specific unit's true configuration years later. Store the as-built and deviation records against the unit serial so the exact configuration of any delivered unit can be recovered on demand.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
