# Fraction Activity Tracking

Test each fraction for activity to identify which ones carry the active compound.

## Inputs

- `primary-fractions`: Fractions to test
- `bioassay-protocol`: Same assay used for the crude screen

## Outputs

- `active-fractions`: Fractions that retain activity above the threshold
- `activity-map`: Activity plotted against fraction number showing the activity distribution

## Process

1. Dissolve each fraction at the test concentration
2. Run the bioassay on all fractions in parallel with the same controls as the crude screen
3. Rank fractions by activity level
4. Select the most active fraction(s) for sub-fractionation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
