# Test Format Selection

Choose the minimum viable test format that can validate the hypothesis with the least effort.

## Inputs

- `hypothesis`: The prediction to test
- `minimum-evidence`: What counts as confirmation

## Outputs

- `test-format`: The test type: landing page (measures signup intent), fake door (measures click-through on a non-existent feature), concierge (deliver the value manually to a few customers), or pre-sale (take payment before building)
- `build-estimate`: Time to build the test: should be 1-3 days, not 1-3 weeks

## Process

1. Match the test format to the hypothesis. If testing demand: landing page with signup form. If testing willingness to pay: pre-sale page with payment. If testing whether the product can deliver value: concierge (do it manually for 5 customers).
2. The test must be buildable in 1-3 days. If it takes longer, you are building a product, not a test. Strip away everything that is not necessary to trigger the action you are measuring.
3. Avoid tests that measure interest instead of commitment. A survey asking 'Would you use this?' always gets inflated yeses. A landing page asking for an email gets the real number.
4. If the idea involves a service (not a product), the concierge test is best: deliver the service manually to 5-10 customers and see if they value it enough to pay.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
