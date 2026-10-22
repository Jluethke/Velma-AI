# Results Analysis And Decision

Analyze the test results against the hypothesis and make a clear build/kill/pivot decision.

## Inputs

- `test-live-url`: The test that ran
- `minimum-evidence`: The threshold for confirmation

## Outputs

- `test-results`: The numbers: total exposed, total who took action, action rate, and comparison to the hypothesis threshold
- `decision`: Build (hypothesis confirmed), Kill (hypothesis rejected), or Pivot (interesting signal but different from the hypothesis)

## Process

1. Calculate the action rate: number who took action divided by number exposed. Compare to the hypothesis threshold.
2. If above threshold: the hypothesis is confirmed. Proceed to building the product. The test has provided evidence that demand exists.
3. If below threshold: the hypothesis is rejected. Do not build the product. The most common mistake is building anyway because 'the test was not set up right' or 'we did not reach the right people.' If the test reached 50+ target audience members and none converted, the idea needs to change.
4. If the data shows an unexpected pattern (people signing up but for a different reason, or a different segment converting), consider a pivot: same audience, different offer, or same offer, different audience.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
