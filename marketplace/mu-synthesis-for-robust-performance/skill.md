# Mu Synthesis For Guaranteed Performance

Use mu-synthesis (D-K iteration) to design a controller that achieves both stability under uncertainty and guaranteed performance for structured uncertainty.

## Inputs

- `uncertainty-model`: LFT representation with structured uncertainty block Delta
- `sensitivity-weights`: Performance weighting functions
- `h-infinity-controller`: Initial controller from H-infinity synthesis as starting point

## Outputs

- `mu-controller`: Controller achieving guaranteed performance for the structured uncertainty set
- `mu-analysis-report`: Upper and lower mu bounds vs frequency, worst-case perturbation, and stability margins

## Process

1. Compute the structured singular value mu of the nominal closed-loop N (with the H-infinity controller) over frequency. If mu < 1 at all frequencies, guaranteed performance is already achieved. If mu > 1 at some frequencies, D-K iteration is needed.
2. D-K iteration: fix K and compute the D-scales that minimize the upper bound on mu at each frequency. Fit the D-scales with stable, minimum-phase transfer functions (rational approximation). Then fix D and synthesize a new K using H-infinity on the D-scaled plant. Repeat until mu converges below 1 or stops improving.
3. D-scale fitting is the critical step: the order of D determines the order of the controller. Start with low-order D (first or second order) and increase only if mu does not converge. High-order D gives better mu bounds but impractical controller complexity.
4. After convergence, verify with mu-analysis: compute upper and lower bounds on mu. If the gap between bounds is large, the result is uncertain. Compute worst-case perturbation (the specific Delta that drives the system closest to instability) and verify it is physically plausible.
5. Compare the mu-controller complexity and performance against the simpler H-infinity controller or a well-tuned classical controller with gain scheduling. Mu-synthesis is worth the complexity only when the uncertainty structure is well-known and the performance requirements are tight. If a gain-scheduled PID achieves adequate stability margins, prefer it for implementation simplicity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
