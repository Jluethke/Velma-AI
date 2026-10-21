# Material Property Verifier

Verify that the material meets its specification by testing composition, hardness, and microstructure.

## Inputs

- `failed-component`: Material samples from the failed part
- `material-specification`: The alloy specification and required properties

## Outputs

- `material-test-results`: Chemical composition, hardness, tensile properties, and microstructure
- `specification-compliance`: Pass/fail comparison of each property against the specification

## Process

1. Cut test specimens from the failed part away from the fracture
2. Run chemical analysis (OES, XRF, or ICP) and compare to the alloy specification
3. Measure hardness (Vickers, Rockwell) and compare to the required range
4. Prepare metallographic sections and examine the microstructure for anomalies

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
