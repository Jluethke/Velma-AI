# Band Filter Extractor

Design and apply a bandpass filter to isolate a target frequency band, then convert back to time domain.

## Inputs

- `windowed-signal`: The preprocessed signal
- `target-band`: The frequency range to extract (low cutoff, high cutoff)

## Outputs

- `filtered-signal`: Time-domain signal containing only the target band
- `filter-specification`: Filter type, order, cutoff frequencies, and rolloff

## Process

1. Design a bandpass filter with the specified cutoff frequencies.
2. Choose filter type (Butterworth, Chebyshev, or FIR) based on rolloff needs.
3. Apply the filter using zero-phase (forward-backward) filtering to avoid phase distortion.
4. Verify the filtered output by checking its spectrum against the target band.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
