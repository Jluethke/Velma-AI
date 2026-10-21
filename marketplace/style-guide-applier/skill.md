# Style Guide Applier

Apply the target journal's or venue's figure style guide: font sizes, line weights, color palette, panel labeling, and resolution requirements.

## Inputs

- `chart-type`: The chart type to style
- `style-guide`: The journal or venue's figure specifications

## Outputs

- `style-config`: All style parameters consolidated into a config (fonts, sizes, colors, DPI)
- `compliance-checklist`: Checklist of style requirements and whether each is met

## Process

1. Extract font family, size for axis labels, tick labels, legends, and titles from the style guide.
2. Extract the required line weight, marker size, and DPI/resolution.
3. Select a color palette that fits the journal's constraints (print-friendly if required).
4. Consolidate all parameters into a reusable style config.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
