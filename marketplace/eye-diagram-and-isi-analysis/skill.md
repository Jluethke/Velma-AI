# Eye Diagram And Isi Analysis

Generate the statistical eye diagram from the channel response, quantify eye opening before and after equalization, and determine if the link has margin.

## Inputs

- `insertion-loss-profile`: Channel S21 data
- `impulse-response`: Channel impulse response with ISI taps
- `data-rate`: Line rate for UI calculation
- `crosstalk-profiles`: Crosstalk from adjacent lanes

## Outputs

- `unequalized-eye`: Eye diagram at the receiver input with no equalization applied, showing voltage and timing margins
- `isi-budget`: ISI contribution from each post-cursor and pre-cursor tap, ranked by magnitude
- `crosstalk-penalty`: Eye closure in mV due to near-end and far-end crosstalk from adjacent lanes
- `eye-opening-raw`: Voltage height and timing width of the raw eye at BER = 1e-12 contour

## Process

1. Generate the statistical eye: convolve a PRBS pattern through the channel impulse response. Use a long enough pattern (PRBS-31 for accurate ISI representation). The statistical eye shows all possible bit transitions superimposed, producing the eye shape.
2. Measure the eye opening at the BER = 1e-12 contour (not at the center, which is optimistic). The 1e-12 contour accounts for the combined probability of all ISI patterns and noise landing in the decision threshold. Extract voltage height (mV) and timing width (ps or fraction of UI).
3. Decompose ISI: the impulse response tells you exactly which cursors (time offsets) contribute the most eye closure. Rank them by amplitude. The largest post-cursors are the ones equalization must cancel.
4. Add crosstalk penalty: superimpose crosstalk from adjacent aggressor channels. Each aggressor adds a noise-like contribution that further closes the eye. Measure the additional eye closure. If crosstalk penalty exceeds 10% of the raw eye opening, the channel spacing or isolation needs improvement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
