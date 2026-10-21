# Failure Mode Classifier

Classify the failure mode based on the fractographic evidence and service conditions.

## Inputs

- `fracture-features`: Identified fracture surface features
- `service-history-summary`: Operating conditions the part experienced

## Outputs

- `failure-mode`: Classified failure mode (fatigue, stress corrosion, overload, creep, hydrogen embrittlement, wear)
- `mode-evidence`: The specific evidence supporting the classification

## Process

1. Match the fracture features to known failure mode signatures
2. Cross-check with the service conditions (cyclic loading = fatigue, corrosive environment = SCC)
3. Consider combined or sequential modes (corrosion-fatigue, creep-fatigue)
4. State the failure mode with the supporting evidence chain

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
