# Equivalent Dose Measurement

Measure the equivalent dose (De) using the single-aliquot regenerative-dose (SAR) protocol on a luminescence reader.

## Inputs

- `prepared-aliquots`: Quartz or feldspar grains mounted on measurement discs
- `sar-protocol`: Preheat temperatures, regenerative dose steps, and test dose value

## Outputs

- `de-distribution`: Equivalent dose values for each aliquot with uncertainties
- `sar-diagnostics`: Recycling ratios, recuperation, and dose recovery test results

## Process

1. Run the SAR protocol: natural measurement, then a sequence of regenerative doses bracketing the expected De
2. Include a zero-dose and repeated-dose step to check recuperation and recycling ratio
3. Construct the dose-response curve for each aliquot and interpolate the natural signal to obtain De
4. Run dose recovery tests on a subset to verify the protocol accurately recovers a known dose

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
