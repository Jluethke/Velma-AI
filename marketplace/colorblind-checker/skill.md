# Colorblind Checker

Check the figure for colorblind accessibility: simulate the three common forms of color vision deficiency and verify all distinctions survive.

## Inputs

- `draft-figure`: The rendered figure

## Outputs

- `accessibility-result`: Pass or fail with specific issues identified
- `fix-recommendations`: Alternative colors, patterns, or markers to resolve issues

## Process

1. Simulate deuteranopia, protanopia, and tritanopia views of the figure.
2. Check whether all data series remain distinguishable in each simulated view.
3. If any series merge, recommend alternative colors, dashing patterns, or marker shapes.
4. Verify that the figure does not rely solely on color for any critical distinction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
