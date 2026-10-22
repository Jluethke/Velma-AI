# Vacuum Chamber And Leak Detection

Design the vacuum chamber, select materials, and implement leak detection and qualification methodology.

## Inputs

- `pressure-budget`: Gas load inventory and required pressure
- `pump-selection`: Selected pump configuration
- `pumpdown-estimate`: Expected pumpdown time

## Outputs

- `chamber-design`: Chamber material, geometry, flanges, and viewport design
- `leak-test-procedure`: Leak detection methodology and acceptance criteria
- `bakeout-procedure`: Bakeout temperature, duration, and monitoring

## Process

1. Select chamber material: 304L or 316LN stainless steel for most applications (low outgassing after bakeout, weldable, non-magnetic for 316LN). Aluminum alloy (6061-T6, 6063) for lower weight and better thermal conductivity. OFE copper for RF cavities. Titanium for specialized applications.
2. Design flanges and seals: CF (ConFlat) with copper gasket for UHV (bakeable to 450C). KF (Klein Flange) with elastomer O-ring for rough and high vacuum (max 150C bakeout). Wire seal (aluminum, gold, silver) for large non-standard joints. Calculate bolt pattern for seal compression.
3. Welding for UHV: full-penetration autogenous TIG from vacuum side (no filler metal contamination). Avoid trapped volumes (virtual leaks). All welds leak-tested before assembly. Electropolish internal surfaces to reduce surface area and outgassing.
4. Leak detection: helium mass spectrometer leak detector (sensitivity 10^-12 mbar*L/s). Methods: vacuum method (pump on chamber, spray helium outside), sniffer method (pressurize with helium, probe outside), accumulation method (bag section, measure helium rise). Acceptance: total leak rate < outgassing rate at operating pressure.
5. Bakeout procedure: 150-250C for 24-48 hours (stainless steel). Heat uniformly with heater tapes or in an oven, monitor with thermocouples (minimum 6 points on a large system). Keep pumping during bakeout. Cool slowly to avoid thermal shock on viewports. Verify pressure improvement: expect 10-100x after bakeout.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
