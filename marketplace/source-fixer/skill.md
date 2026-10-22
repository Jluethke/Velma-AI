# Source Fixer

Find and fix the root cause at the source. Downstream cleaning is a bandage.

## Inputs

- `quality-gaps`: Dimensions below minimum quality
- `critical-data-sets`: The affected data sets

## Outputs

- `source-fixes`: Root cause at the source (input form, integration, manual process) with the fix and expected improvement
- `monitoring-setup`: Automated checks to catch issues before they propagate

## Process

1. Trace each gap to its source: where does data enter the system? The problem originates there.
2. Fix at source: completeness = required fields, accuracy = validation rules, consistency = single source of truth, timeliness = reduce pipeline lag, uniqueness = dedup at input.
3. Resist downstream fixes. The bad data will keep flowing.
4. Set up monitoring: daily completeness checks, weekly reconciliation, continuous validation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
