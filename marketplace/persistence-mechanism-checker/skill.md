# Persistence Mechanism Checker

Check for advanced persistence mechanisms beyond standard autostart locations.

## Inputs

- `autostart-findings`: Standard autostart analysis results
- `volatile-data`: Running process and driver data for correlation

## Outputs

- `persistence-analysis`: Analysis of all identified persistence mechanisms
- `hidden-persistence`: Persistence mechanisms found outside standard locations

## Process

1. Check for DLL search order hijacking in system and application paths
2. Analyze Windows services for unauthorized entries
3. Check for bootkit indicators in the boot configuration
4. Examine browser extensions and scheduled tasks for malicious entries

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
