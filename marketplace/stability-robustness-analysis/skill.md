# Stability Robustness Analysis

Analyze closed-loop stability and margin adequacy: compute gain/phase/delay margins, assess sensitivity to model uncertainty, and verify tolerance to parameter variation.

## Inputs

- `controller-design`: Controller with all parameters
- `plant-model`: Plant model with identified uncertainty

## Outputs

- `stability-analysis`: Gain margin, phase margin, delay margin, and sensitivity function analysis
- `margin-assessment`: Tolerance to parameter variation, unmodeled dynamics, and time delay

## Process

1. Compute classical stability margins. Gain margin: the factor by which the loop gain can increase before instability. Minimum 6 dB (factor of 2) for industrial systems, 12 dB for safety-critical. Phase margin: the phase lag that can be added before instability. Minimum 30 degrees for industrial, 45 degrees for safety-critical. Delay margin: the time delay that can be added before instability; compute from phase margin / crossover frequency. Plot the Nyquist diagram and verify the encirclement count matches the expected number of unstable open-loop poles.
2. Analyze the sensitivity functions. Sensitivity S = 1/(1+L): the transfer function from disturbance to output. Complementary sensitivity T = L/(1+L): the transfer function from reference to output (and from noise to output). |S| + |T| = 1 at every frequency (approximately). The peak of |S| (Ms) indicates margin quality: Ms < 2 (6 dB) is a common requirement; higher peaks indicate near-instability. The peak of |T| (Mt) indicates noise amplification. Plot S and T on Bode plots; the crossover frequency where |S| = |T| = -3 dB is the bandwidth.
3. Assess sensitivity to plant uncertainty. Vary the plant parameters within their identification uncertainty bounds (e.g., +/-20% on gain, +/-10% on time constants). Re-compute the closed-loop response and stability margins for each variation. If stability margins drop below the minimum at any parameter combination, the controller lacks sufficient margin. Use structured singular value (mu analysis) for a rigorous bound on the worst-case uncertainty combination. Alternatively, Monte Carlo simulation with parameter distributions gives a probabilistic margin assessment.
4. Test tolerance to unmodeled dynamics. The identified plant model omits high-frequency dynamics (resonances, sensor dynamics, actuator bandwidth). Model these as multiplicative uncertainty: the true plant is G_true = G_model * (1 + delta * W(s)) where W(s) is a weighting function that increases with frequency (unmodeled dynamics are larger at high frequencies) and |delta| <= 1. The stability condition is |T * W| < 1 at all frequencies. This sets an upper limit on the controller bandwidth: if you push the bandwidth too high, the controller becomes sensitive to unmodeled dynamics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
