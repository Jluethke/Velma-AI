# Reduced Data Packager

Produce the final reduced dataset, projection function, and documentation for downstream analysis.

## Inputs

- `reduced-representation`: validated reduced coordinates
- `scaling-parameters`: preprocessing parameters for new data
- `component-labels`: interpretive labels
- `stability-report`: validation results

## Outputs

- `reduced-dataset`: final reduced data matrix ready for downstream modeling
- `projection-function`: saved model or function to project new observations
- `reduction-report`: complete documentation of method, parameters, interpretation, and stability

## Process

1. Export the reduced data matrix with observation IDs and component labels as columns
2. Save the fitted model or transformation function for projecting new data
3. Write the reduction report covering method selection, variance explained, interpretation, and stability
4. Package everything so a colleague can apply the same reduction to new data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
