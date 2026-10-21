# Detection Improvement Validator

Re-execute previously missed techniques to validate that new and tuned rules detect them.

## Inputs

- `tuned-rules`: Rules that were tuned
- `new-rules`: New rules that were created
- `execution-log`: Original execution log for replay reference

## Outputs

- `validation-results`: Results of re-testing previously missed techniques
- `remaining-gaps`: Any techniques that still evade detection after tuning

## Process

1. Re-execute each previously missed technique using the same tools and methods
2. Verify that new or tuned rules fire alerts correctly
3. Record any remaining gaps that need further work (additional data sources, custom detections)
4. Confirm no new false positives were introduced by the tuning

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
