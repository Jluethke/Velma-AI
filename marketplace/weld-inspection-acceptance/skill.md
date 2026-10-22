# Weld Inspection Acceptance

Select and apply weld inspection methods with acceptance criteria per the governing code, covering both surface and volumetric examination.

## Inputs

- `wps-document`: WPS with joint type and quality requirements
- `service-requirements`: Design code and acceptance criteria level

## Outputs

- `inspection-results`: NDE results for each weld with accept/reject determination per the applicable acceptance criteria
- `repair-plan`: Repair procedures for any rejected indications, including excavation method, re-weld procedure, and re-inspection requirements

## Process

1. Visual inspection (VT) on 100% of welds. Check for undercut, overlap, incomplete fusion, crater cracks, porosity, and dimensional compliance (leg size, throat, reinforcement height). VT before, during (for multi-pass welds), and after welding. VT catches 60-80% of significant defects when performed by a qualified inspector.
2. Surface examination: magnetic particle testing (MT) for ferromagnetic materials, liquid penetrant testing (PT) for non-ferromagnetic materials. MT detects surface and near-surface cracks (sensitivity to about 1mm depth). PT detects surface-breaking defects only. Apply after the weld cools below 50C and the surface is cleaned. For fatigue-critical joints, PT or MT the root side if accessible.
3. Volumetric examination: radiographic testing (RT) or ultrasonic testing (UT). RT provides a permanent film record and is well-suited for detecting volumetric defects (porosity, slag inclusions) in butt welds. UT is better for planar defects (lack of fusion, cracks) and can inspect fillet welds that are difficult to radiograph. Phased array UT (PAUT) provides encoded data and improved detection capability over conventional UT.
4. Apply the acceptance criteria from the code. AWS D1.1 Table 6.1 for structural steel (different criteria for statically loaded vs cyclically loaded structures). ASME VIII for pressure vessels. EN ISO 5817 quality levels B, C, D. The critical distinction: cyclic service acceptance criteria are tighter because crack-like defects that are harmless under static load become fatigue initiation sites.
5. Repair rejected welds by excavation (grinding or air-arc gouging) to sound metal, then re-weld per an approved repair WPS. Re-inspect the repair weld to the same criteria. Track the number of repair cycles on any single joint (typically limit to 2-3 repairs before a stress relief or full cutout is required, as repeated thermal cycles degrade HAZ properties).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
