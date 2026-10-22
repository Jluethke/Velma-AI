# Anti Probing Evaluation

Design anti-probing measures against IC-level physical attacks, implement FIB resistance, and evaluate the complete tamper design against the target Common Criteria protection profile.

## Inputs

- `tamper-protection-design`: Selected tamper mechanisms and sensor suite
- `security-boundary-document`: Physical boundary drawing with penetration points

## Outputs

- `anti-probing-design`: Metal shielding layers, active shield routing, glitch detection, evaluation results
- `cc-evaluation-readiness`: Compliance status against target protection profile, gap analysis, evidence package for evaluator

## Process

1. Anti-probing at IC level: add top metal shielding layer over sensitive circuits (key storage, crypto core). Route an active shield on this layer (a signal that is continuously monitored; probing or FIB editing disrupts it). Backside protection: use backside metal or deep-trench isolation to prevent substrate probing through the thinned die.
2. FIB attack resistance: FIB (focused ion beam) can cut and reconnect metal traces, enabling bypass of security features. Countermeasures: use multiple metal layers for critical signals (FIB can access the top layer but not easily reach buried layers), route security-critical signals on lower metal layers under the active shield, use differential signaling so that a single-trace modification is detectable.
3. Glitch detection: monitor the power supply for voltage excursions outside the operating range (both above and below). Use an analog comparator with fast response (< 10 ns) to detect glitch pulses. On detection: trigger a security reset that clears any partially-computed cryptographic state before it can be read out. Also monitor clock frequency and halt on out-of-range periods.
4. Evaluation: have an independent security laboratory attempt penetration using the attacker model from the threat model. Test mesh sensitivity (minimum drill size that triggers detection), environmental sensor coverage (can an attacker freeze the battery while bypassing the temperature sensor?), zeroization completeness (can any key material be recovered after tamper trigger?).
5. CC protection profile compliance: map each requirement from the target PP (e.g., BSI-CC-PP-0084 for hardware security modules) to the implemented mechanism. Prepare the Security Target document. Compile evidence: design documents, test results, source code review for tamper detection firmware, penetration test reports. Submit to a CCRA-licensed evaluation facility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
