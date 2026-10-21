# Gpr Feature Interpretation

Interpret subsurface features from the processed GPR profiles, classifying reflectors as geological layers, buried structures, utilities, or voids.

## Inputs

- `depth-converted-profiles`: Depth-converted and migrated GPR profiles
- `site-context`: Known site history, expected targets, and surface conditions

## Outputs

- `feature-catalog`: Interpreted features with locations, depths, and classifications
- `interpretation-maps`: Plan-view maps of interpreted features across the survey area

## Process

1. Trace continuous reflectors across multiple profiles to identify layer boundaries
2. Classify point reflectors and hyperbolic patterns as utilities, boulders, or voids based on signature
3. Map feature locations and depths in plan view by connecting picks across parallel profiles
4. Assign confidence levels based on signal quality and consistency across profiles

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
