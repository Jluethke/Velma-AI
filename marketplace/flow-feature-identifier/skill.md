# Flow Feature Identifier

Identify key flow features (separation, transition, vortex structures) from force data trends and flow visualization.

## Inputs

- `aero-coefficients`: CL, CD, CM vs alpha showing inflections or breaks
- `flow-visualization-data`: Oil flow, tuft, or PIV images if available

## Outputs

- `flow-features`: Identified separation onset, transition location, and vortex features
- `feature-evidence`: Which data (force break, visualization image) supports each identified feature

## Process

1. Examine the lift curve for nonlinearity that indicates flow separation onset
2. Look for drag bucket or drag rise that indicates laminar-to-turbulent transition
3. Correlate force data features with flow visualization evidence if available
4. Catalog each identified feature with its angle-of-attack range and evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
