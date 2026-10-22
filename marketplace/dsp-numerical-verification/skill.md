# Dsp Numerical Verification

Verify the DSP implementation's numerical accuracy by comparing against a floating-point reference model across the signal range, including edge cases.

## Inputs

- `optimized-rtl`: Resource-optimized DSP implementation
- `resource-report`: Resource usage summary

## Outputs

- `accuracy-verification-report`: Maximum error, RMS error, and SNR degradation compared to the floating-point reference, across full-scale, small-signal, and DC input conditions
- `dsp-signoff`: Signoff statement that the implementation meets the accuracy specification under all input conditions

## Process

1. Generate test vectors covering the full input range: full-scale sine wave (exercises dynamic range), low-level sine wave at -60 dBFS (exercises noise floor), DC input at mid-scale (exercises DC offset from truncation), impulse input (exercises the filter's impulse response), and random input (exercises all bit patterns statistically).
2. Run each test vector through both the floating-point reference model and the fixed-point RTL simulation. Capture the output from both at every sample.
3. Compute the error metrics: (a) maximum absolute error (peak quantization error, in LSBs and in dB relative to full scale), (b) RMS error (average noise power, in dB), (c) SQNR (signal-to-quantization-noise ratio) = 10*log10(signal_power / error_power). The SQNR must exceed the system SNR requirement.
4. Test overflow conditions: apply an input that produces maximum accumulator values. Verify saturation logic activates correctly and the output is the clamped value, not a wrap-around glitch.
5. Test coefficient accuracy: compare the implemented filter's frequency response (from an FFT of the impulse response) against the ideal response. Measure passband ripple and stopband rejection. If the filter spec is exceeded due to coefficient quantization, increase coefficient word length.
6. Verify pipeline correctness: the output must be a delayed version of the mathematically correct result. Measure the pipeline delay and verify it matches the architecture document. Any cycle offset indicates a register was incorrectly placed or omitted.
7. Run long-duration tests (millions of samples) to detect limit-cycle oscillations. In IIR filters with feedback, quantization in the feedback path can cause the output to oscillate with a small periodic pattern instead of settling to the correct DC value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
