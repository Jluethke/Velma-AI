# Detection Algorithm Design

Design the real-time biomarker detection algorithm for embedded implementation on the implanted processor, meeting latency and power constraints.

## Inputs

- `validated-biomarker`: Selected biomarker with detection parameters
- `implant-constraints`: Available processing power (embedded microcontroller or ASIC), memory, power budget for signal processing

## Outputs

- `detection-algorithm`: Algorithm specification (filtering, feature extraction, classification), detection latency, computational cost, and real-time performance metrics
- `embedded-implementation-specification`: Fixed-point arithmetic precision, memory footprint, MIPS requirement, and power consumption estimate

## Process

1. Design the feature extraction pipeline for embedded execution. For beta band power detection: bandpass filter (13-30 Hz, 4th-order IIR Butterworth, computationally inexpensive), then rectify (absolute value), then low-pass smooth (2 Hz cutoff, single-pole IIR). This produces a running estimate of beta power with approximately 250 ms latency from the smoothing filter. Total computation: approximately 10 multiply-accumulates per sample at 500 Hz sampling rate, trivial for any microcontroller.
2. For seizure detection (more complex): extract multiple features from the LFP in sliding windows (2-second windows, 50% overlap). Features: power in multiple frequency bands (delta, theta, alpha, beta, gamma, high-gamma), line length (sum of absolute sample-to-sample differences), and coastline (similar but amplitude-normalized). Classify using a linear discriminant or small neural network (2 hidden layers, 16 units each). Total computation: approximately 1000 operations per classification, feasible for a low-power ARM Cortex-M4 at under 1 mW.
3. Implement in fixed-point arithmetic for embedded deployment. Convert all floating-point operations to Q15 or Q31 fixed-point format. Use CMSIS-DSP library functions for IIR filters and matrix operations on ARM processors. Verify that fixed-point numerical error does not degrade detection performance: compare classification accuracy between floating-point and fixed-point implementations on the same test dataset. Acceptable degradation: less than 2% accuracy loss.
4. Validate real-time performance. Run the algorithm on the target processor with real neural data streamed at the actual sample rate. Measure: worst-case execution time per processing cycle (must be less than the inter-sample interval), memory usage (must fit in available SRAM), and power consumption (measure total processor current draw during operation). Detection latency from biomarker change to algorithm output: target less than 500 ms for Parkinson's, less than 2 seconds for seizure onset detection (to allow time for stimulation to abort the seizure).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
