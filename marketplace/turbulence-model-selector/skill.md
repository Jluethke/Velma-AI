# Turbulence Model Selector

Select the turbulence model based on the flow regime, computational budget, and accuracy requirements.

## Inputs

- `flow-conditions`: Reynolds number, flow type (internal, external, free shear), and key phenomena
- `mesh-quality-report`: Mesh resolution and y+ estimate

## Outputs

- `turbulence-model-config`: Selected model (k-epsilon, k-omega SST, SA, LES, DES) with parameters
- `model-justification`: Rationale for the selection citing the flow physics and mesh resolution

## Process

1. Classify the flow (attached, separated, transitional, reacting, compressible)
2. Match flow class to model capability (RANS for attached, LES for large separation, DES for mixed)
3. Verify the mesh resolution supports the selected model (y+ requirements, LES filter width)
4. Document the model choice and its known limitations for this flow

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
