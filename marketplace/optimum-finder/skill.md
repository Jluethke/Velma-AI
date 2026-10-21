# Optimum Finder

Find the factor settings that optimize the response: steepest ascent direction, predicted optimum within the design space, and confidence region around it.

## Inputs

- `response-model`: Fitted response surface model
- `factor-definitions`: Factor ranges and constraints

## Outputs

- `optimal-settings`: Factor levels that maximize or minimize the response
- `predicted-optimum`: Predicted response at the optimal settings with confidence interval

## Process

1. If the optimum is within the design region, solve for the stationary point of the response model.
2. If the optimum is outside (first-order model), compute the steepest ascent direction.
3. Apply any constraints on factor ranges.
4. Report the optimal settings and the predicted response with its uncertainty.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
