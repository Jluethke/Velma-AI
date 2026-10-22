# Filter Specification Extraction

Convert the system filtering requirement into a filter specification: passband, stopband, ripple, rejection, and group delay constraints.

## Inputs

- `system-filtering-need`: The system requirement driving the filter: interferer rejection, harmonic suppression, channel selection, or image rejection
- `frequency-plan`: System frequency plan showing the desired signal band and the frequencies to reject

## Outputs

- `filter-specification`: Passband edges, stopband edges, passband ripple (dB), stopband rejection (dB), insertion loss budget, group delay requirement if any
- `filter-selectivity-ratio`: The ratio of stopband edge to passband edge (for lowpass prototype), which determines the required filter order

## Process

1. Identify the passband: the frequency range where the signal must pass with minimal loss. Define the passband edges at the points where insertion loss must be less than the ripple specification.
2. Identify the stopband: the frequency range where signals must be attenuated. Define the stopband edges at the points where rejection must exceed the rejection specification.
3. Determine the passband ripple tolerance. For a Butterworth response, ripple is 3 dB at the band edge by definition. For Chebyshev, specify the in-band ripple (0.01 dB to 1 dB typical). Tighter ripple requires more elements for the same selectivity.
4. Determine the stopband rejection required. This comes from the interferer power level minus the desired signal power level plus the required signal-to-interferer ratio at the demodulator.
5. If the application has group delay sensitivity (such as digital modulation with wide bandwidth), specify the maximum group delay variation across the passband. Elliptic filters have the worst group delay near the band edges.
6. Calculate the selectivity ratio: (stopband edge)/(passband edge) for a lowpass prototype. Closer to 1.0 means sharper transition, requiring higher filter order.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
