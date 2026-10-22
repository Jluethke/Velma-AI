# Control Effectiveness Tester

Test operating effectiveness by selecting samples and verifying the control was performed.

## Inputs

- `design-test-results`: Controls with adequate design to test
- `sample-parameters`: Sample sizes and selection criteria

## Outputs

- `effectiveness-results`: Pass/fail results for each control tested
- `exceptions-found`: Instances where the control did not operate as designed

## Process

1. Select samples of transactions or events for each control.
2. Examine evidence that the control was performed (signatures, system logs, reconciliation marks).
3. Document exceptions where the control was not performed or was performed incorrectly.
4. Calculate the exception rate and assess whether the control is operating effectively.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
