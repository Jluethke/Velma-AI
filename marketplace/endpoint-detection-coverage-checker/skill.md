# Endpoint Detection Coverage Checker

Verify endpoint detection and response coverage and effectiveness.

## Inputs

- `critical-systems-list`: Critical systems list
- `backup-inventory`: Backup systems to verify coverage

## Outputs

- `edr-coverage-findings`: Systems missing EDR agents and detection gaps
- `detection-test-results`: Results of simulated ransomware behavior detection

## Process

1. Verify EDR agent deployment across all endpoints including servers and VMs
2. Test detection of common ransomware behaviors (mass file encryption, shadow copy deletion, registry changes)
3. Check for EDR exclusions that could be abused to evade detection
4. Verify that alerts reach the SOC and that response playbooks exist

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
