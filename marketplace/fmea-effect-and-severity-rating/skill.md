# Fmea Effect And Severity Rating

Determine the local, next-higher, and end effects of each failure mode, then assign severity ratings with anchored scales.

## Inputs

- `failure-mode-list`: All identified failure modes
- `mechanism-cause-map`: Mechanisms and causes for each mode

## Outputs

- `effect-chain`: For each failure mode: local effect (at the component), next-higher effect (at the subsystem), and end effect (at the system or user level)
- `severity-ratings`: Severity score (1 to 10) for each failure mode, anchored to concrete examples: 1 = no perceivable effect, 4 = minor degradation user notices, 7 = subsystem inoperable but no safety impact, 9 = potential safety issue with warning, 10 = potential safety issue without warning

## Process

1. For each failure mode, trace the effect chain upward. Local effect: what happens at the component (e.g., 'capacitor shorts, bypassing the filter'). Next-higher effect: what the subsystem experiences (e.g., 'unfiltered noise on the power rail'). End effect: what the user or system experiences (e.g., 'intermittent data errors in sensor readings').
2. Assign severity based on the worst end effect, not the local effect. Use anchored scales specific to the product type. Automotive uses a different scale than industrial equipment. The anchoring prevents score inflation where everything becomes a 7 or 8.
3. Severity 9 and 10 are reserved for safety and regulatory compliance. If a failure mode can cause injury with prior warning, it is a 9. Without warning, it is a 10. These ratings trigger mandatory design action regardless of occurrence or detection scores.
4. Document which operating modes produce the worst severity. A failure mode might be severity 3 in normal operation but severity 9 during emergency shutdown. Rate against the worst credible operating condition within the ground rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
