# Response Surface Plotter

Generate contour and surface plots of the response as a function of the two most important factors, with other factors held at their center or optimal values.

## Inputs

- `design-matrix`: Full design data
- `significant-effects`: Which effects matter

## Outputs

- `surface-plots`: Contour and 3D surface plots for the top factor pairs
- `response-model`: Fitted polynomial model of the response surface

## Process

1. Fit a polynomial model (linear + interactions, or quadratic if center points exist).
2. Select the two most influential factors for the primary plot.
3. Generate a contour plot and a 3D surface plot of predicted response.
4. If more than two factors are significant, produce additional plots with non-focal factors held constant.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
