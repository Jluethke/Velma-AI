# Counterfeit Detection Methodology

Detect counterfeit electronic components through layered inspection: visual, electrical, X-ray, and destructive analysis, with statistical sampling for incoming lots.

## Inputs

- `component-description`: Part number, manufacturer, expected marking, package type, procurement source (authorized vs broker)
- `risk-assessment`: Component criticality, supply chain risk level, counterfeit history for this part

## Outputs

- `inspection-results`: Pass/fail for each inspection tier, photographs, measurements, comparison to known-genuine samples
- `counterfeit-risk-verdict`: Accept, reject, or escalate to destructive analysis, with evidence summary

## Process

1. Tier 1 - Visual inspection: examine package marking (laser vs ink, font consistency, alignment, country of origin code), measure package dimensions against manufacturer datasheet (counterfeit packages are often re-marked pulls with non-standard dimensions), inspect leads for re-tinning evidence (uneven solder, solder splashes, bent leads from prior board removal), check date code consistency within the lot.
2. Tier 2 - Electrical testing: compare DC parametric measurements (Voh, Vol, Iih, Iil, Idd) against datasheet limits. Perform functional test at rated speed and across temperature range. Counterfeit parts often fail at corners that genuine parts pass. Compare curve tracer results (I-V characteristics of I/O pins) against known-genuine samples for the same date code.
3. Tier 3 - X-ray inspection: verify internal die size and bond wire pattern match the expected design. Detect re-marking (a smaller die in a larger package, wire bond pattern inconsistent with claimed part number). For BGA: verify solder ball size and pitch consistency (recycled BGAs show non-uniform ball diameter from reworking).
4. Tier 4 - Destructive analysis (sampling basis): decapsulate and compare die markings, die size, and circuit topology to known-genuine samples or manufacturer die photographs. Examine bond wire pull strength (degraded in aged or recycled parts). SEM the die surface for signs of previous use (electromigration voids, bond pad wear).
5. Statistical sampling: for authorized-distributor procurement, 100% Tier 1 + sample Tier 2. For broker procurement, 100% Tier 1 + 100% Tier 2 + sample Tier 3. For critical/single-source parts from unknown sources, add Tier 4. SAE AS6171 and AS6081 provide the sampling framework.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
