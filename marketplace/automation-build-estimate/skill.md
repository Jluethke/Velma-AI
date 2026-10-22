# Automation Build Estimate

Estimate the one-time effort to build the automation, including design, testing, and the parts that always take longer than the happy path. Build estimates for automation tend to run low, so the estimate should be deliberately honest.

## Inputs

- `annual-manual-hours`: Yearly manual hours
- `manual-cost-basis`: Baseline assumptions

## Outputs

- `build-hours`: Estimated one-time hours to build the automation
- `build-assumptions`: What the build estimate assumes and excludes

## Process

1. Estimate the hours to design, build, and test the automation end to end.
2. Add time for the edge cases and error handling that the manual task absorbs silently today.
3. State what the estimate excludes so hidden work does not sink the payback later.
4. Keep the estimate honest by comparing it to similar past builds rather than the happy path.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
