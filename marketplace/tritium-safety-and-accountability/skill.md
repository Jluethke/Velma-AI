# Tritium Safety And Accountability

Design tritium containment, safety analysis, and accountability systems to meet regulatory requirements.

## Inputs

- `fuel-cycle-design`: Tritium processing flowsheet
- `isotope-separation-design`: Separation system specifications
- `storage-and-delivery`: Storage and fuel delivery design

## Outputs

- `confinement-design`: Primary, secondary, and tertiary containment barrier design
- `safety-analysis`: Source term, release scenarios, dose assessment
- `accountability-system`: Tritium inventory measurement and tracking methodology

## Process

1. Design confinement barriers: primary (process piping, vessels), secondary (glovebox or secondary enclosure with inert atmosphere), tertiary (building with negative pressure and HVAC filtration). Each barrier has its own leak detection and detritiation capability.
2. Design atmosphere detritiation system (ADS): catalytic oxidizer converts HT/T2 to HTO, molecular sieve dryer removes HTO from air stream. Size for room air exchange rate and target cleanup time. ADS capacity drives building volume limit for tritium zones.
3. Perform safety analysis: identify bounding accidents (loss of confinement, loss of coolant with air ingress to hot blanket, fire in tritium area). Calculate source term (tritium mobilizable inventory), atmospheric dispersion (Gaussian plume with building wake), and dose at site boundary.
4. Regulatory limits: 10 CFR 835 occupational limit 10 mSv/yr from tritium, 10 CFR 20 public limit 1 mSv/yr, design target typically 0.1 mSv/yr at site boundary for bounding accident. Stack monitoring with ionization chambers for routine releases.
5. Tritium accountability: real-time measurement by ionization chambers in glovebox atmospheres, calorimetry for inventory in storage beds, PVT for gas phase. Daily material balance. Discrepancy (MUF: material unaccounted for) tracked against measurement uncertainty for IAEA safeguards reporting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
