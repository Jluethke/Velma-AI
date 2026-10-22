# Fixed Point Word Length Selection

Determine the bit width for every signal in the DSP path from the system SNR requirement, propagating word lengths through each arithmetic operation.

## Inputs

- `algorithm-specification`: The DSP algorithm to implement: equations, filter coefficients, sample rate, and performance targets (SNR, dynamic range, distortion)
- `system-snr-requirement`: Minimum required signal-to-noise ratio at the output, in dB, including contributions from quantization noise

## Outputs

- `word-length-assignment`: Bit width (integer bits and fractional bits) for every signal in the processing chain: inputs, coefficients, intermediate products, accumulators, and outputs
- `quantization-noise-budget`: Noise contribution from each quantization point, total quantization noise, and margin relative to the SNR requirement

## Process

1. Start from the output SNR requirement. The quantization noise floor for a B-bit fixed-point signal is approximately SNRq = 6.02*B + 1.76 dB (for uniformly distributed quantization error). The output word length must provide at least the required SNR plus margin for processing gain/loss.
2. Work backward through the algorithm. For each addition: the output word length is max(A, B) + 1 bits to prevent overflow (the +1 is the carry bit). For each multiplication: the full-precision product is A + B bits. Truncating or rounding the product introduces quantization noise.
3. Assign coefficient word lengths. Filter coefficients are constants; their quantization shifts the filter response. Simulate the filter with quantized coefficients and verify the passband ripple and stopband rejection still meet spec. Typically 16-18 bits suffices for FIR coefficients with moderate stopband requirements.
4. Size accumulators. For an N-tap FIR filter, the accumulator must be wide enough to hold the sum of N products without overflow: accumulator_bits = input_bits + coeff_bits + ceil(log2(N)). Do not truncate between multiply and accumulate; accumulate at full precision and truncate only at the output.
5. Select truncation vs rounding at each quantization point. Truncation (discard LSBs) introduces a DC bias of -0.5 LSB. Rounding (round to nearest) eliminates the DC bias but costs one additional adder. Convergent rounding (round half to even) eliminates the bias from the rounding operation itself.
6. Handle overflow. Saturation (clamp to max/min value) prevents catastrophic wrap-around distortion but introduces nonlinear distortion. Wrap-around is cheaper in hardware but produces large errors. Use saturation for signals that may occasionally clip (e.g., AGC output). Use guard bits (extra MSBs) to prevent overflow entirely when the maximum signal level is known.
7. Verify the complete word-length assignment by running a bit-accurate fixed-point simulation of the algorithm. Compare the output against a floating-point reference to measure the actual quantization-induced SNR degradation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
