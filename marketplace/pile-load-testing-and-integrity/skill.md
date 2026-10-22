# Pile Load Testing And Integrity

Plan and execute pile load tests to verify design capacity and integrity tests to confirm construction quality.

## Inputs

- `axial-capacity`: Predicted capacity to be verified by testing
- `selected-pile-type`: Pile type and expected construction quality indicators

## Outputs

- `load-test-results`: Measured load-settlement curve, ultimate capacity, and comparison to prediction
- `integrity-test-results`: Pile integrity confirmation: length, cross-section continuity, concrete quality

## Process

1. Plan static load test. Test pile loaded to 200% of design load (ASTM D1143 for compression, D3689 for tension). Reaction system: anchor piles (minimum 5 diameters clear from test pile), or kentledge (dead weight). Maintained load procedure: apply load in increments (25% of design load), hold each for 2 to 15 minutes, hold 200% for 12 to 24 hours. Quick maintained load: 5-minute holds (faster, less creep data). Instrumentation: dial gauges or LVDTs on reference beams, load cell or calibrated jack, tell-tales for tip settlement, strain gauges for load distribution.
2. Interpret static load test. Plot load-settlement curve. Determine ultimate capacity: Davisson offset method (line parallel to elastic compression, offset by 3.8 + D/120 mm from origin, intersection with load-settlement curve gives ultimate). Or 10% of pile diameter settlement criterion. Compare measured to predicted: if measured > predicted, design is verified and phi factor can be increased. If measured < predicted, investigate (may need longer piles or redesign).
3. Plan dynamic testing. High-strain dynamic testing (PDA, pile driving analyzer): measures force and velocity at pile head during driving or restrike. Signal matching analysis (CAPWAP) estimates shaft and base resistance distribution. Test during initial driving for driveability assessment and on restrike (minimum 24 hours for setup) for capacity verification. Test at least 2% of production piles (minimum 2 per site).
4. Plan Statnamic testing (alternative to static for large piles). Rapid load applied by combustion gases launching a reaction mass. Duration 100 to 200 ms. Measured force, displacement, acceleration. Unloading point method to derive static capacity from dynamic data. Accounts for rate effects and inertia. Suitable for drilled shafts where static load test reaction is impractical.
5. Plan integrity testing. Cross-hole sonic logging (CSL) for drilled shafts: PVC access tubes cast into pile, ultrasonic pulse between tubes measures concrete quality and continuity. Minimum 3 tubes for piles < 1.5 m diameter, 4 for larger. Test at 2 to 7 days after casting. Thermal integrity profiling (TIP): temperature measurement in access tubes during concrete hydration (defects cause temperature anomalies). Low-strain integrity testing (PIT/sonic echo): for all pile types, detects major defects (necks, cracks, base quality) from wave reflection. Test 100% of drilled shafts (CSL), 10 to 20% of driven piles (PIT).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
