# Synthetic Method Selector

Select the generation method based on the data type and purpose.

## Inputs

- `data-schema`: Schema definition
- `generation-purpose`: Purpose of the synthetic data

## Outputs

- `method-selection`: Selected method (statistical, LLM, GAN, simulation)
- `method-config`: Configuration parameters for the selected method

## Process

1. Evaluate candidate methods against the data type.
2. Assess privacy guarantees of each method.
3. Select the method that balances fidelity and privacy.
4. Configure the generation parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
