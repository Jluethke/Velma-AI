# Fowlp Process Selection

Select the fan-out process flow (chip-first or chip-last) and define the RDL design rules based on application requirements.

## Inputs

- `die-specifications`: Die size, I/O count, bump pitch, and number of dies for multi-die fan-out
- `performance-requirements`: Electrical performance: frequency, signal integrity, power delivery
- `form-factor-target`: Package height and footprint constraints

## Outputs

- `process-flow`: Selected FOWLP variant: chip-first face-down, chip-first face-up, chip-last, or multi-die InFO
- `rdl-design-rules`: Line/space, via diameter, layer count, and dielectric material

## Process

1. Chip-first face-down (eWLB type): die placed face-down on carrier, molded, carrier removed, RDL built on exposed die face. Simplest process, good for single-die. Die shift during molding limits fine-pitch RDL (typically 5/5um line/space minimum).
2. Chip-first face-up: die placed face-up, molded, RDL built on top. Better die shift control for multi-die. Requires via to reach die pads through dielectric.
3. Chip-last (RDL-first): RDL built on carrier wafer first, then dies bonded to RDL. Finest pitch achievable (2/2um or finer) because lithography is done on a flat carrier, not on a reconstructed wafer with die shift. Higher cost.
4. Select based on requirements: chip-first for cost-sensitive single-die, chip-last for fine-pitch multi-die (TSMC InFO). For multi-die fan-out as interposer alternative, chip-last gives tighter RDL rules.
5. Define RDL rules: line/space from routing density analysis, via size from current capacity, dielectric from electrical (low-Dk) and mechanical (low stress) requirements. Typical: polyimide or PBO dielectric, Cu RDL.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
