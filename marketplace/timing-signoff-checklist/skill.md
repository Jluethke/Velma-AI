# Timing Signoff Checklist

Verify that timing is fully closed across all conditions and that no paths are untimed, incorrectly constrained, or masked by overly broad exceptions.

## Inputs

- `optimization-changes`: All changes applied and their timing impact
- `post-optimization-timing`: Final timing summary

## Outputs

- `timing-signoff-report`: Complete signoff report confirming closure status, listing any waivers with justification, and documenting constraint coverage
- `remaining-risks`: Any paths with positive but marginal slack (under 10% of period), waivers for non-closable paths, and temperature/voltage operating restrictions if applicable

## Process

1. Confirm zero negative slack on setup analysis at the slow corner for every constrained clock domain. Any remaining negative slack is a hard failure.
2. Confirm zero negative slack on hold analysis at the fast corner. Hold failures cause intermittent data corruption that is extremely difficult to debug in the lab.
3. Re-verify constraint coverage: every clock domain constrained, every I/O port with delays, every CDC path either false-pathed (with documented justification) or constrained with set_max_delay.
4. Audit all false_path and multicycle_path exceptions. For each one, verify the justification is still valid. A false path on a mux select is valid only if the select is truly static during data transfer. A multicycle path is valid only if the enable signal enforces the multi-cycle contract.
5. Check for paths with marginal positive slack (less than 10% of the clock period). These paths may fail under temperature or voltage variation beyond the analyzed corners, or with slight manufacturing variation on the specific device. Flag them for monitoring.
6. Verify that the timing model matches the actual device: speed grade, temperature grade, voltage supply levels. A design timed for commercial grade will fail if deployed on an industrial-grade device with wider temperature range.
7. Generate the signoff report with: WNS and TNS for every domain, constraint coverage percentage, list of all timing exceptions with justification, list of marginal paths, and any operating restrictions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
