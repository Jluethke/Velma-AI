# Field Testing Execution

Execute the field investigation: drilling, sampling, in-situ testing, and groundwater characterization.

## Inputs

- `investigation-plan`: Borehole locations, depths, and testing program
- `preliminary-ground-model`: Expected conditions to guide real-time field decisions

## Outputs

- `field-data`: Borehole logs, CPT profiles, in-situ test results, groundwater observations, and samples for laboratory
- `field-observations`: Notable conditions encountered: unexpected layers, obstructions, artesian pressures, contamination indicators

## Process

1. Set up boreholes. Rotary drilling for general use. Cable percussion (shell and auger) in soft ground with better sample quality. Sonic drilling for contaminated sites (sealed samples, minimal waste). Diamond core drilling in rock (double or triple tube barrel for core recovery; target > 95% TCR in competent rock).
2. Collect samples. Undisturbed samples in cohesive soil: thin-wall Shelby tube (75 mm diameter, pushed not driven) or piston sampler in very soft clay. Disturbed samples in granular soil from SPT split spoon. Rock core: log RQD, discontinuity spacing, orientation, roughness, infilling (use ISRM descriptors).
3. Run CPTu. Calibrate cone before and after each sounding. Push rate 2 cm/s. Record qt (corrected cone resistance), fs (sleeve friction), u2 (pore pressure at shoulder). Dissipation tests at selected depths in clay (time to 50% dissipation gives coefficient of consolidation). Plot Ic (soil behavior type index) to classify layers.
4. Install groundwater monitoring. Standpipe piezometers at key depths (one above and one below each confining layer). Vibrating wire piezometers for rapid response in low-permeability soils. Allow equilibration time (days in sand, weeks in clay) before reading. Record initial water strike levels during drilling separately from equilibrium levels.
5. Adapt program in real time. If unexpected conditions are found (softer layers, higher water table, boulders, contamination), modify depths, add boreholes, or change testing. Document all deviations from plan and their justification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
