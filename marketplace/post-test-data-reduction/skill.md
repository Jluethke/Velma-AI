# Post Test Data Reduction

Reduce the raw data to engineering results: apply calibrations, filter and detrend, quantify uncertainty, and report against the test questions.

## Inputs

- `channel-list`: The acquired channels with their calibration coefficients and filter settings
- `redline-set`: The limits and any excursions logged during the run, for flagging affected data

## Outputs

- `reduced-results`: The engineering-unit results per run with uncertainty bands, answering the test questions
- `data-quality-report`: The record of calibration applied, channels dropped or corrected, excursions, and the final data-quality assessment

## Process

1. Apply calibrations and verify them against the pre/post checks before reducing anything. Convert counts to engineering units with the recorded coefficients, then confirm each channel's known-input check held across the test. Flag any channel that failed its post-test calibration as suspect before it reaches a conclusion.
2. Filter and detrend only with a documented, reversible method. Apply the planned digital filtering (and its corner) to extract the quantity of interest, remove known offsets and drift with a recorded baseline, and keep the raw record untouched so any reduction step can be rechecked. Undocumented smoothing hides real behavior.
3. Propagate uncertainty to the reported result. Carry the per-channel uncertainty budget from instrumentation through the data-reduction equations, combining in a root-sum-square, so each reported number has a band. A result quoted without an uncertainty cannot be compared to a prediction or a requirement.
4. Reconcile with the prediction and explain the gap. Overlay measured versus predicted, and when they disagree beyond the combined uncertainty, resolve whether the model, the article, or the measurement is wrong before accepting the result. An unexplained gap is a finding, not a rounding issue.
5. Report against the original test questions and mark data affected by excursions. State each question's measured answer with its band, note any run affected by a redline excursion or instrumentation loss, and record which runs are valid for the conclusion. Deliver the reduced results and the data-quality report together.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
