# Payload Sensitivity Analysis

Quantify how payload capacity changes with Isp, structural mass, engine count, and other design variables to identify the highest-leverage improvements.

## Inputs

- `stage-mass-estimates`: Baseline mass breakdown per stage
- `stage-delta-v-split`: Delta-v allocation per stage
- `payload-fraction`: Baseline payload fraction

## Outputs

- `isp-sensitivity`: Payload gain per second of Isp improvement, per stage
- `structural-mass-sensitivity`: Payload gain per kilogram of structural mass removed, per stage
- `design-trade-priority`: Ranked list of design changes by payload impact per dollar or per schedule month

## Process

1. Differentiate the rocket equation to find payload sensitivity to Isp: d(m_payload)/d(Isp) = m_payload * delta-v / (Isp^2 * g0). For a typical LEO launcher, 1 second of Isp on the first stage is worth 50-100 kg of payload.
2. Structural mass sensitivity: 1 kg removed from the first stage is worth approximately 1/(payload_fraction) kg of payload. For a vehicle with 2% payload fraction, 1 kg off the first stage is worth 50 kg of payload. Upper stage mass is even more valuable.
3. Engine thrust-to-weight ratio directly affects gravity loss. A lighter engine at the same thrust reduces structural mass AND gravity loss. This is why the Merlin engine's T/W ratio of 150+ was a significant technical achievement.
4. Propellant density affects tank size and therefore structural mass. LOX/RP-1 (density impulse ~350 kg*s/L) produces a smaller first stage than LOX/LH2 (density impulse ~120 kg*s/L) despite lower Isp, which is why kerolox first stages dominate modern launchers.
5. Build a trade matrix: columns are design changes (better Isp, lighter tanks, more thrust), rows are cost and schedule impact. The highest payload-per-dollar changes get priority. Often, the answer is manufacturing improvement (thinner tanks at same strength) rather than exotic materials.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
