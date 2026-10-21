# Dating System Selector

Select the appropriate radiometric dating system based on the sample and expected age range.

## Inputs

- `sample-description`: Mineral type, rock type, or organic material
- `expected-age-range`: Approximate age range to constrain system choice
- `available-material`: Amount and condition of sample available

## Outputs

- `dating-system`: Selected system (14C, K-Ar, Ar-Ar, U-Pb, Rb-Sr, Sm-Nd, Lu-Hf, or other)
- `system-rationale`: Why this system is appropriate and its limitations for this sample

## Process

1. Match the sample type to systems where the parent isotope is present in measurable quantity
2. Confirm the expected age falls within the effective range of the system
3. Consider the half-life, closure temperature, and susceptibility to open-system behavior
4. Document the rationale and flag any potential complications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
