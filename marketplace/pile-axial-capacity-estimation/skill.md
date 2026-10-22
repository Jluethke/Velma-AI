# Pile Axial Capacity Estimation

Calculate axial capacity of piles in compression and tension using appropriate methods for the selected pile type and ground.

## Inputs

- `selected-pile-type`: Pile type, dimensions, and installation method
- `ground-conditions`: Soil/rock parameters by depth: su, phi', Ko, SPT N, CPT qt

## Outputs

- `axial-capacity`: Ultimate shaft resistance, base resistance, and total capacity in compression and tension per pile
- `pile-length-required`: Required pile length to achieve target capacity with specified factor of safety

## Process

1. Calculate shaft resistance. In clay (undrained, alpha method): qs = alpha * su, where alpha = 0.55 for su/sigma_v' <= 1.0, reducing for higher su/sigma_v' ratios (API method). In sand (beta method): qs = beta * sigma_v', where beta = K * tan(delta), K depends on installation (1.0 for bored, 1.2 to 2.0 for driven displacement), delta = phi' minus 5 degrees. In rock: qs from rock socket methods (Horvath and Kenney: qs = 0.65 * sqrt(UCS) in MPa for normal roughness). Integrate shaft resistance over pile length: Qs = sum(qs_i * pi * D * dz_i).
2. Calculate base resistance. In clay: qb = Nc * su at tip (Nc = 9 for deep piles, D/B > 5). In sand: qb limited by CPT-based methods (Eslami-Fellenius: qb = average of qt in influence zone, typically 4D below to 8D above tip, with geometric averaging). For rock socket: qb = bearing capacity factor * UCS (typically 2.5 to 5.0 * UCS for intact rock, reduced for fractured). Qb = qb * Ab.
3. For CPT direct methods (preferred when CPT data available): use LCPC method or UniCone method. LCPC: shaft resistance from qt with empirical factors by soil type (clay, sand, gravel). Base resistance from average qt near tip with correction factor. These methods have the best calibration to pile load test databases.
4. Calculate tension capacity. Shaft resistance in tension is typically 75% of compression shaft resistance (reduced for clays due to changes in effective stress during pullout). No base resistance contribution. Check structural capacity of pile in tension (connections, splices).
5. Apply factors of safety. LRFD approach (AASHTO): phi factors depend on analysis method and site variability. Static analysis only: phi = 0.45 (shaft) and 0.40 (tip). With static load test: phi = 0.70 to 0.80. With dynamic testing (CAPWAP signal matching): phi = 0.65. ASD approach: FS = 2.0 with load test, 2.5 to 3.0 without.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
