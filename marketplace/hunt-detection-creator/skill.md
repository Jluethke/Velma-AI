# Hunt Detection Creator

Create detection rules from confirmed findings and validated patterns.

## Inputs

- `findings-list`: Confirmed anomalies and suspicious patterns
- `false-positive-notes`: Known benign patterns to exclude in detection rules

## Outputs

- `new-detection-rules`: Detection rules (Sigma, YARA, or SIEM-native) created from hunt findings
- `coverage-update`: Updated ATT&CK coverage map reflecting new detections

## Process

1. For each confirmed finding, write a detection rule that captures the malicious pattern
2. Add exclusions for the documented false positive patterns
3. Test the rule against historical data to validate detection rate and false positive rate
4. Update the ATT&CK coverage map with the new detections

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
