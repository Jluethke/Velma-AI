# Water Sampling Planner

Design the water sampling plan: select sites, parameters, frequency, and collection methods based on the assessment objectives.

## Inputs

- `assessment-objectives`: Purpose of the assessment (drinking water, ecological, discharge compliance)
- `waterbody-description`: Type (river, lake, groundwater), location, and known pollution sources

## Outputs

- `sampling-plan`: Sites, parameters, frequency, methods, and preservation requirements
- `parameter-list`: Physical, chemical, and biological parameters to measure with their methods

## Process

1. Identify sampling sites: upstream/downstream of sources, at intake points, at regulatory compliance points.
2. Select parameters based on objectives: physical (temperature, turbidity), chemical (nutrients, metals, organics), biological (fecal indicators, BOD).
3. Determine sampling frequency: event-based for stormwater, monthly for baseline, quarterly for groundwater.
4. Specify collection methods, container types, preservation (acidification, cooling), and holding times.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
