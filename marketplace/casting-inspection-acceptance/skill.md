# Casting Inspection Acceptance

Inspect the finished casting and apply acceptance criteria per the applicable standard, with disposition methodology for indications.

## Inputs

- `verified-design`: Expected casting quality from the design and simulation
- `performance-requirements`: Quality level and inspection requirements from the design code or customer specification

## Outputs

- `inspection-results`: Results of visual, dimensional, radiographic, and surface NDE with accept/reject determination per the applicable standard
- `casting-disposition`: Disposition of each indication (accept as-is, weld repair, scrap) with engineering substantiation

## Process

1. Visual inspection per ASTM A802/MSS SP-55 for steel castings, or the applicable standard for the alloy. Check for surface discontinuities (shrinkage, porosity, sand inclusions, hot tears, cold shuts), dimensional compliance (draft angles, machining stock, flatness), and surface finish. Visual inspection by a qualified Level II or III inspector.
2. Radiographic inspection per ASTM E446 (steel), ASTM E155 (aluminum), or ASTM E192 (investment castings). Compare the radiograph to the reference radiograph standard and grade each indication by severity. The acceptable grade depends on the application: ASTM E446 Level 1-2 for high-integrity structural or pressure castings, Level 3-5 for less critical applications. Digital radiography provides immediate results and easier archival.
3. Surface NDE: magnetic particle testing (MT) for ferromagnetic castings per ASTM E125 reference photographs. Liquid penetrant testing (PT) for non-ferromagnetic castings per ASTM E433. Acceptance criteria by ASME section V or the customer specification. Pay attention to areas of geometric complexity where casting defects concentrate (fillets, junctions, thin-to-thick transitions).
4. Mechanical testing of separately cast test bars or test coupons attached to the casting (keel blocks). Tensile test per ASTM E8. Impact test per ASTM E23 if required. Hardness per ASTM E10 (Brinell). Compare to the alloy specification minimum requirements. For ductile iron, also verify nodularity and nodule count by metallographic examination per ASTM A247.
5. Disposition non-conformances. Weld repair of casting defects is common but must follow a qualified weld repair procedure per the applicable code (ASME, AWS D15.1 for railroad, AMS 2175 for aerospace). Excavate the defect completely (verify by MT or PT before welding). Post-weld heat treatment if required by the original casting specification. Re-inspect the repair area to the same criteria as the original casting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
