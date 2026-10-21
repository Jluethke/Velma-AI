# Wifi Hardening Reporter

Produce the wireless infrastructure hardening report.

## Inputs

- `ap-inventory`: Access points that were hardened
- `wids-config`: WIDS configuration

## Outputs

- `hardening-report`: Full wireless hardening report
- `wifi-security-summary`: Summary of wireless security posture per SSID

## Process

1. Compile all configuration changes across access points
2. Run a wireless security scan to verify settings
3. Document any exceptions with justification
4. Produce the report with per-SSID security status

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
