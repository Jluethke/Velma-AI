# Logmon Alert Rule Test

Test detection and alert rules against known attack patterns to verify they fire correctly.

## Inputs

- `siem-access`: Access to SIEM rules and alert configurations
- `source-inventory`: Log source inventory for understanding available data

## Outputs

- `detection-findings`: Attack patterns that do and do not trigger alerts
- `rule-coverage-map`: Map of MITRE ATT&CK techniques to existing detection rules

## Process

1. Map existing alert rules to MITRE ATT&CK techniques
2. Execute controlled test scenarios for critical attack techniques (credential dumping, lateral movement, exfiltration)
3. Verify that expected alerts fire within acceptable time windows
4. Identify high-priority ATT&CK techniques with no detection coverage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
