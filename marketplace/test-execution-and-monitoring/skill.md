# Test Execution And Monitoring

Run the price test and monitor volume daily to detect any sharp drops early.

## Inputs

- `test-design`: The test parameters
- `baseline-metrics`: The comparison baseline

## Outputs

- `test-results`: Volume, revenue, and conversion rate during the test period at the new price
- `volume-change-percentage`: The actual percentage change in volume compared to baseline

## Process

1. Implement the price change and start tracking volume daily.
2. If volume drops more than 20% in the first week, the price increase may be too aggressive for this product. Consider reducing to a 5% increase.
3. Monitor customer feedback during the test. A few complaints are normal. A surge of complaints or cancellations is a signal to stop the test.
4. At the end of the test period, calculate the volume change, revenue change, and profit change compared to baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
