# Autostart Location Analyzer

Analyze all autostart locations for unauthorized or suspicious entries.

## Inputs

- `target-system`: The system to examine
- `flagged-files`: Files already flagged for correlation

## Outputs

- `autostart-findings`: All autostart entries with suspicious ones highlighted
- `persistence-candidates`: Entries likely used for malware persistence

## Process

1. Enumerate registry Run/RunOnce keys and their values
2. Check startup folders, logon scripts, and Group Policy scripts
3. Analyze WMI event subscriptions and COM object hijacks
4. On Linux: check systemd units, cron, init scripts, and LD_PRELOAD

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
