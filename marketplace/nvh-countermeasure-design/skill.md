# Nvh Countermeasure Design

Design and validate NVH countermeasures targeting the dominant source-path contributions identified in diagnosis.

## Inputs

- `source-path-ranking`: Ranked source-path contributions
- `dominant-mechanisms`: Physical mechanisms for each source
- `path-transfer-functions`: Transfer functions for each path
- `nvh-targets`: Quantified improvement targets

## Outputs

- `countermeasure-design`: Specified treatments for each dominant path with predicted dB reduction
- `weight-cost-impact`: Mass, cost, and packaging impact of each countermeasure
- `verification-results`: Measured NVH performance after countermeasure implementation compared to targets

## Process

1. Address the source first if practical. Powertrain: engine mount tuning (lower dynamic stiffness at problem frequency), transmission gear tooth profile modification to reduce mesh excitation, crankshaft damper tuning. Tire: cavity resonance dampers (foam ring inside tire), pattern optimization to reduce pattern noise.
2. Address the structure-borne path: increase transfer loss by adding mass (constrained layer damping on body panels), increasing stiffness (closeout brackets to shift panel modes away from excitation frequencies), or adding isolation (secondary mount, decoupling bushing). Each approach has weight and cost trade-offs.
3. Address the airborne path: seal gaps (door seals, pass-through grommets), add acoustic absorption (headliner, carpet, dash insulator), increase panel TL (add barrier layers: loaded vinyl between carpet and floor).
4. Predict the countermeasure effect by modifying the TPA model: reduce the force at the source or reduce the transfer function along the path and recalculate the synthesis at the receiver. The predicted reduction is the difference in synthesized interior noise before and after the change.
5. Implement and measure. Compare measured NVH with and without the countermeasure under the same conditions. The measured improvement should be within 2 dB of the prediction if the TPA model is accurate. If not, the discrepancy reveals a flanking path or an inaccurate transfer function.
6. Evaluate the sound quality after the countermeasure. Reducing one source can unmask another that was previously inaudible. Listen subjectively and re-analyze the spectrum to confirm no new quality issues emerged.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
