# Heat Treatment Quality Verification

Verify that the heat treatment achieved the target properties through testing and inspection, with disposition criteria for non-conformances.

## Inputs

- `heat-treatment-cycle`: Actual cycle run (furnace chart records, thermocouple data)
- `expected-case-profile`: Predicted property values to verify against

## Outputs

- `verification-results`: Hardness measurements, microstructure evaluation, mechanical test results, and dimensional check against the specification requirements
- `process-records`: Complete heat treatment records (furnace charts, atmosphere logs, quench tank temperature, lot traceability) for the quality file

## Process

1. Hardness testing per ASTM E18 (Rockwell) or ASTM E384 (micro-hardness). Test at the specified location on the actual part. For case-hardened parts, perform a micro-hardness traverse from surface to core (Vickers HV0.5 at 0.1mm intervals through the case, then 0.5mm intervals to the core). Compare the effective case depth to the specification.
2. Microstructural examination of representative samples or sacrificial test pieces processed with the production load. Verify: grain size (ASTM E112, typically ASTM 5-8 for most applications), absence of retained austenite above specification limit (typically < 15% for carburized gears by XRD), absence of intergranular oxidation (IGO) at the surface of carburized parts (IGO depth specification per the drawing, typically < 12 microns), tempered martensite without undissolved ferrite (incomplete austenitization) or free carbide networks.
3. Mechanical testing if required by the specification. Tensile test per ASTM E8 (round bar or flat specimen). Charpy V-notch impact test per ASTM E23 at the specified temperature. For case-hardened gears, the core hardness must also meet the minimum (typically 30-40 HRC for 8620, ensuring the core was properly quenched).
4. Dimensional inspection. Measure critical dimensions before and after heat treatment to quantify distortion. Growth from carburizing is typically 0.05-0.15mm per surface. Quench distortion is geometry-dependent. If distortion exceeds the tolerance, evaluate whether post-heat-treatment grinding or straightening is acceptable (straightening of hardened parts risks cracking). Verify that the part still meets the finished dimension after any planned grinding stock removal.
5. Archive the heat treatment records. Furnace temperature chart showing the entire cycle, atmosphere logs (carbon potential for carburizing, nitrogen flow for nitriding), quench tank temperature (must stay below the specified maximum, typically 60C for oil), load diagram (part position in the furnace), and test results tied to the lot number. Retention per the quality system (typically the life of the product plus a defined period).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
