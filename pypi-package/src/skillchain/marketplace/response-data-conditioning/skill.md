# Response Data Conditioning

Clean and structure measured input-output data for system identification. Handle missing samples, align timestamps, remove outliers, and segment into steady-state and transient regions.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load raw measurements, identify channels and rates
REASON  --> Detect gaps, outliers, segment boundaries
PLAN    --> Resample, interpolate, segment, compute bandwidth
ACT     --> Output conditioned data and quality report
```

## Inputs

- `raw_measurements`: list[object] -- Time-series of measured inputs and outputs. Each channel: name, timestamps, values, unit.
- `sample_rate`: object -- Nominal sampling rate per channel and any known gaps or irregularities.

## Outputs

- `conditioned_data`: object -- Cleaned, aligned, segmented time-series. All channels on a common time base. Each segment labeled steady-state or transient.
- `data_quality_report`: object -- Missing sample count per channel, outlier count, segment boundaries, effective bandwidth, coverage assessment.

---

## Execution

### OBSERVE: Assess Raw Data

1. **Inventory channels.** List every input and output channel with: name, unit, nominal rate, total sample count, time span.
2. **Detect gaps.** Find intervals where no sample exists for longer than 3x the nominal sample period. These are segment boundaries.
3. **Detect rate inconsistencies.** Channels with variable sample rates need resampling to a common base.

### REASON: Clean the Data

1. **Remove outliers.** For each channel, compute the median absolute deviation (MAD). Flag points more than 5 MAD from the rolling median as outliers. Replace with linear interpolation from neighbors.
2. **Interpolate short gaps.** Gaps shorter than 3 sample periods: fill with linear interpolation. Gaps longer: mark as segment boundaries. Do not extrapolate across segment boundaries.
3. **Resample to common time base.** Choose the highest sample rate across all channels (or a user-specified target rate). Resample all channels to this common base using linear interpolation.

### PLAN: Segment and Characterize

1. **Segment by dynamics.** Compute the rolling variance of each output channel (window = 50 samples). Regions where variance is below the noise floor are steady-state. Regions where variance exceeds the noise floor are transient.
2. **Label segments.** Each segment gets: start time, end time, type (steady-state or transient), and the input range covered.
3. **Compute effective bandwidth.** Take the FFT of the input channels. The effective bandwidth is the frequency range where input power spectral density exceeds the noise floor. System identification is reliable only within this bandwidth.
4. **Assess coverage.** Does the input span enough of the operating range? If the input only covers 20% of the expected range, the identified model will be valid only in that narrow region.

### ACT: Deliver

1. Output the conditioned data: aligned, cleaned, segmented time-series.
2. Output the quality report: missing samples, outliers removed, segments, bandwidth, coverage assessment with recommendations.

## Exit Criteria

1. All channels are on a common time base
2. Outliers are removed and gaps are handled
3. Data is segmented into steady-state and transient regions
4. Effective bandwidth and coverage are reported

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
