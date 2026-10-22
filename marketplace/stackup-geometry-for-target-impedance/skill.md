# Stackup Geometry For Target Impedance

Design the PCB cross-section geometry (dielectric height, trace width, copper weight) to achieve the target impedance for microstrip, stripline, and coplanar waveguide structures.

## Inputs

- `impedance-target`: Target impedance with tolerance band
- `layer-count`: Number of PCB layers available
- `laminate-material`: Laminate type (e.g., FR-4, Megtron 6, Rogers 4350B) with Dk and Df at frequency of interest

## Outputs

- `stackup-cross-section`: Layer-by-layer cross section with dielectric heights, copper weights, and trace widths for each impedance class
- `microstrip-geometry`: Outer layer trace width and dielectric height to reference plane for target impedance
- `stripline-geometry`: Inner layer trace width and dielectric heights above and below to reference planes
- `manufacturing-notes`: Notes on etch compensation, resin content, and glass weave style needed from the fabricator

## Process

1. For microstrip: use the IPC-2141 approximation Z0 = (87 / sqrt(Dk_eff + 1.41)) * ln(5.98 * h / (0.8 * w + t)) as a starting point. Iterate trace width (w) for given dielectric height (h) and copper thickness (t) to approach the target.
2. For stripline: use Z0 = (60 / sqrt(Dk)) * ln(4 * b / (0.67 * pi * (0.8 * w + t))) where b is the distance between reference planes. Adjust w for the target.
3. For coplanar waveguide with ground: the gap-to-trace-width ratio controls impedance alongside dielectric height. Use when you need tighter impedance control on outer layers or when routing over plane splits.
4. Document the geometry for the fabricator: specify dielectric height as finished (post-lamination), copper weight as starting weight (the fab will etch-compensate), and request the specific prepreg resin content and glass style needed to hit the Dk at your frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
