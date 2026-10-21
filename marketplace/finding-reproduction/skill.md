# Finding Reproduction

Reproduce each unique finding to confirm it is real and not a transient error.

## Inputs

- `unique-findings`: Deduplicated findings to confirm

## Outputs

- `confirmed-findings`: Findings that reproduce consistently
- `false-positives`: Findings that could not be reproduced

## Process

1. Replay the exact request that triggered each finding
2. Test three times to confirm consistency
3. Classify as confirmed or false positive

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
