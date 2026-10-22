# Mimo Interaction Analysis

Analyze the coupling between input-output channels to determine whether decentralized control is feasible or a full MIMO design is needed.

## Inputs

- `mimo-plant-model`: Transfer function matrix G(s) with n_u inputs and n_y outputs
- `control-objectives`: Which outputs to control, acceptable interaction levels, and bandwidth requirements per channel

## Outputs

- `interaction-analysis`: RGA at key frequencies, SVD analysis showing gain directionality, and recommended input-output pairing or MIMO design approach
- `control-structure-decision`: Decentralized (SISO loops), decoupled (static or dynamic decoupler), or full MIMO (LQR, H-infinity) with rationale

## Process

1. Compute the Relative Gain Array: RGA = G(0) .* (G(0)^-T) element-wise at steady state. RGA_ij near 1.0 means input j primarily affects output i with little interaction. RGA_ij near 0 means input j does not affect output i. RGA_ij negative means the loop gain reverses sign when other loops close, which is dangerous for decentralized control.
2. Pair inputs to outputs by selecting the pairing where RGA diagonal elements are closest to 1.0 and positive. Avoid pairings with RGA < 0 (indicates negative interaction that causes instability when loops close) or RGA >> 1 (indicates the plant is nearly singular in that configuration, sensitive to gain changes).
3. Compute RGA at multiple frequencies, especially near the target crossover frequencies. The interaction pattern can change with frequency. The static RGA (at DC) determines steady-state interaction; RGA near crossover determines dynamic interaction during transients.
4. Perform SVD analysis: G(jw) = U(w) * Sigma(w) * V(w)^H. The condition number sigma_max/sigma_min indicates how directional the plant is. A large condition number means the plant has a strong direction (easy to excite) and a weak direction (hard to control). The right singular vectors V show which input combinations excite each direction.
5. Decision: if RGA is close to identity at all relevant frequencies and condition number is moderate (< 10), decentralized SISO control with detuning for interaction is viable. If RGA is far from identity but the interaction is mostly at low frequency, a static decoupler may suffice. If interaction is frequency-dependent and condition number is large, a full MIMO design (LQR or H-infinity) is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
