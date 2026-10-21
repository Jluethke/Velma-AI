# Title Abstract Screener

Screen search results at title and abstract level against inclusion criteria, with dual-reviewer conflict resolution.

## Inputs

- `search-log`: collected search results with citations
- `inclusion-criteria`: criteria for study inclusion and exclusion

## Outputs

- `screened-set`: studies passing title/abstract screening
- `exclusion-log`: excluded studies with reason codes
- `screening-agreement-rate`: inter-rater reliability (Cohen kappa)

## Process

1. Deduplicate citations across databases
2. Apply inclusion/exclusion criteria to each title and abstract independently
3. Resolve disagreements through discussion or a third reviewer
4. Calculate inter-rater agreement (Cohen kappa) and document the screening flow in a PRISMA diagram

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
