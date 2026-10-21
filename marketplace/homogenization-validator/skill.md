# Homogenization Validator

Validate the homogenized record: check that the adjustments reduced the variance of the difference series without introducing new artifacts.

## Inputs

- `homogenized-record`: The adjusted record
- `reference-composite`: The reference series for comparison

## Outputs

- `validation-result`: Before/after variance comparison, remaining breakpoint test, and trend comparison
- `quality-flag`: Whether the homogenized record passes quality criteria

## Process

1. Recompute the difference series using the homogenized record.
2. Test the corrected difference series for remaining breakpoints (should find none).
3. Compare the variance of the corrected difference series to the original (should be reduced).
4. Compare trend estimates from the raw and homogenized records to quantify the adjustment's impact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
