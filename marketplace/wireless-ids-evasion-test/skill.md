# Wireless Ids Evasion Test

Test wireless IDS/WIPS detection and evasion to assess monitoring effectiveness.

## Inputs

- `wireless-survey-results`: Wireless infrastructure including IDS/WIPS sensors
- `enterprise-wifi-findings`: Attacks tested so far and their detection status

## Outputs

- `wids-evasion-results`: Techniques that evaded wireless IDS detection
- `wids-detection-coverage`: Detection rates for each tested attack category

## Process

1. Test if the WIPS detected the evil twin and rogue AP deployments
2. Attempt low-and-slow scanning techniques to avoid threshold-based detection
3. Test channel hopping and MAC randomization for evasion
4. Measure detection response times for each attack technique

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
