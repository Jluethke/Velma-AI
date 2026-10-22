# Source Fix Design

Design a fix at each source step so the work is done right the first time and the failure demand never forms. Added inspection downstream is not a source fix; it is more failure demand.

## Inputs

- `root-causes`: The first-time-right failures
- `cause-to-category-map`: Cause to category mapping

## Outputs

- `source-fixes`: Changes at the source step that prevent the failure
- `fix-effort-estimate`: The effort each source fix requires

## Process

1. For each root cause, design a change at the source step that makes the work right the first time.
2. Reject fixes that only add downstream checking, since that is more failure demand in disguise.
3. Estimate the effort each source fix requires to build and sustain.
4. Confirm each fix removes the cause rather than catching its result later.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
