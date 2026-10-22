# Bias Correction Protocol

For each identified bias, build a correction protocol. If you are overconfident at 85%, add a rule to reduce your stated confidence by 15 points for that decision type. If you consistently under-estimate timelines, multiply your estimate by 1.5. The corrections are mechanical on purpose: they override the bias without requiring you to 'try harder' to be unbiased.

## Inputs

- `calibration-report`: Your calibration data
- `bias-patterns`: The systematic biases identified

## Outputs

- `correction-rules`: Mechanical correction rules for each identified bias (e.g., 'subtract 15 from confidence on hiring decisions', 'multiply timeline estimates by 1.5')
- `updated-journal-template`: The journal template updated to include a correction step for known biases

## Process

1. For each bias, define a mechanical correction. Not 'be less overconfident' but 'subtract 15 points from your initial confidence estimate on decisions about X'.
2. Build the correction into the journal entry template as a required step: record raw confidence, then apply the correction rule, then record the corrected confidence.
3. Track whether the corrections improve your calibration over the next quarter.
4. Update the correction rules quarterly as your calibration data grows.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
