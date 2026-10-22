# Discretization And Sample Rate

Convert a continuous controller to discrete-time and select the sample rate that preserves the designed performance.

## Inputs

- `continuous-controller`: Controller transfer function K(s) from continuous design
- `plant-bandwidth`: Closed-loop bandwidth and highest-frequency dynamics that matter

## Outputs

- `discrete-controller`: Controller in z-domain K(z) at the selected sample rate
- `discretization-error-analysis`: Comparison of continuous and discrete frequency responses showing where they diverge

## Process

1. Select sample rate: minimum 10x the closed-loop bandwidth for acceptable phase margin degradation. 20x to 30x is preferred for high-performance servo systems. The sample rate sets the upper limit on achievable bandwidth (no more than fs/6 for adequate phase margin from sampling delay).
2. Choose discretization method: Zero-Order Hold (ZOH) for the plant model (matches the physical DAC behavior). Tustin (bilinear transform) for the controller (preserves frequency response mapping, no frequency warping issues below fs/4). Tustin with prewarping at a critical frequency if one specific frequency must match exactly (e.g., a notch filter center).
3. Avoid matched pole-zero for controllers with integrators or high-order dynamics; it can introduce unintended behavior. Use it only for simple lead-lag compensators where the pole-zero mapping is intuitive.
4. Compare the discrete and continuous controller frequency responses on a Bode plot. They should match within 1dB magnitude and 5 degrees phase up to the closed-loop bandwidth. Divergence above the bandwidth is expected and acceptable.
5. Account for the computational delay: the discrete controller computes u[k] from y[k] but by the time u[k] is applied, the plant has moved by approximately one sample period. This is equivalent to an additional 0.5*Ts delay (for compute-then-output) or 1.0*Ts (for output-then-compute). Include this delay in the plant model used for design or design with one extra sample of delay.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
