# Documented Vs Actual Gap Analyzer

Compare the actual process map to the documented (official) process. Every gap is a finding. Workarounds mean the official process does not work. Rework loops mean quality fails upstream. Missing steps mean the documentation is incomplete.

## Inputs

- `actual-process-map`: How the process actually runs
- `path-frequencies`: How often each path is taken

## Outputs

- `gap-list`: Every difference between actual and documented, classified by type: workaround, rework loop, missing step, extra step, wrong sequence
- `gap-root-causes`: For each gap, the reason it exists (the documented process is wrong, incomplete, or impractical)

## Process

1. Overlay the actual map on the documented process. Mark every difference.
2. Classify each gap: workaround (the official way does not work), rework (quality failure feeds back), missing step (documentation skipped it), extra step (documentation has a step nobody does), wrong sequence (people found a better order).
3. For each gap, determine the root cause. Workarounds exist because the official process has a flaw. Rework exists because an upstream step does not catch errors.
4. Prioritize gaps by frequency and impact. A workaround used in 80% of instances is more important than one used in 5%.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
