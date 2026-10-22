# Fatigue Loading Characterization

Process the service loading history into cycle counts and load spectra for fatigue analysis.

## Inputs

- `load-history`: Time history of the applied load, stress, or strain at the critical location
- `component-description`: Material, geometry, surface condition, and operating environment

## Outputs

- `cycle-count`: Rainflow cycle count matrix: stress amplitude, mean stress, and number of cycles for each bin
- `loading-characterization`: Constant amplitude equivalent, load spectrum shape, and whether the loading is proportional or non-proportional

## Process

1. If the loading is constant amplitude (sinusoidal), extract stress amplitude sigma_a = (sigma_max - sigma_min)/2 and mean stress sigma_m = (sigma_max + sigma_min)/2. Stress ratio R = sigma_min/sigma_max. Fully reversed loading has R = -1 (sigma_m = 0).
2. For variable amplitude loading, apply rainflow cycle counting (ASTM E1049) to extract the individual cycles from the complex history. Each cycle is defined by its range, mean, and count. The rainflow method identifies closed hysteresis loops in the stress-strain response.
3. For multiaxial loading, determine if the principal stress axes rotate during the load cycle (non-proportional loading). Non-proportional loading causes additional hardening in most metals and reduces fatigue life compared to proportional loading of the same equivalent stress amplitude.
4. Construct the load spectrum: order cycles from largest to smallest amplitude. The spectrum shape determines which cycles contribute most to damage. For many engineering applications, the largest cycles dominate damage; the numerous small cycles contribute little unless they exceed the endurance limit.
5. Identify the critical location: the point in the component with the highest fatigue damage. This is usually the location of highest stress concentration, but for variable loading it may depend on the load path. Check multiple locations if the critical point is not obvious.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
