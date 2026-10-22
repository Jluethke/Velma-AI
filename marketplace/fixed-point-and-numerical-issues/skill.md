# Fixed Point And Numerical Issues

Handle the practical issues of implementing a controller in finite-precision arithmetic on embedded hardware.

## Inputs

- `discrete-controller`: Controller in z-domain
- `hardware-constraints`: Word length (16-bit, 32-bit, floating-point availability), processor speed, memory

## Outputs

- `implementation-form`: Controller realization (direct form II, transposed, parallel, cascade second-order sections) with coefficient quantization and scaling
- `numerical-verification`: Bit-exact simulation showing coefficient sensitivity, overflow analysis, and limit cycle assessment

## Process

1. Select controller realization form: direct form II transposed has better numerical properties (lower coefficient sensitivity) than direct form I. For high-order controllers, cascade of second-order sections (biquads) is preferred because each section has well-behaved coefficients even in fixed-point.
2. For fixed-point: determine the dynamic range of each internal signal (state variable, intermediate product). Scale each to use the full word length without overflow. The scaling factors must account for worst-case signal magnitudes, not just nominal.
3. Quantize coefficients to the available word length and recompute the discrete pole/zero locations. For an Nth-order controller, pole sensitivity to coefficient quantization grows rapidly with order. If poles shift significantly, split into biquad sections where each section's poles are insensitive to quantization.
4. Check for limit cycles: in fixed-point recursive systems, quantization within the feedback loop can create small-amplitude oscillations (granular limit cycles) or large-amplitude oscillations (overflow limit cycles). Deadband limit cycles occur when the quantization step is large relative to the signal. Mitigation: use rounding (not truncation), add dither, or increase word length.
5. Run a bit-exact simulation (simulate with the actual fixed-point arithmetic, not floating-point approximation) with representative input signals and compare to the floating-point reference. The difference should be within the quantization noise floor, not growing or oscillating.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
