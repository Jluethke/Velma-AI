# Design Review And Dfm Check

Review the complete power PCB layout for manufacturing feasibility, IPC compliance, and perform a final checklist covering all critical design rules before releasing to fabrication.

## Inputs

- `ground-strategy`: Ground management plan
- `sensitive-trace-routing`: Sensitive signal routing completed

## Outputs

- `design-review-checklist`: Completed checklist covering: hot loop area verification, gate loop area, thermal path continuity, clearance and creepage, solder paste apertures for power components, and test point accessibility
- `manufacturing-notes`: Fabrication and assembly notes: copper weight, via fill specification, impedance-controlled layers, special paste or stencil requirements for fine-pitch or thermal pads, and inspection criteria

## Process

1. Verify critical loop areas. Measure the hot loop area using the 3D stackup: trace length * layer-to-layer separation. For a 4-layer board with 0.2mm dielectric: a 20mm hot loop trace on layer 1 returning on layer 2 has area = 20mm * 0.2mm = 4mm^2. This produces ~5nH. If the budget is 2nH, the trace must be shorter or the return path must be on the same layer.
2. Verify clearance and creepage. IPC-2221 and IEC 62368: for 400V working voltage, minimum clearance = 2.5mm (sea level), creepage = 6.4mm (Pollution Degree 2, Material Group III). These apply between input and output if isolation is required, and between any conductor and exposed metal. Slots in the PCB can reduce creepage requirements by creating air gaps.
3. Verify thermal paths. Every power component must have a defined thermal path to ambient: through the PCB (thermal vias to a copper pour or heat sink), through the package top (heat sink attached), or through airflow (forced air over an exposed pad). Use the calculated thermal resistance to verify no component exceeds its temperature limit.
4. Solder paste and stencil review. For large thermal pads (QFN, D2PAK): reduce the stencil aperture to 50-80% coverage using a window pattern (multiple small rectangles instead of one large one) to prevent solder voids and tombstoning. For fine-pitch ICs (0.5mm pitch): reduce aperture width to 80% of pad width. Step-down stencil areas if there are mixed large and small components.
5. Test point accessibility. Add test points for: input voltage, output voltage, switching node (for scope probe access), gate drive signals, current sense, key control IC pins (feedback, compensation, soft-start). Place switching node test points as short stubs to minimize probe-induced ringing. Add a dedicated ground test point (a large, easily accessible pad) for the scope probe ground spring.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
