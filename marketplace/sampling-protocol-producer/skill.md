# Sampling Protocol Producer

Compile the complete sampling protocol: effect size, test, sample size, sampling design, attrition plan, and a recruitment timeline.

## Inputs

- `target-effect-size`: Effect size specification
- `selected-test`: Statistical test
- `adjusted-sample-size`: Final enrollment target
- `sampling-design`: Sampling method and eligibility

## Outputs

- `sampling-protocol`: Complete sampling protocol document
- `recruitment-timeline`: Estimated enrollment rate and completion date

## Process

1. Combine all components into a single protocol document.
2. Estimate the enrollment rate based on the sampling method and population access.
3. Project the recruitment timeline from enrollment rate and adjusted sample size.
4. Review for consistency: the test matches the design, the sample size matches the effect size.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
