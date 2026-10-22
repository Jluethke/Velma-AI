# Actual Process Map Builder

Build the actual process map from the instance logs. Include every path that was observed, not just the main path. Rework loops and workarounds are part of the actual process.

## Inputs

- `instance-logs`: The observed instances
- `observation-notes`: Contextual observations

## Outputs

- `actual-process-map`: Map of the process as it actually runs, including all observed paths, loops, and workarounds
- `path-frequencies`: How often each path was taken (main path vs. rework loop vs. workaround)

## Process

1. Lay out the main path (the sequence followed by the majority of instances).
2. Add rework loops as backward arrows. Label each with how often it occurred and why.
3. Add workarounds as parallel paths. These are unofficial but real.
4. Calculate the percentage of instances that followed the main path without deviation. If it is below 70%, the official process is not the real process.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
