# Fermentation Doe Design

Design the response surface experiment to optimize the significant media components and process parameters.

## Inputs

- `significant-components`: Factors to optimize
- `optimization-objectives`: Response variables

## Outputs

- `experimental-design`: Central composite or Box-Behnken design with run list and center points
- `factor-ranges`: Low, center, and high levels for each factor

## Process

1. Select the design type: central composite design (CCD) or Box-Behnken based on the number of factors.
2. Set factor ranges based on screening results and biological constraints.
3. Include center point replicates for curvature estimation and pure error.
4. Randomize the run order to minimize time-dependent bias.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
